import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    InternImportValidationResult, 
    ParsedInternItemPreview 
} from '../../../../services/internImportValidator';
import {
    useInternImportModal,
    InternImportHeader,
    InternImportSummaryBar,
    InternImportErrorAdvisory,
    InternImportFilterTabs,
    InternImportTable,
    InternItemEditModal,
    InternImportCriticalError,
    InternImportFooter
} from './import-modal';

export interface InternImportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    validationResult: InternImportValidationResult | null;
    isSubmitting: boolean;
    onConfirmImport: (validItems: ParsedInternItemPreview[], skipErrors: boolean) => void;
    onDownloadTemplate: () => void;
    baseYear?: number;
}

export const InternImportPreviewModal: React.FC<InternImportPreviewModalProps> = ({
    isOpen,
    onClose,
    validationResult,
    isSubmitting,
    onConfirmImport,
    onDownloadTemplate,
    baseYear = new Date().getFullYear()
}) => {
    const {
        viewFilter,
        setViewFilter,
        searchQuery,
        setSearchQuery,
        skipErrorRows,
        setSkipErrorRows,
        filteredItems,
        importableItems,
        canSubmit,
        counts,
        editingItem,
        setEditingItem,
        handleUpdateItem
    } = useInternImportModal({
        validationResult,
        isSubmitting,
        baseYear
    });

    const handleConfirm = () => {
        if (!canSubmit) return;
        onConfirmImport(importableItems, skipErrorRows);
    };

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && validationResult && (
                <div
                    key="intern-import-modal-wrapper"
                    className="fixed inset-0 z-[2200] flex items-center justify-center p-3 sm:p-5 font-sans select-none overflow-hidden"
                >
                    {/* Backdrop */}
                    <motion.div
                        key="intern-import-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        onClick={!isSubmitting ? onClose : undefined}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
                        aria-hidden="true"
                    />

                    {/* Modal Window */}
                    <motion.div
                        key="intern-import-content"
                        initial={{ opacity: 0, scale: 0.94, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 20 }}
                        transition={{
                            type: 'spring',
                            stiffness: 360,
                            damping: 28,
                            mass: 0.8
                        }}
                        className="relative bg-white w-full max-w-5xl h-[90vh] max-h-[860px] rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-10"
                    >
                        {/* 1. Header */}
                        <InternImportHeader
                            fileName={validationResult.fileName}
                            totalRows={validationResult.totalRows}
                            isSubmitting={isSubmitting}
                            onClose={onClose}
                        />

                        {/* 2. Content */}
                        {validationResult.hasCriticalHeaderError ? (
                            <InternImportCriticalError
                                fileName={validationResult.fileName}
                                errorMessage={validationResult.headerErrorMessage}
                                onDownloadTemplate={onDownloadTemplate}
                                onClose={onClose}
                            />
                        ) : (
                            <>
                                {/* Summary Metrics */}
                                <InternImportSummaryBar
                                    totalRows={counts.total}
                                    validRowsCount={counts.valid}
                                    warningRowsCount={counts.warning}
                                    errorRowsCount={counts.error}
                                    activeFilter={viewFilter}
                                    onSelectFilter={setViewFilter}
                                />

                                {/* Advisory Notice */}
                                <InternImportErrorAdvisory
                                    errorRowsCount={counts.error}
                                    warningRowsCount={counts.warning}
                                    totalRows={counts.total}
                                    onDownloadTemplate={onDownloadTemplate}
                                    onSelectFilter={setViewFilter}
                                    activeFilter={viewFilter}
                                />

                                {/* Filter Tabs & Search */}
                                <InternImportFilterTabs
                                    viewFilter={viewFilter}
                                    onChangeFilter={setViewFilter}
                                    counts={counts}
                                    skipErrorRows={skipErrorRows}
                                    onToggleSkipErrorRows={setSkipErrorRows}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                />

                                {/* Table Preview */}
                                <InternImportTable
                                    items={filteredItems}
                                    onEdit={(item) => setEditingItem(item)}
                                />

                                {/* Action Footer */}
                                <InternImportFooter
                                    importableCount={importableItems.length}
                                    totalRows={counts.total}
                                    errorRowsCount={counts.error}
                                    skipErrorRows={skipErrorRows}
                                    isSubmitting={isSubmitting}
                                    canSubmit={canSubmit}
                                    onClose={onClose}
                                    onSubmit={handleConfirm}
                                />
                            </>
                        )}
                    </motion.div>

                    {/* Quick Row Edit Modal */}
                    {editingItem && (
                        <InternItemEditModal
                            isOpen={editingItem !== null}
                            item={editingItem}
                            onClose={() => setEditingItem(null)}
                            onSave={handleUpdateItem}
                        />
                    )}
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default InternImportPreviewModal;
