import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Task, Channel } from '../../../../../types';
import {
    generateMetricoolCsvFromTasks,
    downloadMetricoolCsv,
    MetricoolExportOptions
} from '../../../../../utils/metricoolCsv';
import { useToast } from '../../../../../context/ToastContext';
import {
    ExportRangeMode,
    ExportStatusScope,
    ImportDraftMode,
    YoutubePrivacyMode,
    PREVIEW_PAGE_SIZE
} from '../constants';

interface UseMetricoolExportParams {
    isOpen: boolean;
    tasks: Task[];
    channels: Channel[];
    currentDate: Date;
    activeChannelFilterId?: string;
}

export function useMetricoolExport({
    isOpen,
    tasks,
    channels,
    currentDate,
    activeChannelFilterId
}: UseMetricoolExportParams) {
    const { showToast } = useToast();

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
    const [exportPage, setExportPage] = useState<number>(1);

    useEffect(() => {
        if (currentDate && isValid(currentDate)) {
            setCustomStartDate(format(startOfMonth(currentDate), 'yyyy-MM-dd'));
            setCustomEndDate(format(endOfMonth(currentDate), 'yyyy-MM-dd'));
        }
    }, [currentDate]);

    useEffect(() => {
        if (isOpen && activeChannelFilterId) {
            setExportChannelId(activeChannelFilterId);
        }
    }, [isOpen, activeChannelFilterId]);

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

    // Reset page when filter changes
    useEffect(() => {
        setExportPage(1);
    }, [exportRangeMode, customStartDate, customEndDate, exportChannelId, exportStatusScope]);

    const exportTotalPages = Math.max(1, Math.ceil(exportCandidateTasks.length / PREVIEW_PAGE_SIZE));
    const paginatedExportTasks = useMemo(() => {
        const start = (exportPage - 1) * PREVIEW_PAGE_SIZE;
        return exportCandidateTasks.slice(start, start + PREVIEW_PAGE_SIZE);
    }, [exportCandidateTasks, exportPage]);

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
            defaultTime: defaultExportTime,
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
        showToast(
            `ส่งออกไฟล์ CSV สำหรับ Metricool จำนวน ${selectedExportTasks.length} รายการเรียบร้อย!`,
            'success'
        );
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

    return {
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
        paginatedExportTasks,
        exportPage,
        setExportPage,
        exportTotalPages,
        selectedExportTasks,
        toggleExportTask,
        toggleSelectAllExportTasks,
        handleDownloadCsv
    };
}
