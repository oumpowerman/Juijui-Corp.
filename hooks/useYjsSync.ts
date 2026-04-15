import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useYjsSync = (scriptId: string, isWriter: boolean, initialContent?: string) => {
    const [ydoc] = useState(() => new Y.Doc());
    const [isSynced, setIsSynced] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const isWriterRef = useRef(isWriter);

    useEffect(() => {
        isWriterRef.current = isWriter;
    }, [isWriter]);

    useEffect(() => {
        if (!scriptId) return;

        let isMounted = true;
        const channel = supabase.channel(`script_yjs_${scriptId}`);
        channelRef.current = channel;

        // 1. Fetch initial state from DB
        const fetchInitialState = async () => {
            try {
                const { data, error } = await supabase
                    .from('scripts')
                    .select('document_state')
                    .eq('id', scriptId)
                    .single();

                if (error) throw error;

                if (data?.document_state && isMounted) {
                    // Decode Base64 to Uint8Array and apply to Y.Doc
                    const binaryString = atob(data.document_state);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    Y.applyUpdate(ydoc, bytes, 'initial');
                } else if (initialContent && isMounted) {
                    // Initialize with HTML content if no documentState exists
                    // We can't directly parse HTML to Yjs here without Tiptap, 
                    // so we rely on Tiptap to initialize it if we pass content to the editor.
                    // Actually, if we pass content to the editor, Tiptap will sync it to Yjs.
                }
                if (isMounted) setIsSynced(true);
            } catch (err) {
                console.error('Error fetching initial Yjs state:', err);
                if (isMounted) setIsSynced(true); // Proceed anyway to allow editing
            }
        };

        fetchInitialState();

        // 2. Setup Supabase Realtime for Yjs updates
        channel
            .on('broadcast', { event: 'yjs_update' }, (payload) => {
                // Apply update from other clients
                if (payload.payload?.update) {
                    const update = new Uint8Array(payload.payload.update);
                    Y.applyUpdate(ydoc, update, 'supabase');
                }
            })
            .subscribe();

        // 3. Listen to local Yjs updates and broadcast them
        const handleUpdate = (update: Uint8Array, origin: any) => {
            // Only broadcast if the update originated locally (not from 'supabase' or 'initial')
            if (origin !== 'supabase' && origin !== 'initial' && isWriterRef.current) {
                channel.send({
                    type: 'broadcast',
                    event: 'yjs_update',
                    payload: { update: Array.from(update) }
                }).catch(err => console.error("Failed to broadcast Yjs update", err));
            }
        };

        ydoc.on('update', handleUpdate);

        return () => {
            isMounted = false;
            ydoc.off('update', handleUpdate);
            channel.unsubscribe();
        };
    }, [scriptId, ydoc, initialContent]); // Removed isWriter from dependencies

    return { ydoc, isSynced };
};
