
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MeetingLog, MeetingCategory } from '../types';
import { useToast } from '../context/ToastContext';

export const useMeetings = () => {
    const [meetings, setMeetings] = useState<MeetingLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchMeetings = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('meeting_logs')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                setMeetings(data.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    date: new Date(m.date),
                    content: m.content || '',
                    category: (m.category as MeetingCategory) || 'GENERAL',
                    attendees: m.attendees || [],
                    tags: m.tags || [],
                    
                    // Map new JSONB fields
                    agenda: m.agenda || [], 
                    assets: m.assets || [],
                    
                    createdAt: new Date(m.created_at),
                    updatedAt: new Date(m.updated_at),
                    authorId: m.author_id
                })));
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_logs' }, () => fetchMeetings())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const createMeeting = async (title: string, date: Date, userId: string) => {
        try {
            const payload = {
                title,
                date: date.toISOString(),
                content: '',
                author_id: userId,
                category: 'GENERAL',
                attendees: [],
                tags: [],
                agenda: [],
                assets: []
            };

            const { data, error } = await supabase.from('meeting_logs').insert(payload).select().single();
            if (error) throw error;
            
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
            if (updates.date) payload.date = updates.date.toISOString();
            if (updates.attendees) payload.attendees = updates.attendees;
            if (updates.tags) payload.tags = updates.tags;
            if (updates.category) payload.category = updates.category;
            
            // New Fields
            if (updates.agenda) payload.agenda = updates.agenda;
            if (updates.assets) payload.assets = updates.assets;

            const { error } = await supabase.from('meeting_logs').update(payload).eq('id', id);
            if (error) throw error;
        } catch (err: any) {
            console.error(err);
            showToast('บันทึกไม่สำเร็จ', 'error');
        }
    };

    const deleteMeeting = async (id: string) => {
        if(!confirm('ยืนยันการลบบันทึกนี้?')) return;
        try {
            await supabase.from('meeting_logs').delete().eq('id', id);
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
