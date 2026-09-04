import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StockCSVValidationResult, ParsedStockItemPreview } from '../../../services/stockImportValidator';
import { Channel, User, MasterOption } from '../../../types';
import {
    useImportPreviewModal,
    ImportHeader,
    ImportSummaryBar,
    ImportFilterTabs,
    ImportTable,
    ImportCriticalError,
    ImportFooter,
    ImportErrorAdvisory,
    ImportItemEditModal
} from './import-modal';

export interface StockImportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    validationResult: StockCSVValidationResult | null;
    isSubmitting: boolean;
    onConfirmImport: (validItems: ParsedStockItemPreview[], skipErrors: boolean) => void;
    onDownloadTemplate: () => void;
    channels?: Channel[];
    users?: User[];
    masterOptions?: MasterOption[];
}

export const StockImportPreviewModal: React.FC<StockImportPreviewModalProps> = ({
    isOpen,
    onClose,
    validationResult,
    isSubmitting,
    onConfirmImport,
    onDownloadTemplate,
    channels = [],
    users = [],
    masterOptions = []
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
    } = useImportPreviewModal({
        validationResult,
        isSubmitting,
        users,
        channels,
        masterOptions
    });

    const handleConfirm = () => {
        if (!canSubmit) return;
        onConfirmImport(importableItems, skipErrorRows);
    };

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && validationResult && (
                <div
                    key="stock-import-modal-wrapper"
                    className="fixed inset-0 z-[2200] flex items-center justify-center p-3 sm:p-5 font-sans select-none overflow-hidden"
                >
                    {/* Backdrop with smooth Fade-in & Fade-out */}
                    <motion.div
                        key="stock-import-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        onClick={!isSubmitting ? onClose : undefined}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
                        aria-hidden="true"
                    />

                    {/* Modal Window with Spring Entrance & Smooth Scale-down Exit */}
                    <motion.div
                        key="stock-import-content"
                        initial={{ opacity: 0, scale: 0.94, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 20 }}
                        transition={{
                            type: 'spring',
                            stiffness: 360,
                            damping: 28,
                            mass: 0.8
                        }}
                        className="relative bg-white w-full max-w-5xl h-[90vh] max-h-[840px] rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-10"
                    >
                        {/* 1. Header */}
                        <ImportHeader
                            fileName={validationResult.fileName}
                            totalRows={validationResult.totalRows}
                            isSubmitting={isSubmitting}
                            onClose={onClose}
                        />

                        {/* 2. Content: Critical Error vs. Data Preview */}
                        {validationResult.hasCriticalHeaderError ? (
                            <ImportCriticalError
                                fileName={validationResult.fileName}
                                errorMessage={validationResult.headerErrorMessage}
                                onDownloadTemplate={onDownloadTemplate}
                                onClose={onClose}
                            />
                        ) : (
                            <>
                                {/* Summary Stats */}
                                <ImportSummaryBar
                                    totalRows={counts.total}
                                    validRowsCount={counts.valid}
                                    warningRowsCount={counts.warning}
                                    errorRowsCount={counts.error}
                                    activeFilter={viewFilter}
                                    onSelectFilter={setViewFilter}
                                />

                                {/* Advisory Notice (Errors > 5 vs Quick-fix <= 5) */}
                                <ImportErrorAdvisory
                                    errorRowsCount={counts.error}
                                    warningRowsCount={counts.warning}
                                    totalRows={counts.total}
                                    onDownloadTemplate={onDownloadTemplate}
                                    onSelectFilter={setViewFilter}
                                    activeFilter={viewFilter}
                                />

                                {/* Filter Tabs & Search */}
                                <ImportFilterTabs
                                    viewFilter={viewFilter}
                                    onChangeFilter={setViewFilter}
                                    counts={counts}
                                    skipErrorRows={skipErrorRows}
                                    onToggleSkipErrorRows={setSkipErrorRows}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                />

                                {/* Table Preview */}
                                <ImportTable
                                    items={filteredItems}
                                    onEdit={(item) => setEditingItem(item)}
                                />

                                {/* Action Footer */}
                                <ImportFooter
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
                        <ImportItemEditModal
                            isOpen={editingItem !== null}
                            item={editingItem}
                            channels={channels}
                            users={users}
                            masterOptions={masterOptions}
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

export default StockImportPreviewModal;
