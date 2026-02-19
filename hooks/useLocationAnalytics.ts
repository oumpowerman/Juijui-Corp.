
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, isWithinInterval, subDays, differenceInCalendarDays } from 'date-fns';

export interface LocationStat {
    name: string;
    totalVisits: number;
    totalClips: number;
    lastVisit: Date | null;
    freshnessScore: number; // 0 (Burned out) - 100 (Fresh)
    saturationLevel: 'FRESH' | 'USED' | 'OVERUSED' | 'BURNOUT';
    isRegistered: boolean; // NEW: True if exists in Master Data
    visits: Record<string, {
        date: Date;
        clips: { id: string; title: string; status: string; format: string }[];
    }>;
}

export type DateRangeType = 'THIS_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'ALL_TIME' | 'CUSTOM';

export const useLocationAnalytics = (rangeType: DateRangeType, customStart?: Date, customEnd?: Date) => {
    const [rawData, setRawData] = useState<any[]>([]);
    const [masterLocations, setMasterLocations] = useState<string[]>([]); // Store Master Location Names
    const [isLoading, setIsLoading] = useState(true);

    // Calculate effective date range
    const dateRange = useMemo(() => {
        const now = new Date();
        let start = new Date(0); // Epoch for ALL_TIME
        let end = endOfMonth(now);

        if (rangeType === 'THIS_MONTH') {
            start = startOfMonth(now);
        } else if (rangeType === 'LAST_3_MONTHS') {
            start = subDays(now, 90);
        } else if (rangeType === 'THIS_YEAR') {
            start = new Date(now.getFullYear(), 0, 1);
        } else if (rangeType === 'CUSTOM' && customStart && customEnd) {
            start = customStart;
            end = customEnd;
        }
        return { start, end };
    }, [rangeType, customStart, customEnd]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Content Usage
            const contentPromise = supabase
                .from('contents')
                .select('id, title, shoot_date, shoot_location, status, content_format')
                .not('shoot_location', 'is', null)
                .not('shoot_date', 'is', null)
                .order('shoot_date', { ascending: false });

            // 2. Fetch Master Data Locations (To show 0-visit locations)
            const masterPromise = supabase
                .from('master_options')
                .select('label')
                .eq('type', 'SHOOT_LOCATION')
                .eq('is_active', true);

            const [contentRes, masterRes] = await Promise.all([contentPromise, masterPromise]);

            if (contentRes.error) throw contentRes.error;
            
            setRawData(contentRes.data || []);
            setMasterLocations(masterRes.data?.map((m: any) => m.label) || []);

        } catch (err) {
            console.error("Fetch location stats failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('realtime-location-v7-unified')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'master_options' }, () => fetchData()) // Listen to Master changes too
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const locationStats = useMemo(() => {
        const stats: Record<string, LocationStat> = {};
        const now = new Date();

        // 1. Initialize with Master Locations
        masterLocations.forEach(name => {
            const normalizeKey = name.trim().toLowerCase();
            stats[normalizeKey] = {
                name: name, // Keep original casing from Master
                totalVisits: 0,
                totalClips: 0,
                lastVisit: null,
                freshnessScore: 100,
                saturationLevel: 'FRESH',
                isRegistered: true, // Mark as Official
                visits: {}
            };
        });

        // 2. Process Actual Usage
        rawData.forEach(item => {
            if (!item.shoot_location) return;
            
            const locName = item.shoot_location.trim();
            const normalizeKey = locName.toLowerCase();
            const itemDate = new Date(item.shoot_date);

            // If not in master (Unregistered/Legacy), create entry
            if (!stats[normalizeKey]) {
                stats[normalizeKey] = {
                    name: locName, // Use casing from content
                    totalVisits: 0,
                    totalClips: 0,
                    lastVisit: null,
                    freshnessScore: 100,
                    saturationLevel: 'FRESH',
                    isRegistered: false, // Mark as Unregistered
                    visits: {}
                };
            }

            // Calculate Stats ONLY for items within Selected Range
            const isInRange = rangeType === 'ALL_TIME' || isWithinInterval(itemDate, { start: dateRange.start, end: dateRange.end });
            
            if (isInRange) {
                const dateStr = format(itemDate, 'yyyy-MM-dd');
                if (!stats[normalizeKey].visits[dateStr]) {
                    stats[normalizeKey].visits[dateStr] = { date: itemDate, clips: [] };
                    stats[normalizeKey].totalVisits += 1;
                }
                stats[normalizeKey].visits[dateStr].clips.push({
                    id: item.id, 
                    title: item.title, 
                    status: item.status, 
                    format: item.content_format
                });
                stats[normalizeKey].totalClips += 1;
            }

            // Track Last Visit (Global context for freshness)
            if (!stats[normalizeKey].lastVisit || itemDate > stats[normalizeKey].lastVisit!) {
                stats[normalizeKey].lastVisit = itemDate;
            }
        });

        // 3. Calculate "Freshness" & "Saturation"
        const results = Object.values(stats);
        
        results.forEach(stat => {
            if (!stat.lastVisit) return;
            
            const daysSinceLast = differenceInCalendarDays(now, stat.lastVisit);
            
            let score = Math.min(100, daysSinceLast * 2); 
            
            // Saturation Label
            if (daysSinceLast < 7) stat.saturationLevel = 'BURNOUT'; // Just went there this week!
            else if (daysSinceLast < 30) stat.saturationLevel = 'OVERUSED'; // Went there this month
            else if (daysSinceLast < 60) stat.saturationLevel = 'USED';
            else stat.saturationLevel = 'FRESH'; // Haven't been there in 2 months
            
            stat.freshnessScore = score;
        });

        // 4. Final Filter: Only return locations that have visits in the selected range
        return results.filter(s => s.totalVisits > 0);

    }, [rawData, masterLocations, dateRange, rangeType]);

    return { locationStats, isLoading, refresh: fetchData };
};
