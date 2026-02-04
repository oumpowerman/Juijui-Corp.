
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export interface CalendarException {
    id: string;
    date: string; // YYYY-MM-DD
    type: 'WORK_DAY' | 'HOLIDAY';
    description?: string;
}

export const useCalendarExceptions = () => {
    const [exceptions, setExceptions] = useState<CalendarException[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchExceptions = async () => {
        try {
            const { data, error } = await supabase
                .from('calendar_exceptions')
                .select('*');
            
            if (error) throw error;
            if (data) setExceptions(data);
        } catch (err: any) {
            console.error('Error fetching calendar exceptions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Upsert: If exists update, else insert. Based on 'date' unique constraint
    const setException = async (date: string, type: 'WORK_DAY' | 'HOLIDAY', description: string) => {
        try {
            const { error } = await supabase
                .from('calendar_exceptions')
                .upsert({ 
                    date, 
                    type, 
                    description 
                }, { onConflict: 'date' });

            if (error) throw error;
            
            showToast('บันทึกการตั้งค่าวันเรียบร้อย ✅', 'success');
            fetchExceptions(); // Refresh
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteException = async (date: string) => {
        try {
            const { error } = await supabase
                .from('calendar_exceptions')
                .delete()
                .eq('date', date);

            if (error) throw error;
            
            showToast('ลบการตั้งค่าพิเศษแล้ว (กลับสู่ค่าเริ่มต้น)', 'info');
            fetchExceptions();
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    useEffect(() => {
        fetchExceptions();
        
        const channel = supabase.channel('realtime-calendar-exceptions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_exceptions' }, () => fetchExceptions())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return {
        exceptions,
        isLoading,
        setException,
        deleteException
    };
};
