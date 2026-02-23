import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WorkboxItem } from '../types/features';
import { User } from '../types/core';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

interface WorkboxContextType {
    items: WorkboxItem[];
    isLoading: boolean;
    isDragging: boolean;
    setIsDragging: (value: boolean) => void;
    addItem: (item: Partial<WorkboxItem>) => Promise<void>;
    updateItem: (id: string, updates: Partial<WorkboxItem>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    clearCompleted: () => Promise<void>;
    refresh: () => Promise<void>;
}

const WorkboxContext = createContext<WorkboxContextType | undefined>(undefined);

export const WorkboxProvider: React.FC<{ children: React.ReactNode; currentUser: User | null }> = ({ children, currentUser }) => {
    const [items, setItems] = useState<WorkboxItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const { showToast } = useToast();

    const fetchWorkbox = useCallback(async () => {
        if (!currentUser?.id) {
            setItems([]);
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('workbox_items')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('order_index', { ascending: true });

            if (error) {
                if (error.code !== 'PGRST205') {
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

        const channel = supabase
            .channel(`workbox_global_${currentUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'workbox_items',
                    filter: `user_id=eq.${currentUser.id}`,
                },
                () => fetchWorkbox()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id, fetchWorkbox]);

    const addItem = async (item: Partial<WorkboxItem>) => {
        if (!currentUser?.id) return;
        
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
            progress: 0,
            notes: '',
            meta: {}
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
                progress: 0,
                notes: '',
                meta: {}
            }]);
            
            if (error) throw error;
        } catch (err: any) {
            console.error('Error adding to workbox:', err);
            setItems(prev => prev.filter(i => i.id !== tempId));
            showToast('ไม่สามารถเพิ่มเข้า WorkBox ได้', 'error');
        }
    };

    const updateItem = async (id: string, updates: Partial<WorkboxItem>) => {
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
            setItems(previousItems);
            showToast('ไม่สามารถอัปเดตรายการได้', 'error');
        }
    };

    const deleteItem = async (id: string) => {
        const previousItems = [...items];
        setItems(prev => prev.filter(item => item.id !== id));

        try {
            const { error } = await supabase
                .from('workbox_items')
                .delete()
                .eq('id', id);
            if (error) throw error;
        } catch (err: any) {
            setItems(previousItems);
            showToast('ไม่สามารถลบรายการได้', 'error');
        }
    };

    const clearCompleted = async () => {
        if (!currentUser?.id) return;
        try {
            const { error } = await supabase
                .from('workbox_items')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('is_completed', true);
            if (error) throw error;
            fetchWorkbox();
        } catch (err: any) {
            showToast('ไม่สามารถล้างรายการได้', 'error');
        }
    };

    return (
        <WorkboxContext.Provider value={{ 
            items, 
            isLoading, 
            isDragging, 
            setIsDragging, 
            addItem, 
            updateItem, 
            deleteItem, 
            clearCompleted, 
            refresh: fetchWorkbox 
        }}>
            {children}
        </WorkboxContext.Provider>
    );
};

export const useWorkboxContext = () => {
    const context = useContext(WorkboxContext);
    if (context === undefined) {
        throw new Error('useWorkboxContext must be used within a WorkboxProvider');
    }
    return context;
};
