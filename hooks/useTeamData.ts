
import { useState, useMemo } from 'react';
import { User, Task } from '../types';
import { ViewScope } from './useTeamFilters';

interface UseTeamDataProps {
    allUsers: User[];
    allTasks: Task[];
    currentUser: User | null;
    filters: {
        scope: ViewScope;
        search: string;
        position: string;
    };
    dateRange: { start: Date; end: Date };
    pageSize?: number;
}

export const useTeamData = ({
    allUsers,
    allTasks,
    currentUser,
    filters,
    dateRange,
    pageSize = 10
}: UseTeamDataProps) => {
    const [currentPage, setCurrentPage] = useState(1);

    // 1. Filter Users
    const filteredUsers = useMemo(() => {
        let users = allUsers.filter(u => u.isActive && u.isApproved); // Only Active

        // A. Scope Filter
        if (filters.scope === 'MY_SQUAD' && currentUser) {
            // Show users with same position OR explicit position filter
            const targetPos = filters.position !== 'ALL' ? filters.position : currentUser.position;
            if (targetPos) {
                 users = users.filter(u => u.position === targetPos);
            }
        } else if (filters.scope === 'ALL') {
            if (filters.position !== 'ALL') {
                users = users.filter(u => u.position === filters.position);
            }
        }

        // B. Search Filter
        if (filters.search) {
            const lowerQuery = filters.search.toLowerCase();
            users = users.filter(u => 
                u.name.toLowerCase().includes(lowerQuery) || 
                (u.position || '').toLowerCase().includes(lowerQuery)
            );
        }

        // Always put current user at top if in list
        return users.sort((a, b) => {
            if (a.id === currentUser?.id) return -1;
            if (b.id === currentUser?.id) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [allUsers, currentUser, filters]);

    // 2. Pagination
    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    
    // Reset page if out of bounds
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }

    const visibleUsers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    // 3. Map Tasks to VISIBLE Users (Performance Optimization)
    // Only calculate task distribution for the 10-20 users currently on screen
    const userTaskMap = useMemo(() => {
        const map = new Map<string, Task[]>();
        
        // Initialize for visible users
        visibleUsers.forEach(u => map.set(u.id, []));

        // Filter tasks within date range first
        const relevantTasks = allTasks.filter(t => {
            if (t.status === 'DONE') return false;
            const tStart = new Date(t.startDate); tStart.setHours(0,0,0,0);
            const tEnd = new Date(t.endDate); tEnd.setHours(23,59,59,999);
            return tStart <= dateRange.end && tEnd >= dateRange.start;
        });

        // Distribute tasks
        relevantTasks.forEach(t => {
            t.assigneeIds.forEach(uid => {
                if (map.has(uid)) {
                    map.get(uid)?.push(t);
                }
            });
        });

        return map;
    }, [visibleUsers, allTasks, dateRange]);

    return {
        visibleUsers,
        userTaskMap,
        pagination: {
            currentPage,
            totalPages,
            setCurrentPage,
            totalItems: filteredUsers.length
        }
    };
};
