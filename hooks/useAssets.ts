
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { InventoryItem, AssetCondition, AssetGroup, InventoryType } from '../types';
import { useToast } from '../context/ToastContext';

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
    const [assets, setAssets] = useState<InventoryItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [globalStats, setGlobalStats] = useState({ totalValue: 0, count: 0, damaged: 0, lost: 0, warrantyAlert: 0 });
    
    // New: Store all unique tags for suggestions
    const [allTags, setAllTags] = useState<string[]>([]);
    
    const { showToast } = useToast();

    // 1. Fetch Global Stats (Separate from paginated list)
    const fetchStats = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('purchase_price, condition, warranty_expire, tags, item_type');

            if (error) throw error;

            if (data) {
                // Filter only FIXED assets for value calculation typically, but keep robust
                const fixedAssets = data.filter(a => a.item_type !== 'CONSUMABLE');
                
                const totalValue = fixedAssets.reduce((sum, a) => sum + (Number(a.purchase_price) || 0), 0);
                const count = fixedAssets.length;
                const damaged = fixedAssets.filter(a => a.condition === 'DAMAGED' || a.condition === 'REPAIR').length;
                const lost = fixedAssets.filter(a => a.condition === 'LOST').length;
                const warrantyAlert = fixedAssets.filter(a => {
                    if (!a.warranty_expire) return false;
                    const diff = new Date(a.warranty_expire).getTime() - new Date().getTime();
                    const days = diff / (1000 * 3600 * 24);
                    return days > 0 && days <= 30;
                }).length;

                setGlobalStats({ totalValue, count, damaged, lost, warrantyAlert });
                
                // Extract Unique Tags for Autocomplete
                const tagsSet = new Set<string>();
                data.forEach((item: any) => {
                    if (Array.isArray(item.tags)) {
                        item.tags.forEach((t: string) => tagsSet.add(t));
                    }
                });
                setAllTags(Array.from(tagsSet).sort());
            }
        } catch (err) {
            console.error("Fetch stats failed", err);
        }
    }, []);

    // 2. Fetch Paginated Assets
    const fetchAssets = useCallback(async (params: FetchParams) => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('inventory_items')
                .select(`
                    *,
                    holder:profiles!inventory_items_current_holder_id_fkey(full_name, avatar_url)
                `, { count: 'exact' });

            // Apply Type Filter (Important for separating tabs)
            if (params.itemType) {
                query = query.eq('item_type', params.itemType);
            }

            // Apply Group Filter
            if (params.group !== 'ALL') {
                query = query.eq('asset_group', params.group);
            }

            // Apply Category Filter
            if (params.categoryId && params.categoryId !== 'ALL') {
                query = query.eq('category_id', params.categoryId);
            }

            // Apply Search
            if (params.search) {
                query = query.or(`name.ilike.%${params.search}%,serial_number.ilike.%${params.search}%`);
            }

            // Apply Tag Filter (New)
            if (params.tag) {
                query = query.contains('tags', [params.tag]);
            }

            // Apply Incomplete Filter
            if (params.showIncomplete) {
                query = query.or('purchase_price.is.null,purchase_price.eq.0,purchase_date.is.null');
            }

            // Pagination logic
            const from = (params.page - 1) * params.pageSize;
            const to = from + params.pageSize - 1;

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (data) {
                setAssets(data.map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    description: i.description,
                    categoryId: i.category_id,
                    imageUrl: i.image_url,
                    
                    itemType: i.item_type || 'FIXED', // Default
                    
                    // Fixed Asset Fields
                    purchasePrice: Number(i.purchase_price || 0),
                    purchaseDate: i.purchase_date ? new Date(i.purchase_date) : undefined,
                    serialNumber: i.serial_number,
                    warrantyExpire: i.warranty_expire ? new Date(i.warranty_expire) : undefined,
                    condition: i.condition as AssetCondition,
                    currentHolderId: i.current_holder_id,
                    assetGroup: i.asset_group as AssetGroup,
                    holder: i.holder ? { name: i.holder.full_name, avatarUrl: i.holder.avatar_url } : undefined,
                    
                    // Consumable Fields
                    quantity: i.quantity || 0,
                    unit: i.unit || 'ชิ้น',
                    minThreshold: i.min_threshold || 0,
                    maxCapacity: i.max_capacity || 0,

                    tags: i.tags || []
                })));
                setTotalCount(count || 0);
            }
        } catch (err) {
            console.error("Fetch assets failed", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial Load & Realtime Sync
    useEffect(() => {
        fetchStats();
        // Subscriptions
        const channel = supabase
            .channel('realtime-assets-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
                fetchStats();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchStats]);

    const saveAsset = async (asset: Partial<InventoryItem>, file?: File) => {
        try {
            let imageUrl = asset.imageUrl;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `asset-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(`inventory/${fileName}`, file);

                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(`inventory/${fileName}`);
                imageUrl = urlData.publicUrl;
            }

            const payload: any = {
                name: asset.name,
                description: asset.description,
                category_id: asset.categoryId,
                image_url: imageUrl,
                item_type: asset.itemType,
                asset_group: asset.assetGroup,
                tags: asset.tags || []
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
            fetchStats(); // Explicit refresh
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
            fetchStats();
            return true;
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    // Clone Function
    const cloneAsset = async (asset: InventoryItem, amount: number) => {
        try {
            // Only Fixed Assets should use Clone in this way usually, but let's allow it
            const copies = Array.from({ length: amount }).map((_, i) => ({
                name: `${asset.name} (Copy ${i+1})`,
                description: asset.description,
                category_id: asset.categoryId,
                image_url: asset.imageUrl,
                item_type: asset.itemType,
                asset_group: asset.assetGroup,
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
            fetchStats();
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
            fetchStats();
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('นำเข้าล้มเหลว: ' + err.message, 'error');
            return false;
        }
    };

    // New: Quick Update Stock
    const updateStock = async (id: string, newQuantity: number) => {
        // Optimistic UI update should be handled by caller, this is just the API call
        try {
            const { error } = await supabase
                .from('inventory_items')
                .update({ quantity: newQuantity })
                .eq('id', id);
            
            if (error) throw error;
            // No toast to avoid spamming
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
        refreshStats: fetchStats
    };
};
