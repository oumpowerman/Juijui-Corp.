import React from 'react';
import { Task, Channel } from '../../../../types';
import { ExportRangeMode, ExportStatusScope, ImportDraftMode } from './constants';
import ExportFilterBar from './export/ExportFilterBar';
import ExportPreviewTable from './export/ExportPreviewTable';

interface MetricoolExportTabProps {
    currentDate: Date;
    channels: Channel[];
    exportRangeMode: ExportRangeMode;
    setExportRangeMode: (mode: ExportRangeMode) => void;
    customStartDate: string;
    setCustomStartDate: (val: string) => void;
    customEndDate: string;
    setCustomEndDate: (val: string) => void;
    exportChannelId: string;
    setExportChannelId: (id: string) => void;
    exportStatusScope: ExportStatusScope;
    setExportStatusScope: (scope: ExportStatusScope) => void;
    defaultExportTime: string;
    setDefaultExportTime: (time: string) => void;
    importAsDraftMode: ImportDraftMode;
    setImportAsDraftMode: (mode: ImportDraftMode) => void;
    includeTagsInCaption: boolean;
    setIncludeTagsInCaption: (val: boolean) => void;
    exportCandidateTasks: Task[];
    paginatedExportTasks: Task[];
    exportPage: number;
    setExportPage: (page: number) => void;
    exportTotalPages: number;
    selectedExportTasks: Task[];
    excludedTaskIds: Set<string>;
    toggleExportTask: (id: string) => void;
    toggleSelectAllExportTasks: () => void;
}

export const MetricoolExportTab: React.FC<MetricoolExportTabProps> = React.memo(({
    currentDate,
    channels,
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
    includeTagsInCaption,
    setIncludeTagsInCaption,
    exportCandidateTasks,
    paginatedExportTasks,
    exportPage,
    setExportPage,
    exportTotalPages,
    selectedExportTasks,
    excludedTaskIds,
    toggleExportTask,
    toggleSelectAllExportTasks
}) => {
    return (
        <div className="flex-1 min-h-0 flex flex-col gap-3.5 overflow-hidden">
            <ExportFilterBar
                currentDate={currentDate}
                channels={channels}
                exportRangeMode={exportRangeMode}
                setExportRangeMode={setExportRangeMode}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
                exportChannelId={exportChannelId}
                setExportChannelId={setExportChannelId}
                exportStatusScope={exportStatusScope}
                setExportStatusScope={setExportStatusScope}
                defaultExportTime={defaultExportTime}
                setDefaultExportTime={setDefaultExportTime}
                importAsDraftMode={importAsDraftMode}
                setImportAsDraftMode={setImportAsDraftMode}
                includeTagsInCaption={includeTagsInCaption}
                setIncludeTagsInCaption={setIncludeTagsInCaption}
            />

            <ExportPreviewTable
                channels={channels}
                defaultExportTime={defaultExportTime}
                exportCandidateTasks={exportCandidateTasks}
                paginatedExportTasks={paginatedExportTasks}
                exportPage={exportPage}
                setExportPage={setExportPage}
                exportTotalPages={exportTotalPages}
                selectedExportTasks={selectedExportTasks}
                excludedTaskIds={excludedTaskIds}
                toggleExportTask={toggleExportTask}
                toggleSelectAllExportTasks={toggleSelectAllExportTasks}
            />
        </div>
    );
});

export default MetricoolExportTab;
