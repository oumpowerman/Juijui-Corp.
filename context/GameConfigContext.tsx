
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_GAME_CONFIG } from '../lib/gameLogic';

interface GameConfigContextType {
    config: any;
    isLoading: boolean;
    refreshConfig: () => Promise<void>;
    updateConfigValue: (key: string, value: any) => Promise<boolean>;
}

const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

export const GameConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initial state is the fallback default
    const [config, setConfig] = useState<any>(DEFAULT_GAME_CONFIG);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConfigs = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('game_configs')
                .select('*');

            if (error) {
                console.error("Error fetching game configs:", error);
                // Fallback to default if table doesn't exist or error
                return;
            }

            if (data && data.length > 0) {
                // Transform array [{key: 'A', value: {}}] into object { A: {} }
                const configMap = data.reduce((acc: any, curr: any) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});

                // Merge with default to ensure no missing keys
                setConfig((prev: any) => ({
                    ...prev,
                    ...configMap
                }));
            }
        } catch (err) {
            console.error("Failed to load game config", err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateConfigValue = async (key: string, value: any) => {
        try {
            const { error } = await supabase
                .from('game_configs')
                .upsert({ 
                    key, 
                    value,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
            // Optimistic update
            setConfig((prev: any) => ({
                ...prev,
                [key]: value
            }));
            return true;
        } catch (err) {
            console.error(`Failed to update config ${key}`, err);
            return false;
        }
    };

    useEffect(() => {
        fetchConfigs();

        // Subscribe to changes
        const channel = supabase
            .channel('realtime-game-config')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_configs' }, () => {
                fetchConfigs();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <GameConfigContext.Provider value={{ config, isLoading, refreshConfig: fetchConfigs, updateConfigValue }}>
            {children}
        </GameConfigContext.Provider>
    );
};

export const useGameConfig = () => {
    const context = useContext(GameConfigContext);
    if (!context) {
        throw new Error('useGameConfig must be used within a GameConfigProvider');
    }
    return context;
};
