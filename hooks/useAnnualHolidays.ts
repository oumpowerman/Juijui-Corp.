
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AnnualHoliday } from '../types';
import { useToast } from '../context/ToastContext';

export const useAnnualHolidays = () => {
    const [annualHolidays, setAnnualHolidays] = useState<AnnualHoliday[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchHolidays = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('annual_holidays')
                .select('*')
                .order('month', { ascending: true })
                .order('day', { ascending: true });

            if (error) throw error;

            if (data) {
                setAnnualHolidays(data.map((h: any) => ({
                    id: h.id,
                    name: h.name,
                    day: h.day,
                    month: h.month,
                    typeKey: h.type_key,
                    isActive: h.is_active
                })));
            }
        } catch (err: any) {
            console.error('Fetch annual holidays failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const addHoliday = async (name: string, day: number, month: number, typeKey: string) => {
        try {
            const { error } = await supabase.from('annual_holidays').insert({
                name, day, month, type_key: typeKey, is_active: true
            });
            if (error) throw error;
            showToast('เพิ่มวันหยุดประจำปีแล้ว 🎉', 'success');
            fetchHolidays();
        } catch (err: any) {
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteHoliday = async (id: string) => {
        if(!confirm('ยืนยันการลบ?')) return;
        try {
            const { error } = await supabase.from('annual_holidays').delete().eq('id', id);
            if (error) throw error;
            setAnnualHolidays(prev => prev.filter(h => h.id !== id));
            showToast('ลบเรียบร้อย', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    // Realtime Subscription
    useEffect(() => {
        fetchHolidays();
        const channel = supabase.channel('realtime-annual-holidays')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'annual_holidays' }, () => fetchHolidays())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    return {
        annualHolidays,
        isLoading,
        addHoliday,
        deleteHoliday
    };
};
