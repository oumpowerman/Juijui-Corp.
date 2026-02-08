
import { useState, useMemo, useEffect } from 'react';
import { User } from '../types';

export type ViewScope = 'MY_SQUAD' | 'ALL';

export const useTeamFilters = (allUsers: User[], currentUser: User | null) => {
    const [viewScope, setViewScope] = useState<ViewScope>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<string>('ALL');

    // Extract unique positions for dropdown
    const availablePositions = useMemo(() => {
        const positions = new Set(allUsers.map(u => u.position || 'Member').filter(Boolean));
        return Array.from(positions).sort();
    }, [allUsers]);

    // Set Default Scope on Load
    useEffect(() => {
        if (currentUser) {
            // If Admin, usually show ALL. If Member, show SQUAD first.
            if (currentUser.role === 'ADMIN') {
                setViewScope('ALL');
            } else {
                setViewScope('MY_SQUAD');
                // Ensure position matches current user if in squad mode
                if (currentUser.position) {
                    setSelectedPosition(currentUser.position);
                }
            }
        }
    }, [currentUser]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedPosition('ALL');
        setViewScope('ALL');
    };

    return {
        viewScope,
        setViewScope,
        searchQuery,
        setSearchQuery,
        selectedPosition,
        setSelectedPosition,
        availablePositions,
        resetFilters
    };
};
