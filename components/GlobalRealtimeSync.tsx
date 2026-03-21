import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const GlobalRealtimeSync = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Master Options Sync
        const masterChannel = supabase
            .channel('realtime-master-options-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'master_options' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['master_options'] });
                }
            )
            .subscribe();

        // Channels Sync
        const channelsChannel = supabase
            .channel('realtime-channels-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'channels' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['channels'] });
                }
            )
            .subscribe();

        // Inventory Sync
        const inventoryChannel = supabase
            .channel('realtime-inventory-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_items' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
                    queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
                }
            )
            .subscribe();

        // Checklist Sync
        const checklistChannel = supabase
            .channel('realtime-checklist-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'active_checklist_items' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['active_checklist_items'] });
                }
            )
            .subscribe();

        // Presets Sync
        const presetsChannel = supabase
            .channel('realtime-presets-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'checklist_presets_db' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['checklist_presets_db'] });
                }
            )
            .subscribe();

        // Profiles Sync
        const profilesChannel = supabase
            .channel('realtime-profiles-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['profiles'] });
                }
            )
            .subscribe();

        // Tasks & Contents Sync
        const tasksChannel = supabase
            .channel('realtime-tasks-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['tasks'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contents' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['contents'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'task_reviews' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['tasks'] });
                    queryClient.invalidateQueries({ queryKey: ['contents'] });
                }
            )
            .subscribe();
        
        // KPI Sync
        const kpiChannel = supabase
            .channel('realtime-kpi-global')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'kpi_configs' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['kpi_configs'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'kpi_records' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['kpi_records'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'individual_goals' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['individual_goals'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'idp_items' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['idp_items'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'kpi_peer_reviews' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['kpi_peer_reviews'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(masterChannel);
            supabase.removeChannel(channelsChannel);
            supabase.removeChannel(inventoryChannel);
            supabase.removeChannel(checklistChannel);
            supabase.removeChannel(presetsChannel);
            supabase.removeChannel(profilesChannel);
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(kpiChannel);
        };
    }, [queryClient]);

    return null;
};
