import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useReviewJudge } from '../hooks/useReviewJudge';
import { useMasterDataContext } from '../context/MasterDataContext';
import { useUserSession } from '../context/UserSessionContext';

export const GlobalRealtimeSync = () => {
    const queryClient = useQueryClient();
    const { runReviewChecks, runWarningChecks } = useReviewJudge();
    const { annualHolidays, calendarExceptions, isLoading: isMasterLoading } = useMasterDataContext();
    const { currentUserProfile, isReady: isAuthReady } = useUserSession();

    useEffect(() => {
        // Run SLA checks (Global & Personal Warning)
        if (!isMasterLoading && annualHolidays && isAuthReady) {
            // 1. Global Revert Check (Leader-based)
            runReviewChecks(annualHolidays, calendarExceptions || []);
            
            // 2. Personal SLA Warning Check (Only for current user's tasks)
            if (currentUserProfile?.id) {
                runWarningChecks(currentUserProfile.id, annualHolidays, calendarExceptions || []);
            }
        }
    }, [isMasterLoading, annualHolidays, calendarExceptions, isAuthReady, currentUserProfile?.id]);

    useEffect(() => {
        // Consolidate all global syncs into a single channel to reduce egress and overhead
        const globalChannel = supabase
            .channel('global-app-sync')
            // Master Options
            .on('postgres_changes', { event: '*', schema: 'public', table: 'master_options' }, () => {
                queryClient.invalidateQueries({ queryKey: ['master_options'] });
            })
            // Channels
            .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => {
                queryClient.invalidateQueries({ queryKey: ['channels'] });
            })
            // Inventory
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
                queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
                queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
            })
            // Checklist
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_checklist_items' }, () => {
                queryClient.invalidateQueries({ queryKey: ['active_checklist_items'] });
            })
            // Presets
            .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_presets_db' }, () => {
                queryClient.invalidateQueries({ queryKey: ['checklist_presets_db'] });
            })
            // Profiles
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                queryClient.invalidateQueries({ queryKey: ['profiles'] });
            })
            // Tasks & Contents
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, () => {
                queryClient.invalidateQueries({ queryKey: ['contents'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, () => {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                queryClient.invalidateQueries({ queryKey: ['contents'] });
            })
            // KPI
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_configs' }, () => {
                queryClient.invalidateQueries({ queryKey: ['kpi_configs'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_records' }, () => {
                queryClient.invalidateQueries({ queryKey: ['kpi_records'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'individual_goals' }, () => {
                queryClient.invalidateQueries({ queryKey: ['individual_goals'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'idp_items' }, () => {
                queryClient.invalidateQueries({ queryKey: ['idp_items'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_peer_reviews' }, () => {
                queryClient.invalidateQueries({ queryKey: ['kpi_peer_reviews'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(globalChannel);
        };
    }, [queryClient]);

    return null;
};
