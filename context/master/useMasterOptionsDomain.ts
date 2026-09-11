import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { MasterOption } from '../../types';
import { useToast } from '../ToastContext';
import { useGlobalDialog } from '../GlobalDialogContext';
import { DEFAULT_OPTIONS } from '../masterDefaults';
import { updateSystemVersion } from './masterVersionSync';

export const CACHE_KEY_OPTIONS = 'master_options_cache';
export const CACHE_KEY_VERSION = 'master_options_version_cache';

const mapRawOption = (item: any): MasterOption => ({
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
});

export const useMasterOptionsDomain = () => {
    const [options, setOptions] = useState<MasterOption[]>([]);
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    const isMutatingOptionsCache = useRef(false);

    const updateOptionsLocalCache = useCallback(async (
        action: 'ADD' | 'UPDATE' | 'DELETE', 
        payload: any, 
        skipVersionUpdate: boolean = false
    ) => {
        isMutatingOptionsCache.current = true;
        try {
            const cachedOptions = localStorage.getItem(CACHE_KEY_OPTIONS);
            let rawOptions = cachedOptions ? JSON.parse(cachedOptions) : [];
            
            if (action === 'ADD') {
                if (!rawOptions.some((o: any) => o.id === payload.id)) {
                    rawOptions.push(payload);
                }
            } else if (action === 'UPDATE') {
                const index = rawOptions.findIndex((o: any) => o.id === payload.id);
                if (index > -1) rawOptions[index] = { ...rawOptions[index], ...payload };
            } else if (action === 'DELETE') {
                rawOptions = rawOptions.filter((o: any) => o.id !== payload);
            }
            
            rawOptions.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            localStorage.setItem(CACHE_KEY_OPTIONS, JSON.stringify(rawOptions));
            setOptions(rawOptions.map(mapRawOption));

            if (!skipVersionUpdate) {
                const newVersion = await updateSystemVersion('master_options_version');
                if (newVersion) {
                    localStorage.setItem(CACHE_KEY_VERSION, newVersion);
                }
            }
        } catch (e) {
            console.error('Error updating local options cache:', e);
        } finally {
            setTimeout(() => {
                isMutatingOptionsCache.current = false;
            }, 1000);
        }
    }, []);

    const loadOptionsFromCacheOrRemote = useCallback(async (currentOptionsVersion?: string) => {
        const cachedOptions = localStorage.getItem(CACHE_KEY_OPTIONS);
        const cachedOptionsVersion = localStorage.getItem(CACHE_KEY_VERSION);
        let optionsData = null;
        let useCache = false;

        if (isMutatingOptionsCache.current) {
            useCache = true;
            optionsData = JSON.parse(localStorage.getItem(CACHE_KEY_OPTIONS) || '[]');
            console.log('🚀 Master Data: Using cached options (Mutation in progress)');
        } else if (cachedOptions && cachedOptionsVersion && currentOptionsVersion && cachedOptionsVersion === currentOptionsVersion) {
            try {
                optionsData = JSON.parse(cachedOptions);
                useCache = true;
                console.log('🚀 Master Data: Using cached options', currentOptionsVersion);
            } catch (e) {
                console.warn('⚠️ Master Data: Options Cache corrupted');
            }
        }

        if (!useCache) {
            console.log('📡 Master Data: Fetching master_options...');
            const { data, error } = await supabase
                .from('master_options')
                .select('*')
                .order('sort_order', { ascending: true });
            
            if (error) throw error;
            optionsData = data;

            if (data && currentOptionsVersion) {
                localStorage.setItem(CACHE_KEY_OPTIONS, JSON.stringify(data));
                localStorage.setItem(CACHE_KEY_VERSION, currentOptionsVersion);
            }
        }

        if (optionsData) {
            setOptions(optionsData.map(mapRawOption));
        }
    }, []);

    const addMasterOption = useCallback(async (option: Omit<MasterOption, 'id'>): Promise<boolean> => {
        try {
            const exists = options.some(o => 
                o.type === option.type && 
                (o.parentKey || null) === (option.parentKey || null) &&
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

            await updateOptionsLocalCache('ADD', data);
            showToast('เพิ่มข้อมูลสำเร็จ ✅', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    }, [options, showToast, updateOptionsLocalCache]);

    const updateMasterOption = useCallback(async (option: MasterOption): Promise<boolean> => {
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

            const { data, error } = await supabase.from('master_options').update(payload).eq('id', option.id).select().single();
            if (error) throw error;

            await updateOptionsLocalCache('UPDATE', data);
            showToast('อัปเดตข้อมูลสำเร็จ ✨', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    }, [showToast, updateOptionsLocalCache]);

    const deleteMasterOption = useCallback(async (id: string): Promise<boolean> => {
        const confirmed = await showConfirm(
            'คุณแน่ใจหรือไม่ว่าต้องการลบตัวเลือกนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้',
            'ยืนยันการลบข้อมูล',
            true
        );

        if (!confirmed) return false;

        try {
            const { error } = await supabase.from('master_options').delete().eq('id', id);
            if (error) throw error;

            await updateOptionsLocalCache('DELETE', id);
            showToast('ลบข้อมูลสำเร็จ 🗑️', 'warning');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    }, [showConfirm, showToast, updateOptionsLocalCache]);

    const saveMasterOptionsBulk = useCallback(async (bulkOptions: any[]): Promise<boolean> => {
        try {
            isMutatingOptionsCache.current = true;
            for (const item of bulkOptions) {
                const payload = {
                    type: item.type,
                    key: item.key,
                    label: item.label,
                    color: item.color,
                    sort_order: item.sort_order ?? item.sortOrder,
                    is_active: item.is_active ?? item.isActive,
                    is_default: item.is_default ?? item.isDefault,
                    parent_key: item.parent_key ?? item.parentKey ?? null,
                    description: item.description ?? null,
                    progress_value: item.progress_value ?? item.progressValue ?? 0
                };
                const { error } = await supabase.from('master_options').update(payload).eq('id', item.id);
                if (error) throw error;
            }

            localStorage.setItem(CACHE_KEY_OPTIONS, JSON.stringify(bulkOptions));
            setOptions(bulkOptions.map(mapRawOption));

            const newVersion = await updateSystemVersion('master_options_version');
            if (newVersion) {
                localStorage.setItem(CACHE_KEY_VERSION, newVersion);
            }

            showToast('บันทึกข้อมูลเรียบร้อย ✨', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
            return false;
        } finally {
            setTimeout(() => {
                isMutatingOptionsCache.current = false;
            }, 1000);
        }
    }, [showToast]);

    const seedDefaults = useCallback(async (onReload: () => Promise<void>): Promise<void> => {
        try {
            showToast('กำลังตรวจสอบฐานข้อมูล... กรุณารอสักครู่', 'info');
            
            const { data: existingData, error: fetchError } = await supabase
                .from('master_options')
                .select('id, type, key, description');

            if (fetchError) throw fetchError;

            const existingMap = new Map(
                existingData?.map((i: any) => [`${i.type.trim().toUpperCase()}_${i.key.trim()}`, i]) || []
            );

            let insertedCount = 0;
            let updatedCount = 0;
            
            for (const opt of DEFAULT_OPTIONS) {
                const compositeKey = `${opt.type}_${opt.key}`;
                const existing = existingMap.get(compositeKey);

                if (!existing) {
                    const { error: insertError } = await supabase
                        .from('master_options')
                        .insert(opt);

                    if (!insertError) {
                        insertedCount++;
                    }
                } else if (!existing.description && opt.description) {
                    const { error: updateError } = await supabase
                        .from('master_options')
                        .update({ description: opt.description })
                        .eq('id', existing.id);
                    
                    if (!updateError) {
                        updatedCount++;
                    }
                }
            }

            if (insertedCount > 0 || updatedCount > 0) {
                showToast(`ซิงค์ข้อมูลสำเร็จ (เพิ่ม ${insertedCount}, อัปเดต ${updatedCount}) 🎉`, 'success');
                await onReload(); 
            } else {
                showToast('ข้อมูลครบถ้วนและเป็นปัจจุบันอยู่แล้วครับ', 'success');
            }
        } catch (err: any) {
            console.error(err);
            showToast('สร้างข้อมูลไม่สำเร็จ: ' + err.message, 'error');
        }
    }, [showToast]);

    return {
        options,
        setOptions,
        isMutatingOptionsCache,
        updateOptionsLocalCache,
        loadOptionsFromCacheOrRemote,
        addMasterOption,
        updateMasterOption,
        deleteMasterOption,
        saveMasterOptionsBulk,
        seedDefaults
    };
};
