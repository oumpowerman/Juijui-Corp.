
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChecklistItem, ChecklistPreset, InventoryItem, AssetCondition, AssetGroup } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext'; 
import { useQuery, useQueryClient } from '@tanstack/react-query';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export const useChecklist = () => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog(); 
    const queryClient = useQueryClient();
    
    // --- 1. Fetching Logic (React Query) ---

    // Fetch Active List
    const { data: activeChecklistItems = [] } = useQuery({
        queryKey: ['active_checklist_items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('active_checklist_items')
                .select('id, text, is_checked, category_id, created_at')
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return (data || []).map((i: any) => ({
                id: i.id,
                text: i.text,
                isChecked: i.is_checked,
                categoryId: i.category_id
            })) as ChecklistItem[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Fetch Inventory
    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['inventory_items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('id, name, description, category_id, image_url, item_type, quantity, unit, min_threshold, max_capacity, tags, asset_group, purchase_price, purchase_date, serial_number, warranty_expire, condition, current_holder_id, created_at')
                .order('created_at', { ascending: false }); 
            
            if (error) throw error;
            return (data || []).map((i: any) => ({
                id: i.id,
                name: i.name,
                description: i.description, 
                categoryId: i.category_id,
                imageUrl: i.image_url,
                itemType: i.item_type || 'FIXED', 
                quantity: i.quantity || 0,
                unit: i.unit,
                minThreshold: i.min_threshold,
                maxCapacity: i.max_capacity,
                tags: i.tags || [],
                assetGroup: i.asset_group as AssetGroup,
                purchasePrice: i.purchase_price,
                purchaseDate: i.purchase_date ? new Date(i.purchase_date) : undefined,
                serialNumber: i.serial_number,
                warrantyExpire: i.warranty_expire ? new Date(i.warranty_expire) : undefined,
                condition: i.condition as AssetCondition,
                currentHolderId: i.current_holder_id
            })) as InventoryItem[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Fetch Presets
    const { data: checklistPresets = [] } = useQuery({
        queryKey: ['checklist_presets_db'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('checklist_presets_db')
                .select('id, name, items')
                .order('name', { ascending: true });

            if (error) throw error;
            return (data || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                items: p.items || []
            })) as ChecklistPreset[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Fetch Active Preset Metadata from master_options
    const { data: activePresetConfig } = useQuery({
        queryKey: ['master_options', 'CHECKLIST_CONFIG', 'ACTIVE_PRESET_ID'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('master_options')
                .select('id, label, type, key')
                .eq('type', 'CHECKLIST_CONFIG')
                .eq('key', 'ACTIVE_PRESET_ID')
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const activePresetId = activePresetConfig?.label || null;
    const activePresetName = checklistPresets.find(p => p.id === activePresetId)?.name || null;

    // Helper to invalidate queries
    const loadChecklistData = () => {
        queryClient.invalidateQueries({ queryKey: ['active_checklist_items'] });
        queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
        queryClient.invalidateQueries({ queryKey: ['checklist_presets_db'] });
        queryClient.invalidateQueries({ queryKey: ['master_options', 'CHECKLIST_CONFIG', 'ACTIVE_PRESET_ID'] });
    };

    // --- 2. Realtime Subscriptions ---
    // Moved to GlobalRealtimeSync to avoid multiple subscriptions

    // --- 3. Active List Logic ---
    
    const handleToggleChecklist = async (id: string, currentStatus: boolean) => {
        // Optimistic UI Update
        queryClient.setQueryData(['active_checklist_items'], (old: ChecklistItem[] | undefined) => 
            old ? old.map(item => item.id === id ? { ...item, isChecked: !currentStatus } : item) : []
        );
        
        try {
            await supabase.from('active_checklist_items').update({ is_checked: !currentStatus }).eq('id', id);
        } catch (err) {
            console.error("Toggle error", err);
        }
    };
  
    const handleAddChecklistItem = async (text: string, categoryId: string) => {
        try {
            const { error } = await supabase.from('active_checklist_items').insert({
                text,
                category_id: categoryId,
                is_checked: false
            });
            if (error) throw error;
            loadChecklistData();
        } catch (err) {
            showToast('เพิ่มรายการไม่สำเร็จ', 'error');
        }
    };
  
    const handleDeleteChecklistItem = async (id: string) => {
        try {
            await supabase.from('active_checklist_items').delete().eq('id', id);
            queryClient.setQueryData(['active_checklist_items'], (old: ChecklistItem[] | undefined) => 
                old ? old.filter(i => i.id !== id) : []
            );
        } catch (err) { console.error(err); }
    };
  
    const handleResetChecklist = async () => {
        const confirmed = await showConfirm('รีเซ็ตสถานะเช็คลิสต์ทั้งหมด?', 'ยืนยันการรีเซ็ต');
        
        if (confirmed) {
            queryClient.setQueryData(['active_checklist_items'], (old: ChecklistItem[] | undefined) => 
                old ? old.map(i => ({ ...i, isChecked: false })) : []
            );
            
            try {
                await supabase.from('active_checklist_items').update({ is_checked: false }).neq('id', NIL_UUID); 
                showToast('รีเซ็ตสถานะแล้ว', 'info');
                loadChecklistData();
            } catch (err) { console.error(err); }
        }
    };

    // --- 4. Inventory Logic (Enhanced) ---

    // Updated: Accept assetGroup
    const handleAddInventoryItem = async (name: string, description: string, categoryId: string, imageFile?: File, assetGroup?: string) => {
        try {
            let imageUrl = null;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `inventory-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars') 
                    .upload(`inventory/${fileName}`, imageFile);

                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(`inventory/${fileName}`);
                imageUrl = urlData.publicUrl;
            }

            const { error } = await supabase.from('inventory_items').insert({
                name,
                description,
                category_id: categoryId,
                asset_group: assetGroup || null, // Save Group
                image_url: imageUrl,
                condition: 'GOOD', // Default
                item_type: 'FIXED', // Default for basic add, usually AssetRegistry handles full types
                quantity: 1
            });
            
            if (error) throw error;
            
            await loadChecklistData();
            showToast('เพิ่มเข้าคลังอุปกรณ์แล้ว ✅', 'success');
            return true;
        } catch (err: any) {
            console.error('Add inventory error:', err);
            showToast('เพิ่มเข้าคลังไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const handleUpdateInventoryItem = async (id: string, updates: Partial<InventoryItem>, imageFile?: File) => {
        try {
            let imageUrl = updates.imageUrl;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `inventory-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(`inventory/${fileName}`, imageFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(`inventory/${fileName}`);
                imageUrl = urlData.publicUrl;
            }

            // Map Partial<InventoryItem> to DB payload (snake_case)
            const payload: any = {
                name: updates.name,
                description: updates.description,
                category_id: updates.categoryId,
            };
            if (imageUrl) payload.image_url = imageUrl;
            // Add other fields if needed for future proofing
            if (updates.assetGroup) payload.asset_group = updates.assetGroup;

            const { error } = await supabase.from('inventory_items').update(payload).eq('id', id);
            
            if (error) throw error;
            
            await loadChecklistData();
            showToast('แก้ไขข้อมูลเรียบร้อย ✅', 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const handleDeleteInventoryItem = async (id: string) => {
        const confirmed = await showConfirm('ลบรายการนี้ออกจากคลังถาวร?', 'ยืนยันการลบ');

        if (confirmed) {
            try {
                const { error } = await supabase.from('inventory_items').delete().eq('id', id);
                if (error) throw error;
                
                queryClient.setQueryData(['inventory_items'], (old: InventoryItem[] | undefined) => 
                    old ? old.filter(i => i.id !== id) : []
                );
                showToast('ลบจากคลังแล้ว', 'info');
            } catch (err) { console.error(err); }
        }
    };

    // --- 5. Preset Logic ---
    
    const updateGlobalActivePreset = async (presetId: string | null) => {
        try {
            const { data: existing } = await supabase
                .from('master_options')
                .select('id')
                .eq('type', 'CHECKLIST_CONFIG')
                .eq('key', 'ACTIVE_PRESET_ID')
                .maybeSingle();

            if (existing) {
                await supabase
                    .from('master_options')
                    .update({ label: presetId || '' })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('master_options')
                    .insert({
                        type: 'CHECKLIST_CONFIG',
                        key: 'ACTIVE_PRESET_ID',
                        label: presetId || '',
                        sort_order: 999
                    });
            }
        } catch (err) {
            console.error("Update Global Preset Error:", err);
        }
    };

    const handleLoadPreset = async (presetId: string, clearFirst: boolean = false) => {
        if (presetId === 'CLEAR') {
            queryClient.setQueryData(['active_checklist_items'], []); 
            await supabase.from('active_checklist_items').delete().neq('id', NIL_UUID);
            await updateGlobalActivePreset(null);
            showToast('ล้างกระเป๋าเรียบร้อย', 'warning');
            loadChecklistData();
            return;
        }

        const preset = checklistPresets.find(p => p.id === presetId);
        if(preset) {
            const tempItems: ChecklistItem[] = preset.items.map((i, idx) => ({
                id: `temp-${Date.now()}-${idx}`,
                text: i.text,
                categoryId: i.categoryId,
                isChecked: false
            }));

            if (clearFirst) {
                queryClient.setQueryData(['active_checklist_items'], tempItems); 
            } else {
                queryClient.setQueryData(['active_checklist_items'], (old: ChecklistItem[] | undefined) => 
                    old ? [...old, ...tempItems] : tempItems
                ); 
            }

            try {
                if (clearFirst) {
                    await supabase.from('active_checklist_items').delete().neq('id', NIL_UUID);
                    await updateGlobalActivePreset(presetId);
                }

                const itemsToInsert = preset.items.map(i => ({
                    text: i.text,
                    category_id: i.categoryId,
                    is_checked: false
                }));
                
                if (itemsToInsert.length > 0) {
                    await supabase.from('active_checklist_items').insert(itemsToInsert);
                    showToast(`โหลดชุด "${preset.name}" เรียบร้อย`, 'success');
                    loadChecklistData();
                }
            } catch (err) {
                console.error("Load Preset DB Error", err);
                loadChecklistData();
            }
        }
    };
  
    const handleAddPreset = async (name: string, selectedInventoryIds?: string[]) => {
        try {
            let itemsToSave: { text: string, categoryId: string }[] = [];

            if (selectedInventoryIds && selectedInventoryIds.length > 0) {
                itemsToSave = inventoryItems
                    .filter(i => selectedInventoryIds.includes(i.id))
                    .map(i => ({ text: i.name, categoryId: i.categoryId }));
            } else {
                if (activeChecklistItems.length === 0) {
                    showToast('ไม่มีรายการให้บันทึกครับ', 'warning');
                    return;
                }
                itemsToSave = activeChecklistItems.map(i => ({
                    text: i.text,
                    categoryId: i.categoryId
                }));
            }
            
            const { error } = await supabase.from('checklist_presets_db').insert({
                name,
                items: itemsToSave
            });
            
            if (error) throw error;
            
            loadChecklistData();
            showToast(`บันทึก Preset "${name}" แล้ว`, 'success');
        } catch (err) {
            console.error(err);
            showToast('บันทึก Preset ไม่สำเร็จ', 'error');
        }
    };
    
    const handleUpdatePreset = async (id: string, name: string, items: { text: string; categoryId: string }[]) => {
        try {
            queryClient.setQueryData(['checklist_presets_db'], (old: ChecklistPreset[] | undefined) => 
                old ? old.map(p => p.id === id ? { ...p, name, items } : p) : []
            );

            const { error } = await supabase.from('checklist_presets_db').update({
                name,
                items
            }).eq('id', id);

            if (error) throw error;
            
            loadChecklistData();
            showToast('อัปเดต Preset เรียบร้อย ✅', 'success');
        } catch (err) {
            console.error(err);
            showToast('อัปเดตไม่สำเร็จ', 'error');
            loadChecklistData(); 
        }
    };
  
    const handleDeletePreset = async (id: string) => {
        const confirmed = await showConfirm('ยืนยันลบ Preset นี้?', 'ลบ Preset');

        if(confirmed) {
            try {
                await supabase.from('checklist_presets_db').delete().eq('id', id);
                loadChecklistData();
                showToast('ลบ Preset เรียบร้อย', 'info');
            } catch (err) { console.error(err); }
        }
    };

    return {
        checklistPresets,
        activeChecklistItems,
        inventoryItems,
        activePresetId,
        activePresetName,
        
        loadChecklistData,
        handleToggleChecklist,
        handleAddChecklistItem,
        handleDeleteChecklistItem,
        handleResetChecklist,
        
        handleLoadPreset,
        handleAddPreset,
        handleUpdatePreset,
        handleDeletePreset,

        handleAddInventoryItem,
        handleUpdateInventoryItem,
        handleDeleteInventoryItem
    };
};
