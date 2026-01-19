
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Role } from '../types';
import { useToast } from '../context/ToastContext';

export const useTeam = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const { showToast } = useToast();

    // Map DB profile to User type with Safety Checks
    const mapProfileToUser = (u: any): User => ({
        id: u.id,
        email: u.email,
        name: u.full_name || 'Unknown User', 
        role: u.role,
        avatarUrl: u.avatar_url || '',
        position: u.position || 'Member',
        isApproved: u.is_approved,
        isActive: u.is_active !== false,
        xp: u.xp || 0,
        level: u.level || 1,
        availablePoints: u.available_points || 0
    });

    const fetchTeamMembers = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
            if (error) throw error;
            if (data) {
                setAllUsers(data.map(mapProfileToUser));
            }
        } catch (err) { console.error('Fetch team failed', err); }
    };

    // Setup Realtime Subscription for Profiles
    useEffect(() => {
        const channel = supabase
            .channel('realtime-profiles')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setAllUsers(prev => {
                            if (prev.some(u => u.id === payload.new.id)) return prev;
                            return [...prev, mapProfileToUser(payload.new)];
                        });
                        showToast(`มีสมาชิกใหม่สมัครเข้ามา: ${payload.new.full_name || 'Unknown'}`, 'info');
                    } 
                    else if (payload.eventType === 'UPDATE') {
                        setAllUsers(prev => prev.map(u => 
                            u.id === payload.new.id ? mapProfileToUser(payload.new) : u
                        ));
                    } 
                    else if (payload.eventType === 'DELETE') {
                        setAllUsers(prev => prev.filter(u => u.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const approveMember = async (userId: string) => {
        try {
            const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
            if (error) throw error;
            showToast('อนุมัติสมาชิกเรียบร้อย! 🎉', 'success');
        } catch (err: any) {
            showToast('อนุมัติไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const removeMember = async (userId: string) => {
        if(!confirm('แน่ใจนะครับว่าจะลบสมาชิกคนนี้?')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;
            showToast('ลบสมาชิกออกจากทีมแล้ว', 'warning');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;
            const { error } = await supabase.from('profiles').update({ is_active: newStatus }).eq('id', userId);
            if (error) throw error;
            showToast(newStatus ? 'เปิดใช้งาน User แล้ว ✅' : 'พักงาน User ชั่วคราว 💤', 'info');
        } catch (err: any) {
            showToast('อัปเดตสถานะไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    // NEW: Function for Admin to update member info
    const updateMember = async (userId: string, updates: { name?: string, position?: string, role?: Role }) => {
        try {
            const payload: any = {};
            if (updates.name) payload.full_name = updates.name;
            if (updates.position) payload.position = updates.position;
            if (updates.role) payload.role = updates.role;

            const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
            if (error) throw error;
            
            showToast('อัปเดตข้อมูลสมาชิกสำเร็จ ✨', 'success');
            return true;
        } catch (err: any) {
            showToast('อัปเดตล้มเหลว: ' + err.message, 'error');
            return false;
        }
    };

    return {
        allUsers,
        fetchTeamMembers,
        approveMember,
        removeMember,
        toggleUserStatus,
        updateMember
    };
};
