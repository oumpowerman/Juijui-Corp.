import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { InventoryItem } from '../../types';
import { useToast } from '../ToastContext';
import { useGlobalDialog } from '../GlobalDialogContext';
import { getOrgStoragePath } from '../../lib/tenantStorage';

export const useChecklistInventoryActions = () => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const handleAddInventoryItem = useCallback(
        async (
            name: string,
            description: string,
            categoryId: string,
            imageFile?: File,
            assetGroup?: string
        ): Promise<boolean> => {
            try {
                let imageUrl: string | null = null;
                if (imageFile) {
                    const fileExt = imageFile.name.split('.').pop();
                    const storagePath = getOrgStoragePath(
                        `inventory/inventory-${Date.now()}.${fileExt}`
                    );
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(storagePath, imageFile);

                    if (uploadError) throw uploadError;
                    const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(storagePath);
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
        },
        [showToast]
    );

    const handleUpdateInventoryItem = useCallback(
        async (
            id: string,
            updates: Partial<InventoryItem>,
            imageFile?: File
        ): Promise<boolean> => {
            try {
                let imageUrl = updates.imageUrl;
                if (imageFile) {
                    const fileExt = imageFile.name.split('.').pop();
                    const storagePath = getOrgStoragePath(
                        `inventory/inventory-${Date.now()}.${fileExt}`
                    );
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(storagePath, imageFile);
                    if (uploadError) throw uploadError;
                    const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(storagePath);
                    imageUrl = urlData.publicUrl;
                }

                const payload: any = {
                    name: updates.name,
                    description: updates.description,
                    category_id: updates.categoryId
                };
                if (imageUrl) payload.image_url = imageUrl;
                if (updates.assetGroup) payload.asset_group = updates.assetGroup;

                const { error } = await supabase
                    .from('inventory_items')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
                showToast('แก้ไขข้อมูลเรียบร้อย ✅', 'success');
                return true;
            } catch (err: any) {
                console.error(err);
                showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
                return false;
            }
        },
        [showToast]
    );

    const handleDeleteInventoryItem = useCallback(
        async (id: string): Promise<void> => {
            const confirmed = await showConfirm('ลบรายการนี้ออกจากคลังถาวร?', 'ยืนยันการลบ');
            if (confirmed) {
                try {
                    const { error } = await supabase
                        .from('inventory_items')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                    showToast('ลบจากคลังแล้ว', 'info');
                } catch (err) {
                    console.error(err);
                }
            }
        },
        [showConfirm, showToast]
    );

    return {
        handleAddInventoryItem,
        handleUpdateInventoryItem,
        handleDeleteInventoryItem
    };
};
