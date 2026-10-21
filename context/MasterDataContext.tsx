import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { MasterDataContextType } from './master/types';
import { checkAndHealVersions } from './master/masterVersionSync';
import { useMasterOptionsDomain, getOptionsVersionCacheKey } from './master/useMasterOptionsDomain';
import { useChannelsDomain, getChannelsVersionCacheKey, mapChannel } from './master/useChannelsDomain';
import { useInventoryDomain, getInventoryVersionCacheKey, mapInventoryItem } from './master/useInventoryDomain';
import { useCalendarMasterDomain } from './master/useCalendarMasterDomain';
import { getActiveOrgIdSync, getOrgChannelName } from '../lib/tenantStorage';

export type { MasterDataContextType };
export { mapChannel, mapInventoryItem };

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export const MasterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [activeOrgId, setActiveOrgId] = useState<string>(() => getActiveOrgIdSync());

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

    // 3. Centralized Realtime Listeners isolated per organization
    useEffect(() => {
        const metadataChannel = supabase.channel(getOrgChannelName('system-metadata-changes', activeOrgId))
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'system_metadata' 
            }, (payload) => {
                const updatedKey = payload.new.key;
                const remoteVersion = payload.new.last_updated_at;
                const optVerKey = getOptionsVersionCacheKey(activeOrgId);
                const invVerKey = getInventoryVersionCacheKey(activeOrgId);
                const chVerKey = getChannelsVersionCacheKey(activeOrgId);

                if (updatedKey === 'master_options_version') {
                    if (localStorage.getItem(optVerKey) !== remoteVersion) {
                        setTimeout(() => {
                            if (localStorage.getItem(optVerKey) !== remoteVersion) {
                                console.log('🔄 Master Data: Options Delta missed, healing with full fetch...');
                                fetchAllMasterData();
                            }
                        }, 2000);
                    }
                } else if (updatedKey === 'inventory_version') {
                    if (localStorage.getItem(invVerKey) !== remoteVersion) {
                        setTimeout(() => {
                            if (localStorage.getItem(invVerKey) !== remoteVersion) {
                                console.log('🔄 Master Data: Inventory Delta missed, healing with full fetch...');
                                fetchAllMasterData();
                            }
                        }, 2000);
                    }
                } else if (updatedKey === 'channels_version') {
                    if (localStorage.getItem(chVerKey) !== remoteVersion) {
                        setTimeout(() => {
                            if (localStorage.getItem(chVerKey) !== remoteVersion) {
                                console.log('🔄 Master Data: Channels Delta missed, healing with full fetch...');
                                fetchAllMasterData();
                            }
                        }, 2000);
                    }
                }
            }).subscribe();

        const holidaysChannel = supabase.channel(getOrgChannelName('global-annual-holidays', activeOrgId))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'annual_holidays' }, () => {
                calendarDomain.loadCalendarData();
            }).subscribe();

        const exceptionsChannel = supabase.channel(getOrgChannelName('global-calendar-exceptions', activeOrgId))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_exceptions' }, () => {
                calendarDomain.loadCalendarData();
            }).subscribe();

        const optionsChannel = supabase.channel(getOrgChannelName('global-master-options', activeOrgId))
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

        const inventoryChannel = supabase.channel(getOrgChannelName('global-inventory-items', activeOrgId))
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

        const channelsChannel = supabase.channel(getOrgChannelName('global-channels', activeOrgId))
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
        activeOrgId,
        fetchAllMasterData,
        calendarDomain.loadCalendarData,
        masterOptionsDomain.updateOptionsLocalCache,
        inventoryDomain.updateInventoryLocalCache,
        channelsDomain.updateChannelsLocalCache
    ]);

    // Reload master data whenever user switches active Organization Workspace
    useEffect(() => {
        const handleWorkspaceSwitched = (e: Event) => {
            const customEvent = e as CustomEvent<{ orgId?: string }>;
            const nextOrgId = customEvent.detail?.orgId || getActiveOrgIdSync();
            setActiveOrgId(nextOrgId);
            try {
                localStorage.removeItem(getOptionsVersionCacheKey(nextOrgId));
                localStorage.removeItem(getInventoryVersionCacheKey(nextOrgId));
                localStorage.removeItem(getChannelsVersionCacheKey(nextOrgId));
            } catch {
                // Ignore storage errors
            }
            fetchAllMasterData();
        };
        window.addEventListener('org-workspace-switched', handleWorkspaceSwitched);
        return () => window.removeEventListener('org-workspace-switched', handleWorkspaceSwitched);
    }, [fetchAllMasterData]);

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
