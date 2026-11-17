import { ParsedStockItemPreview } from '../services/stockImportValidator';
import { BulkImportedContentItem } from './assignmentNotifications';

export interface ImportSubmitProgress {
    processedCount: number;
    totalCount: number;
    succeededCount: number;
    failedCount: number;
    currentBatch: number;
    totalBatches: number;
    statusText: string;
    isRetrying?: boolean;
}

export interface RowImportFailure {
    item: ParsedStockItemPreview;
    reason: string;
    isTransient: boolean;
}

export interface BulkStockImportResult {
    totalRequested: number;
    insertedItems: BulkImportedContentItem[];
    succeededIndices: Set<number>;
    rowFailures: RowImportFailure[];
    remainingItems: ParsedStockItemPreview[];
    abortedByTransientError: boolean;
    errorMessage?: string;
}

export interface ExecuteResilientStockImportOptions {
    batchSize?: number;
    interChunkDelayMs?: number;
    maxRetries?: number;
    onProgress?: (progress: ImportSubmitProgress) => void;
}

const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_INTER_CHUNK_DELAY_MS = 200;
const DEFAULT_MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const formatSupabaseError = (err: any): string => {
    if (!err) return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    if (typeof err === 'string') return err;
    const code = err.code ? `[${err.code}] ` : '';
    const msg = err.message || err.error_description || err.details || 'ไม่สามารถบันทึกข้อมูลได้';
    return `${code}${msg}`.trim();
};

/**
 * Classifies temporary network, gateway, rate-limit, or statement-timeout errors
 * that are safe to automatically retry with exponential backoff.
 */
export const isTransientSupabaseError = (err: any): boolean => {
    if (!err) return false;

    const status = Number(err.status || err.statusCode || 0);
    if ([408, 425, 429, 500, 502, 503, 504, 520, 522, 524].includes(status)) {
        return true;
    }

    const code = String(err.code || '').toUpperCase();
    // PostgreSQL transient/connection/timeout codes (e.g. 57014 statement_timeout, 08xxx connection exception, 53xxx insufficient resources, 40001 serialization)
    if (
        code === '57014' ||
        code === '40001' ||
        code === '40P01' ||
        code.startsWith('08') ||
        code.startsWith('53') ||
        code === 'ETIMEDOUT' ||
        code === 'ECONNRESET' ||
        code === 'ECONNABORTED' ||
        code === 'ENOTFOUND'
    ) {
        return true;
    }

    const text = `${err.message || ''} ${err.details || ''} ${err.hint || ''} ${err.name || ''}`.toLowerCase();
    return (
        text.includes('failed to fetch') ||
        text.includes('networkerror') ||
        text.includes('network request failed') ||
        text.includes('load failed') ||
        text.includes('fetch failed') ||
        text.includes('timeout') ||
        text.includes('timed out') ||
        text.includes('rate limit') ||
        text.includes('too many requests') ||
        text.includes('temporarily unavailable') ||
        text.includes('service unavailable') ||
        text.includes('bad gateway') ||
        text.includes('gateway timeout') ||
        text.includes('connection') ||
        text.includes('abort')
    );
};

async function runWithTransientRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    onRetry?: (attempt: number, maxRetries: number, delayMs: number, err: any) => void
): Promise<T> {
    let lastErr: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (err) {
            lastErr = err;
            if (!isTransientSupabaseError(err) || attempt >= maxRetries) {
                throw err;
            }
            const baseDelay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
            const jitter = Math.floor(Math.random() * 250);
            const delayMs = baseDelay + jitter;
            onRetry?.(attempt + 1, maxRetries, delayMs, err);
            await sleep(delayMs);
        }
    }
    throw lastErr;
}

/**
 * Executes bulk ContentStock inserts using micro-batching, inter-chunk throttling,
 * exponential backoff retries for transient failures, and row-level isolation for
 * database constraint errors — ensuring partial progress is preserved cleanly.
 */
export async function executeResilientStockImport(
    itemsToInsert: ParsedStockItemPreview[],
    insertBatchFn: (payloads: any[]) => Promise<BulkImportedContentItem[]>,
    options: ExecuteResilientStockImportOptions = {}
): Promise<BulkStockImportResult> {
    const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    const interChunkDelayMs = options.interChunkDelayMs ?? DEFAULT_INTER_CHUNK_DELAY_MS;
    const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    const onProgress = options.onProgress;

    const totalRequested = itemsToInsert.length;
    const totalBatches = Math.max(1, Math.ceil(totalRequested / batchSize));

    const insertedItems: BulkImportedContentItem[] = [];
    const succeededIndices = new Set<number>();
    const rowFailures: RowImportFailure[] = [];

    let processedCount = 0;
    let abortedByTransientError = false;
    let fatalErrorMessage: string | undefined;

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        const start = batchIdx * batchSize;
        const batchItems = itemsToInsert.slice(start, start + batchSize);
        const batchNumber = batchIdx + 1;

        onProgress?.({
            processedCount,
            totalCount: totalRequested,
            succeededCount: succeededIndices.size,
            failedCount: rowFailures.length,
            currentBatch: batchNumber,
            totalBatches,
            statusText: `กำลังนำเข้า ${processedCount}/${totalRequested} รายการ (ชุดที่ ${batchNumber}/${totalBatches})`,
            isRetrying: false,
        });

        try {
            const payloads = batchItems.map(item => item.payload);
            const savedRows = await runWithTransientRetry(
                () => insertBatchFn(payloads),
                maxRetries,
                (attempt, totalAttempts) => {
                    onProgress?.({
                        processedCount,
                        totalCount: totalRequested,
                        succeededCount: succeededIndices.size,
                        failedCount: rowFailures.length,
                        currentBatch: batchNumber,
                        totalBatches,
                        statusText: `การเชื่อมต่อสะดุด กำลังลองส่งชุดที่ ${batchNumber}/${totalBatches} ใหม่ (${attempt}/${totalAttempts})...`,
                        isRetrying: true,
                    });
                }
            );

            insertedItems.push(...savedRows);
            batchItems.forEach(item => succeededIndices.add(item.index));
            processedCount += batchItems.length;

            onProgress?.({
                processedCount,
                totalCount: totalRequested,
                succeededCount: succeededIndices.size,
                failedCount: rowFailures.length,
                currentBatch: batchNumber,
                totalBatches,
                statusText: `บันทึกแล้ว ${succeededIndices.size}/${totalRequested} รายการ`,
                isRetrying: false,
            });
        } catch (batchErr: any) {
            if (isTransientSupabaseError(batchErr)) {
                // Transient outage persisted past all retries: preserve all prior batches and stop cleanly
                abortedByTransientError = true;
                fatalErrorMessage = `เชื่อมต่อ Supabase ไม่สำเร็จชั่วคราวหลังลองซ้ำ ${maxRetries} ครั้ง (${formatSupabaseError(batchErr)})`;
                break;
            }

            // Non-transient error (e.g., DB constraint/type issue in 1 specific row):
            // Fall back to 1-by-1 isolation so valid rows in this batch still succeed.
            onProgress?.({
                processedCount,
                totalCount: totalRequested,
                succeededCount: succeededIndices.size,
                failedCount: rowFailures.length,
                currentBatch: batchNumber,
                totalBatches,
                statusText: `พบข้อมูลติดเงื่อนไขฐานข้อมูลในชุดที่ ${batchNumber} กำลังแยกบันทึกทีละรายการ...`,
                isRetrying: false,
            });

            let hitTransientDuringFallback = false;
            for (const singleItem of batchItems) {
                try {
                    const savedSingle = await runWithTransientRetry(
                        () => insertBatchFn([singleItem.payload]),
                        maxRetries,
                        (attempt, totalAttempts) => {
                            onProgress?.({
                                processedCount,
                                totalCount: totalRequested,
                                succeededCount: succeededIndices.size,
                                failedCount: rowFailures.length,
                                currentBatch: batchNumber,
                                totalBatches,
                                statusText: `การเชื่อมต่อสะดุด กำลังลองส่งแถวที่ ${singleItem.index} ใหม่ (${attempt}/${totalAttempts})...`,
                                isRetrying: true,
                            });
                        }
                    );
                    insertedItems.push(...savedSingle);
                    succeededIndices.add(singleItem.index);
                    processedCount += 1;
                } catch (rowErr: any) {
                    if (isTransientSupabaseError(rowErr)) {
                        abortedByTransientError = true;
                        fatalErrorMessage = `เชื่อมต่อ Supabase ไม่สำเร็จชั่วคราวระหว่างแยกส่งข้อมูล (${formatSupabaseError(rowErr)})`;
                        hitTransientDuringFallback = true;
                        break;
                    }
                    rowFailures.push({
                        item: singleItem,
                        reason: `บันทึกไม่สำเร็จจากฐานข้อมูล: ${formatSupabaseError(rowErr)}`,
                        isTransient: false,
                    });
                    processedCount += 1;
                }

                await sleep(40);
            }

            if (hitTransientDuringFallback) {
                break;
            }
        }

        // Gentle throttle between chunks so Postgres triggers, RLS, and Realtime queue stay smooth
        if (batchIdx < totalBatches - 1 && interChunkDelayMs > 0) {
            await sleep(interChunkDelayMs);
        }
    }

    const failedByIndex = new Map<number, RowImportFailure>(
        rowFailures.map(f => [f.item.index, f])
    );

    const remainingItems: ParsedStockItemPreview[] = itemsToInsert
        .filter(item => !succeededIndices.has(item.index))
        .map(item => {
            const failure = failedByIndex.get(item.index);
            if (!failure) return item;
            const hasReason = item.errors.includes(failure.reason);
            return {
                ...item,
                isValid: false,
                errors: hasReason ? item.errors : [...item.errors, failure.reason],
            };
        });

    if (!fatalErrorMessage && rowFailures.length > 0) {
        fatalErrorMessage = `มี ${rowFailures.length} รายการที่ไม่ผ่านเงื่อนไขฐานข้อมูล`;
    }

    return {
        totalRequested,
        insertedItems,
        succeededIndices,
        rowFailures,
        remainingItems,
        abortedByTransientError,
        errorMessage: fatalErrorMessage,
    };
}
