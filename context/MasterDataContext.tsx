import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { MasterDataContextType } from './master/types';
import { checkAndHealVersions } from './master/masterVersionSync';
import { useMasterOptionsDomain, CACHE_KEY_VERSION } from './master/useMasterOptionsDomain';
import { useChannelsDomain, CACHE_KEY_CHANNELS_VERSION, mapChannel } from './master/useChannelsDomain';
import { useInventoryDomain, CACHE_KEY_INVENTORY_VERSION, mapInventoryItem } from './master/useInventoryDomain';
import { useCalendarMasterDomain } from './master/useCalendarMasterDomain';

export type { MasterDataContextType };
export { mapChannel, mapInventoryItem };

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export const MasterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);

    // 1. Initialize Domain Hooks
    const masterOptionsDomain = useMasterOptionsDomain();
    const channelsDomain = useChannelsDomain();
    const inventoryDomain = useInventoryDomain();
    const calendarDomain = useCalendarMasterDomain();

    // 2. Centralized Master Data Orchestrator
    const fetchAllMasterData = useCallback(async () => {
        try {
            const versions = await checkAndHealVersions([
                'master_options_version', 
                'inventory_version', 
                'channels_version'
            ]);

            await Promise.all([
                masterOptionsDomain.loadOptionsFromCacheOrRemote(versions.master_options_version),
                inventoryDomain.loadInventoryFromCacheOrRemote(versions.inventory_version),
                channelsDomain.loadChannelsFromCacheOrRemote(versions.channels_version),
                calendarDomain.loadCalendarData()
            ]);
        } catch (err: any) {
            console.error('Fetch all master data failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, [
        masterOptionsDomain.loadOptionsFromCacheOrRemote,
        inventoryDomain.loadInventoryFromCacheOrRemote,
        channelsDomain.loadChannelsFromCacheOrRemote,
        calendarDomain.loadCalendarData
    ]);

    const seedDefaults = useCallback(async () => {
        await masterOptionsDomain.seedDefaults(fetchAllMasterData);
    }, [masterOptionsDomain.seedDefaults, fetchAllMasterData]);

    // 3. Centralized Realtime Listeners
    useEffect(() => {
        const metadataChannel = supabase.channel('system-metadata-changes')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'system_metadata' 
            }, (payload) => {
                const updatedKey = payload.new.key;
                const remoteVersion = payload.new.last_updated_at;

                if (updatedKey === 'master_options_version') {
                    if (localStorage.getItem(CACHE_KEY_VERSION) !== remoteVersion) {
                        setTimeout(() => {
                            if (localStorage.getItem(CACHE_KEY_VERSION) !== remoteVersion) {
                                console.log('🔄 Master Data: Options Delta missed, healing with full fetch...');
                                fetchAllMasterData();
                            }
                        }, 2000);
                    }
                } else if (updatedKey === 'inventory_version') {
                    if (localStorage.getItem(CACHE_KEY_INVENTORY_VERSION) !== remoteVersion) {
                        setTimeout(() => {
                            if (localStorage.getItem(CACHE_KEY_INVENTORY_VERSION) !== remoteVersion) {
                                console.log('🔄 Master Data: Inventory Delta missed, healing with full fetch...');
                                fetchAllMasterData();
                            }
                        }, 2000);
                    }
                } else if (updatedKey === 'channels_version') {
                    if (localStorage.getItem(CACHE_KEY_CHANNELS_VERSION) !== remoteVersion) {
                        setTimeout(() => {
                            if (localStorage.getItem(CACHE_KEY_CHANNELS_VERSION) !== remoteVersion) {
                                console.log('🔄 Master Data: Channels Delta missed, healing with full fetch...');
                                fetchAllMasterData();
                            }
                        }, 2000);
                    }
                }
            }).subscribe();

        const holidaysChannel = supabase.channel('global-annual-holidays')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'annual_holidays' }, () => {
                calendarDomain.loadCalendarData();
            }).subscribe();

        const exceptionsChannel = supabase.channel('global-calendar-exceptions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_exceptions' }, () => {
                calendarDomain.loadCalendarData();
            }).subscribe();

        const optionsChannel = supabase.channel('global-master-options')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'master_options' }, (payload) => {
                if (!masterOptionsDomain.isMutatingOptionsCache.current) {
                    console.log(`🔄 Master Data: Remote options ${payload.eventType} detected, syncing delta...`);
                    if (payload.eventType === 'DELETE') {
                        masterOptionsDomain.updateOptionsLocalCache('DELETE', payload.old.id, true);
                    } else {
                        masterOptionsDomain.updateOptionsLocalCache(payload.eventType === 'INSERT' ? 'ADD' : 'UPDATE', payload.new, true);
                    }
                }
            }).subscribe();

        const inventoryChannel = supabase.channel('global-inventory-items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, (payload) => {
                if (!inventoryDomain.isMutatingInventoryCache.current) {
                    console.log(`🔄 Master Data: Remote inventory ${payload.eventType} detected, syncing delta...`);
                    if (payload.eventType === 'DELETE') {
                        inventoryDomain.updateInventoryLocalCache('DELETE', payload.old.id, true);
                    } else {
                        inventoryDomain.updateInventoryLocalCache(payload.eventType === 'INSERT' ? 'ADD' : 'UPDATE', payload.new, true);
                    }
                }
            }).subscribe();

        const channelsChannel = supabase.channel('global-channels')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, (payload) => {
                if (!channelsDomain.isMutatingChannelsCache.current) {
                    console.log(`🔄 Master Data: Remote channels ${payload.eventType} detected, syncing delta...`);
                    if (payload.eventType === 'DELETE') {
                        channelsDomain.updateChannelsLocalCache('DELETE', payload.old.id, true);
                    } else {
                        channelsDomain.updateChannelsLocalCache(payload.eventType === 'INSERT' ? 'ADD' : 'UPDATE', payload.new, true);
                    }
                }
            }).subscribe();

        return () => {
            supabase.removeChannel(metadataChannel);
            supabase.removeChannel(holidaysChannel);
            supabase.removeChannel(exceptionsChannel);
            supabase.removeChannel(optionsChannel);
            supabase.removeChannel(inventoryChannel);
            supabase.removeChannel(channelsChannel);
        };
    }, [
        fetchAllMasterData,
        calendarDomain.loadCalendarData,
        masterOptionsDomain.updateOptionsLocalCache,
        inventoryDomain.updateInventoryLocalCache,
        channelsDomain.updateChannelsLocalCache
    ]);

    // 4. Compose Combined Context Value
    const value = useMemo<MasterDataContextType>(() => ({
        masterOptions: masterOptionsDomain.options,
        annualHolidays: calendarDomain.annualHolidays,
        calendarExceptions: calendarDomain.calendarExceptions,
        inventoryItems: inventoryDomain.inventoryItems,
        channels: channelsDomain.channels,
        isLoading,
        fetchMasterOptions: fetchAllMasterData,
        fetchChannels: fetchAllMasterData,
        addMasterOption: masterOptionsDomain.addMasterOption,
        updateMasterOption: masterOptionsDomain.updateMasterOption,
        deleteMasterOption: masterOptionsDomain.deleteMasterOption,
        saveMasterOptionsBulk: masterOptionsDomain.saveMasterOptionsBulk,
        handleAddChannel: channelsDomain.handleAddChannel,
        handleUpdateChannel: channelsDomain.handleUpdateChannel,
        handleDeleteChannel: channelsDomain.handleDeleteChannel,
        addInventoryItem: inventoryDomain.addInventoryItem,
        updateInventoryItem: inventoryDomain.updateInventoryItem,
        deleteInventoryItem: inventoryDomain.deleteInventoryItem,
        batchUpdateInventoryItems: inventoryDomain.batchUpdateInventoryItems,
        updateInventoryStock: inventoryDomain.updateInventoryStock,
        seedDefaults
    }), [
        masterOptionsDomain.options,
        masterOptionsDomain.addMasterOption,
        masterOptionsDomain.updateMasterOption,
        masterOptionsDomain.deleteMasterOption,
        masterOptionsDomain.saveMasterOptionsBulk,
        calendarDomain.annualHolidays,
        calendarDomain.calendarExceptions,
        inventoryDomain.inventoryItems,
        inventoryDomain.addInventoryItem,
        inventoryDomain.updateInventoryItem,
        inventoryDomain.deleteInventoryItem,
        inventoryDomain.batchUpdateInventoryItems,
        inventoryDomain.updateInventoryStock,
        channelsDomain.channels,
        channelsDomain.handleAddChannel,
        channelsDomain.handleUpdateChannel,
        channelsDomain.handleDeleteChannel,
        isLoading,
        fetchAllMasterData,
        seedDefaults
    ]);

    return (
        <MasterDataContext.Provider value={value}>
            {children}
        </MasterDataContext.Provider>
    );
};

export const useMasterDataContext = () => {
    const context = useContext(MasterDataContext);
    if (context === undefined) {
        throw new Error('useMasterDataContext must be used within a MasterDataProvider');
    }
    return context;
};
