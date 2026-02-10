
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Role, WorkStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';

export const useTeam = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
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
        // --- NEW STATUS FIELDS ---
        workStatus: (u.work_status as WorkStatus) || 'ONLINE',
        leaveStartDate: u.leave_start_date ? new Date(u.leave_start_date) : null,
        leaveEndDate: u.leave_end_date ? new Date(u.leave_end_date) : null,
        // --- NEW READ FIELDS ---
        lastReadChatAt: u.last_read_chat_at ? new Date(u.last_read_chat_at) : new Date(0),
        lastReadNotificationAt: u.last_read_notification_at ? new Date(u.last_read_notification_at) : new Date(0),
        // --- PAYROLL FIELDS ---
        baseSalary: u.base_salary || 0,
        bankAccount: u.bank_account || '',
        bankName: u.bank_name || '',
        ssoIncluded: u.sso_included !== false, // Default true
        taxType: u.tax_type || 'WHT_3'
    });

    const fetchTeamMembers = async () => {
        try {
            // Select all columns or explicitly list new ones if needed
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true });
                
            if (error) {
                console.error("Supabase Error fetching team:", error.message);
                throw error;
            }
            if (data) {
                setAllUsers(data.map(mapProfileToUser));
            }
        } catch (err: any) { 
            console.error('Fetch team failed', err);
        }
    };

    // Setup Realtime Subscription for Profiles
    useEffect(() => {
        fetchTeamMembers(); // Initial fetch

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
            
            // Update Local State Immediately
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isApproved: true } : u));
            
            showToast('อนุมัติสมาชิกเรียบร้อย! 🎉', 'success');
        } catch (err: any) {
            showToast('อนุมัติไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const removeMember = async (userId: string) => {
        // Fix: Replaced native confirm with showConfirm
        const confirmed = await showConfirm('แน่ใจนะครับว่าจะลบสมาชิกคนนี้?', 'ลบสมาชิกออกจากทีม');
        if(!confirmed) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;

            // Update Local State Immediately
            setAllUsers(prev => prev.filter(u => u.id !== userId));

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

            // Update Local State Immediately
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: newStatus } : u));

            showToast(newStatus ? 'เปิดใช้งาน User แล้ว ✅' : 'พักงาน User ชั่วคราว 💤', 'info');
        } catch (err: any) {
            showToast('อัปเดตสถานะไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    // NEW: Function for Admin to update member info (Expanded)
    const updateMember = async (userId: string, updates: any) => {
        try {
            const payload: any = {};
            if (updates.name) payload.full_name = updates.name;
            if (updates.position) payload.position = updates.position;
            if (updates.role) payload.role = updates.role;
            
            // Payroll Fields
            if (updates.baseSalary !== undefined) payload.base_salary = updates.baseSalary;
            if (updates.bankAccount !== undefined) payload.bank_account = updates.bankAccount;
            if (updates.bankName !== undefined) payload.bank_name = updates.bankName;
            if (updates.ssoIncluded !== undefined) payload.sso_included = updates.ssoIncluded;
            if (updates.taxType !== undefined) payload.tax_type = updates.taxType;

            const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
            if (error) throw error;
            
            // Update Local State Immediately
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

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
