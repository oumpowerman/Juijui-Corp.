
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useMasterData } from './useMasterData';

export interface CalendarException {
    id: string;
    date: string; // YYYY-MM-DD
    type: 'WORK_DAY' | 'HOLIDAY';
    description?: string;
}

export const useCalendarExceptions = () => {
    const { calendarExceptions: exceptions, isLoading } = useMasterData();
    const { showToast } = useToast();

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
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    return {
        exceptions,
        isLoading,
        setException,
        deleteException
    };
};
