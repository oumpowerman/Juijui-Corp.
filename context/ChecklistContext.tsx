
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ChecklistItem, ChecklistPreset, InventoryItem } from '../types';
import { useToast } from './ToastContext';
import { useGlobalDialog } from './GlobalDialogContext';
import { useMasterData } from '../hooks/useMasterData';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

interface ChecklistContextType {
    activeChecklistItems: ChecklistItem[];
    checklistPresets: ChecklistPreset[];
    activePresetId: string | null;
    activePresetName: string | null;
    inventoryItems: InventoryItem[];
    isLoading: boolean;
    
    loadChecklistData: () => Promise<void>;
    handleToggleChecklist: (id: string, currentStatus: boolean) => Promise<void>;
    handleAddChecklistItem: (text: string, categoryId: string) => Promise<void>;
    handleDeleteChecklistItem: (id: string) => Promise<void>;
    handleResetChecklist: () => Promise<void>;
    
    handleLoadPreset: (presetId: string, clearFirst?: boolean) => Promise<void>;
    handleAddPreset: (name: string, selectedInventoryIds?: string[]) => Promise<void>;
    handleUpdatePreset: (id: string, name: string, items: { text: string; categoryId: string }[]) => Promise<void>;
    handleDeletePreset: (id: string) => Promise<void>;

    handleAddInventoryItem: (name: string, description: string, categoryId: string, imageFile?: File, assetGroup?: string) => Promise<boolean>;
    handleUpdateInventoryItem: (id: string, updates: Partial<InventoryItem>, imageFile?: File) => Promise<boolean>;
    handleDeleteInventoryItem: (id: string) => Promise<void>;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    const { masterOptions, inventoryItems } = useMasterData();
    const queryClient = useQueryClient();

    const [activeChecklistItems, setActiveChecklistItems] = useState<ChecklistItem[]>([]);
    const [checklistPresets, setChecklistPresets] = useState<ChecklistPreset[]>([]);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const [activePresetName, setActivePresetName] = useState<string | null>(null);

    // 1. React Query for Active Items
    const { data: activeData, isLoading: isActiveLoading, refetch: refetchActive } = useQuery({
        queryKey: ['active_checklist_items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('active_checklist_items')
                .select('*')
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 2. React Query for Presets
    const { data: presetData, isLoading: isPresetsLoading, refetch: refetchPresets } = useQuery({
        queryKey: ['checklist_presets_db'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('checklist_presets_db')
                .select('*')
                .order('name', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5,
    });

    // Sync Query Data to Local State (for backward compatibility)
    useEffect(() => {
        if (activeData) {
            setActiveChecklistItems(activeData.map((i: any) => ({
                id: i.id,
                text: i.text,
                isChecked: i.is_checked,
                categoryId: i.category_id
            })));
        }
    }, [activeData]);

    useEffect(() => {
        if (presetData) {
            setChecklistPresets(presetData.map((p: any) => ({
                id: p.id,
                name: p.name,
                items: p.items || []
            })));
        }
    }, [presetData]);

    const isLoading = isActiveLoading || isPresetsLoading;

    const loadChecklistData = useCallback(async () => {
        await Promise.all([refetchActive(), refetchPresets()]);
    }, [refetchActive, refetchPresets]);

    useEffect(() => {
        const configData = masterOptions.find(o => o.type === 'CHECKLIST_CONFIG' && o.key === 'ACTIVE_PRESET_ID');
        if (configData) {
            const pId = configData.label;
            setActivePresetId(pId);
            const activeP = checklistPresets.find(p => p.id === pId);
            setActivePresetName(activeP ? activeP.name : null);
        } else {
            setActivePresetId(null);
            setActivePresetName(null);
        }
    }, [masterOptions, checklistPresets]);

    const handleToggleChecklist = async (id: string, currentStatus: boolean) => {
        setActiveChecklistItems(prev => prev.map(item => item.id === id ? { ...item, isChecked: !currentStatus } : item));
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
            // Realtime will handle the update
        } catch (err) {
            showToast('เพิ่มรายการไม่สำเร็จ', 'error');
        }
    };

    const handleDeleteChecklistItem = async (id: string) => {
        try {
            await supabase.from('active_checklist_items').delete().eq('id', id);
            // Realtime will handle the update
        } catch (err) { console.error(err); }
    };

    const handleResetChecklist = async () => {
        const confirmed = await showConfirm('รีเซ็ตสถานะเช็คลิสต์ทั้งหมด?', 'ยืนยันการรีเซ็ต');
        if (confirmed) {
            setActiveChecklistItems(prev => prev.map(i => ({ ...i, isChecked: false })));
            try {
                await supabase.from('active_checklist_items').update({ is_checked: false }).neq('id', NIL_UUID); 
                showToast('รีเซ็ตสถานะแล้ว', 'info');
            } catch (err) { console.error(err); }
        }
    };

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
                asset_group: assetGroup || null,
                image_url: imageUrl,
                condition: 'GOOD',
                item_type: 'FIXED',
                quantity: 1
            });
            
            if (error) throw error;
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

            const payload: any = {
                name: updates.name,
                description: updates.description,
                category_id: updates.categoryId,
            };
            if (imageUrl) payload.image_url = imageUrl;
            if (updates.assetGroup) payload.asset_group = updates.assetGroup;

            const { error } = await supabase.from('inventory_items').update(payload).eq('id', id);
            if (error) throw error;
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
                showToast('ลบจากคลังแล้ว', 'info');
            } catch (err) { console.error(err); }
        }
    };

    const updateGlobalActivePreset = async (presetId: string | null) => {
        try {
            const existing = masterOptions.find(o => o.type === 'CHECKLIST_CONFIG' && o.key === 'ACTIVE_PRESET_ID');
            if (existing) {
                await supabase.from('master_options').update({ label: presetId || '' }).eq('id', existing.id);
            } else {
                await supabase.from('master_options').insert({
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
            setActiveChecklistItems([]); 
            await supabase.from('active_checklist_items').delete().neq('id', NIL_UUID);
            await updateGlobalActivePreset(null);
            showToast('ล้างกระเป๋าเรียบร้อย', 'warning');
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
                setActiveChecklistItems(tempItems); 
            } else {
                setActiveChecklistItems(prev => [...prev, ...tempItems]); 
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
                }
            } catch (err) {
                console.error("Load Preset DB Error", err);
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
            showToast(`บันทึก Preset "${name}" แล้ว`, 'success');
        } catch (err) {
            console.error(err);
            showToast('บันทึก Preset ไม่สำเร็จ', 'error');
        }
    };

    const handleUpdatePreset = async (id: string, name: string, items: { text: string; categoryId: string }[]) => {
        try {
            const { error } = await supabase.from('checklist_presets_db').update({
                name,
                items
            }).eq('id', id);
            if (error) throw error;
            showToast('อัปเดต Preset เรียบร้อย ✅', 'success');
        } catch (err) {
            console.error(err);
            showToast('อัปเดตไม่สำเร็จ', 'error');
        }
    };

    const handleDeletePreset = async (id: string) => {
        const confirmed = await showConfirm('ยืนยันลบ Preset นี้?', 'ลบ Preset');
        if(confirmed) {
            try {
                await supabase.from('checklist_presets_db').delete().eq('id', id);
                showToast('ลบ Preset เรียบร้อย', 'info');
            } catch (err) { console.error(err); }
        }
    };

    const value = useMemo(() => ({
        activeChecklistItems,
        checklistPresets,
        activePresetId,
        activePresetName,
        inventoryItems,
        isLoading,
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
    }), [
        activeChecklistItems,
        checklistPresets,
        activePresetId,
        activePresetName,
        isLoading,
        loadChecklistData,
        handleToggleChecklist,
        handleAddChecklistItem,
        handleDeleteChecklistItem,
        handleResetChecklist,
        handleLoadPreset,
        handleAddPreset,
        handleUpdatePreset,
        handleDeletePreset,
        inventoryItems,
        handleAddInventoryItem,
        handleUpdateInventoryItem,
        handleDeleteInventoryItem
    ]);

    return (
        <ChecklistContext.Provider value={value}>
            {children}
        </ChecklistContext.Provider>
    );
};

export const useChecklistContext = () => {
    const context = useContext(ChecklistContext);
    if (context === undefined) {
        throw new Error('useChecklistContext must be used within a ChecklistProvider');
    }
    return context;
};
