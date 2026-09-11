import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { updateSystemVersion } from './masterVersionSync';

export const CACHE_KEY_INVENTORY = 'inventory_items_cache';
export const CACHE_KEY_INVENTORY_VERSION = 'inventory_version_cache';

export const mapInventoryItem = (i: any) => ({
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
    assetGroup: i.asset_group,
    purchasePrice: i.purchase_price,
    purchaseDate: i.purchase_date ? new Date(i.purchase_date) : undefined,
    serialNumber: i.serial_number,
    warrantyExpire: i.warranty_expire ? new Date(i.warranty_expire) : undefined,
    condition: i.condition,
    currentHolderId: i.current_holder_id,
    groupLabel: i.group_label,
    createdAt: i.created_at ? new Date(i.created_at) : undefined
});

export const useInventoryDomain = () => {
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const isMutatingInventoryCache = useRef(false);

    const updateInventoryLocalCache = useCallback(async (
        action: 'ADD' | 'UPDATE' | 'DELETE' | 'BATCH_UPDATE', 
        payload: any, 
        skipVersionUpdate: boolean = false
    ) => {
        isMutatingInventoryCache.current = true;
        try {
            const cachedInventory = localStorage.getItem(CACHE_KEY_INVENTORY);
            let rawInventory = cachedInventory ? JSON.parse(cachedInventory) : [];
            
            if (action === 'ADD') {
                if (Array.isArray(payload)) {
                    payload.forEach(item => {
                        if (!rawInventory.some((i: any) => i.id === item.id)) {
                            rawInventory.push(item);
                        }
                    });
                } else {
                    if (!rawInventory.some((i: any) => i.id === payload.id)) {
                        rawInventory.push(payload);
                    }
                }
            } else if (action === 'UPDATE') {
                const index = rawInventory.findIndex((i: any) => i.id === payload.id);
                if (index > -1) rawInventory[index] = { ...rawInventory[index], ...payload };
            } else if (action === 'DELETE') {
                rawInventory = rawInventory.filter((i: any) => i.id !== payload);
            } else if (action === 'BATCH_UPDATE') {
                const { ids, data } = payload;
                rawInventory = rawInventory.map((i: any) => 
                    ids.includes(i.id) ? { ...i, ...data } : i
                );
            }
            
            rawInventory.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
            localStorage.setItem(CACHE_KEY_INVENTORY, JSON.stringify(rawInventory));
            setInventoryItems(rawInventory.map(mapInventoryItem));

            if (!skipVersionUpdate) {
                const newVersion = await updateSystemVersion('inventory_version');
                if (newVersion) {
                    localStorage.setItem(CACHE_KEY_INVENTORY_VERSION, newVersion);
                }
            }
        } catch (e) {
            console.error('Error updating local inventory cache:', e);
        } finally {
            setTimeout(() => {
                isMutatingInventoryCache.current = false;
            }, 1000);
        }
    }, []);

    const loadInventoryFromCacheOrRemote = useCallback(async (currentInventoryVersion?: string) => {
        const cachedInventory = localStorage.getItem(CACHE_KEY_INVENTORY);
        const cachedInventoryVersion = localStorage.getItem(CACHE_KEY_INVENTORY_VERSION);
        let inventoryData = null;
        let useCache = false;

        if (isMutatingInventoryCache.current) {
            useCache = true;
            inventoryData = JSON.parse(localStorage.getItem(CACHE_KEY_INVENTORY) || '[]');
            console.log('🚀 Master Data: Using cached inventory (Mutation in progress)');
        } else if (cachedInventory && cachedInventoryVersion && currentInventoryVersion && cachedInventoryVersion === currentInventoryVersion) {
            try {
                inventoryData = JSON.parse(cachedInventory);
                useCache = true;
                console.log('🚀 Master Data: Using cached inventory', currentInventoryVersion);
            } catch (e) {
                console.warn('⚠️ Master Data: Inventory Cache corrupted');
            }
        }

        if (!useCache) {
            console.log('📡 Master Data: Fetching inventory_items...');
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) throw error;
            inventoryData = data;

            if (data && currentInventoryVersion) {
                localStorage.setItem(CACHE_KEY_INVENTORY, JSON.stringify(data));
                localStorage.setItem(CACHE_KEY_INVENTORY_VERSION, currentInventoryVersion);
            }
        }

        if (inventoryData) {
            setInventoryItems(inventoryData.map(mapInventoryItem));
        }
    }, []);

    const addInventoryItem = useCallback(async (item: any): Promise<boolean> => {
        try {
            const { data, error } = await supabase.from('inventory_items').insert(item).select();
            if (error) throw error;
            await updateInventoryLocalCache('ADD', data);
            return true;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    }, [updateInventoryLocalCache]);

    const updateInventoryItem = useCallback(async (item: any): Promise<boolean> => {
        try {
            const { id, ...payload } = item;
            const { data, error } = await supabase.from('inventory_items').update(payload).eq('id', id).select().single();
            if (error) throw error;
            await updateInventoryLocalCache('UPDATE', data);
            return true;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    }, [updateInventoryLocalCache]);

    const deleteInventoryItem = useCallback(async (id: string): Promise<boolean> => {
        try {
            const { error } = await supabase.from('inventory_items').delete().eq('id', id);
            if (error) throw error;
            await updateInventoryLocalCache('DELETE', id);
            return true;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    }, [updateInventoryLocalCache]);

    const batchUpdateInventoryItems = useCallback(async (ids: string[], payload: any): Promise<boolean> => {
        try {
            const { error } = await supabase.from('inventory_items').update(payload).in('id', ids);
            if (error) throw error;
            await updateInventoryLocalCache('BATCH_UPDATE', { ids, data: payload });
            return true;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    }, [updateInventoryLocalCache]);

    const updateInventoryStock = useCallback(async (id: string, newQuantity: number): Promise<boolean> => {
        try {
            const { data, error } = await supabase.from('inventory_items').update({ quantity: newQuantity }).eq('id', id).select().single();
            if (error) throw error;
            await updateInventoryLocalCache('UPDATE', data);
            return true;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    }, [updateInventoryLocalCache]);

    return {
        inventoryItems,
        setInventoryItems,
        isMutatingInventoryCache,
        updateInventoryLocalCache,
        loadInventoryFromCacheOrRemote,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        batchUpdateInventoryItems,
        updateInventoryStock
    };
};
