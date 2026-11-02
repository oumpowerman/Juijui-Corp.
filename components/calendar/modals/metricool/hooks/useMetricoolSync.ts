import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    addDays,
    isWithinInterval,
    startOfDay,
    endOfDay,
    isValid
} from 'date-fns';
import { Task, Channel, TaskAsset, MasterOption } from '../../../../../types';
import {
    generateMetricoolCsvFromTasks,
    downloadMetricoolCsv,
    parseMetricoolCsvText,
    requestAiMetricoolMatch,
    ParsedMetricoolRow,
    MetricoolExportOptions
} from '../../../../../utils/metricoolCsv';
import { useToast } from '../../../../../context/ToastContext';
import {
    MetricoolTabType,
    ExportRangeMode,
    ExportStatusScope,
    ImportDraftMode,
    YoutubePrivacyMode
} from '../constants';

interface UseMetricoolSyncParams {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    channels: Channel[];
    masterOptions: MasterOption[];
    currentDate: Date;
    activeChannelFilterId?: string;
    onSaveTask?: (task: Task) => Promise<void> | void;
}

export function useMetricoolSync({
    isOpen,
    onClose,
    tasks,
    channels,
    masterOptions,
    currentDate,
    activeChannelFilterId,
    onSaveTask
}: UseMetricoolSyncParams) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<MetricoolTabType>('EXPORT');

    // --- EXPORT STATE ---
    const [exportRangeMode, setExportRangeMode] = useState<ExportRangeMode>('CURRENT_MONTH');
    const [customStartDate, setCustomStartDate] = useState<string>(() =>
        format(startOfMonth(currentDate || new Date()), 'yyyy-MM-dd')
    );
    const [customEndDate, setCustomEndDate] = useState<string>(() =>
        format(endOfMonth(currentDate || new Date()), 'yyyy-MM-dd')
    );
    const [exportChannelId, setExportChannelId] = useState<string>(activeChannelFilterId || 'ALL');
    const [exportStatusScope, setExportStatusScope] = useState<ExportStatusScope>('ALL');
    const [defaultExportTime, setDefaultExportTime] = useState<string>('18:00');
    const [importAsDraftMode, setImportAsDraftMode] = useState<ImportDraftMode>('ALWAYS_SCHEDULED');
    const [youtubePrivacy, setYoutubePrivacy] = useState<YoutubePrivacyMode>('PUBLIC');
    const [includeTagsInCaption, setIncludeTagsInCaption] = useState<boolean>(true);
    const [excludedTaskIds, setExcludedTaskIds] = useState<Set<string>>(new Set());

    // --- IMPORT STATE ---
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [importedFileName, setImportedFileName] = useState<string>('');
    const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
    const [parsedRows, setParsedRows] = useState<ParsedMetricoolRow[]>([]);
    const [importDefaultChannelId, setImportDefaultChannelId] = useState<string>(
        activeChannelFilterId && activeChannelFilterId !== 'ALL' ? activeChannelFilterId : (channels[0]?.id || '')
    );
    const [importDefaultStatus, setImportDefaultStatus] = useState<string>('FINAL');
    const [isRunningAiMatch, setIsRunningAiMatch] = useState<boolean>(false);
    const [isSavingImport, setIsSavingImport] = useState<boolean>(false);
    const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
    const [rawCsvPaste, setRawCsvPaste] = useState<string>('');

    // Sync default dates when currentDate changes
    useEffect(() => {
        if (currentDate && isValid(currentDate)) {
            setCustomStartDate(format(startOfMonth(currentDate), 'yyyy-MM-dd'));
            setCustomEndDate(format(endOfMonth(currentDate), 'yyyy-MM-dd'));
        }
    }, [currentDate]);

    // Sync channel filter when modal opens
    useEffect(() => {
        if (isOpen && activeChannelFilterId) {
            setExportChannelId(activeChannelFilterId);
            if (activeChannelFilterId !== 'ALL') {
                setImportDefaultChannelId(activeChannelFilterId);
            }
        }
    }, [isOpen, activeChannelFilterId]);

    // Content statuses from masterOptions
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

    // Filtered tasks for Export
    const exportCandidateTasks = useMemo(() => {
        const contentTasks = tasks.filter(t => t.type === 'CONTENT' && !t.isUnscheduled);

        let rangeStart: Date;
        let rangeEnd: Date;
        const baseDate = currentDate && isValid(currentDate) ? currentDate : new Date();

        if (exportRangeMode === 'CURRENT_MONTH') {
            rangeStart = startOfMonth(baseDate);
            rangeEnd = endOfMonth(baseDate);
        } else if (exportRangeMode === 'NEXT_7_DAYS') {
            rangeStart = startOfDay(new Date());
            rangeEnd = endOfDay(addDays(new Date(), 7));
        } else {
            rangeStart = startOfDay(new Date(customStartDate || Date.now()));
            rangeEnd = endOfDay(new Date(customEndDate || Date.now()));
        }

        return contentTasks
            .filter(task => {
                const tDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
                if (!isValid(tDate)) return false;
                if (!isWithinInterval(tDate, { start: rangeStart, end: rangeEnd })) return false;
                if (exportChannelId !== 'ALL' && task.channelId !== exportChannelId) return false;
                if (exportStatusScope === 'FINAL_ONLY') {
                    const st = String(task.status || '').toUpperCase();
                    if (!['FINAL', 'APPROVE', 'APPROVED', 'DONE', 'COMPLETED'].includes(st)) {
                        return false;
                    }
                }
                return true;
            })
            .sort((a, b) => {
                const dA = new Date(a.endDate).getTime();
                const dB = new Date(b.endDate).getTime();
                return dA - dB;
            });
    }, [tasks, currentDate, exportRangeMode, customStartDate, customEndDate, exportChannelId, exportStatusScope]);

    const selectedExportTasks = useMemo(
        () => exportCandidateTasks.filter(t => !excludedTaskIds.has(t.id)),
        [exportCandidateTasks, excludedTaskIds]
    );

    const toggleExportTask = useCallback((taskId: string) => {
        setExcludedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    }, []);

    const toggleSelectAllExportTasks = useCallback(() => {
        setExcludedTaskIds(prev => {
            if (prev.size > 0) {
                return new Set();
            }
            return new Set(exportCandidateTasks.map(t => t.id));
        });
    }, [exportCandidateTasks]);

    const handleDownloadCsv = useCallback(() => {
        if (selectedExportTasks.length === 0) {
            showToast('กรุณาเลือกรายการคอนเทนต์อย่างน้อย 1 รายการเพื่อส่งออก', 'warning');
            return;
        }

        const options: MetricoolExportOptions = {
            defaultTime: `${defaultExportTime}:00`,
            importAsDraft: importAsDraftMode,
            youtubePrivacy,
            includeTagsInCaption
        };

        const csvString = generateMetricoolCsvFromTasks(selectedExportTasks, channels, options);
        const channelSuffix =
            exportChannelId !== 'ALL'
                ? `-${channels.find(c => c.id === exportChannelId)?.code || channels.find(c => c.id === exportChannelId)?.name || 'channel'}`
                : '';
        const filename = `metricool-export${channelSuffix}-${format(new Date(), 'yyyy-MM-dd')}.csv`;

        downloadMetricoolCsv(csvString, filename);
        showToast(`ส่งออกไฟล์ CSV สำหรับ Metricool จำนวน ${selectedExportTasks.length} รายการเรียบร้อย!`, 'success');
    }, [
        selectedExportTasks,
        defaultExportTime,
        importAsDraftMode,
        youtubePrivacy,
        includeTagsInCaption,
        channels,
        exportChannelId,
        showToast
    ]);

    // --- IMPORT HANDLERS ---
    const handleRunAiSmartMatch = useCallback(
        async (targetRows?: ParsedMetricoolRow[]) => {
            const rowsToProcess = targetRows || parsedRows;
            if (rowsToProcess.length === 0) return;

            setIsRunningAiMatch(true);
            try {
                const rowsForAi = rowsToProcess.filter(r => r.matchType !== 'EXACT');
                if (rowsForAi.length === 0) {
                    showToast('ทุกรายการจับคู่ตรงกัน 100% อยู่แล้ว', 'info');
                    setIsRunningAiMatch(false);
                    return;
                }

                const aiMatches = await requestAiMetricoolMatch(rowsForAi, tasks);
                const matchByRowIdx = new Map(aiMatches.map(m => [m.rowIndex, m]));

                let aiMatchedCount = 0;
                setParsedRows(prev =>
                    prev.map(row => {
                        const aiMatch = matchByRowIdx.get(row.rowIndex);
                        if (aiMatch && aiMatch.matchedTaskId && aiMatch.confidence >= 65) {
                            const targetTask = tasks.find(t => t.id === aiMatch.matchedTaskId);
                            if (targetTask) {
                                aiMatchedCount++;
                                return {
                                    ...row,
                                    action: 'UPDATE',
                                    matchedTaskId: targetTask.id,
                                    matchedChannelId:
                                        row.matchedChannelId || targetTask.channelId || importDefaultChannelId,
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
                    showToast('AI ตรวจสอบแล้ว รายการที่เหลือเป็นคอนเทนต์ใหม่ทั้งหมด', 'info');
                }
            } catch (err: any) {
                console.warn('[useMetricoolSync] AI match warning:', err);
                showToast(
                    err?.message || 'ใช้ระบบจับคู่ภาษาไทยในเครื่องแทน เนื่องจากเรียก AI ไม่สำเร็จ',
                    'warning'
                );
            } finally {
                setIsRunningAiMatch(false);
            }
        },
        [parsedRows, tasks, importDefaultChannelId, showToast]
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

            if (rows.length === 0) {
                showToast('ไม่พบข้อมูลแถวที่สามารถนำเข้าได้ กรุณาตรวจสอบไฟล์ CSV', 'warning');
                return;
            }

            // Automatically trigger AI Smart Match for rows that are not 100% EXACT matches
            const ambiguousRows = rows.filter(r => r.matchType !== 'EXACT');
            if (ambiguousRows.length > 0 && tasks.some(t => t.type === 'CONTENT')) {
                await handleRunAiSmartMatch(rows);
            } else {
                showToast(`อ่านไฟล์สำเร็จ พบ ${rows.length} รายการ`, 'success');
            }
        },
        [tasks, channels, importDefaultChannelId, handleRunAiSmartMatch, showToast]
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
                        matchedChannelId:
                            r.matchedChannelId || targetTask?.channelId || importDefaultChannelId,
                        matchType: 'MANUAL',
                        matchConfidence: 100,
                        matchReason: 'เลือกจับคู่ด้วยตนเอง'
                    };
                })
            );
        },
        [tasks, importDefaultChannelId]
    );

    const handleConfirmImport = useCallback(async () => {
        if (!onSaveTask) {
            showToast('ไม่พบฟังก์ชันบันทึกข้อมูลของตารางปฏิทิน', 'error');
            return;
        }

        const activeRows = parsedRows.filter(r => r.action !== 'SKIP');
        if (activeRows.length === 0) {
            showToast('ไม่มีรายการที่เลือกให้นำเข้า', 'warning');
            return;
        }

        setIsSavingImport(true);
        let updatedCount = 0;
        let createdCount = 0;

        try {
            for (const row of activeRows) {
                const existingTask =
                    row.action === 'UPDATE' && row.matchedTaskId
                        ? tasks.find(t => t.id === row.matchedTaskId)
                        : undefined;

                const existingAssets: TaskAsset[] = existingTask?.assets ? [...existingTask.assets] : [];
                const existingUrls = new Set(existingAssets.map(a => a.url));

                row.mediaUrls.forEach((url, idx) => {
                    if (url && !existingUrls.has(url)) {
                        existingAssets.push({
                            id: `mc-media-${Date.now()}-${row.rowIndex}-${idx}`,
                            name: `ไฟล์มีเดีย Metricool #${idx + 1}`,
                            url,
                            type: 'LINK',
                            category: 'VIDEO_DRAFT',
                            createdAt: new Date()
                        });
                        existingUrls.add(url);
                    }
                });

                if (row.thumbnailUrl && !existingUrls.has(row.thumbnailUrl)) {
                    existingAssets.push({
                        id: `mc-thumb-${Date.now()}-${row.rowIndex}`,
                        name: 'ปกคลิป (Metricool Thumbnail)',
                        url: row.thumbnailUrl,
                        type: 'LINK',
                        category: 'THUMBNAIL',
                        createdAt: new Date()
                    });
                }

                if (existingTask) {
                    const mergedTags = Array.from(new Set([...(existingTask.tags || []), ...row.tags]));
                    const mergedPlatforms =
                        row.targetPlatforms.length > 0
                            ? Array.from(new Set([...(existingTask.targetPlatforms || []), ...row.targetPlatforms]))
                            : existingTask.targetPlatforms;

                    const updatedTask: Task = {
                        ...existingTask,
                        title: existingTask.title || row.title,
                        description: row.description || existingTask.description,
                        startDate: row.parsedDate,
                        endDate: row.parsedDate,
                        scheduledTime: row.scheduledTime || existingTask.scheduledTime,
                        channelId:
                            existingTask.channelId ||
                            row.matchedChannelId ||
                            importDefaultChannelId ||
                            undefined,
                        targetPlatforms: mergedPlatforms,
                        contentFormats:
                            row.contentFormats.length > 0
                                ? row.contentFormats
                                : existingTask.contentFormats,
                        tags: mergedTags,
                        assets: existingAssets,
                        isUnscheduled: false
                    };

                    await onSaveTask(updatedTask);
                    updatedCount++;
                } else {
                    const newTask: Task = {
                        id: crypto.randomUUID ? crypto.randomUUID() : `mc-${Date.now()}-${row.rowIndex}`,
                        type: 'CONTENT',
                        title: row.title,
                        description: row.description,
                        status: row.isDraft ? 'IDEA' : importDefaultStatus,
                        tags: row.tags,
                        startDate: row.parsedDate,
                        endDate: row.parsedDate,
                        scheduledTime: row.scheduledTime,
                        channelId: row.matchedChannelId || importDefaultChannelId || undefined,
                        targetPlatforms:
                            row.targetPlatforms.length > 0
                                ? row.targetPlatforms
                                : ['TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'],
                        contentFormats:
                            row.contentFormats.length > 0 ? row.contentFormats : ['SHORT_FORM'],
                        assigneeIds: [],
                        ideaOwnerIds: [],
                        editorIds: [],
                        assets: existingAssets,
                        isUnscheduled: false
                    };

                    await onSaveTask(newTask);
                    createdCount++;
                }
            }

            showToast(
                `ซิงค์ตารางจาก Metricool สำเร็จ! (อัปเดตการ์ดเดิม ${updatedCount} รายการ, สร้างใหม่ ${createdCount} รายการ)`,
                'success'
            );
            onClose();
        } catch (err: any) {
            console.error('[useMetricoolSync] Save error:', err);
            showToast(err?.message || 'เกิดข้อผิดพลาดในการบันทึกรายการคอนเทนต์', 'error');
        } finally {
            setIsSavingImport(false);
        }
    }, [onSaveTask, parsedRows, tasks, importDefaultChannelId, importDefaultStatus, showToast, onClose]);

    const importSummary = useMemo(() => {
        const updateCount = parsedRows.filter(r => r.action === 'UPDATE').length;
        const createCount = parsedRows.filter(r => r.action === 'CREATE').length;
        const skipCount = parsedRows.filter(r => r.action === 'SKIP').length;
        return { updateCount, createCount, skipCount };
    }, [parsedRows]);

    const nearbyTasks = useMemo(
        () => tasks.filter(t => t.type === 'CONTENT').slice(0, 80),
        [tasks]
    );

    return {
        activeTab,
        setActiveTab,
        // Export state & handlers
        exportRangeMode,
        setExportRangeMode,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        exportChannelId,
        setExportChannelId,
        exportStatusScope,
        setExportStatusScope,
        defaultExportTime,
        setDefaultExportTime,
        importAsDraftMode,
        setImportAsDraftMode,
        youtubePrivacy,
        setYoutubePrivacy,
        includeTagsInCaption,
        setIncludeTagsInCaption,
        excludedTaskIds,
        exportCandidateTasks,
        selectedExportTasks,
        toggleExportTask,
        toggleSelectAllExportTasks,
        handleDownloadCsv,
        // Import state & handlers
        fileInputRef,
        importedFileName,
        detectedHeaders,
        parsedRows,
        importDefaultChannelId,
        setImportDefaultChannelId,
        importDefaultStatus,
        setImportDefaultStatus,
        contentStatuses,
        isRunningAiMatch,
        isSavingImport,
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
        handleConfirmImport
    };
}
