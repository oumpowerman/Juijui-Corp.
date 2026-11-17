import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, Channel, User, MasterOption, getChecklistGroupKey } from '../types';
import { useToast } from '../context/ToastContext';
import { useContentStock } from './useContentStock';
import { generateContentStockCSVTemplate } from '../services/csvService';
import { validateAndParseStockFile, StockCSVValidationResult, ParsedStockItemPreview } from '../services/stockImportValidator';
import { supabase } from '../lib/supabase';
import { isStockTerminalStatus } from '../config/status';
import { parseChannelTokens, copyTextToClipboard } from './content-stock/deepLinkUtils';
import { dispatchBulkContentImportNotifications, BulkImportedContentItem } from '../utils/assignmentNotifications';
import { executeResilientStockImport, ImportSubmitProgress, formatSupabaseError } from '../utils/bulkStockImporter';
import {
    SortKey,
    SortDirection,
    StockFilterState,
    StockViewState,
    StockDataResult,
    StockModalState,
    StockImportActions,
    ImportPartialAlert
} from './content-stock/types';

export * from './content-stock/types';

const ITEMS_PER_PAGE = 20;

interface UseContentStockControllerProps {
    globalTasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
}

export const useContentStockController = ({ globalTasks, channels, users, masterOptions }: UseContentStockControllerProps) => {
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    // --- Filter States (Hydrated from URL query params) ---
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || searchParams.get('search') || '');
    const [filterChannel, setFilterChannel] = useState<string[]>([]);
    const [filterFormat, setFilterFormat] = useState<string[]>(() => {
        const raw = searchParams.get('format') || searchParams.get('stockFormat');
        return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
    });
    const [filterPillar, setFilterPillar] = useState<string[]>(() => {
        const raw = searchParams.get('pillar') || searchParams.get('stockPillar');
        return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
    });
    const [filterCategory, setFilterCategory] = useState<string[]>(() => {
        const raw = searchParams.get('category') || searchParams.get('stockCategory');
        return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
    });
    const [filterStatuses, setFilterStatuses] = useState<string[]>(() => {
        const raw = searchParams.get('status') || searchParams.get('stockStatus');
        return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
    });
    const [filterOnlyOverdue, setFilterOnlyOverdue] = useState(() => searchParams.get('overdue') === 'true');
    const [filterOnlyMissingStorage, setFilterOnlyMissingStorage] = useState(() => searchParams.get('missingStorage') === 'true');
    const [filterChecklistProgress, setFilterChecklistProgress] = useState<string[]>([]);
    
    // Range Filter
    const [filterHasShootDate, setFilterHasShootDate] = useState(false);
    const [filterShootDateStart, setFilterShootDateStart] = useState('');
    const [filterShootDateEnd, setFilterShootDateEnd] = useState('');
    
    const [showStockOnly, setShowStockOnly] = useState(() => searchParams.get('stockOnly') === 'true');
    const [isFiltering, setIsFiltering] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [selectedContentForAnalytics, setSelectedContentForAnalytics] = useState<Task | null>(null);

    // --- CSV Import Validation States ---
    const [isImportPreviewOpen, setIsImportPreviewOpenRaw] = useState(false);
    const [importValidationResult, setImportValidationResult] = useState<StockCSVValidationResult | null>(null);
    const [isSubmittingImport, setIsSubmittingImport] = useState(false);
    const [importProgress, setImportProgress] = useState<ImportSubmitProgress | null>(null);
    const [importPartialAlert, setImportPartialAlert] = useState<ImportPartialAlert | null>(null);
    const isSubmittingImportRef = useRef(false);

    const setIsImportPreviewOpen = useCallback((open: boolean) => {
        setIsImportPreviewOpenRaw(open);
        if (!open) {
            setImportProgress(null);
            setImportPartialAlert(null);
        }
    }, []);
    
    const viewTab = (searchParams.get('stockMode') as 'LIST' | 'QUEUE') || 'LIST';
    const contentSubTab = (searchParams.get('stockTab') as 'ACTIVE' | 'ARCHIVE') || 'ACTIVE';

    const setViewTab = useCallback((tab: 'LIST' | 'QUEUE') => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            // Navigation Guard: if user navigated away from ContentStock, do not overwrite URL
            if (next.get('view') !== 'ContentStock') {
                return prev;
            }
            if (tab === 'QUEUE') {
                next.set('stockMode', 'QUEUE');
                next.delete('stockTab');
            } else {
                next.delete('stockMode');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const setContentSubTab = useCallback((tab: 'ACTIVE' | 'ARCHIVE' | ((prev: 'ACTIVE' | 'ARCHIVE') => 'ACTIVE' | 'ARCHIVE')) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            // Navigation Guard: if user navigated away from ContentStock, do not overwrite URL
            if (next.get('view') !== 'ContentStock') {
                return prev;
            }
            next.delete('stockMode');
            
            const currentSubTab = (next.get('stockTab') as 'ACTIVE' | 'ARCHIVE') || 'ACTIVE';
            const nextSubTab = typeof tab === 'function' ? tab(currentSubTab) : tab;
            
            if (nextSubTab === 'ARCHIVE') {
                next.set('stockTab', 'ARCHIVE');
            } else {
                next.delete('stockTab');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const currentPage = parseInt(searchParams.get('stockPage') || '1', 10) || 1;
    const setCurrentPage = useCallback((page: number | ((prev: number) => number)) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            // Navigation Guard: if user navigated away from ContentStock, do not overwrite URL
            if (next.get('view') !== 'ContentStock') {
                return prev;
            }
            
            const currentPageVal = parseInt(next.get('stockPage') || '1', 10) || 1;
            const nextPageVal = typeof page === 'function' ? page(currentPageVal) : page;
            
            if (nextPageVal > 1) {
                next.set('stockPage', nextPageVal.toString());
            } else {
                next.delete('stockPage');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const isFirstMountRef = useRef(true);
    const setCurrentPageRef = useRef(setCurrentPage);
    setCurrentPageRef.current = setCurrentPage;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const initialChannelResolvedRef = useRef(false);
    const lastSyncedChannelsParamRef = useRef<string>('');

    // --- 1. HYBRID CHANNEL DEEP LINK RESOLVER (Option C: ID, Code, Name, Unassigned) ---
    useEffect(() => {
        if (initialChannelResolvedRef.current) return;
        if (!channels || channels.length === 0) return;

        const rawChannelParam = searchParams.get('channels') || searchParams.get('channel');
        if (!rawChannelParam) {
            initialChannelResolvedRef.current = true;
            return;
        }

        const { resolvedIds, hasUnresolved } = parseChannelTokens(rawChannelParam, channels);

        if (resolvedIds.length > 0) {
            setFilterChannel(resolvedIds);
            lastSyncedChannelsParamRef.current = resolvedIds.join(',');
        } else if (hasUnresolved) {
            // Edge Case 2: Fallback when specified channel doesn't exist
            showToast('ไม่พบช่องตามลิงก์ที่ระบุ แสดงคอนเทนต์ทั้งหมด', 'warning');
            setFilterChannel([]);
            lastSyncedChannelsParamRef.current = '';
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.delete('channels');
                next.delete('channel');
                return next;
            }, { replace: true });
        }

        initialChannelResolvedRef.current = true;
    }, [channels, searchParams, setSearchParams, showToast]);

    // --- 2. TWO-WAY URL STATE SYNCHRONIZATION (Edge Case 3: replace history) ---
    useEffect(() => {
        // Navigation Guard: only sync when currently viewing ContentStock
        if (searchParams.get('view') !== 'ContentStock') return;
        // Do not overwrite URL before initial channel resolution if channel query is present
        if (!initialChannelResolvedRef.current && (searchParams.get('channels') || searchParams.get('channel'))) return;

        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (next.get('view') !== 'ContentStock') return prev;

            let changed = false;

            // Sync Channels
            const currentChannelsParam = next.get('channels') || '';
            const newChannelsParam = filterChannel.join(',');
            if (newChannelsParam) {
                if (currentChannelsParam !== newChannelsParam || next.has('channel')) {
                    next.set('channels', newChannelsParam);
                    next.delete('channel'); // Canonicalize to 'channels'
                    lastSyncedChannelsParamRef.current = newChannelsParam;
                    changed = true;
                }
            } else {
                if (next.has('channels') || next.has('channel')) {
                    next.delete('channels');
                    next.delete('channel');
                    lastSyncedChannelsParamRef.current = '';
                    changed = true;
                }
            }

            // Sync Format
            const currentFormat = next.get('format') || '';
            const newFormat = filterFormat.join(',');
            if (newFormat !== currentFormat) {
                if (newFormat) next.set('format', newFormat);
                else next.delete('format');
                changed = true;
            }

            // Sync Status
            const currentStatus = next.get('status') || '';
            const newStatus = filterStatuses.join(',');
            if (newStatus !== currentStatus) {
                if (newStatus) next.set('status', newStatus);
                else next.delete('status');
                changed = true;
            }

            // Sync Category
            const currentCat = next.get('category') || '';
            const newCat = filterCategory.join(',');
            if (newCat !== currentCat) {
                if (newCat) next.set('category', newCat);
                else next.delete('category');
                changed = true;
            }

            // Sync Pillar
            const currentPillar = next.get('pillar') || '';
            const newPillar = filterPillar.join(',');
            if (newPillar !== currentPillar) {
                if (newPillar) next.set('pillar', newPillar);
                else next.delete('pillar');
                changed = true;
            }

            // Sync Search Query
            const currentQ = next.get('q') || '';
            const newQ = searchQuery.trim();
            if (newQ !== currentQ) {
                if (newQ) next.set('q', newQ);
                else next.delete('q');
                changed = true;
            }

            // Sync Overdue
            const currentOverdue = next.get('overdue') === 'true';
            if (filterOnlyOverdue !== currentOverdue) {
                if (filterOnlyOverdue) next.set('overdue', 'true');
                else next.delete('overdue');
                changed = true;
            }

            // Sync Missing Storage
            const currentMissingStorage = next.get('missingStorage') === 'true';
            if (filterOnlyMissingStorage !== currentMissingStorage) {
                if (filterOnlyMissingStorage) next.set('missingStorage', 'true');
                else next.delete('missingStorage');
                changed = true;
            }

            // Sync Stock Only
            const currentStockOnly = next.get('stockOnly') === 'true';
            if (showStockOnly !== currentStockOnly) {
                if (showStockOnly) next.set('stockOnly', 'true');
                else next.delete('stockOnly');
                changed = true;
            }

            return changed ? next : prev;
        }, { replace: true });
    }, [
        filterChannel, filterFormat, filterStatuses, filterCategory, filterPillar,
        searchQuery, filterOnlyOverdue, filterOnlyMissingStorage, showStockOnly,
        searchParams, setSearchParams
    ]);

    // Reset pagination when filters change (skip initial mount, avoid setCurrentPage in deps)
    useEffect(() => {
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            return;
        }
        setCurrentPageRef.current(1);
    }, [searchQuery, filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly, sortConfig, filterOnlyMissingStorage, filterChecklistProgress]);

    const filters = useMemo(() => ({
        channelId: filterChannel,
        format: filterFormat,
        pillar: filterPillar,
        category: filterCategory,
        statuses: filterStatuses,
        hasShootDate: filterHasShootDate,
        shootDateStart: filterShootDateStart,
        shootDateEnd: filterShootDateEnd,
        showStockOnly,
        onlyOverdue: filterOnlyOverdue,
        onlyMissingStorage: filterOnlyMissingStorage,
        contentSubTab,
        checklistProgress: filterChecklistProgress
    }), [filterChannel, filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly, filterOnlyOverdue, filterOnlyMissingStorage, contentSubTab, filterChecklistProgress]);

    useEffect(() => {
        setIsFiltering(true);
        const timer = setTimeout(() => setIsFiltering(false), 500);
        return () => clearTimeout(timer);
    }, [filters]);

    // Reset checklist filter if it's a specific step but we are no longer in a single status
    useEffect(() => {
        const isSingleStatus = filterStatuses.length === 1;
        if (!isSingleStatus) {
            const validFilters = filterChecklistProgress.filter(
                f => f === 'COMPLETED' || f === 'INCOMPLETE'
            );
            if (validFilters.length !== filterChecklistProgress.length) {
                setFilterChecklistProgress(validFilters);
            }
        } else {
            const selectedStatus = filterStatuses[0];
            const groupKey = getChecklistGroupKey(selectedStatus, masterOptions);
            const activeSteps = masterOptions.filter(
                o => o.type === 'STATUS_CHECKLIST' && o.parentKey === groupKey && o.isActive
            );
            const stepKeys = activeSteps.map(s => s.key);
            
            const validFilters = filterChecklistProgress.filter(
                f => f === 'COMPLETED' || f === 'INCOMPLETE' || stepKeys.includes(f)
            );
            if (validFilters.length !== filterChecklistProgress.length) {
                setFilterChecklistProgress(validFilters);
            }
        }
    }, [filterStatuses, filterChecklistProgress, masterOptions]);

    const { 
        contents: paginatedTasks, 
        totalCount, 
        overdueCount, 
        missingStorageCount, 
        unassignedChannelCount,
        isLoading, 
        isRefreshing, 
        fetchContents, 
        refreshStock,
        fetchUnassignedChannelCount,
        updateLocalItem, 
        toggleShootQueue, 
        updateSubChecklistProgress 
    } = useContentStock({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        searchQuery,
        filters,
        sortConfig,
        masterOptions
    });

    const handleSort = useCallback((key: SortKey) => {
        setSortConfig(current => {
            if (current && current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            const isDateKey = key === 'date' || key === 'publishDate' || key === 'shootDate';
            return { key, direction: isDateKey ? 'desc' : 'asc' };
        });
    }, []);

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setFilterChannel([]);
        setFilterFormat([]);
        setFilterPillar([]);
        setFilterCategory([]);
        setFilterHasShootDate(false);
        setFilterShootDateStart('');
        setFilterShootDateEnd('');
        setFilterStatuses([]);
        setFilterOnlyOverdue(false);
        setFilterOnlyMissingStorage(false);
        setFilterChecklistProgress([]);
    }, []);

    const hasActiveFilters = useMemo(() => {
        return !!(searchQuery || 
               filterChannel.length > 0 || 
               filterFormat.length > 0 || 
               filterPillar.length > 0 || 
               filterCategory.length > 0 || 
               filterStatuses.length > 0 || 
               filterHasShootDate || 
               filterShootDateStart || 
               filterShootDateEnd ||
               filterChecklistProgress.length > 0 ||
               filterOnlyOverdue ||
               filterOnlyMissingStorage);
    }, [
        searchQuery, filterChannel, filterFormat, filterPillar, 
        filterCategory, filterStatuses, filterHasShootDate, 
        filterShootDateStart, filterShootDateEnd, filterChecklistProgress,
        filterOnlyOverdue, filterOnlyMissingStorage
    ]);

    const handleProcessFile = useCallback(async (file: File) => {
        if (!file) return;

        setIsImporting(true);
        try {
            const validation = await validateAndParseStockFile(file, users, channels, masterOptions);
            setImportPartialAlert(null);
            setImportProgress(null);
            setImportValidationResult(validation);
            setIsImportPreviewOpen(true);
        } catch (err: any) {
            console.error('Import parse error:', err);
            showToast('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + (err.message || err), 'error');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [channels, users, masterOptions, showToast, setIsImportPreviewOpen]);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await handleProcessFile(file);
    }, [handleProcessFile]);

    const handleExecuteImport = useCallback(async (itemsToInsert: ParsedStockItemPreview[]) => {
        if (!itemsToInsert || itemsToInsert.length === 0) {
            showToast('ไม่มีรายการที่พร้อมนำเข้า', 'warning');
            return;
        }
        if (isSubmittingImportRef.current) {
            return;
        }

        isSubmittingImportRef.current = true;
        setIsSubmittingImport(true);
        setImportPartialAlert(null);
        setImportProgress({
            processedCount: 0,
            totalCount: itemsToInsert.length,
            succeededCount: 0,
            failedCount: 0,
            currentBatch: 1,
            totalBatches: Math.max(1, Math.ceil(itemsToInsert.length / 25)),
            statusText: `กำลังเตรียมนำเข้า ${itemsToInsert.length} รายการ...`,
            isRetrying: false,
        });

        try {
            const result = await executeResilientStockImport(
                itemsToInsert,
                async (payloadBatch) => {
                    const { data, error } = await supabase
                        .from('contents')
                        .insert(payloadBatch)
                        .select('id, title, end_date, idea_owner_ids, editor_ids, assignee_ids');

                    if (error) throw error;

                    return Array.isArray(data)
                        ? data.map((row: any): BulkImportedContentItem => ({
                            id: row.id,
                            title: row.title,
                            endDate: row.end_date,
                            ideaOwnerIds: row.idea_owner_ids || [],
                            editorIds: row.editor_ids || [],
                            assigneeIds: row.assignee_ids || [],
                        }))
                        : [];
                },
                {
                    batchSize: 25,
                    interChunkDelayMs: 200,
                    maxRetries: 3,
                    onProgress: (progress) => setImportProgress(progress),
                }
            );

            // Dispatch notifications for whatever succeeded (even in partial success)
            if (result.insertedItems.length > 0) {
                try {
                    await dispatchBulkContentImportNotifications(result.insertedItems);
                } catch (notifErr) {
                    console.warn('[useContentStockController] Bulk import notification warning:', notifErr);
                }
            }

            const hasRemaining = result.remainingItems.length > 0 || result.rowFailures.length > 0 || result.abortedByTransientError;

            if (!hasRemaining) {
                showToast(`นำเข้าสำเร็จทั้งหมด ${result.insertedItems.length} รายการ`, 'success');
                setIsImportPreviewOpen(false);
                setImportValidationResult(null);
                setImportPartialAlert(null);
                await Promise.all([refreshStock(), fetchUnassignedChannelCount()]);
                return;
            }

            // Partial or full failure recovery: strip already-saved items so retries NEVER duplicate them
            const updatedByIndex = new Map<number, ParsedStockItemPreview>(
                result.remainingItems.map(it => [it.index, it])
            );

            setImportValidationResult(prev => {
                if (!prev) return prev;
                const nextItems = prev.items
                    .filter(it => !result.succeededIndices.has(it.index))
                    .map(it => updatedByIndex.get(it.index) || it);

                let validCount = 0;
                let warningCount = 0;
                let errorCount = 0;
                nextItems.forEach(it => {
                    if (!it.isValid) errorCount++;
                    else if (it.warnings.length > 0) warningCount++;
                    else validCount++;
                });

                return {
                    ...prev,
                    totalRows: nextItems.length,
                    validRowsCount: validCount,
                    warningRowsCount: warningCount,
                    errorRowsCount: errorCount,
                    items: nextItems,
                };
            });

            const succeededCount = result.succeededIndices.size;
            const remainingValidCount = result.remainingItems.filter(it => it.isValid).length;
            const errorRowCount = result.rowFailures.length;

            const alertMsg = succeededCount > 0
                ? `บันทึกเข้าฐานข้อมูลแล้ว ${succeededCount} รายการ — เหลืออีก ${result.remainingItems.length} รายการที่ยังไม่ถูกนำเข้า${result.errorMessage ? ` (${result.errorMessage})` : ''}`
                : (result.errorMessage || 'ไม่สามารถบันทึกข้อมูลเข้า Supabase ได้ชั่วคราว กรุณาลองใหม่อีกครั้ง');

            setImportPartialAlert({
                succeededCount,
                remainingCount: remainingValidCount,
                errorRowCount,
                message: alertMsg,
            });

            if (succeededCount > 0) {
                showToast(`บันทึกสำเร็จบางส่วน ${succeededCount} รายการ (เหลือ ${result.remainingItems.length} รายการให้ส่งต่อ)`, 'warning');
                await Promise.all([refreshStock(), fetchUnassignedChannelCount()]);
            } else {
                showToast(alertMsg, 'error');
            }
        } catch (err: any) {
            console.error('Execute import error:', err);
            showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + formatSupabaseError(err), 'error');
        } finally {
            isSubmittingImportRef.current = false;
            setIsSubmittingImport(false);
            setImportProgress(null);
        }
    }, [showToast, refreshStock, fetchUnassignedChannelCount, setIsImportPreviewOpen]);

    const handleDownloadTemplate = useCallback(() => {
        try {
            const csvContent = generateContentStockCSVTemplate(masterOptions, channels);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `content_stock_template_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('ดาวน์โหลดไฟล์ Template สำเร็จ', 'success');
        } catch (err) {
            console.error('Template download error:', err);
            showToast('เกิดข้อผิดพลาดในการดาวน์โหลด Template', 'error');
        }
    }, [masterOptions, channels, showToast]);

    // The unassigned count is fetched directly from database (contents table where channel_id is null)
    // We should use unassignedChannelCount directly rather than Math.max with local tasks (which includes tasks table).
    const effectiveUnassignedCount = unassignedChannelCount !== undefined && unassignedChannelCount >= 0 
        ? unassignedChannelCount 
        : 0;

    const handleShareFilterLink = useCallback(async () => {
        try {
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set('view', 'ContentStock');

            if (viewTab === 'QUEUE') {
                url.searchParams.set('stockMode', 'QUEUE');
            }
            if (contentSubTab === 'ARCHIVE') {
                url.searchParams.set('stockTab', 'ARCHIVE');
            }
            if (currentPage > 1) {
                url.searchParams.set('stockPage', currentPage.toString());
            }

            // Channel parameter
            if (filterChannel.length > 0) {
                url.searchParams.set('channels', filterChannel.join(','));
            }

            // Other active filters (Full State Sharing)
            if (filterFormat.length > 0) {
                url.searchParams.set('format', filterFormat.join(','));
            }
            if (filterStatuses.length > 0) {
                url.searchParams.set('status', filterStatuses.join(','));
            }
            if (filterCategory.length > 0) {
                url.searchParams.set('category', filterCategory.join(','));
            }
            if (filterPillar.length > 0) {
                url.searchParams.set('pillar', filterPillar.join(','));
            }
            if (searchQuery.trim()) {
                url.searchParams.set('q', searchQuery.trim());
            }
            if (filterOnlyOverdue) {
                url.searchParams.set('overdue', 'true');
            }
            if (filterOnlyMissingStorage) {
                url.searchParams.set('missingStorage', 'true');
            }
            if (showStockOnly) {
                url.searchParams.set('stockOnly', 'true');
            }

            const shareUrl = url.toString();
            const copied = await copyTextToClipboard(shareUrl);

            if (!copied) {
                showToast('ไม่สามารถคัดลอกลิงก์ได้ กรุณาลองใหม่อีกครั้ง', 'error');
                return;
            }

            // Determine toast message
            let toastMsg = 'คัดลอกลิงก์มุมมองคลังคอนเทนต์สำเร็จ! นำไปวางส่งให้ทีมได้เลย';

            if (filterChannel.length === 1) {
                if (filterChannel[0] === 'NO_CHANNEL') {
                    toastMsg = 'คัดลอกลิงก์ช่อง [ไม่มีช่องทาง] สำเร็จ! นำไปวางส่งให้ทีมได้เลย';
                } else {
                    const matchedCh = channels.find(c => c.id === filterChannel[0]);
                    const chName = matchedCh?.name || 'ระบุ';
                    toastMsg = `คัดลอกลิงก์ช่อง [${chName}] สำเร็จ! นำไปวางส่งให้ทีมได้เลย`;
                }
            } else if (filterChannel.length > 1) {
                const names = filterChannel
                    .map(id => {
                        if (id === 'NO_CHANNEL') return 'ไม่มีช่องทาง';
                        return channels.find(c => c.id === id)?.name || id;
                    })
                    .slice(0, 2)
                    .join(', ');
                const moreText = filterChannel.length > 2 ? ` และอีก ${filterChannel.length - 2} ช่อง` : '';
                toastMsg = `คัดลอกลิงก์ ${filterChannel.length} ช่อง [${names}${moreText}] สำเร็จ! นำไปวางส่งให้ทีมได้เลย`;
            }

            showToast(toastMsg, 'success');
        } catch (err) {
            console.error('[useContentStockController] handleShareFilterLink error:', err);
            showToast('ไม่สามารถคัดลอกลิงก์ได้ กรุณาลองใหม่อีกครั้ง', 'error');
        }
    }, [
        filterChannel, filterFormat, filterStatuses, filterCategory, filterPillar,
        searchQuery, filterOnlyOverdue, filterOnlyMissingStorage, showStockOnly,
        viewTab, contentSubTab, currentPage, channels, showToast
    ]);

    // ==========================================
    // GROUPED OBJECTS (For clean orchestrator)
    // ==========================================
    const filterState: StockFilterState = useMemo(() => ({
        searchQuery,
        setSearchQuery,
        filterChannel,
        setFilterChannel,
        filterFormat,
        setFilterFormat,
        filterPillar,
        setFilterPillar,
        filterCategory,
        setFilterCategory,
        filterStatuses,
        setFilterStatuses,
        filterOnlyOverdue,
        setFilterOnlyOverdue,
        filterOnlyMissingStorage,
        setFilterOnlyMissingStorage,
        filterChecklistProgress,
        setFilterChecklistProgress,
        filterHasShootDate,
        setFilterHasShootDate,
        filterShootDateStart,
        setFilterShootDateStart,
        filterShootDateEnd,
        setFilterShootDateEnd,
        showStockOnly,
        setShowStockOnly,
        isFiltering,
        clearFilters,
        hasActiveFilters,
        handleShareFilterLink,
    }), [
        searchQuery, filterChannel, filterFormat, filterPillar, filterCategory,
        filterStatuses, filterOnlyOverdue, filterOnlyMissingStorage, filterChecklistProgress,
        filterHasShootDate, filterShootDateStart, filterShootDateEnd, showStockOnly,
        isFiltering, clearFilters, hasActiveFilters, handleShareFilterLink
    ]);

    const viewState: StockViewState = useMemo(() => ({
        viewTab,
        setViewTab,
        contentSubTab,
        setContentSubTab,
        currentPage,
        setCurrentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        sortConfig,
        handleSort,
        searchParams,
        setSearchParams
    }), [viewTab, setViewTab, contentSubTab, setContentSubTab, currentPage, setCurrentPage, sortConfig, handleSort, searchParams, setSearchParams]);

    const dataResult: StockDataResult = useMemo(() => ({
        paginatedTasks,
        totalCount,
        overdueCount,
        missingStorageCount,
        unassignedChannelCount: effectiveUnassignedCount,
        isLoading,
        isRefreshing,
        fetchContents,
        refreshStock,
        fetchUnassignedChannelCount,
        updateLocalItem,
        toggleShootQueue,
        updateSubChecklistProgress
    }), [
        paginatedTasks, totalCount, overdueCount, missingStorageCount, effectiveUnassignedCount,
        isLoading, isRefreshing, fetchContents, refreshStock, fetchUnassignedChannelCount,
        updateLocalItem, toggleShootQueue, updateSubChecklistProgress
    ]);

    const modalState: StockModalState = useMemo(() => ({
        isInventoryModalOpen,
        setIsInventoryModalOpen,
        openInventoryModal: () => setIsInventoryModalOpen(true),
        closeInventoryModal: () => setIsInventoryModalOpen(false),
        isImportPreviewOpen,
        setIsImportPreviewOpen,
        importValidationResult,
        setImportValidationResult,
        isSubmittingImport,
        importProgress,
        importPartialAlert,
        selectedContentForAnalytics,
        setSelectedContentForAnalytics
    }), [isInventoryModalOpen, isImportPreviewOpen, setIsImportPreviewOpen, importValidationResult, isSubmittingImport, importProgress, importPartialAlert, selectedContentForAnalytics]);

    const importActions: StockImportActions = useMemo(() => ({
        fileInputRef,
        isImporting,
        handleFileUpload,
        handleProcessFile,
        handleExecuteImport,
        handleDownloadTemplate
    }), [fileInputRef, isImporting, handleFileUpload, handleProcessFile, handleExecuteImport, handleDownloadTemplate]);

    return {
        // --- 4 Clean Groups ---
        filters: filterState,
        view: viewState,
        data: dataResult,
        modals: modalState,
        importActions,

        // --- Backward Compatibility (ยังคง field เดิมไว้ทั้งหมด) ---
        searchQuery, setSearchQuery,
        filterChannel, setFilterChannel,
        filterFormat, setFilterFormat,
        filterPillar, setFilterPillar,
        filterCategory, setFilterCategory,
        filterStatuses, setFilterStatuses,
        filterOnlyOverdue, setFilterOnlyOverdue,
        filterOnlyMissingStorage, setFilterOnlyMissingStorage,
        filterChecklistProgress, setFilterChecklistProgress,
        filterHasShootDate, setFilterHasShootDate,
        filterShootDateStart, setFilterShootDateStart,
        filterShootDateEnd, setFilterShootDateEnd,
        showStockOnly, setShowStockOnly,
        isFiltering,
        isInventoryModalOpen, setIsInventoryModalOpen,
        selectedContentForAnalytics, setSelectedContentForAnalytics,
        viewTab, setViewTab,
        contentSubTab, setContentSubTab,
        sortConfig, setSortConfig,
        currentPage, setCurrentPage,
        ITEMS_PER_PAGE,
        fileInputRef,
        isImporting,
        isImportPreviewOpen,
        setIsImportPreviewOpen,
        importValidationResult,
        setImportValidationResult,
        isSubmittingImport,
        importProgress,
        importPartialAlert,
        handleFileUpload,
        handleProcessFile,
        handleExecuteImport,
        handleDownloadTemplate,
        clearFilters,
        handleShareFilterLink,
        handleSort,
        paginatedTasks,
        totalCount,
        overdueCount,
        missingStorageCount,
        unassignedChannelCount: effectiveUnassignedCount,
        isLoading,
        isRefreshing,
        fetchContents,
        refreshStock,
        fetchUnassignedChannelCount,
        updateLocalItem,
        toggleShootQueue,
        updateSubChecklistProgress,
        searchParams,
        setSearchParams
    };
};
