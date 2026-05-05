
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { StorageConfig } from '../types';
import { useToast } from './ToastContext';

interface StorageContextType {
    storageConfigs: StorageConfig[];
    isLoading: boolean;
    fetchConfigs: () => Promise<void>;
    saveConfig: (config: Omit<StorageConfig, 'id' | 'updatedAt'> & { id?: string }) => Promise<boolean>;
    deleteConfig: (id: string) => Promise<boolean>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [storageConfigs, setStorageConfigs] = useState<StorageConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchConfigs = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('storage_config')
                .select('*')
                .order('label', { ascending: true });

            if (error) throw error;

            setStorageConfigs(data.map(item => ({
                id: item.id,
                label: item.label,
                currentLetter: item.current_letter,
                description: item.description,
                updatedAt: new Date(item.updated_at)
            })));
        } catch (err) {
            console.error('Fetch storage configs failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveConfig = async (config: Omit<StorageConfig, 'id' | 'updatedAt'> & { id?: string }) => {
        try {
            const payload = {
                label: config.label.toUpperCase().replace(/\s+/g, '_'),
                current_letter: config.currentLetter,
                description: config.description,
                updated_at: new Date().toISOString()
            };

            if (config.id) {
                const { error } = await supabase
                    .from('storage_config')
                    .update(payload)
                    .eq('id', config.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('storage_config')
                    .insert(payload);
                if (error) throw error;
            }

            showToast('บันทึกการตั้งค่าไดรฟ์สำเร็จ ✅', 'success');
            fetchConfigs();
            return true;
        } catch (err: any) {
            console.error('Save storage config failed:', err);
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const deleteConfig = async (id: string) => {
        try {
            const { error } = await supabase
                .from('storage_config')
                .delete()
                .eq('id', id);
            if (error) throw error;

            showToast('ลบการตั้งค่าไดรฟ์แล้ว 🗑️', 'info');
            fetchConfigs();
            return true;
        } catch (err: any) {
            console.error('Delete storage config failed:', err);
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    useEffect(() => {
        fetchConfigs();

        const channel = supabase.channel('storage_config_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'storage_config' }, () => {
                fetchConfigs();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchConfigs]);

    return (
        <StorageContext.Provider value={{ storageConfigs, isLoading, fetchConfigs, saveConfig, deleteConfig }}>
            {children}
        </StorageContext.Provider>
    );
};

export const useStorage = () => {
    const context = useContext(StorageContext);
    if (context === undefined) {
        throw new Error('useStorage must be used within a StorageProvider');
    }
    return context;
};
