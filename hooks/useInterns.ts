
import { useState, useEffect, useCallback } from 'react';
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
    const [interns, setInterns] = useState<InternCandidate[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
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

    const PAGE_SIZE = 50;

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

    const calculateStats = useCallback((data: InternCandidate[]) => {
        const newStats = data.reduce((acc, curr) => {
            if (curr.status === 'APPLIED') acc.applied++;
            if (curr.status === 'INTERVIEW_SCHEDULED') acc.interview++;
            if (curr.status === 'ACCEPTED') acc.accepted++;
            if (curr.status === 'REJECTED') acc.rejected++;
            acc.total++;
            return acc;
        }, { applied: 0, interview: 0, accepted: 0, rejected: 0, total: 0 });
        setStats(newStats);
    }, []);

    const fetchInterns = useCallback(async (reset = false, currentFilters: InternFilterState) => {
        if (!enabled) return; 
        
        try {
            setLoading(true);
            
            let currentPage = 0;
            setPage(prev => {
                currentPage = reset ? 0 : prev;
                return currentPage;
            });

            const from = currentPage * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('intern_candidates')
                .select('*', { count: 'exact' });

            // Apply Filters
            if (currentFilters.searchQuery) {
                query = query.or(`full_name.ilike.%${currentFilters.searchQuery}%,university.ilike.%${currentFilters.searchQuery}%,position.ilike.%${currentFilters.searchQuery}%,email.ilike.%${currentFilters.searchQuery}%`);
            }

            if (currentFilters.statuses.length > 0) {
                query = query.in('status', currentFilters.statuses);
            }

            if (currentFilters.dateRange.start && currentFilters.dateRange.end) {
                const start = currentFilters.dateRange.start.toISOString();
                const end = currentFilters.dateRange.end.toISOString();

                if (currentFilters.dateType === 'APPLICATION') {
                    query = query.gte('application_date', start).lte('application_date', end);
                } else {
                    query = query.or(`and(start_date.lte.${end},end_date.gte.${start})`);
                }
            }

            // Sorting
            if (currentFilters.dateType === 'APPLICATION') {
                query = query.order('application_date', { ascending: false });
            } else {
                query = query.order('start_date', { ascending: true });
            }

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;
            if (data) {
                const mapped = data.map(mapDBToIntern);
                if (reset) {
                    setInterns(mapped);
                    setPage(1);
                    // If it's a reset, we should also fetch ALL data for stats if needed, 
                    // but for now let's calculate from what we have or do a separate count query
                    // Actually, stats should probably be global for the filter, not just the page.
                    
                    // Fetch global stats for this filter
                    let statsQuery = supabase
                        .from('intern_candidates')
                        .select('status', { count: 'exact' });
                    
                    if (currentFilters.searchQuery) {
                        statsQuery = statsQuery.or(`full_name.ilike.%${currentFilters.searchQuery}%,university.ilike.%${currentFilters.searchQuery}%,position.ilike.%${currentFilters.searchQuery}%,email.ilike.%${currentFilters.searchQuery}%`);
                    }
                    if (currentFilters.dateRange.start && currentFilters.dateRange.end) {
                        const start = currentFilters.dateRange.start.toISOString();
                        const end = currentFilters.dateRange.end.toISOString();
                        if (currentFilters.dateType === 'APPLICATION') {
                            statsQuery = statsQuery.gte('application_date', start).lte('application_date', end);
                        } else {
                            statsQuery = statsQuery.or(`and(start_date.lte.${end},end_date.gte.${start})`);
                        }
                    }

                    const { data: statsData } = await statsQuery;
                    if (statsData) {
                        const s = statsData.reduce((acc: any, curr: any) => {
                            if (curr.status === 'APPLIED') acc.applied++;
                            if (curr.status === 'INTERVIEW_SCHEDULED') acc.interview++;
                            if (curr.status === 'ACCEPTED') acc.accepted++;
                            if (curr.status === 'REJECTED') acc.rejected++;
                            acc.total++;
                            return acc;
                        }, { applied: 0, interview: 0, accepted: 0, rejected: 0, total: 0 });
                        setStats(s);
                    }

                } else {
                    setInterns(prev => [...prev, ...mapped]);
                    setPage(prev => prev + 1);
                }
                
                if (count !== null) {
                    setHasMore((from + mapped.length) < count);
                }
            }
        } catch (err: any) {
            console.error('Error fetching interns:', err);
            showToast('ไม่สามารถโหลดข้อมูลเด็กฝึกงานได้: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [mapDBToIntern, showToast, enabled]);

    useEffect(() => {
        if (enabled) {
            fetchInterns(true, filters);
        }
    }, [enabled, filters, fetchInterns]);

    useEffect(() => {
        if (!enabled) return;

        const channel = supabase.channel('intern-candidates-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'intern_candidates' }, (payload) => {
                const checkFilters = (item: any) => {
                    // Simple check if item matches current filters
                    if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) return false;
                    if (filters.searchQuery) {
                        const search = filters.searchQuery.toLowerCase();
                        const matches = item.full_name?.toLowerCase().includes(search) || 
                                      item.university?.toLowerCase().includes(search) ||
                                      item.position?.toLowerCase().includes(search);
                        if (!matches) return false;
                    }
                    // Date range check could be added here too
                    return true;
                };

                if (payload.eventType === 'INSERT') {
                    const newIntern = mapDBToIntern(payload.new);
                    if (checkFilters(payload.new)) {
                        setInterns(prev => [newIntern, ...prev]);
                    }
                    // Always update stats if it matches filters (even if not in current page)
                    if (checkFilters(payload.new)) {
                        setStats(prev => {
                            const ns = { ...prev };
                            if (newIntern.status === 'APPLIED') ns.applied++;
                            if (newIntern.status === 'INTERVIEW_SCHEDULED') ns.interview++;
                            if (newIntern.status === 'ACCEPTED') ns.accepted++;
                            if (newIntern.status === 'REJECTED') ns.rejected++;
                            ns.total++;
                            return ns;
                        });
                    }
                    showToast(`มีผู้สมัครฝึกงานใหม่: ${newIntern.fullName}`, 'info');
                } else if (payload.eventType === 'UPDATE') {
                    const updatedIntern = mapDBToIntern(payload.new);
                    const oldIntern = mapDBToIntern(payload.old); // payload.old might only have ID
                    
                    setInterns(prev => {
                        const exists = prev.find(i => i.id === updatedIntern.id);
                        if (exists) {
                            if (checkFilters(payload.new)) {
                                return prev.map(i => i.id === updatedIntern.id ? updatedIntern : i);
                            } else {
                                return prev.filter(i => i.id !== updatedIntern.id);
                            }
                        } else if (checkFilters(payload.new)) {
                            return [updatedIntern, ...prev];
                        }
                        return prev;
                    });
                    
                    // Refresh stats on update to be safe
                    fetchInterns(true, filters);

                } else if (payload.eventType === 'DELETE') {
                    setInterns(prev => prev.filter(i => i.id !== payload.old.id));
                    fetchInterns(true, filters);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [enabled, mapDBToIntern, showToast, filters, fetchInterns]);

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
                avatar_url: intern.avatarUrl,
                gender: intern.gender,
                position: intern.position,
                source: intern.source,
                start_date: intern.startDate?.toISOString(),
                end_date: intern.endDate?.toISOString(),
                duration_days: intern.durationDays,
                application_date: intern.applicationDate?.toISOString(),
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

    const fetchMore = useCallback(() => fetchInterns(false, filters), [fetchInterns, filters]);
    const refresh = useCallback(() => fetchInterns(true, filters), [fetchInterns, filters]);

    return {
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
    };
};
