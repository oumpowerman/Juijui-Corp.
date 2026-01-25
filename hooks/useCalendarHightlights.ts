
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarHighlight } from '../types';
import { useToast } from '../context/ToastContext';
import { startOfMonth, endOfMonth, format, addDays } from 'date-fns';

export const useCalendarHighlights = (currentDate: Date) => {
    const [highlights, setHighlights] = useState<CalendarHighlight[]>([]);
    const { showToast } = useToast();

    const fetchHighlights = useCallback(async () => {
        // Fetch a bit wider range to ensure smooth transition (prev/next month days)
        const start = format(addDays(startOfMonth(currentDate), -7), 'yyyy-MM-dd');
        const end = format(addDays(endOfMonth(currentDate), 14), 'yyyy-MM-dd');

        try {
            const { data, error } = await supabase
                .from('calendar_highlights')
                .select('*')
                .gte('date', start)
                .lte('date', end);

            if (error) throw error;

            if (data) {
                setHighlights(data.map((h: any) => ({
                    id: h.id,
                    date: new Date(h.date),
                    typeKey: h.type_key,
                    note: h.note
                })));
            }
        } catch (err) {
            console.error('Fetch highlights error:', err);
        }
    }, [currentDate]);

    // Set up Realtime subscription (Optimized)
    useEffect(() => {
        fetchHighlights();

        const channel = supabase
            .channel('realtime-calendar-highlights')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_highlights' }, (payload: any) => {
                // handle DELETE
                if (payload.eventType === 'DELETE') {
                    setHighlights(prev => prev.filter(h => h.id !== payload.old.id));
                } 
                // handle INSERT
                else if (payload.eventType === 'INSERT') {
                    const newHighlight: CalendarHighlight = {
                        id: payload.new.id,
                        date: new Date(payload.new.date),
                        typeKey: payload.new.type_key,
                        note: payload.new.note
                    };
                    setHighlights(prev => [...prev, newHighlight]);
                }
                // handle UPDATE
                else if (payload.eventType === 'UPDATE') {
                    setHighlights(prev => prev.map(h => {
                        if (h.id === payload.new.id) {
                            return {
                                id: payload.new.id,
                                date: new Date(payload.new.date),
                                typeKey: payload.new.type_key,
                                note: payload.new.note
                            };
                        }
                        return h;
                    }));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchHighlights]);

    const setHighlight = async (date: Date, typeKey: string, note?: string) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        try {
            // Upsert based on unique constraint (date)
            const { error } = await supabase
                .from('calendar_highlights')
                .upsert({
                    date: dateStr,
                    type_key: typeKey,
                    note: note
                }, { onConflict: 'date' });

            if (error) throw error;
            showToast('บันทึกไฮไลท์เรียบร้อย 🎨', 'success');
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const removeHighlight = async (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        try {
            const { error } = await supabase
                .from('calendar_highlights')
                .delete()
                .eq('date', dateStr);

            if (error) throw error;
            showToast('ลบไฮไลท์แล้ว', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    return {
        highlights,
        setHighlight,
        removeHighlight,
        refreshHighlights: fetchHighlights
    };
};
