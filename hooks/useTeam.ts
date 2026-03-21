
import { useUserSession } from '../context/UserSessionContext';

export const useTeam = () => {
    const {
        allUsers,
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
        fetchTeamMembers,
        approveMember,
        removeMember,
        toggleUserStatus,
        updateMember,
        adjustStatsLocally,
        setAllUsers
    };
};

