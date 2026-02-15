
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChecklistItem, ChecklistPreset, InventoryItem, AssetCondition, AssetGroup } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext'; 

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export const useChecklist = () => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog(); 
    
    // Data States
    const [activeChecklistItems, setActiveChecklistItems] = useState<ChecklistItem[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [checklistPresets, setChecklistPresets] = useState<ChecklistPreset[]>([]);
    
    // --- 1. Fetching Logic ---
    const loadChecklistData = async () => {
        try {
            // Fetch Active List
            const { data: activeData, error: activeError } = await supabase
                .from('active_checklist_items')
                .select('*')
                .order('created_at', { ascending: true });
            
            if (activeError) console.error("Error fetching active items:", activeError);
            if (activeData) {
                setActiveChecklistItems(activeData.map((i: any) => ({
                    id: i.id,
                    text: i.text,
                    isChecked: i.is_checked,
                    categoryId: i.category_id
                })));
            }

            // Fetch Inventory (Updated to map ALL fields including asset_group and consumables)
            const { data: invData, error: invError } = await supabase
                .from('inventory_items')
                .select('*')
                .order('created_at', { ascending: false }); 
            
            if (invError) console.error("Error fetching inventory:", invError);
            if (invData) {
                setInventoryItems(invData.map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    description: i.description, 
                    categoryId: i.category_id,
                    imageUrl: i.image_url,
                    
                    // Fixed: Map Consumable & New Fields
                    itemType: i.item_type || 'FIXED', 
                    quantity: i.quantity || 0,
                    unit: i.unit,
                    minThreshold: i.min_threshold,
                    maxCapacity: i.max_capacity,
                    tags: i.tags || [],

                    // Asset Registry Fields
                    assetGroup: i.asset_group as AssetGroup,
                    purchasePrice: i.purchase_price,
                    purchaseDate: i.purchase_date ? new Date(i.purchase_date) : undefined,
                    serialNumber: i.serial_number,
                    warrantyExpire: i.warranty_expire ? new Date(i.warranty_expire) : undefined,
                    condition: i.condition as AssetCondition,
                    currentHolderId: i.current_holder_id
                })));
            }

            // Fetch Presets
            const { data: presetData, error: presetError } = await supabase
                .from('checklist_presets_db')
                .select('*')
                .order('name', { ascending: true });

            if (presetError) console.error("Error fetching presets:", presetError);
            if (presetData) {
                setChecklistPresets(presetData.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    items: p.items || []
                })));
            }

        } catch (err) {
            console.error("Load Checklist Data Error:", err);
        }
    };

    // --- 2. Realtime Subscriptions ---
    useEffect(() => {
        loadChecklistData();

        // Subscribe to all changes in these tables
        const channel = supabase
            .channel('checklist-all-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_checklist_items' }, () => loadChecklistData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => loadChecklistData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_presets_db' }, () => loadChecklistData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // --- 3. Active List Logic ---
    
    const handleToggleChecklist = async (id: string, currentStatus: boolean) => {
        // Optimistic UI Update
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
            loadChecklistData();
        } catch (err) {
            showToast('เพิ่มรายการไม่สำเร็จ', 'error');
        }
    };
  
    const handleDeleteChecklistItem = async (id: string) => {
        try {
            await supabase.from('active_checklist_items').delete().eq('id', id);
            setActiveChecklistItems(prev => prev.filter(i => i.id !== id));
        } catch (err) { console.error(err); }
    };
  
    const handleResetChecklist = async () => {
        const confirmed = await showConfirm('รีเซ็ตสถานะเช็คลิสต์ทั้งหมด?', 'ยืนยันการรีเซ็ต');
        
        if (confirmed) {
            setActiveChecklistItems(prev => prev.map(i => ({ ...i, isChecked: false })));
            
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
                
                setInventoryItems(prev => prev.filter(i => i.id !== id));
                showToast('ลบจากคลังแล้ว', 'info');
            } catch (err) { console.error(err); }
        }
    };

    // --- 5. Preset Logic (No Changes needed here) ---
    
    const handleLoadPreset = async (presetId: string, clearFirst: boolean = false) => {
        if (presetId === 'CLEAR') {
            setActiveChecklistItems([]); 
            await supabase.from('active_checklist_items').delete().neq('id', NIL_UUID);
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
                setActiveChecklistItems(tempItems); 
            } else {
                setActiveChecklistItems(prev => [...prev, ...tempItems]); 
            }

            try {
                if (clearFirst) {
                    await supabase.from('active_checklist_items').delete().neq('id', NIL_UUID);
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
            setChecklistPresets(prev => prev.map(p => 
                p.id === id ? { ...p, name, items } : p
            ));

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
