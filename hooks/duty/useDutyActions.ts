
import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Duty, DutyConfig, User } from '../../types';
import { useToast } from '../../context/ToastContext';
import { format, addDays } from 'date-fns';

export const useDutyActions = (duties: Duty[], setDuties: React.Dispatch<React.SetStateAction<Duty[]>>, config?: any) => {
    const { showToast } = useToast();

    const saveConfigs = useCallback(async (newConfigs: DutyConfig[]) => {
        try {
            // Bulk upsert to prevent performance issues (N+1 queries)
            const payload = newConfigs.map(config => ({
                day_of_week: config.dayOfWeek,
                required_people: config.requiredPeople,
                task_titles: config.taskTitles
            }));

            const { error } = await supabase
                .from('duty_configs')
                .upsert(payload);
            
            if (error) throw error;
            
            showToast('บันทึกการตั้งค่าเวรลงระบบแล้ว ☁️', 'success');
        } catch (err: any) {
            showToast('บันทึกกติกาไม่สำเร็จ: ' + err.message, 'error');
        }
    }, [showToast]);

    const addDuty = useCallback(async (title: string, assigneeId: string, date: Date) => {
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const { error } = await supabase.from('duties').insert({
                title,
                assignee_id: assigneeId,
                date: dateStr,
                is_done: false
            });
            if (error) throw error;
            showToast('เพิ่มเวรลงฐานข้อมูลแล้ว', 'success');
        } catch (err: any) {
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
        }
    }, [showToast]);

    const toggleDuty = useCallback(async (id: string) => {
        const duty = duties.find(d => d.id === id);
        if (!duty) return;
        
        const newStatus = !duty.isDone;
        setDuties(prev => prev.map(d => d.id === id ? { ...d, isDone: newStatus } : d));
        
        try {
            const { error } = await supabase
                .from('duties')
                .update({ is_done: newStatus })
                .eq('id', id);
            
            if (error) throw error;
        } catch (err: any) {
            console.error('Toggle duty failed', err);
            setDuties(prev => prev.map(d => d.id === id ? { ...d, isDone: !newStatus } : d));
            showToast('อัปเดตสถานะไม่สำเร็จ: ' + err.message, 'error');
        }
    }, [duties, setDuties, showToast]);

    const deleteDuty = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('duties').delete().eq('id', id);
            if (error) throw error;
            showToast('ลบเวรออกแล้ว', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    }, [showToast]);

    const cleanupOldDuties = useCallback(async () => {
        const cleanupDays = config?.SYSTEM_MAINTENANCE?.duty_cleanup_days || 90;
        const cutoffDate = format(addDays(new Date(), -cleanupDays), 'yyyy-MM-dd');
        
        try {
            const { error } = await supabase
                .from('duties')
                .delete()
                .lt('date', cutoffDate);
            if (error) throw error;
            showToast(`ล้างข้อมูลเก่ากว่า ${cleanupDays} วันเรียบร้อย`, 'success');
        } catch (err: any) {
            showToast('ล้างข้อมูลล้มเหลว: ' + err.message, 'error');
        }
    }, [config, showToast]);

    const clearFutureDutiesForUser = useCallback(async (userId: string) => {
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const { error } = await supabase
                .from('duties')
                .delete()
                .eq('assignee_id', userId)
                .gte('date', todayStr)
                .eq('is_done', false);
            
            if (error) throw error;
            showToast('เคลียร์ตารางเวรในอนาคตของพนักงานคนนี้เรียบร้อย', 'info');
        } catch (err: any) {
            showToast('เคลียร์ตารางเวรไม่สำเร็จ: ' + err.message, 'error');
        }
    }, [showToast]);

    return {
        saveConfigs,
        addDuty,
        toggleDuty,
        deleteDuty,
        cleanupOldDuties,
        clearFutureDutiesForUser
    };
};
