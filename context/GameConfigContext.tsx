
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_GAME_CONFIG } from '../lib/gameLogic';

interface GameConfigContextType {
    config: any;
    isLoading: boolean;
    refreshConfig: () => Promise<void>;
    updateConfigValue: (key: string, value: any) => Promise<boolean>;
    updateConfigsBulk: (configsList: { key: string, value: any }[]) => Promise<boolean>;
}

const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

export const GameConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initial state is the fallback default
    const [config, setConfig] = useState<any>(DEFAULT_GAME_CONFIG);
    const [isLoading, setIsLoading] = useState(true);
    const isSavingRef = useRef(false);

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
            isSavingRef.current = true;
            console.log(`Updating config [${key}] with:`, value);

            // Bidirectional Sync for ATTENDANCE_RULES
            if (key === 'ATTENDANCE_RULES' && value) {
                console.log("🔄 Single update for ATTENDANCE_RULES, syncing to master_option_rules...");
                try {
                    const { data: masterOptions, error: masterOptsError } = await supabase
                        .from('master_options')
                        .select('id, key');

                    if (!masterOptsError && masterOptions) {
                        const rulesPayload = [];
                        for (const [ruleKey, ruleVal] of Object.entries(value)) {
                            const option = masterOptions.find(o => o.key === ruleKey);
                            if (option) {
                                const valObj = ruleVal as any;
                                rulesPayload.push({
                                    master_option_id: option.id,
                                    xp: Number(valObj.xp) || 0,
                                    hp: Number(valObj.hp) || 0,
                                    coins: Number(valObj.coins) || 0,
                                    updated_at: new Date().toISOString()
                                });
                            }
                        }

                        if (rulesPayload.length > 0) {
                            console.log("Upserting master_option_rules for single config update:", rulesPayload);
                            await supabase
                                .from('master_option_rules')
                                .upsert(rulesPayload, { onConflict: 'master_option_id' });
                        }
                    }
                } catch (err) {
                    console.error("Failed to sync rules in single config update:", err);
                }
            }

            const { error } = await supabase
                .from('game_configs')
                .upsert({ 
                    key, 
                    value,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' }); // Explicitly specify conflict column
            
            if (error) {
                console.error(`Supabase error updating ${key}:`, error);
                throw error;
            }
            
            // Optimistic update
            setConfig((prev: any) => ({
                ...prev,
                [key]: value
            }));

            // Wait for 1.5 seconds cooldown to let real-time events settle
            await new Promise(resolve => setTimeout(resolve, 1500));
            return true;
        } catch (err) {
            console.error(`Failed to update config ${key}`, err);
            return false;
        } finally {
            isSavingRef.current = false;
            fetchConfigs();
        }
    };

    const updateConfigsBulk = async (configsList: { key: string, value: any }[]) => {
        try {
            isSavingRef.current = true;
            console.log("🔒 Saving started, realtime bypassed:", configsList);

            // 1. Process Bidirectional Sync first if there's ATTENDANCE_RULES
            const attendanceRulesItem = configsList.find(c => c.key === 'ATTENDANCE_RULES');
            if (attendanceRulesItem && attendanceRulesItem.value) {
                console.log("🔄 ATTENDANCE_RULES found, performing Bidirectional Sync to master_option_rules...");
                try {
                    const { data: masterOptions, error: masterOptsError } = await supabase
                        .from('master_options')
                        .select('id, key');

                    if (masterOptsError) throw masterOptsError;

                    if (masterOptions && masterOptions.length > 0) {
                        const attendanceRules = attendanceRulesItem.value;
                        const rulesPayload = [];

                        for (const [ruleKey, ruleVal] of Object.entries(attendanceRules)) {
                            const option = masterOptions.find(o => o.key === ruleKey);
                            if (option) {
                                const valObj = ruleVal as any;
                                rulesPayload.push({
                                    master_option_id: option.id,
                                    xp: Number(valObj.xp) || 0,
                                    hp: Number(valObj.hp) || 0,
                                    coins: Number(valObj.coins) || 0,
                                    updated_at: new Date().toISOString()
                                });
                            }
                        }

                        if (rulesPayload.length > 0) {
                            console.log("Upserting master_option_rules:", rulesPayload);
                            const { error: rulesError } = await supabase
                                .from('master_option_rules')
                                .upsert(rulesPayload, { onConflict: 'master_option_id' });

                            if (rulesError) {
                                console.error("Error upserting master_option_rules:", rulesError);
                            } else {
                                console.log("✅ master_option_rules upserted successfully");
                            }
                        }
                    }
                } catch (rulesSyncErr) {
                    console.error("Failed to sync master_option_rules:", rulesSyncErr);
                }
            }

            // 2. Perform Bulk Atomic Upsert into game_configs
            const payload = configsList.map(c => ({
                key: c.key,
                value: c.value,
                updated_at: new Date().toISOString()
            }));

            console.log("📦 Bulk atomic upserting game_configs payload:", payload);
            const { error } = await supabase
                .from('game_configs')
                .upsert(payload, { onConflict: 'key' });

            if (error) {
                console.error(`Supabase error bulk updating configs:`, error);
                throw error;
            }

            // 3. Optimistic state update
            setConfig((prev: any) => {
                const next = { ...prev };
                configsList.forEach(c => {
                    next[c.key] = c.value;
                });
                return next;
            });

            console.log("✅ Bulk atomic upsert completed successfully!");

            // 4. Wait for a small cooldown period before unlocking Realtime.
            // This bypasses any delayed realtime notification echoes from our own saves.
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            return true;
        } catch (err) {
            console.error(`Failed to bulk update configs`, err);
            return false;
        } finally {
            isSavingRef.current = false;
            console.log("🔓 Saving finished, realtime unlocked.");
            fetchConfigs();
        }
    };

    useEffect(() => {
        fetchConfigs();

        // Subscribe to changes
        const channel = supabase
            .channel('realtime-game-config')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_configs' }, () => {
                if (!isSavingRef.current) {
                    console.log("Realtime event received: updating configs");
                    fetchConfigs();
                } else {
                    console.log("Realtime event ignored: saving in progress");
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <GameConfigContext.Provider value={{ config, isLoading, refreshConfig: fetchConfigs, updateConfigValue, updateConfigsBulk }}>
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
