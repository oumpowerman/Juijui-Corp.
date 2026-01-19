
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Channel } from '../types';
import { useToast } from '../context/ToastContext';

export const useChannels = () => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const { showToast } = useToast();

    const fetchChannels = async () => {
        try {
            // Order by created_at to keep list stable
            const { data, error } = await supabase
                .from('channels')
                .select('*')
                .order('created_at', { ascending: true });
                
            if (error) throw error;
            if (data) {
                // Ensure platforms is an array
                setChannels(data.map((c:any) => ({
                    ...c,
                    platforms: Array.isArray(c.platforms) ? c.platforms : (c.platform ? [c.platform] : ['OTHER']) 
                })));
            }
        } catch (err) { console.error('Fetch channels failed', err); }
    };

    const handleAddChannel = async (channel: Channel): Promise<boolean> => {
        try {
            // FIX: Use crypto.randomUUID() for proper UUID generation
            const finalId = channel.id || crypto.randomUUID();
            
            // Explicitly map payload to ensure 'platforms' is an array
            // FIX: Also map 'platform' (singular) to satisfy legacy DB constraints
            const payload = {
                id: finalId,
                name: channel.name,
                description: channel.description || '', // Ensure string
                color: channel.color,
                platforms: channel.platforms, // New schema (Array)
                platform: channel.platforms[0] || 'OTHER' // Legacy schema support (String)
            };

            const { error } = await supabase.from('channels').insert(payload);
            
            if (error) {
                console.error("Supabase Error (Insert Channel):", error);
                throw error;
            }
            
            setChannels(prev => [...prev, { ...channel, id: finalId }]);
            showToast('เพิ่มแบรนด์ใหม่สำเร็จ 🎉', 'success');
            return true;
        } catch (dbError: any) {
            console.error(dbError);
            showToast('บันทึกไม่สำเร็จ: ' + (dbError.message || 'Unknown DB error'), 'error');
            return false;
        }
    };

    const handleUpdateChannel = async (updatedChannel: Channel): Promise<boolean> => {
         try {
             const payload = {
                name: updatedChannel.name,
                description: updatedChannel.description || '',
                color: updatedChannel.color,
                platforms: updatedChannel.platforms,
                platform: updatedChannel.platforms[0] || 'OTHER' // Legacy schema support
            };

            const { error } = await supabase.from('channels').update(payload).eq('id', updatedChannel.id);
            
            if (error) throw error;
            setChannels(prev => prev.map(c => c.id === updatedChannel.id ? updatedChannel : c));
            showToast('อัปเดตข้อมูลสำเร็จ ✨', 'success');
            return true;
        } catch (dbError: any) {
             console.error("Supabase Error (Update Channel):", dbError);
            showToast('อัปเดตไม่สำเร็จ: ' + (dbError.message || ''), 'error');
            return false;
        }
    };

    const handleDeleteChannel = async (channelId: string): Promise<boolean> => {
        try {
            const { error } = await supabase.from('channels').delete().eq('id', channelId);
            if (error) throw error;
            setChannels(prev => prev.filter(c => c.id !== channelId));
            showToast('ลบแบรนด์สำเร็จ 🗑️', 'warning');
            return true;
        } catch (dbError) {
            showToast('ลบไม่สำเร็จ', 'error');
            return false;
        }
    };

    return {
        channels,
        fetchChannels,
        handleAddChannel,
        handleUpdateChannel,
        handleDeleteChannel
    };
};
