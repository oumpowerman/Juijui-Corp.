
import { useState, useMemo } from 'react';
import { ShootTrip } from '../types';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

type ViewMode = 'MONTH' | 'ALL';
type SortConfig = { key: keyof ShootTrip | 'clipCount' | 'totalCost'; direction: 'asc' | 'desc' };

export const useTripManagement = (trips: ShootTrip[]) => {
    // --- STATE ---
    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState<string>('ALL');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

    // --- DERIVED DATA ---
    const uniqueLocations = useMemo(() => {
        // Normalize for uniqueness, but store display name
        const locMap = new Map<string, string>();
        trips.forEach(t => {
            const normalized = t.locationName.trim().toLowerCase();
            if (!locMap.has(normalized)) {
                locMap.set(normalized, t.locationName);
            }
        });
        return Array.from(locMap.values()).sort();
    }, [trips]);

    // --- FILTERING LOGIC ---
    const filteredTrips = useMemo(() => {
        let result = trips;

        // 1. Date Filter
        if (viewMode === 'MONTH') {
            const start = startOfMonth(viewDate);
            const end = endOfMonth(viewDate);
            result = result.filter(t => isWithinInterval(new Date(t.date), { start, end }));
        }

        // 2. Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(t => 
                t.title.toLowerCase().includes(lowerQuery) || 
                t.locationName.toLowerCase().includes(lowerQuery)
            );
        }

        // 3. Location Filter (Normalized Check)
        if (locationFilter !== 'ALL') {
            const target = locationFilter.trim().toLowerCase();
            result = result.filter(t => t.locationName.trim().toLowerCase() === target);
        }

        // 4. Sorting
        return result.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    }, [trips, viewDate, viewMode, searchQuery, locationFilter, sortConfig]);

    // --- ANALYTICS LOGIC ---
    const analytics = useMemo(() => {
        // Key by Normalized Name to group "Studio A" and "studio a"
        const locStats: Record<string, { displayName: string, count: number, cost: number, clips: number, trips: ShootTrip[] }> = {};
        let totalC = 0;
        let totalV = 0;

        filteredTrips.forEach(t => {
            totalC += t.totalCost || 0;
            totalV += t.clipCount || 0;

            const normalizedKey = t.locationName.trim().toLowerCase();

            if (!locStats[normalizedKey]) {
                locStats[normalizedKey] = { displayName: t.locationName, count: 0, cost: 0, clips: 0, trips: [] };
            }
            
            // Keep the casing of the first encountered variant, or most frequent if we wanted to be fancy
            // For now, first wins for display name
            
            locStats[normalizedKey].count += 1;
            locStats[normalizedKey].cost += t.totalCost || 0;
            locStats[normalizedKey].clips += t.clipCount || 0;
            locStats[normalizedKey].trips.push(t);
        });

        const locationSummaries = Object.values(locStats)
            .map((val) => ({ 
                name: val.displayName, 
                count: val.count,
                cost: val.cost,
                clips: val.clips,
                avgPerClip: val.clips > 0 ? val.cost / val.clips : 0,
                efficiency: val.clips > 0 ? (val.clips / val.count) : 0 
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalCost: totalC,
            totalVideos: totalV,
            avgCostPerVideo: totalV > 0 ? totalC / totalV : 0,
            locationSummaries
        };
    }, [filteredTrips]);

    const handleSort = (key: keyof ShootTrip | 'clipCount' | 'totalCost') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    return {
        // State
        viewDate, setViewDate,
        viewMode, setViewMode,
        searchQuery, setSearchQuery,
        locationFilter, setLocationFilter,
        sortConfig, setSortConfig,
        
        // Data
        uniqueLocations,
        filteredTrips,
        analytics,

        // Actions
        handleSort
    };
};
