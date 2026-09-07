import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth } from 'date-fns';
import { User } from '../../../types';
import { BRAND_CONFIG } from '../../../config/brand';
import { useCompanies } from '../../../hooks/useCompanies';
import { useUserSession } from '../../../context/UserSessionContext';

// Types
import { 
    AdminAttendanceDashboardProps, 
    UserStat, 
    DateFilterMode, 
    ViewMode, 
    LateViewMode, 
    OtViewMode, 
    HpViewMode, 
    StatFilterType, 
    SortDirection 
} from './types';

// Custom Hooks & Utilities
import { useAttendanceDashboardData } from './hooks/useAttendanceDashboardData';
import { useAttendanceCalculator } from './hooks/useAttendanceCalculator';
import { useAttendanceFilterSort } from './hooks/useAttendanceFilterSort';

// Tabs & Modals
import { AttendanceTableTab } from './tabs/AttendanceTableTab';
import { AttendanceAnalyticsTab } from './tabs/AttendanceAnalyticsTab';
import DashboardUserDetailModal from './DashboardUserDetailModal';
import { ExportControlCenterModal } from './modal/ExportControlCenterModal';
import { AttendanceMemberControlModal } from './modal/member-control';

const AdminAttendanceDashboard: React.FC<AdminAttendanceDashboardProps> = ({ users }) => {
    const { activeCompanies } = useCompanies();
    const shouldHideAdmins = BRAND_CONFIG.hideAdminFromAttendanceDashboardMode === 2;
    const { currentUserProfile } = useUserSession();

    // Date Filtering States
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('MONTH');
    const [customStartDate, setCustomStartDate] = useState<Date>(startOfMonth(new Date()));
    const [customEndDate, setCustomEndDate] = useState<Date>(endOfMonth(new Date()));

    // Search & Filter Dropdown States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmploymentType, setSelectedEmploymentType] = useState('ALL');
    const [selectedPosition, setSelectedPosition] = useState('ALL');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [isToolsExpanded, setIsToolsExpanded] = useState(false);

    // View Modes & Metrics
    const [viewMode, setViewMode] = useState<ViewMode>('TABLE');
    const [lateViewMode, setLateViewMode] = useState<LateViewMode>('DAYS');
    const [otViewMode, setOtViewMode] = useState<OtViewMode>('HOURS');
    const [hpViewMode, setHpViewMode] = useState<HpViewMode>('MONTHLY');
    const [activeStatFilter, setActiveStatFilter] = useState<StatFilterType>('ALL');
    const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');

    // Modals
    const [selectedUser, setSelectedUser] = useState<{ user: User; stat: UserStat } | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isMemberControlOpen, setIsMemberControlOpen] = useState(false);

    // Reset sort direction to DESC whenever active stat filter changes
    useEffect(() => {
        setSortDirection('DESC');
    }, [activeStatFilter]);

    // 1. Data Layer (Fetch logs, snapshots & realtime subscriptions)
    const { logs, isLoading, snapshots } = useAttendanceDashboardData({
        currentMonth,
        dateFilterMode,
        customStartDate,
        customEndDate
    });

    // 2. Calculation Engine (Stats, Leaves, OT, Grades, Aggregates)
    const {
        startTime,
        lateBuffer,
        multipleShifts,
        workingDaysInMonth,
        userStats,
        userMap,
        positions,
        aggregates,
        getGrade
    } = useAttendanceCalculator({
        users,
        logs,
        currentMonth,
        dateFilterMode,
        customStartDate,
        customEndDate,
        shouldHideAdmins
    });

    // 3. Filter & Sort Layer (Two-Phase Filtering)
    const { filteredStats } = useAttendanceFilterSort({
        userStats,
        userMap,
        searchTerm,
        selectedEmploymentType,
        selectedPosition,
        filterCompany,
        activeStatFilter,
        sortDirection,
        lateViewMode,
        shouldHideAdmins
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <AnimatePresence mode="wait">
                {viewMode === 'TABLE' ? (
                    <AttendanceTableTab 
                        totalCheckins={aggregates.totalCheckins}
                        totalLates={aggregates.totalLates}
                        lateRate={aggregates.lateRate}
                        totalAbsents={aggregates.totalAbsents}
                        totalLeaves={aggregates.totalLeaves}
                        activeUsersCount={users.filter(u => u.isActive).length}
                        activeStatFilter={activeStatFilter}
                        setActiveStatFilter={setActiveStatFilter}
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
                        companies={activeCompanies}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        isToolsExpanded={isToolsExpanded}
                        setIsToolsExpanded={setIsToolsExpanded}
                        isLoading={isLoading}
                        filteredStats={filteredStats}
                        users={users}
                        getGrade={getGrade}
                        onUserClick={(user, stat) => setSelectedUser({ user, stat })}
                        sortDirection={sortDirection}
                        setSortDirection={setSortDirection}
                        lateViewMode={lateViewMode}
                        setLateViewMode={setLateViewMode}
                        otViewMode={otViewMode}
                        setOtViewMode={setOtViewMode}
                        hpViewMode={hpViewMode}
                        setHpViewMode={setHpViewMode}
                        snapshots={snapshots}
                        onOpenMemberControl={() => setIsMemberControlOpen(true)}
                        onOpenExportModal={() => setIsExportModalOpen(true)}
                    />
                ) : (
                    <AttendanceAnalyticsTab 
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
                        companies={activeCompanies}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        isToolsExpanded={isToolsExpanded}
                        setIsToolsExpanded={setIsToolsExpanded}
                        users={users}
                        userStats={userStats}
                        workingDaysInMonth={workingDaysInMonth}
                        startTime={startTime}
                        lateBuffer={lateBuffer}
                        getGrade={getGrade}
                        onUserClick={(user, stat) => setSelectedUser({ user, stat })}
                        shiftsEnabled={multipleShifts.enabled}
                        shiftsList={multipleShifts.shiftsList}
                        onOpenMemberControl={() => setIsMemberControlOpen(true)}
                    />
                )}
            </AnimatePresence>
            
            {/* User Detail Record Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <DashboardUserDetailModal 
                        user={selectedUser.user}
                        stat={selectedUser.stat}
                        workingDaysInMonth={workingDaysInMonth}
                        startTime={startTime}
                        lateBuffer={lateBuffer}
                        onClose={() => setSelectedUser(null)}
                    />
                )}
            </AnimatePresence>

            {/* Export Control Center Modal */}
            <ExportControlCenterModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                users={users}
                userStats={userStats}
                getGrade={getGrade}
                currentMonth={currentMonth}
                workingDaysInMonth={workingDaysInMonth}
            />

            {/* Attendance Member Status & HP Control Modal */}
            {currentUserProfile && (
                <AttendanceMemberControlModal 
                    isOpen={isMemberControlOpen}
                    onClose={() => setIsMemberControlOpen(false)}
                    users={users}
                    currentUser={currentUserProfile}
                />
            )}
        </div>
    );
};

export default AdminAttendanceDashboard;
