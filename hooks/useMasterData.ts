
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { MasterOption } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';

// Default Data for seeding
const DEFAULT_OPTIONS = [
    // ... (keep DEFAULT_OPTIONS same)
];

export const useMasterData = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const { data: options = [], isLoading, refetch } = useQuery({
        queryKey: ['master_options'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('master_options')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) {
                console.error('Error fetching master_options:', error);
                throw error;
            }

            return (data || []).map((item: any) => ({
                id: item.id,
                type: (item.type || '').trim().toUpperCase(),
                key: (item.key || '').trim(),
                label: item.label,
                color: item.color,
                sortOrder: item.sort_order,
                isActive: item.is_active,
                isDefault: item.is_default,
                parentKey: item.parent_key,
                description: item.description,
                progressValue: item.progress_value
            })) as MasterOption[];
        },
        staleTime: 1000 * 60 * 30, // 30 minutes (Master data is very static)
    });

    const handleAddOption = async (option: Omit<MasterOption, 'id'>) => {
        try {
            // Check for Duplicates (Case-Insensitive)
            const exists = options.some(o => 
                o.type === option.type && 
                (o.key === option.key || o.label.toLowerCase().trim() === option.label.toLowerCase().trim())
            );

            if (exists) {
                showToast(`ข้อมูล "${option.label}" มีอยู่แล้วในระบบ`, 'warning');
                return false;
            }

            const payload = {
                type: option.type,
                key: option.key,
                label: option.label,
                color: option.color,
                sort_order: option.sortOrder,
                is_active: option.isActive,
                is_default: option.isDefault,
                parent_key: option.parentKey || null,
                description: option.description || null,
                progress_value: option.progressValue || 0
            };

            const { data, error } = await supabase.from('master_options').insert(payload).select().single();
            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['master_options'] });
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
                is_default: option.isDefault,
                parent_key: option.parentKey || null,
                description: option.description || null,
                progress_value: option.progressValue || 0
            };

            const { error } = await supabase.from('master_options').update(payload).eq('id', option.id);
            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['master_options'] });
            showToast('อัปเดตข้อมูลสำเร็จ ✨', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const handleDeleteOption = async (id: string) => {
        const confirmed = await showConfirm('ยืนยันการลบข้อมูลนี้? หากลบแล้วอาจกระทบกับงานเก่าที่ใช้ค่านี้อยู่', 'ลบข้อมูลมาสเตอร์');
        if(!confirmed) return;

        try {
            const { error } = await supabase.from('master_options').delete().eq('id', id);
            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['master_options'] });
            showToast('ลบข้อมูลเรียบร้อย 🗑️', 'info');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const seedDefaults = async () => {
        try {
            showToast('กำลังตรวจสอบฐานข้อมูล... กรุณารอสักครู่', 'info');
            
            const { data: existingData, error: fetchError } = await supabase
                .from('master_options')
                .select('type, key');

            if (fetchError) throw fetchError;

            const existingSet = new Set(
                existingData?.map((i: any) => `${i.type.trim().toUpperCase()}_${i.key.trim()}`) || []
            );

            let insertedCount = 0;
            
            for (const opt of DEFAULT_OPTIONS) {
                const compositeKey = `${opt.type}_${opt.key}`;

                if (!existingSet.has(compositeKey)) {
                    const { error: insertError } = await supabase
                        .from('master_options')
                        .insert(opt);

                    if (!insertError) {
                        insertedCount++;
                    } else {
                        console.error(`Failed to insert ${compositeKey}:`, insertError);
                    }
                }
            }

            if (insertedCount > 0) {
                showToast(`สร้างข้อมูลเพิ่มสำเร็จ ${insertedCount} รายการ 🎉`, 'success');
                queryClient.invalidateQueries({ queryKey: ['master_options'] });
            } else {
                showToast('ข้อมูลครบถ้วนอยู่แล้วครับ (ตรวจสอบจาก DB แล้ว)', 'success');
            }

        } catch (err: any) {
            console.error(err);
            showToast('สร้างข้อมูลไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    return {
        masterOptions: options,
        isLoading,
        fetchMasterOptions: refetch,
        addMasterOption: handleAddOption,
        updateMasterOption: handleUpdateOption,
        deleteMasterOption: handleDeleteOption,
        seedDefaults
    };
};
