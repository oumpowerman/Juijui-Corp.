
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DashboardConfig } from '../types';
import { useToast } from '../context/ToastContext';

export const useDashboardConfig = () => {
    const [configs, setConfigs] = useState<DashboardConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchConfigs = async () => {
        try {
            const { data, error } = await supabase
                .from('dashboard_configs')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            if (data) {
                setConfigs(data.map((c: any) => ({
                    id: c.id,
                    key: c.key,
                    label: c.label,
                    icon: c.icon,
                    colorTheme: c.color_theme,
                    statusKeys: c.status_keys || [],
                    filterType: c.filter_type || 'STATUS', // Default to STATUS
                    sortOrder: c.sort_order
                })));
            }
        } catch (err) {
            console.error('Fetch dashboard config failed', err);
        } finally {
            setIsLoading(false);
        }
    };

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

            setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
            showToast('บันทึกการตั้งค่าแล้ว ✅', 'success');
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    return {
        configs,
        isLoading,
        updateConfig,
        refreshConfigs: fetchConfigs
    };
};
