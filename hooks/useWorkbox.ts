import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WorkboxItem } from '../types/features';
import { User } from '../types/core';
import { useToast } from '../context/ToastContext';

export const useWorkbox = (currentUser: User | null) => {
    const [items, setItems] = useState<WorkboxItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchWorkbox = useCallback(async () => {
        if (!currentUser?.id) return;
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('workbox_items')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('order_index', { ascending: true });

            if (error) {
                // ถ้าเป็น Error ว่าหาตารางไม่เจอ ไม่ต้องแจ้ง Toast รัวๆ ให้ Log ไว้พอ
                if (error.code === 'PGRST205') {
                    console.warn('Workbox table not found yet. Please run the SQL script.');
                } else {
                    showToast('ไม่สามารถโหลด WorkBox ได้', 'error');
                }
                throw error;
            }
            setItems(data || []);
        } catch (err: any) {
            console.error('Error fetching workbox:', err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.id, showToast]);

    useEffect(() => {
        fetchWorkbox();

        if (!currentUser?.id) return;

        // Real-time subscription
        const channel = supabase
            .channel(`workbox_user_${currentUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'workbox_items',
                    filter: `user_id=eq.${currentUser.id}`,
                },
                (payload) => {
                    console.log('Workbox Realtime Change:', payload);
                    fetchWorkbox();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Workbox Realtime Subscribed!');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id, fetchWorkbox]);

    const addItem = async (item: Partial<WorkboxItem>) => {
        if (!currentUser?.id) return;
        
        // Optimistic Update
        const tempId = crypto.randomUUID();
        const optimisticItem: WorkboxItem = {
            id: tempId,
            user_id: currentUser.id,
            title: item.title || 'Untitled',
            description: item.description || '',
            type: item.type || 'CHECKLIST',
            content_id: item.content_id,
            is_completed: false,
            order_index: items.length,
            created_at: new Date().toISOString(),
        };

        setItems(prev => [...prev, optimisticItem]);

        try {
            const { error } = await supabase.from('workbox_items').insert([{
                user_id: currentUser.id,
                title: optimisticItem.title,
                description: optimisticItem.description,
                type: optimisticItem.type,
                content_id: optimisticItem.content_id,
                is_completed: false,
                order_index: optimisticItem.order_index,
            }]);
            
            if (error) throw error;
            showToast('เพิ่มเข้า WorkBox แล้ว', 'success');
        } catch (err: any) {
            console.error('Error adding to workbox:', err);
            setItems(prev => prev.filter(i => i.id !== tempId)); // Rollback
            showToast('ไม่สามารถเพิ่มเข้า WorkBox ได้', 'error');
        }
    };

    const updateItem = async (id: string, updates: Partial<WorkboxItem>) => {
        // Optimistic Update
        const previousItems = [...items];
        setItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));

        try {
            const { error } = await supabase
                .from('workbox_items')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        } catch (err: any) {
            console.error('Error updating workbox item:', err);
            setItems(previousItems); // Rollback
            showToast('ไม่สามารถอัปเดตรายการได้', 'error');
        }
    };

    const deleteItem = async (id: string) => {
        // Optimistic Update
        const previousItems = [...items];
        setItems(prev => prev.filter(item => item.id !== id));

        try {
            const { error } = await supabase
                .from('workbox_items')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showToast('ลบออกจาก WorkBox แล้ว', 'success');
        } catch (err: any) {
            console.error('Error deleting workbox item:', err);
            setItems(previousItems); // Rollback
            showToast('ไม่สามารถลบรายการได้', 'error');
        }
    };

    const clearCompleted = async () => {
        if (!currentUser) return;
        try {
            const { error } = await supabase
                .from('workbox_items')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('is_completed', true);
            if (error) throw error;
            showToast('ล้างรายการที่เสร็จแล้ว', 'success');
        } catch (err: any) {
            console.error('Error clearing completed items:', err);
            showToast('ไม่สามารถล้างรายการได้', 'error');
        }
    };

    return {
        items,
        isLoading,
        addItem,
        updateItem,
        deleteItem,
        clearCompleted,
        refresh: fetchWorkbox
    };
};
