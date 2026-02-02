
import React from 'react';
import { User, ViewMode } from '../../../types';
import { useDuty } from '../../../hooks/useDuty';
import MyDutyWidget from '../member/MyDutyWidget';

interface DailyMissionProps {
    currentUser: User;
    onNavigate: (view: ViewMode) => void;
    users?: User[]; // Added users prop
}

const DailyMission: React.FC<DailyMissionProps> = ({ currentUser, onNavigate, users = [] }) => {
    const { duties } = useDuty(); // Hook handles fetching and realtime updates

    return (
        <MyDutyWidget 
            duties={duties} 
            currentUser={currentUser} 
            users={users} // Pass users down
            onNavigate={onNavigate}
        />
    );
};

export default DailyMission;
