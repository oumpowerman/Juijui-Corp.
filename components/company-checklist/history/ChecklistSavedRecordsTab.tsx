import React from 'react';
import DatePickerModal from '../../ui/DatePickerModal';
import { ChecklistSavedRecordsTabProps } from './types';
import { useSavedRecordsFilterAndPagination } from './hooks/useSavedRecordsFilterAndPagination';
import { HistoryFilterBar } from './filters/HistoryFilterBar';
import { SavedRecordsEmptyState } from './list/SavedRecordsEmptyState';
import { SavedRecordRowItem } from './list/SavedRecordRowItem';
import {
    HistoryTableTopSummaryBar,
    HistoryPaginationFooterBar
} from './pagination/HistoryPaginationBar';
import { SavedRecordDetailModal } from './SavedRecordDetailModal';

export const ChecklistSavedRecordsTab: React.FC<ChecklistSavedRecordsTabProps> = ({
    checklists,
    nodes = [],
    activeItemStates = {},
    savedRecords,
    expandedRecordId,
    onToggleExpandRecord,
    onDeleteRecord,
    getPositionLabel,
    getResponsibilityLabel
}) => {
    const {
        historyPresetFilter,
        setHistoryPresetFilter,
        statusFilter,
        setStatusFilter,
        dateFilterMode,
        setDateFilterMode,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        historySearch,
        setHistorySearch,
        activeDatePickerTarget,
        setActiveDatePickerTarget,
        availableYears,
        statusCounts,
        hasActiveFilters,
        isDateSubDrawerOpen,
        handleResetFilters,
        setCurrentPage,
        pageSize,
        setPageSize,
        jumpPageInput,
        setJumpPageInput,
        handleJumpPageSubmit,
        filteredSavedRecords,
        paginatedRecords,
        totalRecords,
        totalPages,
        safePage,
        pageNumbers,
        activeDetailIndex,
        activeDetailRecord
    } = useSavedRecordsFilterAndPagination({
        savedRecords,
        expandedRecordId
    });

    return (
        <div className="space-y-4">
            {/* Enterprise Multi-Dimensional Filter Control Panel */}
            <HistoryFilterBar
                checklists={checklists}
                nodes={nodes}
                activeItemStates={activeItemStates}
                savedRecords={savedRecords}
                filteredCount={filteredSavedRecords.length}
                historyPresetFilter={historyPresetFilter}
                onSelectPresetFilter={setHistoryPresetFilter}
                historySearch={historySearch}
                onSearchChange={setHistorySearch}
                statusFilter={statusFilter}
                onSelectStatusFilter={setStatusFilter}
                statusCounts={statusCounts}
                dateFilterMode={dateFilterMode}
                onSelectDateFilterMode={setDateFilterMode}
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                selectedYear={selectedYear}
                onSelectYear={setSelectedYear}
                availableYears={availableYears}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onOpenDatePicker={setActiveDatePickerTarget}
                onClearCustomDates={() => {
                    setCustomStartDate(undefined);
                    setCustomEndDate(undefined);
                }}
                isDateSubDrawerOpen={isDateSubDrawerOpen}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={handleResetFilters}
            />

            {/* Saved Records Compact Enterprise List (Non-pushing layout) */}
            {filteredSavedRecords.length === 0 ? (
                <SavedRecordsEmptyState
                    totalRecordsCount={savedRecords.length}
                    hasActiveFilters={hasActiveFilters}
                    onResetFilters={handleResetFilters}
                />
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    {/* Top Table Summary & Page Size Bar */}
                    <HistoryTableTopSummaryBar
                        safePage={safePage}
                        pageSize={pageSize}
                        totalRecords={totalRecords}
                        onPageSizeChange={setPageSize}
                    />

                    {/* Compact Enterprise Rows */}
                    <div className="divide-y divide-slate-150">
                        {paginatedRecords.map(record => (
                            <SavedRecordRowItem
                                key={record.id}
                                record={record}
                                onInspectRecord={recordId =>
                                    onToggleExpandRecord(recordId)
                                }
                                onDeleteRecord={onDeleteRecord}
                            />
                        ))}
                    </div>

                    {/* Enterprise Bottom Pagination Bar */}
                    <HistoryPaginationFooterBar
                        safePage={safePage}
                        totalPages={totalPages}
                        pageNumbers={pageNumbers}
                        onSelectPage={setCurrentPage}
                        jumpPageInput={jumpPageInput}
                        onJumpPageInputChange={setJumpPageInput}
                        onJumpPageSubmit={handleJumpPageSubmit}
                    />
                </div>
            )}

            {/* DatePickerModal Integration (Start Date & End Date) */}
            <DatePickerModal
                isOpen={activeDatePickerTarget !== null}
                onClose={() => setActiveDatePickerTarget(null)}
                selectedDate={
                    activeDatePickerTarget === 'START' ? customStartDate : customEndDate
                }
                minDate={activeDatePickerTarget === 'END' ? customStartDate : undefined}
                maxDate={activeDatePickerTarget === 'START' ? customEndDate : undefined}
                onSelect={date => {
                    if (activeDatePickerTarget === 'START') {
                        setCustomStartDate(date);
                    } else if (activeDatePickerTarget === 'END') {
                        setCustomEndDate(date);
                    }
                    setActiveDatePickerTarget(null);
                }}
            />

            {/* Clean Portal Detail Modal (Never pushes the main list) */}
            <SavedRecordDetailModal
                record={activeDetailRecord}
                onClose={() => onToggleExpandRecord(null)}
                onDeleteRecord={onDeleteRecord}
                getPositionLabel={getPositionLabel}
                getResponsibilityLabel={getResponsibilityLabel}
                currentIndex={activeDetailIndex >= 0 ? activeDetailIndex : undefined}
                totalFiltered={filteredSavedRecords.length}
                hasPrev={activeDetailIndex > 0}
                hasNext={
                    activeDetailIndex >= 0 &&
                    activeDetailIndex < filteredSavedRecords.length - 1
                }
                onPrevRecord={() => {
                    if (activeDetailIndex > 0) {
                        onToggleExpandRecord(
                            filteredSavedRecords[activeDetailIndex - 1].id
                        );
                    }
                }}
                onNextRecord={() => {
                    if (
                        activeDetailIndex >= 0 &&
                        activeDetailIndex < filteredSavedRecords.length - 1
                    ) {
                        onToggleExpandRecord(
                            filteredSavedRecords[activeDetailIndex + 1].id
                        );
                    }
                }}
            />
        </div>
    );
};
