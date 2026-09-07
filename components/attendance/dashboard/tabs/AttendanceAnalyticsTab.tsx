import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { User, Company } from '../../../../types';
import { UserStat, DateFilterMode, ViewMode, GradeInfo } from '../types';
import DashboardHeader from '../DashboardHeader';

// Lazy Loaded Analytics Component
const AttendanceAnalytics = lazy(() => import('../analytics/AttendanceAnalytics'));

const AnalyticsSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-gray-100 h-[440px] rounded-3xl" />
            <div className="lg:col-span-8 bg-gray-100 h-[440px] rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-gray-100 h-[380px] rounded-3xl" />
            <div className="lg:col-span-7 bg-gray-100 h-[380px] rounded-3xl" />
        </div>
    </div>
);

interface AttendanceAnalyticsTabProps {
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

    // Analytics Data
    users: User[];
    userStats: UserStat[];
    workingDaysInMonth: Date[];
    startTime: string;
    lateBuffer: number;
    getGrade: (stat: UserStat) => GradeInfo;
    onUserClick: (user: User, stat: UserStat) => void;
    shiftsEnabled: boolean;
    shiftsList: string;

    // Bottom Action handlers
    onOpenMemberControl: () => void;
}

export const AttendanceAnalyticsTab: React.FC<AttendanceAnalyticsTabProps> = ({
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
    users,
    userStats,
    workingDaysInMonth,
    startTime,
    lateBuffer,
    getGrade,
    onUserClick,
    shiftsEnabled,
    shiftsList,
    onOpenMemberControl
}) => {
    return (
        <motion.div
            key="ANALYTICS"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6 w-full"
        >
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

            <Suspense fallback={<AnalyticsSkeleton />}>
                <AttendanceAnalytics 
                    users={users}
                    userStats={userStats}
                    workingDaysInMonth={workingDaysInMonth}
                    startTime={startTime}
                    lateBuffer={lateBuffer}
                    currentMonth={currentMonth}
                    getGrade={getGrade}
                    onUserClick={onUserClick}
                    shiftsEnabled={shiftsEnabled}
                    shiftsList={shiftsList}
                />
            </Suspense>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <button 
                    onClick={onOpenMemberControl}
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-2xl text-sm font-bold text-gray-700 hover:text-indigo-600 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>จัดการสถานะสมาชิก & HP</span>
                </button>
            </div>
        </motion.div>
    );
};
