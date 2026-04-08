
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { InternCandidate, InternStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

export interface InternFilterState {
    searchQuery: string;
    statuses: InternStatus[];
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
    dateType: 'APPLICATION' | 'INTERNSHIP';
}

export interface InternStats {
    applied: number;
    interview: number;
    accepted: number;
    rejected: number;
    total: number;
}

export const useInterns = (enabled: boolean = true) => {
    const [rawInterns, setRawInterns] = useState<InternCandidate[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [hasMore, setHasMore] = useState(true);
    const [filters, setFilters] = useState<InternFilterState>({
        searchQuery: '',
        statuses: [],
        dateRange: { start: null, end: null },
        dateType: 'APPLICATION'
    });
    const [stats, setStats] = useState<InternStats>({
        applied: 0,
        interview: 0,
        accepted: 0,
        rejected: 0,
        total: 0
    });
    
    const { showToast } = useToast();

    const mapDBToIntern = useCallback((data: any): InternCandidate => ({
        id: data.id,
        fullName: data.full_name,
        nickname: data.nickname,
        email: data.email,
        phoneNumber: data.phone_number,
        university: data.university,
        faculty: data.faculty,
        academicYear: data.academic_year,
        portfolioUrl: data.portfolio_url,
        resumeUrl: data.resume_url,
        otherUrl: data.other_url,
        avatarUrl: data.avatar_url,
        gender: data.gender,
        position: data.position,
        source: data.source,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        durationDays: data.duration_days,
        applicationDate: data.application_date ? new Date(data.application_date) : undefined,
        status: data.status as InternStatus,
        interviewDate: data.interview_date ? new Date(data.interview_date) : null,
        notes: data.notes || '',
        createdAt: new Date(data.created_at),
        createdBy: data.created_by
    }), []);

    // Local Processing: Filter and Sort
    const interns = useMemo(() => {
        let result = [...rawInterns];

        // 1. Filter by Search Query
        if (filters.searchQuery) {
            const search = filters.searchQuery.toLowerCase();
            result = result.filter(i => 
                i.fullName?.toLowerCase().includes(search) ||
                i.university?.toLowerCase().includes(search) ||
                i.position?.toLowerCase().includes(search) ||
                i.email?.toLowerCase().includes(search) ||
                i.nickname?.toLowerCase().includes(search)
            );
        }

        // 2. Filter by Status
        if (filters.statuses.length > 0) {
            result = result.filter(i => filters.statuses.includes(i.status));
        }

        // 3. Filter by Custom Date Range (if set manually)
        if (filters.dateRange.start && filters.dateRange.end) {
            const start = filters.dateRange.start.getTime();
            const end = filters.dateRange.end.getTime();
            
            result = result.filter(i => {
                if (filters.dateType === 'APPLICATION') {
                    return i.applicationDate && i.applicationDate.getTime() >= start && i.applicationDate.getTime() <= end;
                } else {
                    // Internship overlap check
                    return i.startDate.getTime() <= end && i.endDate.getTime() >= start;
                }
            });
        }

        // 4. Local Sort
        result.sort((a, b) => {
            if (filters.dateType === 'APPLICATION') {
                const dateA = a.applicationDate?.getTime() || 0;
                const dateB = b.applicationDate?.getTime() || 0;
                return dateB - dateA; // Newest first
            } else {
                return a.startDate.getTime() - b.startDate.getTime(); // Earliest first
            }
        });

        return result;
    }, [rawInterns, filters]);

    // Calculate stats from ALL raw data (or at least what's loaded)
    useEffect(() => {
        const newStats = rawInterns.reduce((acc, curr) => {
            if (curr.status === 'APPLIED') acc.applied++;
            if (curr.status === 'INTERVIEW_SCHEDULED') acc.interview++;
            if (curr.status === 'ACCEPTED') acc.accepted++;
            if (curr.status === 'REJECTED') acc.rejected++;
            acc.total++;
            return acc;
        }, { applied: 0, interview: 0, accepted: 0, rejected: 0, total: 0 });
        setStats(newStats);
    }, [rawInterns]);

    const fetchInterns = useCallback(async (isInitial = false) => {
        if (!enabled) return;
        
        try {
            setLoading(true);
            
            let query = supabase.from('intern_candidates').select('*');

            // Hybrid Logic: If initial, fetch -2 months to +1 month
            if (isInitial) {
                const now = new Date();
                const start = subMonths(startOfMonth(now), 2).toISOString();
                const end = addMonths(endOfMonth(now), 1).toISOString();
                
                // Fetch both application and internship dates in this range to be safe
                query = query.or(`application_date.gte.${start},and(start_date.lte.${end},end_date.gte.${start})`);
            } else {
                // Load More: Fetch older data using the earliest application date as a cursor
                // This is more reliable than fixed time windows
                const earliestApp = rawInterns.reduce((min, i) => 
                    i.applicationDate && i.applicationDate < min ? i.applicationDate : min, 
                    new Date()
                );
                
                query = query.lt('application_date', earliestApp.toISOString())
                             .order('application_date', { ascending: false })
                             .limit(50);
            }

            const { data, error } = await query;

            if (error) throw error;
            if (data) {
                const mapped = data.map(mapDBToIntern);
                setRawInterns(prev => {
                    // Deduplicate by ID
                    const existingIds = new Set(prev.map(i => i.id));
                    const newItems = mapped.filter(i => !existingIds.has(i.id));
                    return [...prev, ...newItems];
                });
                
                // If we got data, there might be more. If we got 0, we reached the end.
                // In a more advanced version, we could do a count query for items < earliestApp
                setHasMore(data.length > 0);
            }
        } catch (err: any) {
            console.error('Error fetching interns:', err);
            showToast('ไม่สามารถโหลดข้อมูลเด็กฝึกงานได้: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [mapDBToIntern, showToast, enabled, rawInterns]);

    // Initial Load
    useEffect(() => {
        if (enabled && rawInterns.length === 0) {
            fetchInterns(true);
        }
    }, [enabled, fetchInterns, rawInterns.length]);

    // Real-time Sync
    useEffect(() => {
        if (!enabled) return;

        const channel = supabase.channel('intern-candidates-hybrid')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'intern_candidates' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newIntern = mapDBToIntern(payload.new);
                    setRawInterns(prev => [newIntern, ...prev]);
                    showToast(`มีผู้สมัครฝึกงานใหม่: ${newIntern.fullName}`, 'info');
                } else if (payload.eventType === 'UPDATE') {
                    const updatedIntern = mapDBToIntern(payload.new);
                    setRawInterns(prev => prev.map(i => i.id === updatedIntern.id ? updatedIntern : i));
                } else if (payload.eventType === 'DELETE') {
                    setRawInterns(prev => prev.filter(i => i.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [enabled, mapDBToIntern, showToast]);

    const addIntern = async (intern: Partial<InternCandidate>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const payload = {
                full_name: intern.fullName,
                nickname: intern.nickname,
                email: intern.email,
                phone_number: intern.phoneNumber,
                university: intern.university,
                faculty: intern.faculty,
                academic_year: intern.academicYear,
                portfolio_url: intern.portfolioUrl,
                resume_url: intern.resumeUrl,
                other_url: intern.otherUrl,
                avatar_url: intern.avatarUrl,
                gender: intern.gender,
                position: intern.position,
                source: intern.source,
                start_date: intern.startDate?.toISOString(),
                end_date: intern.endDate?.toISOString(),
                duration_days: intern.durationDays,
                application_date: intern.applicationDate?.toISOString() || new Date().toISOString(),
                status: intern.status || 'APPLIED',
                interview_date: intern.interviewDate?.toISOString() || null,
                notes: intern.notes,
                created_by: user.id
            };

            const { error } = await supabase.from('intern_candidates').insert([payload]);
            if (error) throw error;
            showToast('เพิ่มข้อมูลผู้สมัครเรียบร้อยแล้ว ✨', 'success');
        } catch (err: any) {
            showToast('เพิ่มข้อมูลไม่สำเร็จ: ' + err.message, 'error');
            throw err;
        }
    };

    const updateIntern = async (id: string, updates: Partial<InternCandidate>) => {
        try {
            const payload: any = {};
            if (updates.fullName !== undefined) payload.full_name = updates.fullName;
            if (updates.nickname !== undefined) payload.nickname = updates.nickname;
            if (updates.email !== undefined) payload.email = updates.email;
            if (updates.phoneNumber !== undefined) payload.phone_number = updates.phoneNumber;
            if (updates.university !== undefined) payload.university = updates.university;
            if (updates.faculty !== undefined) payload.faculty = updates.faculty;
            if (updates.academicYear !== undefined) payload.academic_year = updates.academicYear;
            if (updates.portfolioUrl !== undefined) payload.portfolio_url = updates.portfolioUrl;
            if (updates.resumeUrl !== undefined) payload.resume_url = updates.resumeUrl;
            if (updates.otherUrl !== undefined) payload.other_url = updates.otherUrl;
            if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
            if (updates.gender !== undefined) payload.gender = updates.gender;
            if (updates.position !== undefined) payload.position = updates.position;
            if (updates.source !== undefined) payload.source = updates.source;
            if (updates.startDate !== undefined) payload.start_date = updates.startDate?.toISOString();
            if (updates.endDate !== undefined) payload.end_date = updates.endDate?.toISOString();
            if (updates.durationDays !== undefined) payload.duration_days = updates.durationDays;
            if (updates.applicationDate !== undefined) payload.application_date = updates.applicationDate?.toISOString();
            if (updates.status !== undefined) payload.status = updates.status;
            if (updates.interviewDate !== undefined) payload.interview_date = updates.interviewDate?.toISOString() || null;
            if (updates.notes !== undefined) payload.notes = updates.notes;

            const { error } = await supabase.from('intern_candidates').update(payload).eq('id', id);
            if (error) throw error;
            showToast('อัปเดตข้อมูลสำเร็จ ✨', 'success');
        } catch (err: any) {
            showToast('อัปเดตล้มเหลว: ' + err.message, 'error');
            throw err;
        }
    };

    const deleteIntern = async (id: string) => {
        try {
            const { error } = await supabase.from('intern_candidates').delete().eq('id', id);
            if (error) throw error;
            showToast('ลบข้อมูลผู้สมัครแล้ว', 'warning');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            throw err;
        }
    };

    const fetchMore = useCallback(() => fetchInterns(false), [fetchInterns]);
    const refresh = useCallback(() => {
        setRawInterns([]); // Clear and re-fetch initial range
        fetchInterns(true);
    }, [fetchInterns]);

    return useMemo(() => ({
        interns,
        loading,
        hasMore,
        stats,
        filters,
        setFilters,
        addIntern,
        updateIntern,
        deleteIntern,
        fetchMore,
        refresh
    }), [
        interns, loading, hasMore, stats, filters,
        addIntern, updateIntern, deleteIntern, fetchMore, refresh
    ]);
};
