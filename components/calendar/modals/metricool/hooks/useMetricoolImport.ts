import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { isValid, isSameMonth, differenceInCalendarDays } from 'date-fns';
import { Task, Channel, MasterOption } from '../../../../../types';
import {
    parseMetricoolCsvText,
    requestAiMetricoolMatch,
    ParsedMetricoolRow
} from '../../../../../utils/metricoolCsv';
import {
    batchSaveMetricoolRows,
    BatchSaveProgress
} from '../../../../../utils/metricool/metricoolBatchSaver';
import { useTaskContext } from '../../../../../context/TaskContext';
import { useToast } from '../../../../../context/ToastContext';
import { ImportStatusFilter, PREVIEW_PAGE_SIZE } from '../constants';

interface UseMetricoolImportParams {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    channels: Channel[];
    masterOptions: MasterOption[];
    currentDate: Date;
    activeChannelFilterId?: string;
    onRangeChange?: (targetDate: Date) => void;
    onNavigateDate?: (targetDate: Date) => void;
}

export function useMetricoolImport({
    isOpen,
    onClose,
    tasks,
    channels,
    masterOptions,
    currentDate,
    activeChannelFilterId,
    onRangeChange,
    onNavigateDate
}: UseMetricoolImportParams) {
    const { showToast } = useToast();
    const { setTasks } = useTaskContext();

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [importedFileName, setImportedFileName] = useState<string>('');
    const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
    const [parsedRows, setParsedRows] = useState<ParsedMetricoolRow[]>([]);
    const [importDefaultChannelId, setImportDefaultChannelId] = useState<string>(
        activeChannelFilterId && activeChannelFilterId !== 'ALL'
            ? activeChannelFilterId
            : channels[0]?.id || ''
    );
    const [importDefaultStatus, setImportDefaultStatus] = useState<string>('FINAL');

    // AI Smart Match & Batch Save Progress State
    const [isRunningAiMatch, setIsRunningAiMatch] = useState<boolean>(false);
    const [aiMatchProgress, setAiMatchProgress] = useState<{ current: number; total: number } | null>(null);
    const [isSavingImport, setIsSavingImport] = useState<boolean>(false);
    const [saveProgress, setSaveProgress] = useState<BatchSaveProgress | null>(null);

    // Raw CSV Paste Drawer
    const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
    const [rawCsvPaste, setRawCsvPaste] = useState<string>('');

    // Interactive Preview Inspection State (Filter, Search, Pagination, Diff Expansion)
    const [statusFilter, setStatusFilter] = useState<ImportStatusFilter>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [importPage, setImportPage] = useState<number>(1);
    const [expandedDiffRowIndices, setExpandedDiffRowIndices] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (isOpen && activeChannelFilterId && activeChannelFilterId !== 'ALL') {
            setImportDefaultChannelId(activeChannelFilterId);
            return;
        }
        if (!importDefaultChannelId && channels.length > 0) {
            setImportDefaultChannelId(channels[0].id);
        }
    }, [isOpen, activeChannelFilterId, channels, importDefaultChannelId]);

    const contentStatuses = useMemo(() => {
        const fromMaster = masterOptions.filter(o => o.type === 'STATUS' && o.isActive);
        if (fromMaster.length > 0) return fromMaster;
        return [
            { key: 'IDEA', label: 'Idea / วางแผน' },
            { key: 'SCRIPT', label: 'เขียนสคริปต์' },
            { key: 'EDIT_CLIP', label: 'กำลังตัดต่อ' },
            { key: 'APPROVE', label: 'รออนุมัติ / พร้อมลง' },
            { key: 'FINAL', label: 'Final / ตั้งเวลาแล้ว' }
        ];
    }, [masterOptions]);

    // Toggle Old-vs-New Diff comparison row
    const toggleDiffRow = useCallback((rowIndex: number) => {
        setExpandedDiffRowIndices(prev => {
            const next = new Set(prev);
            if (next.has(rowIndex)) {
                next.delete(rowIndex);
            } else {
                next.add(rowIndex);
            }
            return next;
        });
    }, []);

    // Run Date-Scoped & Chunked AI Smart Match
    const handleRunAiSmartMatch = useCallback(
        async (targetRows?: ParsedMetricoolRow[]) => {
            const rowsToProcess = targetRows || parsedRows;
            if (rowsToProcess.length === 0) return;

            setIsRunningAiMatch(true);
            setAiMatchProgress(null);

            try {
                const aiMatches = await requestAiMetricoolMatch(
                    rowsToProcess,
                    tasks,
                    (currentChunk, totalChunks) => {
                        setAiMatchProgress({ current: currentChunk, total: totalChunks });
                    }
                );

                if (aiMatches.length === 0) {
                    showToast(
                        `อ่านไฟล์สำเร็จ ${rowsToProcess.length} รายการ (จับคู่ในเครื่องเรียบร้อย ไม่ต้องรอ AI เพิ่มเติม)`,
                        'info'
                    );
                    return;
                }

                const matchByRowIdx = new Map(aiMatches.map(m => [m.rowIndex, m]));
                let aiMatchedCount = 0;

                setParsedRows(prev =>
                    prev.map(row => {
                        if (row.action === 'SKIP') return row;
                        const aiMatch = matchByRowIdx.get(row.rowIndex);
                        if (aiMatch && aiMatch.matchedTaskId && aiMatch.confidence >= 65) {
                            const targetTask = tasks.find(t => t.id === aiMatch.matchedTaskId);
                            if (targetTask) {
                                aiMatchedCount++;
                                return {
                                    ...row,
                                    action: 'UPDATE',
                                    matchedTaskId: targetTask.id,
                                    matchedChannelId: row.matchedChannelId || targetTask.channelId || '',
                                    matchType:
                                        row.matchType === 'THAI_FUZZY' &&
                                        (row.matchConfidence || 0) >= aiMatch.confidence
                                            ? 'THAI_FUZZY'
                                            : 'AI_SEMANTIC',
                                    matchConfidence: Math.max(row.matchConfidence || 0, aiMatch.confidence),
                                    matchReason:
                                        aiMatch.reason ||
                                        row.matchReason ||
                                        'AI วิเคราะห์ว่าเนื้อหาและช่วงเวลาตรงกัน'
                                };
                            }
                        }
                        return row;
                    })
                );

                if (aiMatchedCount > 0) {
                    showToast(`AI ช่วยจับคู่การ์ดงานเดิมได้เพิ่ม ${aiMatchedCount} รายการ!`, 'success');
                } else {
                    showToast(`ตรวจสอบครบถ้วน ${rowsToProcess.length} รายการ`, 'info');
                }
            } catch (err: any) {
                console.warn('[useMetricoolImport] AI match warning:', err);
                showToast(
                    err?.message || 'ใช้ระบบจับคู่ภาษาไทยในเครื่องแทน เนื่องจากเรียก AI ไม่สำเร็จ',
                    'warning'
                );
            } finally {
                setIsRunningAiMatch(false);
                setAiMatchProgress(null);
            }
        },
        [parsedRows, tasks, showToast]
    );

    const processCsvText = useCallback(
        async (csvText: string, sourceName: string) => {
            const { headers, rows } = parseMetricoolCsvText(
                csvText,
                tasks,
                channels,
                importDefaultChannelId
            );

            setImportedFileName(sourceName);
            setDetectedHeaders(headers);
            setParsedRows(rows);
            setStatusFilter('ALL');
            setSearchQuery('');
            setImportPage(1);
            setExpandedDiffRowIndices(new Set());

            if (rows.length === 0) {
                showToast('ไม่พบข้อมูลแถวที่สามารถนำเข้าได้ กรุณาตรวจสอบไฟล์ CSV', 'warning');
                return;
            }

            // Expand loaded calendar task range to cover the CSV's date span
            if (onRangeChange) {
                const validDates = rows
                    .map(r => r.parsedDate)
                    .filter(d => isValid(d))
                    .sort((a, b) => a.getTime() - b.getTime());
                if (validDates.length > 0) {
                    onRangeChange(validDates[0]);
                    if (validDates.length > 1) {
                        onRangeChange(validDates[validDates.length - 1]);
                    }
                }
            }

            // Check if any non-exact rows fall within +/- 5 days of existing CONTENT tasks
            const contentTasks = tasks.filter(t => t.type === 'CONTENT');
            const hasNearbyAmbiguousRows = rows.some(row => {
                if (row.action === 'SKIP' || row.matchType === 'EXACT') return false;
                return contentTasks.some(t => {
                    const tDate = t.endDate instanceof Date ? t.endDate : new Date(t.endDate);
                    return isValid(tDate) && Math.abs(differenceInCalendarDays(row.parsedDate, tDate)) <= 5;
                });
            });

            if (hasNearbyAmbiguousRows) {
                await handleRunAiSmartMatch(rows);
            } else {
                showToast(
                    `อ่านไฟล์สำเร็จ ${rows.length} รายการ (พร้อมตรวจสอบตาราง Preview ก่อนบันทึกจริง)`,
                    'success'
                );
            }
        },
        [tasks, channels, importDefaultChannelId, onRangeChange, handleRunAiSmartMatch, showToast]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async event => {
                const content = String(event.target?.result || '');
                await processCsvText(content, file.name);
            };
            reader.readAsText(file, 'utf-8');
            e.target.value = '';
        },
        [processCsvText]
    );

    const handleRowActionChange = useCallback(
        (rowIndex: number, newAction: 'UPDATE' | 'CREATE' | 'SKIP') => {
            setParsedRows(prev =>
                prev.map(r => {
                    if (r.rowIndex !== rowIndex) return r;
                    if (newAction === 'UPDATE' && !r.matchedTaskId) {
                        const fallbackTask = tasks.find(t => t.type === 'CONTENT');
                        return {
                            ...r,
                            action: newAction,
                            matchedTaskId: fallbackTask?.id || null,
                            matchType: 'MANUAL'
                        };
                    }
                    return { ...r, action: newAction };
                })
            );
        },
        [tasks]
    );

    const handleRowTargetTaskChange = useCallback(
        (rowIndex: number, taskId: string) => {
            setParsedRows(prev =>
                prev.map(r => {
                    if (r.rowIndex !== rowIndex) return r;
                    if (!taskId) {
                        return {
                            ...r,
                            action: 'CREATE',
                            matchedTaskId: null,
                            matchType: 'NONE'
                        };
                    }
                    const targetTask = tasks.find(t => t.id === taskId);
                    return {
                        ...r,
                        action: 'UPDATE',
                        matchedTaskId: taskId,
                        matchedChannelId: r.matchedChannelId || targetTask?.channelId || '',
                        matchType: 'MANUAL',
                        matchConfidence: 100,
                        matchReason: 'เลือกจับคู่ด้วยตนเอง'
                    };
                })
            );
        },
        [tasks]
    );

    // Filtered & Paginated Rows for Preview Inspection
    const filteredImportRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return parsedRows.filter(row => {
            if (statusFilter !== 'ALL' && row.action !== statusFilter) {
                return false;
            }
            if (query) {
                const inTitle = row.title.toLowerCase().includes(query);
                const inCaption = row.description.toLowerCase().includes(query);
                const inTags = row.tags.some(t => t.toLowerCase().includes(query));
                const inDate = row.dateStr.includes(query);
                if (!inTitle && !inCaption && !inTags && !inDate) {
                    return false;
                }
            }
            return true;
        });
    }, [parsedRows, statusFilter, searchQuery]);

    // Reset page when filter or search changes
    useEffect(() => {
        setImportPage(1);
    }, [statusFilter, searchQuery]);

    const importTotalPages = Math.max(1, Math.ceil(filteredImportRows.length / PREVIEW_PAGE_SIZE));
    const paginatedImportRows = useMemo(() => {
        const start = (importPage - 1) * PREVIEW_PAGE_SIZE;
        return filteredImportRows.slice(start, start + PREVIEW_PAGE_SIZE);
    }, [filteredImportRows, importPage]);

    // Bulk action override for all rows matching the current filter/search
    const handleBulkActionForFiltered = useCallback(
        (targetAction: 'CREATE' | 'SKIP') => {
            const targetIndices = new Set(filteredImportRows.map(r => r.rowIndex));
            if (targetIndices.size === 0) return;

            setParsedRows(prev =>
                prev.map(r => (targetIndices.has(r.rowIndex) ? { ...r, action: targetAction } : r))
            );
            showToast(
                `ปรับสถานะ ${targetIndices.size} รายการเป็น "${
                    targetAction === 'CREATE' ? 'สร้างการ์ดใหม่' : 'ข้ามรายการ'
                }" เรียบร้อย`,
                'info'
            );
        },
        [filteredImportRows, showToast]
    );

    // High-Speed Chunked Batch Save
    const handleConfirmImport = useCallback(async () => {
        const activeRows = parsedRows.filter(r => r.action !== 'SKIP');
        if (activeRows.length === 0) {
            showToast('ไม่มีรายการที่เลือกให้นำเข้า', 'warning');
            return;
        }

        setIsSavingImport(true);
        setSaveProgress({
            current: 0,
            total: activeRows.length,
            label: 'กำลังเตรียมซิงค์ข้อมูลเข้าตารางปฏิทิน...'
        });

        try {
            const { updatedCount, createdCount } = await batchSaveMetricoolRows({
                activeRows,
                existingTasks: tasks,
                importDefaultChannelId,
                importDefaultStatus,
                setTasks,
                onProgress: progress => setSaveProgress(progress)
            });

            if (activeRows.length > 0 && onNavigateDate) {
                const hasRowInCurrentMonth = activeRows.some(r =>
                    isSameMonth(r.parsedDate, currentDate || new Date())
                );
                if (!hasRowInCurrentMonth && isValid(activeRows[0].parsedDate)) {
                    onNavigateDate(activeRows[0].parsedDate);
                }
            }

            showToast(
                `ซิงค์ตารางจาก Metricool สำเร็จ! (อัปเดตการ์ดเดิม ${updatedCount} รายการ, สร้างใหม่ ${createdCount} รายการ)`,
                'success'
            );
            onClose();
        } catch (err: any) {
            console.error('[useMetricoolImport] Batch save error:', err);
            showToast(err?.message || 'เกิดข้อผิดพลาดในการบันทึกรายการคอนเทนต์', 'error');
        } finally {
            setIsSavingImport(false);
            setSaveProgress(null);
        }
    }, [
        parsedRows,
        tasks,
        importDefaultChannelId,
        importDefaultStatus,
        setTasks,
        currentDate,
        onNavigateDate,
        showToast,
        onClose
    ]);

    const importSummary = useMemo(() => {
        const updateCount = parsedRows.filter(r => r.action === 'UPDATE').length;
        const createCount = parsedRows.filter(r => r.action === 'CREATE').length;
        const skipCount = parsedRows.filter(r => r.action === 'SKIP').length;
        return { updateCount, createCount, skipCount };
    }, [parsedRows]);

    const nearbyTasks = useMemo(
        () => tasks.filter(t => t.type === 'CONTENT').slice(0, 120),
        [tasks]
    );

    return {
        fileInputRef,
        importedFileName,
        detectedHeaders,
        parsedRows,
        filteredImportRows,
        paginatedImportRows,
        importPage,
        setImportPage,
        importTotalPages,
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        expandedDiffRowIndices,
        toggleDiffRow,
        importDefaultChannelId,
        setImportDefaultChannelId,
        importDefaultStatus,
        setImportDefaultStatus,
        contentStatuses,
        isRunningAiMatch,
        aiMatchProgress,
        isSavingImport,
        saveProgress,
        showPasteBox,
        setShowPasteBox,
        rawCsvPaste,
        setRawCsvPaste,
        importSummary,
        nearbyTasks,
        processCsvText,
        handleFileChange,
        handleRunAiSmartMatch,
        handleRowActionChange,
        handleRowTargetTaskChange,
        handleBulkActionForFiltered,
        handleConfirmImport
    };
}
