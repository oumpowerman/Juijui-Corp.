
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, WorkStatus } from '../types';

export const useAuth = (sessionUser: any) => {
    const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);

    const mapProfileToUser = (data: any): User => ({
        id: data.id,
        email: data.email,
        name: data.full_name || 'No Name',
        role: data.role,
        avatarUrl: data.avatar_url,
        position: data.position || 'Member',
        phoneNumber: data.phone_number,
        bio: data.bio || '',
        feeling: data.feeling || '',
        isApproved: data.is_approved,
        isActive: data.is_active !== false,
        xp: data.xp || 0,
        level: data.level || 1,
        availablePoints: data.available_points || 0,
        hp: data.hp || 100,
        maxHp: data.max_hp || 100,
        workStatus: (data.work_status as WorkStatus) || 'ONLINE',
        leaveStartDate: data.leave_start_date ? new Date(data.leave_start_date) : null,
        leaveEndDate: data.leave_end_date ? new Date(data.leave_end_date) : null,
        // Map new read timestamps
        lastReadChatAt: data.last_read_chat_at ? new Date(data.last_read_chat_at) : new Date(0),
        lastReadNotificationAt: data.last_read_notification_at ? new Date(data.last_read_notification_at) : new Date(0),
    });

    const fetchProfile = async () => {
        if (!sessionUser) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            if (error) throw error;

            const mappedUser = mapProfileToUser(data);
            setCurrentUserProfile(mappedUser);
            return mappedUser;
        } catch (err: any) {
            console.error('Fetch profile failed:', err);
            return null;
        }
    };

    // --- REALTIME SYNC ADDED ---
    useEffect(() => {
        if (!sessionUser?.id) return;

        // Initial Fetch
        fetchProfile();

        const channel = supabase
            .channel(`profile-sync-${sessionUser.id}`)
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'profiles', 
                    filter: `id=eq.${sessionUser.id}` 
                },
                (payload) => {
                    // Update state immediately when DB changes (XP, HP, Points, etc.)
                    setCurrentUserProfile(prev => {
                        if (!prev) return null;
                        const updated = mapProfileToUser(payload.new);
                        // Preserve some fields if needed, but usually full replace is safer for sync
                        return updated;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionUser?.id]);

    const updateProfile = async (updates: Partial<User>, avatarFile?: File) => {
        if (!currentUserProfile) return false;
        
        try {
            const payload: any = {};
            
            if (updates.name !== undefined) payload.full_name = updates.name;
            if (updates.position !== undefined) payload.position = updates.position;
            if (updates.bio !== undefined) payload.bio = updates.bio; 
            if (updates.feeling !== undefined) payload.feeling = updates.feeling; 
            if (updates.phoneNumber !== undefined) payload.phone_number = updates.phoneNumber;
            
            if (updates.workStatus !== undefined) payload.work_status = updates.workStatus;
            if (updates.leaveStartDate !== undefined) payload.leave_start_date = updates.leaveStartDate ? updates.leaveStartDate.toISOString() : null;
            if (updates.leaveEndDate !== undefined) payload.leave_end_date = updates.leaveEndDate ? updates.leaveEndDate.toISOString() : null;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${currentUserProfile.id}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                payload.avatar_url = urlData.publicUrl;
            }

            const { error } = await supabase
                .from('profiles')
                .update(payload)
                .eq('id', currentUserProfile.id);

            if (error) throw error;
            
            // Note: Realtime subscription will likely catch this update too, 
            // but optimistic update here makes UI snappier for the user editing their own profile.
            setCurrentUserProfile(prev => prev ? ({ 
                ...prev, 
                ...updates, 
                avatarUrl: payload.avatar_url || prev.avatarUrl 
            }) : null);
            
            return true;
        } catch (err: any) {
            console.error('Update profile failed:', err);
            alert('เกิดข้อผิดพลาด: ' + err.message);
            return false;
        }
    };

    return {
        currentUserProfile,
        fetchProfile,
        updateProfile
    };
};
