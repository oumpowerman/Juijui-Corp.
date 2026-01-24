
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useToast } from '../context/ToastContext';

interface PresenceState {
    user: User;
    onlineAt: string;
    isKickTarget?: boolean;
    presence_ref?: string;
}

export const useScriptPresence = (scriptId: string, currentUser: User) => {
    const { showToast } = useToast();
    const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
    const [isWriter, setIsWriter] = useState(false);
    const [writer, setWriter] = useState<User | null>(null);
    const [isKicked, setIsKicked] = useState(false);
    
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!scriptId || !currentUser) return;

        const channel = supabase.channel(`script_presence:${scriptId}`);
        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users: PresenceState[] = [];
                
                for (const id in state) {
                    const presenceList = state[id];
                    if (presenceList && presenceList.length > 0) {
                        // Cast through unknown to bypass overlap check error
                        // Supabase types might infer this as only having presence_ref
                        const presence = presenceList[0] as unknown as PresenceState;
                        users.push(presence);
                    }
                }

                // Sort by join time (Earliest first)
                users.sort((a, b) => new Date(a.onlineAt).getTime() - new Date(b.onlineAt).getTime());
                setOnlineUsers(users);

                // Determine Writer
                if (users.length > 0) {
                    const currentWriter = users[0];
                    setWriter(currentWriter.user);
                    setIsWriter(currentWriter.user.id === currentUser.id && !isKicked);
                }
            })
            .on('broadcast', { event: 'force_unlock' }, (payload) => {
                // If I am the target of a kick
                if (payload.payload.targetId === currentUser.id) {
                    setIsKicked(true);
                    setIsWriter(false); // Immediate local demotion
                    showToast('⚠️ คุณถูกยึดสิทธิ์การแก้ไข (Someone took over)', 'warning');
                    
                    // Ideally we should untrack or update status, but simple local read-only is safer
                    channel.untrack();
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user: currentUser,
                        onlineAt: new Date().toISOString()
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [scriptId, currentUser.id, isKicked]);

    const requestTakeover = async () => {
        if (!writer) return;
        
        // Broadcast kick message to current writer
        await channelRef.current?.send({
            type: 'broadcast',
            event: 'force_unlock',
            payload: { targetId: writer.id }
        });

        // We assume they will untrack or we just override visually
        // In a real robust system, we might wait for them to leave, 
        // but for "Level A", we just announce we are taking over.
        // Actually, to become writer in the sorted list, the previous writer must leave.
        // The broadcast above tells them to `untrack()`.
        
        showToast('ยึดสิทธิ์การแก้ไขแล้ว! รอสักครู่...', 'success');
    };

    return {
        onlineUsers,
        writer,
        isWriter,
        isKicked,
        requestTakeover
    };
};
