
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Goal } from '../types';
import { useToast } from '../context/ToastContext';

export const useGoals = () => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchGoals = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('is_archived', false)
                .order('deadline', { ascending: true });

            if (error) throw error;

            if (data) {
                setGoals(data.map((g: any) => ({
                    id: g.id,
                    title: g.title,
                    platform: g.platform,
                    currentValue: g.current_value,
                    targetValue: g.target_value,
                    deadline: new Date(g.deadline),
                    channelId: g.channel_id,
                    isArchived: g.is_archived
                })));
            }
        } catch (err: any) {
            console.error('Fetch goals error:', err.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    const addGoal = async (goal: Omit<Goal, 'id'>) => {
        try {
            const payload = {
                title: goal.title,
                platform: goal.platform,
                current_value: goal.currentValue,
                target_value: goal.targetValue,
                deadline: goal.deadline.toISOString(),
                channel_id: goal.channelId || null,
                is_archived: false
            };

            const { data, error } = await supabase.from('goals').insert(payload).select().single();
            if (error) throw error;

            setGoals(prev => [...prev, { ...goal, id: data.id }]);
            showToast('สร้างเป้าหมายใหม่สำเร็จ 🎯', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('สร้างไม่สำเร็จ: ' + (err.message || 'Unknown error'), 'error');
        }
    };

    const updateGoalValue = async (id: string, currentValue: number) => {
        try {
            const { error } = await supabase.from('goals').update({ current_value: currentValue }).eq('id', id);
            if (error) throw error;

            setGoals(prev => prev.map(g => g.id === id ? { ...g, currentValue } : g));
            showToast('อัปเดตยอดล่าสุดแล้ว! 📈', 'success');
        } catch (err: any) {
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteGoal = async (id: string) => {
        if(!confirm('ลบเป้าหมายนี้?')) return;
        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if(error) throw error;
            setGoals(prev => prev.filter(g => g.id !== id));
            showToast('ลบเป้าหมายแล้ว', 'info');
        } catch(err: any) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    return {
        goals,
        isLoading,
        addGoal,
        updateGoalValue,
        deleteGoal,
        refreshGoals: fetchGoals
    };
};
