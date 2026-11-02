import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, MasterOption } from '../../../types';
import BaseModal from '../../common/BaseModal';
import { tabContentVariants } from './metricool/constants';
import { useMetricoolSync } from './metricool/hooks/useMetricoolSync';
import MetricoolModalHeader from './metricool/MetricoolModalHeader';
import MetricoolExportTab from './metricool/MetricoolExportTab';
import MetricoolImportTab from './metricool/MetricoolImportTab';
import MetricoolModalFooter from './metricool/MetricoolModalFooter';

export interface MetricoolSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    channels: Channel[];
    masterOptions?: MasterOption[];
    currentDate: Date;
    activeChannelFilterId?: string;
    onSaveTask?: (task: Task) => Promise<void> | void;
}

export const MetricoolSyncModal: React.FC<MetricoolSyncModalProps> = ({
    isOpen,
    onClose,
    tasks,
    channels,
    masterOptions = [],
    currentDate,
    activeChannelFilterId,
    onSaveTask
}) => {
    const sync = useMetricoolSync({
        isOpen,
        onClose,
        tasks,
        channels,
        masterOptions,
        currentDate,
        activeChannelFilterId,
        onSaveTask
    });

    const activeImportCount = sync.importSummary.updateCount + sync.importSummary.createCount;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            closeOnEscape={!sync.isSavingImport}
            closeOnBackdropClick={!sync.isSavingImport}
            containerClassName="p-0 sm:p-4 md:p-6 items-end sm:items-center"
            backdropClassName="bg-slate-900/50 backdrop-blur-sm"
            windowClassName="bg-white dark:bg-slate-900 w-full max-w-5xl h-[92vh] sm:h-[85vh] max-h-[92vh] sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 my-0 sm:my-auto"
        >
            {/* 1. Rigid Header & Animated Tab Switcher */}
            <MetricoolModalHeader
                activeTab={sync.activeTab}
                onSelectTab={sync.setActiveTab}
                onClose={onClose}
                disabled={sync.isSavingImport}
                exportCount={sync.selectedExportTasks.length}
                importCount={activeImportCount}
            />

            {/* 2. Fixed-Height Body Viewport (flex-1 min-h-0 prevents modal height jumping) */}
            <div className="flex-1 min-h-0 flex flex-col px-5 sm:px-6 py-4 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                    {sync.activeTab === 'EXPORT' ? (
                        <motion.div
                            key="metricool-export-tab"
                            variants={tabContentVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="flex-1 min-h-0 flex flex-col overflow-hidden"
                        >
                            <MetricoolExportTab
                                currentDate={currentDate}
                                channels={channels}
                                exportRangeMode={sync.exportRangeMode}
                                setExportRangeMode={sync.setExportRangeMode}
                                customStartDate={sync.customStartDate}
                                setCustomStartDate={sync.setCustomStartDate}
                                customEndDate={sync.customEndDate}
                                setCustomEndDate={sync.setCustomEndDate}
                                exportChannelId={sync.exportChannelId}
                                setExportChannelId={sync.setExportChannelId}
                                exportStatusScope={sync.exportStatusScope}
                                setExportStatusScope={sync.setExportStatusScope}
                                defaultExportTime={sync.defaultExportTime}
                                setDefaultExportTime={sync.setDefaultExportTime}
                                importAsDraftMode={sync.importAsDraftMode}
                                setImportAsDraftMode={sync.setImportAsDraftMode}
                                includeTagsInCaption={sync.includeTagsInCaption}
                                setIncludeTagsInCaption={sync.setIncludeTagsInCaption}
                                exportCandidateTasks={sync.exportCandidateTasks}
                                selectedExportTasks={sync.selectedExportTasks}
                                excludedTaskIds={sync.excludedTaskIds}
                                toggleExportTask={sync.toggleExportTask}
                                toggleSelectAllExportTasks={sync.toggleSelectAllExportTasks}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="metricool-import-tab"
                            variants={tabContentVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="flex-1 min-h-0 flex flex-col overflow-hidden"
                        >
                            <MetricoolImportTab
                                fileInputRef={sync.fileInputRef}
                                importedFileName={sync.importedFileName}
                                detectedHeaders={sync.detectedHeaders}
                                parsedRows={sync.parsedRows}
                                channels={channels}
                                tasks={tasks}
                                nearbyTasks={sync.nearbyTasks}
                                importDefaultChannelId={sync.importDefaultChannelId}
                                setImportDefaultChannelId={sync.setImportDefaultChannelId}
                                importDefaultStatus={sync.importDefaultStatus}
                                setImportDefaultStatus={sync.setImportDefaultStatus}
                                contentStatuses={sync.contentStatuses}
                                isRunningAiMatch={sync.isRunningAiMatch}
                                showPasteBox={sync.showPasteBox}
                                setShowPasteBox={sync.setShowPasteBox}
                                rawCsvPaste={sync.rawCsvPaste}
                                setRawCsvPaste={sync.setRawCsvPaste}
                                importSummary={sync.importSummary}
                                processCsvText={sync.processCsvText}
                                handleFileChange={sync.handleFileChange}
                                handleRunAiSmartMatch={sync.handleRunAiSmartMatch}
                                handleRowActionChange={sync.handleRowActionChange}
                                handleRowTargetTaskChange={sync.handleRowTargetTaskChange}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. Rigid Sticky Footer */}
            <MetricoolModalFooter
                activeTab={sync.activeTab}
                onClose={onClose}
                isSavingImport={sync.isSavingImport}
                selectedExportCount={sync.selectedExportTasks.length}
                onDownloadCsv={sync.handleDownloadCsv}
                parsedRowsCount={sync.parsedRows.length}
                activeImportCount={activeImportCount}
                onConfirmImport={sync.handleConfirmImport}
            />
        </BaseModal>
    );
};

export default MetricoolSyncModal;
