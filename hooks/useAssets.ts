
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { InventoryItem, AssetCondition, AssetGroup } from '../types';
import { useToast } from '../context/ToastContext';

export const useAssets = () => {
    const [assets, setAssets] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchAssets = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventory_items')
                .select(`
                    *,
                    holder:profiles!inventory_items_current_holder_id_fkey(full_name, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setAssets(data.map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    description: i.description,
                    categoryId: i.category_id,
                    imageUrl: i.image_url,
                    purchasePrice: Number(i.purchase_price || 0),
                    purchaseDate: i.purchase_date ? new Date(i.purchase_date) : undefined,
                    serialNumber: i.serial_number,
                    warrantyExpire: i.warranty_expire ? new Date(i.warranty_expire) : undefined,
                    condition: i.condition as AssetCondition,
                    currentHolderId: i.current_holder_id,
                    assetGroup: i.asset_group as AssetGroup,
                    holder: i.holder ? { name: i.holder.full_name, avatarUrl: i.holder.avatar_url } : undefined
                })));
            }
        } catch (err) {
            console.error("Fetch assets failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Realtime Sync
    useEffect(() => {
        fetchAssets();
        const channel = supabase
            .channel('realtime-assets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => fetchAssets())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Create / Update Asset
    const saveAsset = async (asset: Partial<InventoryItem>, file?: File) => {
        try {
            let imageUrl = asset.imageUrl;

            // Handle Image Upload
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `asset-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars') // Reusing existing bucket
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
                purchase_price: asset.purchasePrice,
                purchase_date: asset.purchaseDate ? asset.purchaseDate.toISOString() : null,
                serial_number: asset.serialNumber,
                warranty_expire: asset.warrantyExpire ? asset.warrantyExpire.toISOString() : null,
                condition: asset.condition,
                current_holder_id: asset.currentHolderId || null,
                asset_group: asset.assetGroup
            };

            if (asset.id) {
                await supabase.from('inventory_items').update(payload).eq('id', asset.id);
                showToast('อัปเดตข้อมูลทรัพย์สินแล้ว', 'success');
            } else {
                await supabase.from('inventory_items').insert(payload);
                showToast('เพิ่มทรัพย์สินใหม่สำเร็จ', 'success');
            }
            return true;
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    // Calculate Stats
    const stats = useMemo(() => {
        const totalValue = assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
        const count = assets.length;
        const damaged = assets.filter(a => a.condition === 'DAMAGED' || a.condition === 'REPAIR').length;
        const lost = assets.filter(a => a.condition === 'LOST').length;
        const warrantyAlert = assets.filter(a => {
            if (!a.warrantyExpire) return false;
            const diff = a.warrantyExpire.getTime() - new Date().getTime();
            const days = diff / (1000 * 3600 * 24);
            return days > 0 && days <= 30; // Expiring in 30 days
        }).length;

        return { totalValue, count, damaged, lost, warrantyAlert };
    }, [assets]);

    return {
        assets,
        stats,
        isLoading,
        saveAsset,
        fetchAssets
    };
};
