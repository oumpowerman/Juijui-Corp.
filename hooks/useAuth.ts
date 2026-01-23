
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, WorkStatus } from '../types';

export const useAuth = (sessionUser: any) => {
    const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);

    const fetchProfile = async () => {
        if (!sessionUser) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            if (error) throw error;

            // Mapping ข้อมูลจาก DB ลงใน Interface User ของเรา
            const mappedUser: User = {
                id: data.id,
                email: data.email,
                name: data.full_name || 'No Name',
                role: data.role, // สิทธิ์ระบบ: ADMIN, MEMBER
                avatarUrl: data.avatar_url,
                position: data.position || 'Member', // ตำแหน่งงานในบริษัท
                phoneNumber: data.phone_number, // เบอร์โทร
                bio: data.bio || '', // ADDED: Mapped bio field
                feeling: data.feeling || '', // ADDED: Mapped feeling field
                isApproved: data.is_approved,
                isActive: data.is_active !== false,
                xp: data.xp || 0,
                level: data.level || 1,
                availablePoints: data.available_points || 0,
                hp: data.hp || 100,
                maxHp: data.max_hp || 100,
                
                // --- NEW STATUS FIELDS ---
                workStatus: (data.work_status as WorkStatus) || 'ONLINE',
                leaveStartDate: data.leave_start_date ? new Date(data.leave_start_date) : null,
                leaveEndDate: data.leave_end_date ? new Date(data.leave_end_date) : null,
            };
            
            setCurrentUserProfile(mappedUser);
            return mappedUser;
        } catch (err: any) {
            console.error('Fetch profile failed:', err);
            return null;
        }
    };

    const updateProfile = async (updates: Partial<User>, avatarFile?: File) => {
        if (!currentUserProfile) return false;
        
        try {
            const payload: any = {};
            
            // Check undefined to allow empty strings (clearing data)
            if (updates.name !== undefined) payload.full_name = updates.name;
            if (updates.position !== undefined) payload.position = updates.position;
            if (updates.bio !== undefined) payload.bio = updates.bio; 
            if (updates.feeling !== undefined) payload.feeling = updates.feeling; 
            
            // Map camelCase (Frontend) to snake_case (Database) correctly
            if (updates.phoneNumber !== undefined) payload.phone_number = updates.phoneNumber;
            
            // --- NEW STATUS UPDATES ---
            if (updates.workStatus !== undefined) payload.work_status = updates.workStatus;
            if (updates.leaveStartDate !== undefined) payload.leave_start_date = updates.leaveStartDate ? updates.leaveStartDate.toISOString() : null;
            if (updates.leaveEndDate !== undefined) payload.leave_end_date = updates.leaveEndDate ? updates.leaveEndDate.toISOString() : null;

            // Handle File Upload
            if (avatarFile) {
                // Sanitize filename to avoid issues with special characters
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

            // Update Local State immediately
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
