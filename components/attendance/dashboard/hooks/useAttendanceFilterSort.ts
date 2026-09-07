import { useMemo } from 'react';
import { User } from '../../../../types';
import { UserStat, StatFilterType, SortDirection, LateViewMode } from '../types';

interface UseAttendanceFilterSortParams {
    userStats: UserStat[];
    userMap: Map<string, User>;
    searchTerm: string;
    selectedEmploymentType: string;
    selectedPosition: string;
    filterCompany: string;
    activeStatFilter: StatFilterType;
    sortDirection: SortDirection;
    lateViewMode: LateViewMode;
    shouldHideAdmins?: boolean;
}

export const useAttendanceFilterSort = ({
    userStats,
    userMap,
    searchTerm,
    selectedEmploymentType,
    selectedPosition,
    filterCompany,
    activeStatFilter,
    sortDirection,
    lateViewMode,
    shouldHideAdmins = false
}: UseAttendanceFilterSortParams) => {
    const filteredStats = useMemo(() => {
        const baseFiltered = userStats.filter(stat => {
            const user = userMap.get(stat.userId);
            if (!user) return false;

            if (shouldHideAdmins && user.role === 'ADMIN') return false;

            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEmploymentType = selectedEmploymentType === 'ALL' || user.employmentType === selectedEmploymentType;
            const matchesPosition = selectedPosition === 'ALL' || user.position === selectedPosition;
            const matchesCompany = filterCompany === 'ALL' || 
                user.companyId === filterCompany || 
                user.company?.id === filterCompany || 
                user.company?.shortName === filterCompany ||
                (filterCompany === 'JJ' && (!user.companyId || user.company?.shortName === 'JJ'));

            return matchesSearch && matchesEmploymentType && matchesPosition && matchesCompany;
        });

        // Dynamic Metric Filter
        let finalStats = baseFiltered;

        if (activeStatFilter !== 'ALL') {
            const getVal = (s: UserStat) => {
                if (activeStatFilter === 'PRESENT') return s.present;
                if (activeStatFilter === 'LATE') {
                    return lateViewMode === 'HOURS' ? (s.totalLateMinutes || 0) : s.late;
                }
                if (activeStatFilter === 'ABSENT') return s.absent;
                if (activeStatFilter === 'LEAVE') return s.leaves;
                return s.present;
            };

            if (sortDirection === 'DESC') {
                finalStats = baseFiltered.filter(s => getVal(s) > 0);
            } else {
                // ASC
                const hasZero = baseFiltered.some(s => getVal(s) === 0);
                if (hasZero) {
                    finalStats = baseFiltered.filter(s => getVal(s) === 0);
                }
            }
        }

        // Sort
        return [...finalStats].sort((a, b) => {
            let valA = 0;
            let valB = 0;
            if (activeStatFilter === 'LATE') {
                valA = lateViewMode === 'HOURS' ? (a.totalLateMinutes || 0) : a.late;
                valB = lateViewMode === 'HOURS' ? (b.totalLateMinutes || 0) : b.late;
            } else if (activeStatFilter === 'ABSENT') {
                valA = a.absent;
                valB = b.absent;
            } else if (activeStatFilter === 'LEAVE') {
                valA = a.leaves;
                valB = b.leaves;
            } else {
                // PRESENT or ALL
                valA = a.present;
                valB = b.present;
            }

            if (sortDirection === 'ASC') {
                return valA - valB;
            } else {
                return valB - valA;
            }
        });
    }, [userStats, userMap, searchTerm, selectedEmploymentType, selectedPosition, filterCompany, activeStatFilter, sortDirection, lateViewMode, shouldHideAdmins]);

    return {
        filteredStats
    };
};
