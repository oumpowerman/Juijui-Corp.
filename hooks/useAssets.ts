
import { useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { InventoryItem, AssetCondition, AssetGroup, InventoryType } from '../types';
import { useToast } from '../context/ToastContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface FetchParams {
    page: number;
    pageSize: number;
    search: string;
    group: AssetGroup | 'ALL';
    categoryId?: string | 'ALL';
    tag?: string;
    showIncomplete?: boolean;
    itemType?: InventoryType;
}

export const useAssets = (params?: FetchParams) => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // 1. Fetch Global Stats
    const { data: globalStats = { totalValue: 0, count: 0, damaged: 0, lost: 0, warrantyAlert: 0, allTags: [] as string[] } } = useQuery({
        queryKey: ['inventory_stats'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('purchase_price, condition, warranty_expire, tags, item_type');

            if (error) throw error;

            if (data) {
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

                const tagsSet = new Set<string>();
                data.forEach((item: any) => {
                    if (Array.isArray(item.tags)) {
                        item.tags.forEach((t: string) => tagsSet.add(t));
                    }
                });

                return {
                    totalValue,
                    count,
                    damaged,
                    lost,
                    warrantyAlert,
                    allTags: Array.from(tagsSet).sort()
                };
            }
            return { totalValue: 0, count: 0, damaged: 0, lost: 0, warrantyAlert: 0, allTags: [] };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 2. Fetch Paginated Assets
    const { data: assetsData, isLoading, refetch: fetchAssets } = useQuery({
        queryKey: ['inventory_items', params],
        queryFn: async () => {
            if (!params) return { assets: [], totalCount: 0 };

            let query = supabase
                .from('inventory_items')
                .select(`
                    id, name, description, category_id, image_url, item_type, group_label,
                    purchase_price, purchase_date, serial_number, warranty_expire, condition,
                    current_holder_id, asset_group, quantity, unit, min_threshold, max_capacity,
                    tags, created_at,
                    holder:profiles!inventory_items_current_holder_id_fkey(full_name, avatar_url)
                `, { count: 'exact' });

            if (params.itemType) query = query.eq('item_type', params.itemType);
            if (params.group !== 'ALL') query = query.eq('asset_group', params.group);
            if (params.categoryId && params.categoryId !== 'ALL') query = query.eq('category_id', params.categoryId);
            if (params.search) query = query.or(`name.ilike.%${params.search}%,serial_number.ilike.%${params.search}%,group_label.ilike.%${params.search}%`);
            if (params.tag) query = query.contains('tags', [params.tag]);
            if (params.showIncomplete) query = query.or('purchase_price.is.null,purchase_price.eq.0,purchase_date.is.null');

            const from = (params.page - 1) * params.pageSize;
            const to = from + params.pageSize - 1;

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const mappedAssets = (data || []).map((i: any) => ({
                id: i.id,
                name: i.name,
                description: i.description,
                categoryId: i.category_id,
                imageUrl: i.image_url,
                itemType: i.item_type || 'FIXED',
                groupLabel: i.group_label,
                purchasePrice: Number(i.purchase_price || 0),
                purchaseDate: i.purchase_date ? new Date(i.purchase_date) : undefined,
                serialNumber: i.serial_number,
                warrantyExpire: i.warranty_expire ? new Date(i.warranty_expire) : undefined,
                condition: i.condition as AssetCondition,
                currentHolderId: i.current_holder_id,
                assetGroup: i.asset_group as AssetGroup,
                holder: i.holder ? { name: i.holder.full_name, avatarUrl: i.holder.avatar_url } : undefined,
                quantity: i.quantity || 0,
                unit: i.unit || 'ชิ้น',
                minThreshold: i.min_threshold || 0,
                maxCapacity: i.max_capacity || 0,
                tags: i.tags || [],
                createdAt: i.created_at ? new Date(i.created_at) : undefined
            }));

            return { assets: mappedAssets, totalCount: count || 0 };
        },
        enabled: !!params,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const assets = assetsData?.assets || [];
    const totalCount = assetsData?.totalCount || 0;

    const saveAsset = async (asset: Partial<InventoryItem>, file?: File, driveOptions?: { isDriveReady: boolean, uploadFileToDrive: (file: File, path: string[]) => Promise<any> }) => {
        try {
            let imageUrl = asset.imageUrl;

            if (file) {
                let uploaded = false;
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
                    }
                }

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
                group_label: asset.groupLabel || null
            };

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
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
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
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
            return true;
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const batchGroupAssets = async (ids: string[], groupLabel: string) => {
        try {
            const { error } = await supabase
                .from('inventory_items')
                .update({ group_label: groupLabel })
                .in('id', ids);

            if (error) throw error;
            showToast(`รวมกลุ่ม ${ids.length} รายการเรียบร้อย ✅`, 'success');
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            return true;
        } catch (err: any) {
             showToast('รวมกลุ่มไม่สำเร็จ: ' + err.message, 'error');
             return false;
        }
    };
    
    const batchUngroupAssets = async (ids: string[]) => {
         try {
            const { error } = await supabase
                .from('inventory_items')
                .update({ group_label: null })
                .in('id', ids);

            if (error) throw error;
            showToast(`ยกเลิกกลุ่ม ${ids.length} รายการแล้ว`, 'info');
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            return true;
        } catch (err: any) {
             showToast('ยกเลิกไม่สำเร็จ: ' + err.message, 'error');
             return false;
        }
    };

    const cloneAsset = async (asset: InventoryItem, amount: number) => {
        try {
            const copies = Array.from({ length: amount }).map((_, i) => ({
                name: asset.name,
                description: asset.description,
                category_id: asset.categoryId,
                image_url: asset.imageUrl,
                item_type: asset.itemType,
                asset_group: asset.assetGroup,
                group_label: asset.groupLabel || asset.name,
                tags: asset.tags || [],
                ...(asset.itemType === 'CONSUMABLE' ? {
                    quantity: 0,
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
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
            return true;
        } catch (err: any) {
            showToast('Clone ไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const importAssets = async (items: any[]) => {
        try {
            const payload = items.map(item => ({
                name: item.name,
                description: item.description,
                category_id: item.categoryId || 'GENERAL',
                asset_group: item.assetGroup || 'OFFICE',
                condition: 'GOOD',
                purchase_price: 0,
                item_type: 'FIXED',
                quantity: 1,
                tags: [] 
            }));

            const { error } = await supabase.from('inventory_items').insert(payload);
            if (error) throw error;

            showToast(`นำเข้าข้อมูล ${items.length} รายการสำเร็จ!`, 'success');
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
            return true;
        } catch (err: any) {
            console.error(err);
            showToast('นำเข้าล้มเหลว: ' + err.message, 'error');
            return false;
        }
    };

    const updateStock = async (id: string, newQuantity: number) => {
        try {
            const { error } = await supabase
                .from('inventory_items')
                .update({ quantity: newQuantity })
                .eq('id', id);
            
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
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
        allTags: globalStats.allTags,
        isLoading,
        saveAsset,
        deleteAsset,
        cloneAsset,
        importAssets,
        fetchAssets,
        updateStock,
        batchGroupAssets,
        batchUngroupAssets,
        refreshStats: () => queryClient.invalidateQueries({ queryKey: ['inventory_stats'] })
    };
};
