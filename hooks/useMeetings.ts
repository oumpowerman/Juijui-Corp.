
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MeetingLog, MeetingCategory } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { format, isValid } from 'date-fns';

export const useMeetings = () => {
    const [meetings, setMeetings] = useState<MeetingLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    // Helper to map DB object to MeetingLog type
    const mapMeeting = (m: any): MeetingLog => ({
        id: m.id,
        title: m.title,
        date: new Date(m.date),
        content: m.content || '',
        decisions: m.decisions || '', // Map decisions
        category: (m.category as MeetingCategory) || 'GENERAL',
        attendees: m.attendees || [],
        tags: m.tags || [],
        agenda: m.agenda || [], 
        assets: m.assets || [],
        createdAt: new Date(m.created_at),
        updatedAt: new Date(m.updated_at),
        authorId: m.author_id
    });

    const fetchMeetings = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('meeting_logs')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                setMeetings(data.map(mapMeeting));
            }
        } catch (err: any) {
            console.error('Fetch meetings failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
        const channel = supabase.channel('realtime-meetings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_logs' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    // Handled optimistically in createMeeting, but fetch to be safe/sync with others
                    // Check if already exists to avoid duplication from optimistic update
                    setMeetings(prev => {
                        if (prev.some(m => m.id === payload.new.id)) return prev;
                        return [mapMeeting(payload.new), ...prev].sort((a, b) => b.date.getTime() - a.date.getTime());
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setMeetings(prev => prev.map(m => m.id === payload.new.id ? mapMeeting(payload.new) : m));
                } else if (payload.eventType === 'DELETE') {
                    setMeetings(prev => prev.filter(m => m.id !== payload.old.id));
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const createMeeting = async (title: string, date: Date, userId: string) => {
        try {
            // FIX Timezone: Use format from date-fns to get 'YYYY-MM-DD' in local time
            // This prevents UTC conversion shifting the day back
            const dateStr = format(date, 'yyyy-MM-dd');

            const payload = {
                title,
                date: dateStr, // Send as string "2023-10-26"
                content: '',
                decisions: '',
                author_id: userId,
                category: 'GENERAL',
                attendees: [],
                tags: [],
                agenda: [],
                assets: []
            };

            const { data, error } = await supabase.from('meeting_logs').insert(payload).select().single();
            if (error) throw error;
            
            // FIX Refresh: Update state immediately so UI reflects change
            if (data) {
                const newMeeting = mapMeeting(data);
                setMeetings(prev => [newMeeting, ...prev]);
            }

            showToast('สร้างห้องประชุมใหม่แล้ว 📝', 'success');
            return data.id;
        } catch (err: any) {
            showToast('สร้างไม่สำเร็จ: ' + err.message, 'error');
            return null;
        }
    };

    const updateMeeting = async (id: string, updates: Partial<MeetingLog>) => {
        try {
            const payload: any = {
                updated_at: new Date().toISOString()
            };
            if (updates.title) payload.title = updates.title;
            if (updates.content) payload.content = updates.content;
            if (updates.decisions) payload.decisions = updates.decisions; // Add logic
            
            // Fix Date update with validation
            if (updates.date) {
                const d = new Date(updates.date);
                if (isValid(d)) {
                    payload.date = format(d, 'yyyy-MM-dd');
                } else {
                    console.warn("Invalid date passed to updateMeeting", updates.date);
                    // Do not update date if invalid
                }
            }
            
            if (updates.attendees) payload.attendees = updates.attendees;
            if (updates.tags) payload.tags = updates.tags;
            if (updates.category) payload.category = updates.category;
            
            if (updates.agenda) payload.agenda = updates.agenda;
            if (updates.assets) payload.assets = updates.assets;

            const { error } = await supabase.from('meeting_logs').update(payload).eq('id', id);
            if (error) throw error;
            
            // Optimistic update
            setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));

        } catch (err: any) {
            console.error(err);
            showToast('บันทึกไม่สำเร็จ', 'error');
        }
    };

    const deleteMeeting = async (id: string) => {
        // Fix: Replaced native confirm with showConfirm
        const confirmed = await showConfirm('ยืนยันการลบบันทึกนี้ใช่หรือไม่?', 'ลบบันทึกการประชุม');
        if(!confirmed) return;
        try {
            const { error } = await supabase.from('meeting_logs').delete().eq('id', id);
            if (error) throw error;
            
            // Optimistic update
            setMeetings(prev => prev.filter(m => m.id !== id));
            showToast('ลบเรียบร้อย', 'info');
        } catch (err) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    return {
        meetings,
        isLoading,
        createMeeting,
        updateMeeting,
        deleteMeeting
    };
};
