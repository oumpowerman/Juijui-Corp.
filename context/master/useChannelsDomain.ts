import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Channel } from '../../types';
import { useToast } from '../ToastContext';
import { updateSystemVersion } from './masterVersionSync';

export const CACHE_KEY_CHANNELS = 'channels_cache';
export const CACHE_KEY_CHANNELS_VERSION = 'channels_version_cache';

export const mapChannel = (c: any): Channel => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    color: c.color,
    platforms: Array.isArray(c.platforms) ? c.platforms : ['OTHER'],
    logoUrl: c.logo_url || c.logoUrl,
    social_links: c.social_links || {},
    followers: c.followers || {},
    content_strategy: c.content_strategy || null,
    group_id: c.group_id || null,
    group_name: c.group_name || null,
    email: c.email || ''
});

export const useChannelsDomain = () => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const { showToast } = useToast();
    const isMutatingChannelsCache = useRef(false);

    const updateChannelsLocalCache = useCallback(async (
        action: 'ADD' | 'UPDATE' | 'DELETE', 
        payload: any, 
        skipVersionUpdate: boolean = false
    ) => {
        isMutatingChannelsCache.current = true;
        try {
            const cachedChannels = localStorage.getItem(CACHE_KEY_CHANNELS);
            let rawChannels = cachedChannels ? JSON.parse(cachedChannels) : [];
            
            if (action === 'ADD') {
                if (!rawChannels.some((c: any) => c.id === payload.id)) {
                    rawChannels.push(payload);
                }
            } else if (action === 'UPDATE') {
                const index = rawChannels.findIndex((c: any) => c.id === payload.id);
                if (index > -1) {
                    rawChannels[index] = { ...rawChannels[index], ...payload };
                } else {
                    rawChannels.push(payload);
                }
            } else if (action === 'DELETE') {
                rawChannels = rawChannels.filter((c: any) => c.id !== payload);
            }
            
            localStorage.setItem(CACHE_KEY_CHANNELS, JSON.stringify(rawChannels));
            setChannels(rawChannels.map(mapChannel));

            if (!skipVersionUpdate) {
                const newVersion = await updateSystemVersion('channels_version');
                if (newVersion) {
                    localStorage.setItem(CACHE_KEY_CHANNELS_VERSION, newVersion);
                }
            }
        } catch (e) {
            console.error('Error updating local channels cache:', e);
        } finally {
            setTimeout(() => {
                isMutatingChannelsCache.current = false;
            }, 1000);
        }
    }, []);

    const loadChannelsFromCacheOrRemote = useCallback(async (currentChannelsVersion?: string) => {
        const cachedChannels = localStorage.getItem(CACHE_KEY_CHANNELS);
        const cachedChannelsVersion = localStorage.getItem(CACHE_KEY_CHANNELS_VERSION);
        let channelsData = null;
        let useCache = false;

        if (isMutatingChannelsCache.current) {
            useCache = true;
            channelsData = JSON.parse(localStorage.getItem(CACHE_KEY_CHANNELS) || '[]');
            console.log('🚀 Master Data: Using cached channels (Mutation in progress)');
        } else if (cachedChannels && cachedChannelsVersion && currentChannelsVersion && cachedChannelsVersion === currentChannelsVersion) {
            try {
                channelsData = JSON.parse(cachedChannels);
                useCache = true;
                console.log('🚀 Master Data: Using cached channels', currentChannelsVersion);
            } catch (e) {
                console.warn('⚠️ Master Data: Channels Cache corrupted');
            }
        }

        if (!useCache) {
            console.log('📡 Master Data: Fetching channels...');
            const { data, error } = await supabase
                .from('channels')
                .select('*')
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            channelsData = data;

            if (data && currentChannelsVersion) {
                localStorage.setItem(CACHE_KEY_CHANNELS, JSON.stringify(data));
                localStorage.setItem(CACHE_KEY_CHANNELS_VERSION, currentChannelsVersion);
            }
        }

        if (channelsData) {
            setChannels(channelsData.map(mapChannel));
        }
    }, []);

    const handleAddChannel = useCallback(async (channel: Channel, file?: File): Promise<boolean> => {
        try {
            const finalId = channel.id || (
                typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                    ? crypto.randomUUID()
                    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                        const r = Math.random() * 16 | 0;
                        const v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    })
            );
            let logoUrl = null;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `channel-logo-${finalId}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
                
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                logoUrl = data.publicUrl;
            }
            
            const payload = {
                id: finalId,
                name: channel.name,
                description: channel.description || '', 
                color: channel.color,
                platforms: channel.platforms, 
                logo_url: logoUrl,
                social_links: channel.social_links || {},
                followers: channel.followers || {},
                content_strategy: channel.content_strategy || null,
                group_id: channel.group_id || null,
                group_name: channel.group_name || null,
                email: channel.email?.trim() || null
            };

            const { data, error } = await supabase.from('channels').insert(payload).select().single();
            
            if (error) {
                console.error("Supabase Error (Insert Channel):", error);
                throw error;
            }
            await updateChannelsLocalCache('ADD', data || payload); 
            showToast('เพิ่มแบรนด์ใหม่สำเร็จ 🎉', 'success');
            return true;
        } catch (dbError: any) {
            console.error(dbError);
            showToast('บันทึกไม่สำเร็จ: ' + (dbError.message || 'Unknown DB error'), 'error');
            return false;
        }
    }, [showToast, updateChannelsLocalCache]);

    const handleUpdateChannel = useCallback(async (updatedChannel: Channel, file?: File): Promise<boolean> => {
        try {
            let logoUrl = updatedChannel.logoUrl;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `channel-logo-${updatedChannel.id}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
                
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                logoUrl = data.publicUrl;
            }

            const payload = {
                name: updatedChannel.name,
                description: updatedChannel.description || '',
                color: updatedChannel.color,
                platforms: updatedChannel.platforms,
                logo_url: logoUrl,
                social_links: updatedChannel.social_links || {},
                followers: updatedChannel.followers || {},
                content_strategy: updatedChannel.content_strategy || null,
                group_id: updatedChannel.group_id || null,
                group_name: updatedChannel.group_name || null,
                email: updatedChannel.email?.trim() || null
            };

            const { data, error } = await supabase.from('channels').update(payload).eq('id', updatedChannel.id).select().single();
            
            if (error) throw error;
            await updateChannelsLocalCache('UPDATE', data || { id: updatedChannel.id, ...payload });
            showToast('อัปเดตข้อมูลสำเร็จ ✨', 'success');
            return true;
        } catch (dbError: any) {
            console.error("Supabase Error (Update Channel):", dbError);
            showToast('อัปเดตไม่สำเร็จ: ' + (dbError.message || ''), 'error');
            return false;
        }
    }, [showToast, updateChannelsLocalCache]);

    const handleDeleteChannel = useCallback(async (channelId: string): Promise<boolean> => {
        try {
            const { error } = await supabase.from('channels').delete().eq('id', channelId);
            if (error) throw error;
            await updateChannelsLocalCache('DELETE', channelId);
            showToast('ลบแบรนด์สำเร็จ 🗑️', 'warning');
            return true;
        } catch (dbError) {
            showToast('ลบไม่สำเร็จ', 'error');
            return false;
        }
    }, [showToast, updateChannelsLocalCache]);

    return {
        channels,
        setChannels,
        isMutatingChannelsCache,
        updateChannelsLocalCache,
        loadChannelsFromCacheOrRemote,
        handleAddChannel,
        handleUpdateChannel,
        handleDeleteChannel
    };
};
