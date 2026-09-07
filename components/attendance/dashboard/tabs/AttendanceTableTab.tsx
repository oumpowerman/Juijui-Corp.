import React from 'react';
import { motion } from 'framer-motion';
import { Download, Users } from 'lucide-react';
import { User, Company } from '../../../../types';
import { UserStat, DateFilterMode, ViewMode, LateViewMode, OtViewMode, HpViewMode, StatFilterType, SortDirection, GradeInfo } from '../types';
import DashboardStats from '../DashboardStats';
import DashboardHeader from '../DashboardHeader';
import DashboardTable from '../DashboardTable';

interface AttendanceTableTabProps {
    // Stats
    totalCheckins: number;
    totalLates: number;
    lateRate: number;
    totalAbsents: number;
    totalLeaves: number;
    activeUsersCount: number;
    activeStatFilter: StatFilterType;
    setActiveStatFilter: (filter: StatFilterType) => void;

    // Header filters
    currentMonth: Date;
    setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
    dateFilterMode: DateFilterMode;
    setDateFilterMode: (mode: DateFilterMode) => void;
    customStartDate: Date;
    setCustomStartDate: (date: Date) => void;
    customEndDate: Date;
    setCustomEndDate: (date: Date) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedEmploymentType: string;
    setSelectedEmploymentType: (type: string) => void;
    selectedPosition: string;
    setSelectedPosition: (position: string) => void;
    positions: string[];
    filterCompany: string;
    setFilterCompany: (company: string) => void;
    companies: Company[];
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    isToolsExpanded: boolean;
    setIsToolsExpanded: (expanded: boolean) => void;

    // Table
    isLoading: boolean;
    filteredStats: UserStat[];
    users: User[];
    getGrade: (stat: UserStat) => GradeInfo;
    onUserClick: (user: User, stat: UserStat) => void;
    sortDirection: SortDirection;
    setSortDirection: (dir: SortDirection) => void;
    lateViewMode: LateViewMode;
    setLateViewMode: (mode: LateViewMode) => void;
    otViewMode: OtViewMode;
    setOtViewMode: (mode: OtViewMode) => void;
    hpViewMode: HpViewMode;
    setHpViewMode: (mode: HpViewMode) => void;
    snapshots: any[];

    // Bottom Action handlers
    onOpenMemberControl: () => void;
    onOpenExportModal: () => void;
}

export const AttendanceTableTab: React.FC<AttendanceTableTabProps> = ({
    totalCheckins,
    totalLates,
    lateRate,
    totalAbsents,
    totalLeaves,
    activeUsersCount,
    activeStatFilter,
    setActiveStatFilter,
    currentMonth,
    setCurrentMonth,
    dateFilterMode,
    setDateFilterMode,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    searchTerm,
    setSearchTerm,
    selectedEmploymentType,
    setSelectedEmploymentType,
    selectedPosition,
    setSelectedPosition,
    positions,
    filterCompany,
    setFilterCompany,
    companies,
    viewMode,
    setViewMode,
    isToolsExpanded,
    setIsToolsExpanded,
    isLoading,
    filteredStats,
    users,
    getGrade,
    onUserClick,
    sortDirection,
    setSortDirection,
    lateViewMode,
    setLateViewMode,
    otViewMode,
    setOtViewMode,
    hpViewMode,
    setHpViewMode,
    snapshots,
    onOpenMemberControl,
    onOpenExportModal
}) => {
    return (
        <motion.div
            key="TABLE"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6"
        >
            <DashboardStats 
                totalCheckins={totalCheckins}
                totalLates={totalLates}
                lateRate={lateRate}
                totalAbsents={totalAbsents}
                totalLeaves={totalLeaves}
                activeUsersCount={activeUsersCount}
                activeFilter={activeStatFilter}
                onFilterChange={setActiveStatFilter}
            />

            <DashboardHeader 
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                dateFilterMode={dateFilterMode}
                setDateFilterMode={setDateFilterMode}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedEmploymentType={selectedEmploymentType}
                setSelectedEmploymentType={setSelectedEmploymentType}
                selectedPosition={selectedPosition}
                setSelectedPosition={setSelectedPosition}
                positions={positions}
                filterCompany={filterCompany}
                setFilterCompany={setFilterCompany}
                companies={companies}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isToolsExpanded={isToolsExpanded}
                setIsToolsExpanded={setIsToolsExpanded}
            />

            <DashboardTable 
                isLoading={isLoading}
                filteredStats={filteredStats}
                users={users}
                getGrade={getGrade}
                onUserClick={onUserClick}
                activeStatFilter={activeStatFilter}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
                lateViewMode={lateViewMode}
                onLateViewModeChange={setLateViewMode}
                otViewMode={otViewMode}
                onOtViewModeChange={setOtViewMode}
                hpViewMode={hpViewMode}
                onHpViewModeChange={setHpViewMode}
                snapshots={snapshots}
                currentMonth={currentMonth}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <button 
                    onClick={onOpenMemberControl}
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-2xl text-sm font-bold text-gray-700 hover:text-indigo-600 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>จัดการสถานะสมาชิก & HP</span>
                </button>
                <button 
                    onClick={onOpenExportModal}
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                    <Download className="w-4 h-4" /> Export CSV Report
                </button>
            </div>
        </motion.div>
    );
};
