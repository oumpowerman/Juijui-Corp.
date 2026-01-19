
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

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

            const mappedUser: User = {
                id: data.id,
                email: data.email,
                name: data.full_name || 'No Name',
                role: data.role,
                avatarUrl: data.avatar_url,
                position: data.position || 'Member',
                phoneNumber: data.phone_number,
                isApproved: data.is_approved,
                isActive: data.is_active !== false, // Default to true if undefined
                xp: data.xp || 0,
                level: data.level || 1,
                availablePoints: data.available_points || 0 // NEW
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
            if (updates.name) payload.full_name = updates.name;
            if (updates.position) payload.position = updates.position;
            if (updates.phoneNumber) payload.phone_number = updates.phoneNumber;
            
            // Handle File Upload if provided
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${currentUserProfile.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                // 1. Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                // 2. Get Public URL
                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                payload.avatar_url = urlData.publicUrl;
            } else if (updates.avatarUrl !== undefined) {
                // Fallback for URL string update (if needed)
                payload.avatar_url = updates.avatarUrl;
            }

            // 3. Update Profile Data in DB
            const { error } = await supabase
                .from('profiles')
                .update(payload)
                .eq('id', currentUserProfile.id);

            if (error) throw error;

            // Update local state
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
