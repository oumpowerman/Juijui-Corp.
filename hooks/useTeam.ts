
import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Role, WorkStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useTeam = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    // Map DB profile to User type with Safety Checks
    const mapProfileToUser = (u: any): User => ({
        id: u.id,
        email: u.email,
        name: u.full_name || 'Unknown User', 
        role: u.role,
        avatarUrl: u.avatar_url || '',
        position: u.position || 'Member',
        // Map snake_case from DB to camelCase in App
        phoneNumber: u.phone_number || '', 
        bio: u.bio || '', 
        feeling: u.feeling || '', 
        isApproved: u.is_approved,
        isActive: u.is_active !== false,
        xp: u.xp || 0,
        level: u.level || 1,
        availablePoints: u.available_points || 0,
        hp: u.hp ?? 100,
        maxHp: u.max_hp || 100,
        deathCount: u.death_count || 0,
        // --- NEW STATUS FIELDS ---
        workStatus: (u.work_status as WorkStatus) || 'ONLINE',
        leaveStartDate: u.leave_start_date ? new Date(u.leave_start_date) : null,
        leaveEndDate: u.leave_end_date ? new Date(u.leave_end_date) : null,
        // --- NEW READ FIELDS ---
        lastReadChatAt: u.last_read_chat_at ? new Date(u.last_read_chat_at) : new Date(0),
        lastReadNotificationAt: u.last_read_notification_at ? new Date(u.last_read_notification_at) : new Date(0),
        // --- HR FIELDS ---
        workDays: u.work_days || [1, 2, 3, 4, 5],
        // --- PAYROLL FIELDS ---
        baseSalary: u.base_salary || 0,
        bankAccount: u.bank_account || '',
        bankName: u.bank_name || '',
        ssoIncluded: u.sso_included !== false, // Default true
        taxType: u.tax_type || 'WHT_3'
    });

    const { data: allUsers = [], isLoading, refetch: fetchTeamMembers } = useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const isAdmin = currentUser?.user_metadata?.role === 'ADMIN';
            
            let query = supabase
                .from('profiles')
                .select(`
                    id, email, full_name, role, avatar_url, position, phone_number, bio, feeling,
                    is_approved, is_active, xp, level, available_points, hp, max_hp, death_count,
                    work_status, leave_start_date, leave_end_date, last_read_chat_at, last_read_notification_at,
                    work_days${isAdmin ? ', base_salary, bank_account, bank_name, sso_included, tax_type' : ''}
                `)
                .order('full_name', { ascending: true });
                
            const { data, error } = await query;
            if (error) throw error;
            return data.map(mapProfileToUser);
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    const approveMember = async (userId: string) => {
        try {
            const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
            if (error) throw error;
            
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            showToast('อนุมัติสมาชิกเรียบร้อย! 🎉', 'success');
        } catch (err: any) {
            showToast('อนุมัติไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const removeMember = async (userId: string) => {
        const confirmed = await showConfirm('แน่ใจนะครับว่าจะลบสมาชิกคนนี้?', 'ลบสมาชิกออกจากทีม');
        if(!confirmed) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['profiles'] });
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

            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            showToast(newStatus ? 'เปิดใช้งาน User แล้ว ✅' : 'พักงาน User ชั่วคราว 💤', 'info');
        } catch (err: any) {
            showToast('อัปเดตสถานะไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateMember = async (userId: string, updates: any) => {
        try {
            const payload: any = {};
            if (updates.name) payload.full_name = updates.name;
            if (updates.position) payload.position = updates.position;
            if (updates.role) payload.role = updates.role;
            if (updates.workDays) payload.work_days = updates.workDays;
            
            // Payroll Fields
            if (updates.baseSalary !== undefined) payload.base_salary = updates.baseSalary;
            if (updates.bankAccount !== undefined) payload.bank_account = updates.bankAccount;
            if (updates.bankName !== undefined) payload.bank_name = updates.bankName;
            if (updates.ssoIncluded !== undefined) payload.sso_included = updates.ssoIncluded;
            if (updates.taxType !== undefined) payload.tax_type = updates.taxType;

            const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
            if (error) throw error;
            
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            showToast('อัปเดตข้อมูลสมาชิกสำเร็จ ✨', 'success');
            return true;
        } catch (err: any) {
            showToast('อัปเดตล้มเหลว: ' + err.message, 'error');
            return false;
        }
    };

    const adjustStatsLocally = (userId: string, adjustments: { hp?: number, xp?: number, points?: number }) => {
        // Optimistic update using queryClient
        queryClient.setQueryData(['profiles'], (old: User[] | undefined) => {
            if (!old) return [];
            return old.map(u => {
                if (u.id === userId) {
                    const newHp = adjustments.hp !== undefined ? Math.min(u.maxHp, Math.max(0, u.hp + adjustments.hp)) : u.hp;
                    const newXp = adjustments.xp !== undefined ? Math.max(0, u.xp + adjustments.xp) : u.xp;
                    const newPoints = adjustments.points !== undefined ? Math.max(0, u.availablePoints + adjustments.points) : u.availablePoints;
                    return { ...u, hp: newHp, xp: newXp, availablePoints: newPoints };
                }
                return u;
            });
        });
    };

    return {
        allUsers,
        fetchTeamMembers,
        approveMember,
        removeMember,
        toggleUserStatus,
        updateMember,
        adjustStatsLocally,
        isLoading
    };
};
