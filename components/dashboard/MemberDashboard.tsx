
import React, { useState, useEffect } from 'react';
import { User, Task, Channel, MasterOption, WorkStatus, ViewMode } from '../../types';
import { supabase } from '../../lib/supabase';
import WelcomeHeader from './member/WelcomeHeader';
import FocusZone from './member/FocusZone';
import MyWorkBoard from './member/MyWorkBoard';
import MyDutyWidget from './member/MyDutyWidget';
import WeeklyQuestBoard from '../WeeklyQuestBoard'; 
import ItemShopModal from '../gamification/ItemShopModal';
import GameRulesModal from '../gamification/GameRulesModal'; // Import New Modal
import { useWeeklyQuests } from '../../hooks/useWeeklyQuests';
import { useDuty } from '../../hooks/useDuty';
import { useToast } from '../../context/ToastContext';

interface MemberDashboardProps {
    currentUser: User;
    tasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onEditTask: (task: Task) => void;
    onOpenSettings: () => void;
    onOpenNotifications?: () => void;
    onEditProfile: () => void;
    onRefreshMasterData?: () => Promise<void>;
    onNavigate: (view: ViewMode) => void;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ 
    currentUser, 
    tasks, 
    channels, 
    users, 
    masterOptions, 
    onEditTask, 
    onOpenSettings,
    onOpenNotifications,
    onEditProfile,
    onNavigate
}) => {
    // Local State
    const [localUser, setLocalUser] = useState<User>(currentUser);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [isRulesOpen, setIsRulesOpen] = useState(false); // Rules Modal State
    const { showToast } = useToast();
    
    // Hooks
    const { quests, handleAddQuest, handleDeleteQuest, updateManualProgress, updateQuest } = useWeeklyQuests();
    const { duties } = useDuty();

    // Sync
    useEffect(() => {
        setLocalUser(currentUser);
    }, [currentUser]);

    // Handlers
    const handleUpdateStatus = async (status: WorkStatus) => {
        setLocalUser(prev => ({ ...prev, workStatus: status }));
        try {
            const { error } = await supabase.from('profiles').update({ work_status: status }).eq('id', currentUser.id);
            if (error) throw error;
            showToast(`เปลี่ยนสถานะเป็น ${status} แล้ว`, 'success');
        } catch (err: any) {
            console.error(err);
            setLocalUser(currentUser); 
            showToast('เปลี่ยนสถานะไม่สำเร็จ', 'error');
        }
    };

    const myTasks = tasks.filter(t => 
        t.assigneeIds.includes(currentUser.id) || 
        t.ideaOwnerIds?.includes(currentUser.id) || 
        t.editorIds?.includes(currentUser.id)
    );

    const unreadNotifications = 0; 

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            
            {/* 1. Header */}
            <WelcomeHeader 
                user={localUser}
                onUpdateStatus={handleUpdateStatus}
                onOpenShop={() => setIsShopOpen(true)}
                onOpenNotifications={onOpenNotifications || onOpenSettings}
                onEditProfile={onEditProfile}
                onOpenRules={() => setIsRulesOpen(true)} // Pass Handler
                unreadNotifications={unreadNotifications}
            />

            {/* 2. Widgets */}
            <MyDutyWidget 
                duties={duties} 
                currentUser={currentUser} 
                onNavigate={onNavigate}
            />

            <FocusZone 
                tasks={myTasks} 
                onOpenTask={onEditTask} 
            />

            <MyWorkBoard 
                tasks={myTasks} 
                masterOptions={masterOptions}
                onOpenTask={onEditTask}
            />

            <div className="pt-4 border-t border-gray-100">
                <WeeklyQuestBoard 
                    tasks={tasks}
                    channels={channels}
                    quests={quests}
                    masterOptions={masterOptions}
                    onAddQuest={handleAddQuest}
                    onDeleteQuest={handleDeleteQuest}
                    onOpenSettings={onOpenSettings}
                    onUpdateProgress={updateManualProgress}
                    onUpdateQuest={updateQuest}
                />
            </div>

            {/* Modals */}
            <ItemShopModal 
                isOpen={isShopOpen}
                onClose={() => setIsShopOpen(false)}
                currentUser={localUser}
            />

            <GameRulesModal 
                isOpen={isRulesOpen}
                onClose={() => setIsRulesOpen(false)}
            />
        </div>
    );
};

export default MemberDashboard;
