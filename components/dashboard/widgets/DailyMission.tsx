
import React from 'react';
import { User, ViewMode } from '../../../types';
import { useDuty } from '../../../hooks/useDuty';
import MyDutyWidget from '../member/MyDutyWidget';

interface DailyMissionProps {
    currentUser: User;
    onNavigate: (view: ViewMode) => void;
}

const DailyMission: React.FC<DailyMissionProps> = ({ currentUser, onNavigate }) => {
    const { duties } = useDuty(); // Hook handles fetching and realtime updates

    return (
        <MyDutyWidget 
            duties={duties} 
            currentUser={currentUser} 
            onNavigate={onNavigate}
        />
    );
};

export default DailyMission;
