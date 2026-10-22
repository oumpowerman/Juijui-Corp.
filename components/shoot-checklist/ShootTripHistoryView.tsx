import React from 'react';
import { PackageCheck, Loader2 } from 'lucide-react';
import {
    ShootTripRecord,
    ShootTripQueryParams,
    ShootTripPaginatedResult
} from '../../types';
import { useTripHistoryPagination } from './history/useTripHistoryPagination';
import { TripHistoryFilterBar } from './history/TripHistoryFilterBar';
import { TripHistoryCard } from './history/TripHistoryCard';
import { TripHistoryPagination } from './history/TripHistoryPagination';
import { TripDetailModal } from './history/TripDetailModal';

export interface ShootTripHistoryViewProps {
    records: ShootTripRecord[];
    activeTripId?: string;
    onResumeTrip: (trip: ShootTripRecord) => Promise<void>;
    onDeleteTrip: (tripId: string) => Promise<void>;
    fetchPaginatedShootTrips: (params: ShootTripQueryParams) => Promise<ShootTripPaginatedResult>;
}

export const ShootTripHistoryView: React.FC<ShootTripHistoryViewProps> = ({
    records: fallbackRecords,
    activeTripId,
    onResumeTrip,
    onDeleteTrip,
    fetchPaginatedShootTrips
}) => {
    const {
        searchInput,
        setSearchInput,
        statusFilter,
        datePreset,
        customMonth,
        setCustomMonth,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        hasActiveFilters,

        handleStatusChange,
        handleDatePresetChange,
        handlePageSizeChange,
        handleClearAllFilters,

        page,
        setPage,
        pageSize,
        totalCount,
        totalPages,

        displayedRecords,
        summaryCounts,
        showInitialBlockingLoader,
        isFetching,

        selectedTrip,
        setSelectedTrip,
        selectedRoundTab,
        setSelectedRoundTab,
        itemFilterMode,
        setItemFilterMode,
        handleOpenDetail
    } = useTripHistoryPagination({
        fallbackRecords,
        fetchPaginatedShootTrips
    });

    return (
        <div className="space-y-4">
            {/* SQL Search, Date/Month Filter & Status Bar */}
            <TripHistoryFilterBar
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                datePreset={datePreset}
                onDatePresetChange={handleDatePresetChange}
                customMonth={customMonth}
                onCustomMonthChange={month => {
                    setCustomMonth(month);
                    setPage(1);
                }}
                dateFrom={dateFrom}
                onDateFromChange={date => {
                    setDateFrom(date);
                    setPage(1);
                }}
                dateTo={dateTo}
                onDateToChange={date => {
                    setDateTo(date);
                    setPage(1);
                }}
                summaryCounts={summaryCounts}
                hasActiveFilters={hasActiveFilters}
                onClearAllFilters={handleClearAllFilters}
            />

            {/* Loading Indicator */}
            {showInitialBlockingLoader ? (
                <div className="bg-white/70 backdrop-blur-xl backdrop-saturate-150 rounded-3xl border border-white/80 ring-1 ring-slate-900/[0.04] shadow-[0_8px_30px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] p-12 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-gray-600">
                        กำลังดึงข้อมูลประวัติการออกกอง...
                    </p>
                </div>
            ) : displayedRecords.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl backdrop-saturate-150 rounded-3xl border border-white/80 ring-1 ring-slate-900/[0.04] shadow-[0_8px_30px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] p-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                        <PackageCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                        {hasActiveFilters
                            ? 'ไม่พบประวัติการออกกองตามตัวกรองที่เลือก'
                            : 'ยังไม่มีประวัติรายงานการออกกอง'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        {hasActiveFilters
                            ? 'ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองช่วงเวลาและสถานะเพื่อดูรายการอื่น'
                            : 'เมื่อทีมงานติ๊กเช็คอุปกรณ์และกดส่งรายงานในแต่ละรอบ (หยิบออกคลัง / ยกกลับ / คืนเข้าคลัง) ประวัติจะถูกบันทึกไว้ที่นี่โดยอัตโนมัติ'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearAllFilters}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                        >
                            แสดงประวัติทั้งหมด
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3.5 relative">
                    {isFetching && (
                        <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-indigo-600 px-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังอัปเดตข้อมูล...</span>
                        </div>
                    )}

                    {displayedRecords.map(trip => (
                        <TripHistoryCard
                            key={trip.id}
                            trip={trip}
                            isCurrentlyActive={activeTripId === trip.id}
                            onResumeTrip={onResumeTrip}
                            onOpenDetail={handleOpenDetail}
                            onDeleteTrip={onDeleteTrip}
                        />
                    ))}

                    {/* Numbered Page Pagination & Page Size Selector Bar */}
                    <TripHistoryPagination
                        page={page}
                        onPageChange={setPage}
                        pageSize={pageSize}
                        onPageSizeChange={handlePageSizeChange}
                        totalCount={totalCount}
                        totalPages={totalPages}
                    />
                </div>
            )}

            {/* Trip Detail Modal (3-Layer Flexbox Contract) */}
            <TripDetailModal
                trip={selectedTrip}
                onClose={() => setSelectedTrip(null)}
                selectedRoundTab={selectedRoundTab}
                onSelectRoundTab={setSelectedRoundTab}
                itemFilterMode={itemFilterMode}
                onItemFilterModeChange={setItemFilterMode}
                onResumeTrip={onResumeTrip}
            />
        </div>
    );
};

export default ShootTripHistoryView;
