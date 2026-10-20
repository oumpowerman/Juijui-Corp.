import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useReviewJudge } from '../hooks/useReviewJudge';
import { useMasterDataContext } from '../context/MasterDataContext';
import { useUserSession } from '../context/UserSessionContext';
import { useOrganization } from '../context/OrganizationContext';
import { getOrgChannelName } from '../lib/tenantStorage';

export const GlobalRealtimeSync = () => {
    const queryClient = useQueryClient();
    const { runReviewChecks, runWarningChecks } = useReviewJudge();
    const { annualHolidays, calendarExceptions, isLoading: isMasterLoading } = useMasterDataContext();
    const { currentUserProfile, isReady: isAuthReady } = useUserSession();
    const { currentOrg } = useOrganization();
    const activeOrgId = currentOrg?.id;

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
    }, [isMasterLoading, annualHolidays, calendarExceptions, isAuthReady, currentUserProfile?.id, activeOrgId]);

    useEffect(() => {
        const isCurrentOrgEvent = (payload: any): boolean => {
            const eventOrgId = payload?.new?.org_id || payload?.old?.org_id;
            if (!eventOrgId || !activeOrgId) return true;
            return eventOrgId === activeOrgId;
        };

        const channelName = getOrgChannelName('global-app-sync', activeOrgId);

        // Consolidate all global syncs into an organization-scoped channel to prevent cross-org leakage
        const globalChannel = supabase
            .channel(channelName)
            // Master Options
            .on('postgres_changes', { event: '*', schema: 'public', table: 'master_options' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['master_options'] });
            })
            // Channels
            .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['channels'] });
            })
            // Inventory
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, (payload) => {
                if (isCurrentOrgEvent(payload)) {
                    queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
                    queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
                }
            })
            // Checklist
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_checklist_items' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['active_checklist_items'] });
            })
            // Presets
            .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_presets_db' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['checklist_presets_db'] });
            })
            // Profiles
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                queryClient.invalidateQueries({ queryKey: ['profiles'] });
            })
            // Tasks & Contents
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['tasks'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['contents'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, (payload) => {
                if (isCurrentOrgEvent(payload)) {
                    queryClient.invalidateQueries({ queryKey: ['tasks'] });
                    queryClient.invalidateQueries({ queryKey: ['contents'] });
                }
            })
            // KPI
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_configs' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['kpi_configs'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_records' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['kpi_records'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'individual_goals' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['individual_goals'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'idp_items' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['idp_items'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_peer_reviews' }, (payload) => {
                if (isCurrentOrgEvent(payload)) queryClient.invalidateQueries({ queryKey: ['kpi_peer_reviews'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(globalChannel);
        };
    }, [queryClient, activeOrgId]);

    return null;
};

