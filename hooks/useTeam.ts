
import { useUserSession } from '../context/UserSessionContext';

export const useTeam = () => {
    const {
        allUsers,
        activeUsers,
        fetchTeamMembers,
        approveMember,
        removeMember,
        toggleUserStatus,
        updateMember,
        adjustStatsLocally,
        setAllUsers
    } = useUserSession();

    return {
        allUsers,
        activeUsers,
        fetchTeamMembers,
        approveMember,
        removeMember,
        toggleUserStatus,
        updateMember,
        adjustStatsLocally,
        setAllUsers
    };
};

