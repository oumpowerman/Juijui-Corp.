
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { InventoryItem, AssetCondition, AssetGroup, InventoryType } from '../types';
import { useToast } from '../context/ToastContext';
import { useMasterData } from './useMasterData';
import { useUserSession } from '../context/UserSessionContext';

interface FetchParams {
    page: number;
    pageSize: number;
    search: string;
    group: AssetGroup | 'ALL';
    categoryId?: string | 'ALL';
    tag?: string; // New filter
    showIncomplete?: boolean;
    itemType?: InventoryType; // New filter
}

export const useAssets = () => {
    const { inventoryItems } = useMasterData();
    const { allUsers } = useUserSession();
    const { showToast } = useToast();

    const [currentParams, setCurrentParams] = useState<FetchParams | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Compute Global Stats
    const globalStats = useMemo(() => {
        const fixedAssets = inventoryItems.filter(a => a.itemType !== 'CONSUMABLE');
        
        const totalValue = fixedAssets.reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0);
        const count = fixedAssets.length;
        const damaged = fixedAssets.filter(a => a.condition === 'DAMAGED' || a.condition === 'REPAIR').length;
        const lost = fixedAssets.filter(a => a.condition === 'LOST').length;
        const warrantyAlert = fixedAssets.filter(a => {
            if (!a.warrantyExpire) return false;
            const diff = new Date(a.warrantyExpire).getTime() - new Date().getTime();
            const days = diff / (1000 * 3600 * 24);
            return days > 0 && days <= 30;
        }).length;

        return { totalValue, count, damaged, lost, warrantyAlert };
    }, [inventoryItems]);

    // Extract Unique Tags for Autocomplete
    const allTags = useMemo(() => {
        const tagsSet = new Set<string>();
        inventoryItems.forEach(item => {
            if (Array.isArray(item.tags)) {
                item.tags.forEach(t => tagsSet.add(t));
            }
        });
        return Array.from(tagsSet).sort();
    }, [inventoryItems]);

    // 2. Compute Paginated Assets
    const { assets, totalCount } = useMemo(() => {
        if (!currentParams) return { assets: [], totalCount: 0 };

        let filtered = inventoryItems;

        // Apply Type Filter
        if (currentParams.itemType) {
            filtered = filtered.filter(a => a.itemType === currentParams.itemType);
        }

        // Apply Group Filter
        if (currentParams.group !== 'ALL') {
            filtered = filtered.filter(a => a.assetGroup === currentParams.group);
        }

        // Apply Category Filter
        if (currentParams.categoryId && currentParams.categoryId !== 'ALL') {
            filtered = filtered.filter(a => a.categoryId === currentParams.categoryId);
        }

        // Apply Search
        if (currentParams.search) {
            const searchLower = currentParams.search.toLowerCase();
            filtered = filtered.filter(a => 
                (a.name && a.name.toLowerCase().includes(searchLower)) ||
                (a.serialNumber && a.serialNumber.toLowerCase().includes(searchLower)) ||
                ((a as any).groupLabel && (a as any).groupLabel.toLowerCase().includes(searchLower))
            );
        }

        // Apply Tag Filter
        if (currentParams.tag) {
            filtered = filtered.filter(a => a.tags && a.tags.includes(currentParams.tag!));
        }

        // Apply Incomplete Filter
        if (currentParams.showIncomplete) {
            filtered = filtered.filter(a => !a.purchasePrice || a.purchasePrice === 0 || !a.purchaseDate);
        }

        // Sort by created_at descending (assuming id or similar if created_at is not available, but we'll just reverse for now as new items are usually at the end, or we can sort by id)
        // MasterDataContext doesn't fetch created_at currently, but we can assume the order from DB is somewhat chronological or we can sort by id.
        // Let's sort by id descending as a proxy for created_at if created_at is missing.
        filtered = [...filtered].sort((a, b) => (b as any).id > (a as any).id ? 1 : -1);

        const totalCount = filtered.length;

        // Pagination logic
        const from = (currentParams.page - 1) * currentParams.pageSize;
        const to = from + currentParams.pageSize;
        const paginated = filtered.slice(from, to);

        // Join with holder
        const populatedAssets = paginated.map(item => {
            const holderProfile = item.currentHolderId ? allUsers.find(u => u.id === item.currentHolderId) : undefined;
            return {
                ...item,
                holder: holderProfile ? { name: holderProfile.name, avatarUrl: holderProfile.avatarUrl } : undefined
            };
        });

        return { assets: populatedAssets, totalCount };
    }, [inventoryItems, currentParams, allUsers]);

    const fetchAssets = useCallback(async (params: FetchParams) => {
        setIsLoading(true);
        setCurrentParams(params);
        // Simulate a tiny delay to allow UI to show loading state if needed, though it's synchronous now
        setTimeout(() => setIsLoading(false), 50);
    }, []);

    const fetchStats = useCallback(async () => {
        // No-op, stats are computed automatically
    }, []);

    const saveAsset = async (asset: Partial<InventoryItem>, file?: File, driveOptions?: { isDriveReady: boolean, uploadFileToDrive: (file: File, path: string[]) => Promise<any> }) => {
        try {
            let imageUrl = asset.imageUrl;

            if (file) {
                let uploaded = false;

                // Try Google Drive first if available
                if (driveOptions?.isDriveReady) {
                    try {
                        const result = await driveOptions.uploadFileToDrive(file, ['Assets', asset.assetGroup || 'General']);
                        imageUrl = result.thumbnailUrl || result.url;
                        if (imageUrl) {
                            uploaded = true;
                            showToast('บันทึกลง Google Drive สำเร็จ ✅', 'success');
                        }
                    } catch (driveErr) {
                        console.error("Drive Upload Error:", driveErr);
                        // Fallback will happen below
                    }
                }

                // Fallback to Supabase Storage
                if (!uploaded) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `asset-${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(`inventory/${fileName}`, file);

                    if (uploadError) throw uploadError;
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(`inventory/${fileName}`);
                    imageUrl = urlData.publicUrl;
                    if (driveOptions?.isDriveReady) {
                        showToast('บันทึกผ่านระบบสำรอง (Supabase) เรียบร้อย', 'info');
                    }
                }
            }

            const payload: any = {
                name: asset.name,
                description: asset.description,
                category_id: asset.categoryId,
                image_url: imageUrl,
                item_type: asset.itemType,
                asset_group: asset.assetGroup,
                tags: asset.tags || [],
                group_label: (asset as any).groupLabel || null // Save group_label
            };

            // Conditionally add fields based on Type
            if (asset.itemType === 'CONSUMABLE') {
                payload.quantity = asset.quantity;
                payload.unit = asset.unit;
                payload.min_threshold = asset.minThreshold;
                payload.max_capacity = asset.maxCapacity;
            } else {
                payload.purchase_price = asset.purchasePrice;
                payload.purchase_date = asset.purchaseDate ? asset.purchaseDate.toISOString() : null;
                payload.serial_number = asset.serialNumber;
                payload.warranty_expire = asset.warrantyExpire ? asset.warrantyExpire.toISOString() : null;
                payload.condition = asset.condition;
                payload.current_holder_id = asset.currentHolderId || null;
            }

            if (asset.id) {
                await supabase.from('inventory_items').update(payload).eq('id', asset.id);
                showToast('อัปเดตข้อมูลเรียบร้อย', 'success');
            } else {
                await supabase.from('inventory_items').insert(payload);
                showToast('เพิ่มรายการใหม่สำเร็จ', 'success');
            }
            return true;
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const deleteAsset = async (id: string) => {
        try {
            const { error } = await supabase.from('inventory_items').delete().eq('id', id);
            if (error) throw error;
            
            showToast('ลบข้อมูลเรียบร้อย', 'info');
            return true;
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    // New: Batch Update for Grouping
    const batchGroupAssets = async (ids: string[], groupLabel: string) => {
        try {
            const { error } = await supabase
                .from('inventory_items')
                .update({ group_label: groupLabel })
                .in('id', ids);

            if (error) throw error;
            
            showToast(`รวมกลุ่ม ${ids.length} รายการเรียบร้อย ✅`, 'success');
            return true;
        } catch (err: any) {
             showToast('รวมกลุ่มไม่สำเร็จ: ' + err.message, 'error');
             return false;
        }
    };
    
    // New: Batch Ungroup
    const batchUngroupAssets = async (ids: string[]) => {
         try {
            const { error } = await supabase
                .from('inventory_items')
                .update({ group_label: null })
                .in('id', ids);

            if (error) throw error;
            showToast(`ยกเลิกกลุ่ม ${ids.length} รายการแล้ว`, 'info');
            return true;
        } catch (err: any) {
             showToast('ยกเลิกไม่สำเร็จ: ' + err.message, 'error');
             return false;
        }
    };

    // Clone Function
    const cloneAsset = async (asset: InventoryItem, amount: number) => {
        try {
            // Only Fixed Assets should use Clone in this way usually, but let's allow it
            const copies = Array.from({ length: amount }).map((_, i) => ({
                name: asset.name, // Use same name for easier grouping, or append Copy
                description: asset.description,
                category_id: asset.categoryId,
                image_url: asset.imageUrl,
                item_type: asset.itemType,
                asset_group: asset.assetGroup,
                group_label: (asset as any).groupLabel || asset.name, // If no group label, use name as group
                tags: asset.tags || [],
                
                // Copy conditional fields
                ...(asset.itemType === 'CONSUMABLE' ? {
                    quantity: 0, // Reset qty for new entry
                    unit: asset.unit,
                    min_threshold: asset.minThreshold,
                    max_capacity: asset.maxCapacity
                } : {
                    purchase_price: asset.purchasePrice,
                    purchase_date: asset.purchaseDate ? asset.purchaseDate.toISOString() : null,
                    serial_number: '', 
                    warranty_expire: asset.warrantyExpire ? asset.warrantyExpire.toISOString() : null,
                    condition: 'GOOD',
                })
            }));

            const { error } = await supabase.from('inventory_items').insert(copies);
            if (error) throw error;
            
            showToast(`Clone ทรัพย์สินเพิ่ม ${amount} รายการแล้ว`, 'success');
            return true;
        } catch (err: any) {
            showToast('Clone ไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    // Import from CSV
    const importAssets = async (items: any[]) => {
        try {
            const payload = items.map(item => ({
                name: item.name,
                description: item.description,
                category_id: item.categoryId || 'GENERAL',
                asset_group: item.assetGroup || 'OFFICE',
                condition: 'GOOD',
                purchase_price: 0,
                item_type: 'FIXED', // Default to Fixed for import simplicity unless sophisticated
                quantity: 1,
                tags: [] 
            }));

            const { error } = await supabase.from('inventory_items').insert(payload);
            if (error) throw error;

            showToast(`นำเข้าข้อมูล ${items.length} รายการสำเร็จ!`, 'success');
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('นำเข้าล้มเหลว: ' + err.message, 'error');
            return false;
        }
    };

    // New: Quick Update Stock
    const updateStock = async (id: string, newQuantity: number) => {
        try {
            const { error } = await supabase
                .from('inventory_items')
                .update({ quantity: newQuantity })
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (err: any) {
            showToast('อัปเดตสต็อคไม่สำเร็จ', 'error');
            return false;
        }
    };

    return {
        assets,
        totalCount,
        stats: globalStats,
        allTags,
        isLoading,
        saveAsset,
        deleteAsset,
        cloneAsset,
        importAssets,
        fetchAssets,
        updateStock,
        batchGroupAssets, // Export
        batchUngroupAssets, // Export
        refreshStats: fetchStats
    };
};
