
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Duty, DutyConfig, DutySwap } from '../../types';
import { format, subMonths, addMonths } from 'date-fns';
import { useMasterData } from '../useMasterData';

export const useDutyData = () => {
    const [duties, setDuties] = useState<Duty[]>([]);
    const [configs, setConfigs] = useState<DutyConfig[]>([]);
    const [swapRequests, setSwapRequests] = useState<DutySwap[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const { annualHolidays, calendarExceptions } = useMasterData();

    const fetchDuties = useCallback(async () => {
        try {
            // Fetch only relevant duties (2 months ago to 6 months ahead) to prevent scalability issues
            const startDate = format(subMonths(new Date(), 2), 'yyyy-MM-dd');
            const endDate = format(addMonths(new Date(), 6), 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('duties')
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });

            if (error) throw error;
            if (data) {
                setDuties(data.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    assigneeId: d.assignee_id,
                    date: new Date(d.date),
                    isDone: d.is_done,
                    proofImageUrl: d.proof_image_url,
                    isPenalized: d.is_penalized,
                    penaltyStatus: d.penalty_status,
                    appealReason: d.appeal_reason,
                    appealProofUrl: d.appeal_proof_url,
                    abandonedAt: d.abandoned_at ? new Date(d.abandoned_at) : undefined,
                    clearedBySystem: d.cleared_by_system || false
                })));
            }
        } catch (err) {
            console.error('Fetch duties failed', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchConfigs = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('duty_configs')
                .select('*')
                .order('day_of_week', { ascending: true });

            if (error) throw error;
            if (data && data.length > 0) {
                setConfigs(data.map((c: any) => ({
                    dayOfWeek: c.day_of_week,
                    requiredPeople: c.required_people,
                    taskTitles: c.task_titles
                })));
            }
        } catch (err) {
            console.error('Fetch duty configs failed', err);
        }
    }, []);

    const fetchSwapRequests = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('duty_swaps')
                .select(`
                    *,
                    requestor:profiles!duty_swaps_requestor_id_fkey(full_name, avatar_url),
                    target_duty:duties!duty_swaps_target_duty_id_fkey(title, date, assignee_id),
                    own_duty:duties!duty_swaps_own_duty_id_fkey(title, date, assignee_id)
                `)
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                const mappedSwaps: DutySwap[] = data.map((s: any) => ({
                    id: s.id,
                    requestorId: s.requestor_id,
                    targetDutyId: s.target_duty_id,
                    ownDutyId: s.own_duty_id,
                    status: s.status,
                    createdAt: new Date(s.created_at),
                    requestor: s.requestor ? { name: s.requestor.full_name, avatarUrl: s.requestor.avatar_url } : undefined,
                    targetDuty: s.target_duty,
                    ownDuty: s.own_duty
                }));
                setSwapRequests(mappedSwaps);
            }
        } catch (err) {
            console.error('Fetch swaps failed', err);
        }
    }, []);

    useEffect(() => {
        fetchDuties();
        fetchConfigs();
        fetchSwapRequests();

        const dutyChannel = supabase
            .channel('realtime-duties-data')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'duties' }, (payload) => {
                const newDuty: Duty = {
                    id: payload.new.id,
                    title: payload.new.title,
                    assigneeId: payload.new.assignee_id,
                    date: new Date(payload.new.date),
                    isDone: payload.new.is_done,
                    proofImageUrl: payload.new.proof_image_url,
                    isPenalized: payload.new.is_penalized,
                    penaltyStatus: payload.new.penalty_status,
                    appealReason: payload.new.appeal_reason,
                    appealProofUrl: payload.new.appeal_proof_url,
                    abandonedAt: payload.new.abandoned_at ? new Date(payload.new.abandoned_at) : undefined,
                    clearedBySystem: payload.new.cleared_by_system || false
                };
                setDuties(prev => {
                    if (prev.some(d => d.id === newDuty.id)) return prev;
                    return [...prev, newDuty].sort((a, b) => a.date.getTime() - b.date.getTime());
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duties' }, (payload) => {
                setDuties(prev => prev.map(d => {
                    if (d.id === payload.new.id) {
                        return {
                            ...d,
                            title: payload.new.title,
                            assigneeId: payload.new.assignee_id,
                            date: new Date(payload.new.date),
                            isDone: payload.new.is_done,
                            proofImageUrl: payload.new.proof_image_url,
                            isPenalized: payload.new.is_penalized,
                            penaltyStatus: payload.new.penalty_status,
                            appealReason: payload.new.appeal_reason,
                            appealProofUrl: payload.new.appeal_proof_url,
                            abandonedAt: payload.new.abandoned_at ? new Date(payload.new.abandoned_at) : undefined,
                            clearedBySystem: payload.new.cleared_by_system || false
                        };
                    }
                    return d;
                }));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'duties' }, (payload) => {
                setDuties(prev => prev.filter(d => d.id !== payload.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_configs' }, () => fetchConfigs())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_swaps' }, () => fetchSwapRequests())
            .subscribe();

        return () => {
            supabase.removeChannel(dutyChannel);
        };
    }, [fetchDuties, fetchConfigs, fetchSwapRequests]);

    return {
        duties,
        setDuties,
        configs,
        setConfigs,
        swapRequests,
        isLoading,
        annualHolidays,
        calendarExceptions,
        refreshData: () => {
            fetchDuties();
            fetchConfigs();
            fetchSwapRequests();
        }
    };
};
