
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MasterOption } from '../types';
import { useToast } from '../context/ToastContext';

export const useMasterData = () => {
    const [options, setOptions] = useState<MasterOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchOptions = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('master_options')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            if (data) {
                setOptions(data.map((item: any) => ({
                    id: item.id,
                    type: item.type,
                    key: item.key,
                    label: item.label,
                    color: item.color,
                    sortOrder: item.sort_order,
                    isActive: item.is_active,
                    isDefault: item.is_default // Map DB column
                })));
            }
        } catch (err: any) {
            console.error('Fetch master options failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddOption = async (option: Omit<MasterOption, 'id'>) => {
        try {
            const payload = {
                type: option.type,
                key: option.key,
                label: option.label,
                color: option.color,
                sort_order: option.sortOrder,
                is_active: option.isActive,
                is_default: option.isDefault // Map to snake_case
            };

            const { data, error } = await supabase.from('master_options').insert(payload).select().single();
            if (error) throw error;

            const newOption: MasterOption = {
                id: data.id,
                type: data.type,
                key: data.key,
                label: data.label,
                color: data.color,
                sortOrder: data.sort_order,
                isActive: data.is_active,
                isDefault: data.is_default
            };

            setOptions(prev => [...prev, newOption]);
            showToast('เพิ่มข้อมูลสำเร็จ ✅', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const handleUpdateOption = async (option: MasterOption) => {
        try {
            const payload = {
                type: option.type,
                key: option.key,
                label: option.label,
                color: option.color,
                sort_order: option.sortOrder,
                is_active: option.isActive,
                is_default: option.isDefault
            };

            const { error } = await supabase.from('master_options').update(payload).eq('id', option.id);
            if (error) throw error;

            setOptions(prev => prev.map(o => o.id === option.id ? option : o));
            showToast('อัปเดตข้อมูลสำเร็จ ✨', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const handleDeleteOption = async (id: string) => {
        if(!confirm('ยืนยันการลบข้อมูลนี้? หากลบแล้วอาจกระทบกับงานเก่าที่ใช้ค่านี้อยู่')) return;

        try {
            const { error } = await supabase.from('master_options').delete().eq('id', id);
            if (error) throw error;

            setOptions(prev => prev.filter(o => o.id !== id));
            showToast('ลบข้อมูลเรียบร้อย 🗑️', 'info');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    return {
        masterOptions: options,
        isLoading,
        fetchMasterOptions: fetchOptions,
        addMasterOption: handleAddOption,
        updateMasterOption: handleUpdateOption,
        deleteMasterOption: handleDeleteOption
    };
};
