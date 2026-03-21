
import { User } from '../types';
import { useUserSession } from '../context/UserSessionContext';

export const useAuth = (sessionUser: any) => {
    const { currentUserProfile, fetchProfile, updateProfile } = useUserSession();

    return {
        currentUserProfile,
        fetchProfile,
        updateProfile
    };
};

