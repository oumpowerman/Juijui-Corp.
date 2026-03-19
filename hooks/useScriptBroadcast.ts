
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useScriptBroadcast = (scriptId: string, userId: string, isWriter: boolean) => {
    const [liveUpdate, setLiveUpdate] = useState<{ content: string, sheetId: string } | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<any>(null);
    const lastBroadcastRef = useRef<number>(0);

    useEffect(() => {
        if (!scriptId) return;

        const channel = supabase.channel(`script_broadcast:${scriptId}`);
        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'remote_update' }, (payload) => {
                // If we are the writer, ignore incoming broadcasts (to prevent loops)
                if (!isWriter) {
                    if (payload.payload.content) {
                        setLiveUpdate({ 
                            content: payload.payload.content, 
                            sheetId: payload.payload.sheetId || 'main' 
                        });
                    }
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                }
            });

        return () => {
            supabase.removeChannel(channel);
            setIsConnected(false);
        };
    }, [scriptId, isWriter]);

    // Throttle the broadcast to avoid flooding the socket
    const sendLiveUpdate = useCallback((content: string, sheetId: string = 'main') => {
        if (!channelRef.current || !isWriter) return;

        const now = Date.now();
        // Limit to 1 broadcast every 200ms
        if (now - lastBroadcastRef.current > 200) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'remote_update',
                payload: { content, userId, sheetId }
            });
            lastBroadcastRef.current = now;
        }
    }, [isWriter, userId]);

    return {
        liveUpdate,
        sendLiveUpdate,
        isConnected
    };
};
