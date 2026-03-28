
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { InternCandidate, InternStatus } from '../types';
import { useToast } from '../context/ToastContext';

export const useInterns = (enabled: boolean = true) => {
    const [interns, setInterns] = useState<InternCandidate[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const { showToast } = useToast();

    const PAGE_SIZE = 20;

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

    const fetchInterns = useCallback(async (reset = false, dateRange?: { start: string, end: string }) => {
        if (!enabled && !dateRange) return; // Don't fetch if not enabled, unless it's a specific range request
        
        try {
            setLoading(true);
            
            // Use a functional update or local variable to avoid dependency on 'page' state
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

            if (dateRange) {
                // Fetch interns overlapping with the range
                query = query.or(`and(start_date.lte.${dateRange.end},end_date.gte.${dateRange.start})`);
            } else {
                // Standard pagination for list view
                query = query.order('created_at', { ascending: false }).range(from, to);
            }

            const { data, error, count } = await query;

            if (error) throw error;
            if (data) {
                const mapped = data.map(mapDBToIntern);
                if (reset || dateRange) {
                    setInterns(mapped);
                    setPage(1);
                } else {
                    setInterns(prev => [...prev, ...mapped]);
                    setPage(prev => prev + 1);
                }
                
                if (count !== null) {
                    setHasMore(reset ? mapped.length < count : (from + mapped.length) < count);
                }
            }
        } catch (err: any) {
            console.error('Error fetching interns:', err);
            showToast('ไม่สามารถโหลดข้อมูลเด็กฝึกงานได้: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [mapDBToIntern, showToast, enabled]); // Added 'enabled' to dependencies

    useEffect(() => {
        // Initial fetch for list view - only on mount if enabled
        if (enabled) {
            fetchInterns(true);
        }
    }, [enabled, fetchInterns]); // Run when enabled changes or on mount

    useEffect(() => {
        if (!enabled) return; // Don't subscribe if not enabled

        const channel = supabase.channel('intern-candidates-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'intern_candidates' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newIntern = mapDBToIntern(payload.new);
                    setInterns(prev => [newIntern, ...prev]);
                    showToast(`มีผู้สมัครฝึกงานใหม่: ${newIntern.fullName}`, 'info');
                } else if (payload.eventType === 'UPDATE') {
                    const updatedIntern = mapDBToIntern(payload.new);
                    setInterns(prev => prev.map(i => i.id === updatedIntern.id ? updatedIntern : i));
                } else if (payload.eventType === 'DELETE') {
                    setInterns(prev => prev.filter(i => i.id !== payload.old.id));
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

    return {
        interns,
        loading,
        hasMore,
        addIntern,
        updateIntern,
        deleteIntern,
        fetchMore: () => fetchInterns(false),
        fetchByRange: (start: string, end: string) => fetchInterns(true, { start, end }),
        refresh: () => fetchInterns(true)
    };
};
