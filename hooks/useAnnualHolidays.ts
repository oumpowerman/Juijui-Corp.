
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AnnualHoliday } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useMasterData } from './useMasterData';

export const useAnnualHolidays = () => {
    const { annualHolidays, isLoading } = useMasterData();
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const addHoliday = async (name: string, day: number, month: number, typeKey: string) => {
        try {
            const { error } = await supabase.from('annual_holidays').insert({
                name, day, month, type_key: typeKey, is_active: true
            });
            if (error) throw error;
            showToast('เพิ่มวันหยุดประจำปีแล้ว 🎉', 'success');
        } catch (err: any) {
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteHoliday = async (id: string) => {
        // Fix: Replaced native confirm with showConfirm
        const confirmed = await showConfirm('ยืนยันการลบวันหยุดนี้ใช่หรือไม่?', 'ลบวันหยุด');
        if(!confirmed) return;
        try {
            const { error } = await supabase.from('annual_holidays').delete().eq('id', id);
            if (error) throw error;
            showToast('ลบเรียบร้อย', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    return {
        annualHolidays,
        isLoading,
        addHoliday,
        deleteHoliday
    };
};
