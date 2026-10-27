
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DashboardConfig } from '../types';
import { useToast } from '../context/ToastContext';

let cachedDashboardConfigs: DashboardConfig[] | null = null;

export const useDashboardConfig = () => {
    const [configs, setConfigs] = useState<DashboardConfig[]>(() => cachedDashboardConfigs || []);
    const [isLoading, setIsLoading] = useState<boolean>(() => !cachedDashboardConfigs);
    const { showToast } = useToast();

    const fetchConfigs = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('dashboard_configs')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            if (data) {
                const mapped: DashboardConfig[] = data.map((c: any) => ({
                    id: c.id,
                    key: c.key,
                    label: c.label,
                    icon: c.icon,
                    colorTheme: c.color_theme,
                    statusKeys: c.status_keys || [],
                    filterType: c.filter_type || 'STATUS', // Default to STATUS
                    sortOrder: c.sort_order
                }));
                cachedDashboardConfigs = mapped;
                setConfigs(mapped);
            }
        } catch (err) {
            console.error('Fetch dashboard config failed', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateConfig = async (id: string, updates: Partial<DashboardConfig>) => {
        try {
            const payload: any = {};
            if (updates.label) payload.label = updates.label;
            if (updates.statusKeys) payload.status_keys = updates.statusKeys;
            if (updates.colorTheme) payload.color_theme = updates.colorTheme;
            if (updates.filterType) payload.filter_type = updates.filterType;

            const { error } = await supabase
                .from('dashboard_configs')
                .update(payload)
                .eq('id', id);

            if (error) throw error;

            setConfigs(prev => {
                const next = prev.map(c => c.id === id ? { ...c, ...updates } : c);
                cachedDashboardConfigs = next;
                return next;
            });
            showToast('บันทึกการตั้งค่าแล้ว ✅', 'success');
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    useEffect(() => {
        fetchConfigs();

        const handleWorkspaceSwitch = () => {
            cachedDashboardConfigs = null;
            setConfigs([]);
            setIsLoading(true);
            fetchConfigs();
        };

        window.addEventListener('org-workspace-switched', handleWorkspaceSwitch);
        return () => {
            window.removeEventListener('org-workspace-switched', handleWorkspaceSwitch);
        };
    }, [fetchConfigs]);

    return {
        configs,
        isLoading,
        updateConfig,
        refreshConfigs: fetchConfigs
    };
};
