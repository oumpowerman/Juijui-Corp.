
import React, { useState, useEffect } from 'react';
import { User, Task, Channel, MasterOption, WorkStatus, ViewMode } from '../../types';
import { supabase } from '../../lib/supabase';
import WelcomeHeader from './member/WelcomeHeader';
import FocusZone from './member/FocusZone';
import MyWorkBoard from './member/MyWorkBoard';
import MyDutyWidget from './member/MyDutyWidget';
import WeeklyQuestBoard from '../WeeklyQuestBoard'; 
import ItemShopModal from '../gamification/ItemShopModal';
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
    unreadCount?: number; // Added prop
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
    unreadCount = 0,
    onEditProfile,
    onNavigate
}) => {
    // Local State for fast UI updates
    const [localUser, setLocalUser] = useState<User>(currentUser);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const { showToast } = useToast();
    
    // Weekly Quests Hook (Reused)
    const { quests, handleAddQuest, handleDeleteQuest, updateManualProgress, updateQuest } = useWeeklyQuests();

    // Duty Hook (To check for daily duties on dashboard)
    const { duties } = useDuty();

    // Sync local user with prop updates (Realtime updates flow down here)
    useEffect(() => {
        setLocalUser(currentUser);
    }, [currentUser]);

    // Update Status Handler
    const handleUpdateStatus = async (status: WorkStatus) => {
        // Optimistic Update
        setLocalUser(prev => ({ ...prev, workStatus: status }));
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ work_status: status })
                .eq('id', currentUser.id);
            
            if (error) throw error;
            showToast(`เปลี่ยนสถานะเป็น ${status} แล้ว`, 'success');
        } catch (err: any) {
            console.error(err);
            // Revert on error
            setLocalUser(currentUser); 
            showToast('เปลี่ยนสถานะไม่สำเร็จ', 'error');
        }
    };

    // Filter Tasks specific to this user (For Personal Board)
    const myTasks = tasks.filter(t => 
        t.assigneeIds.includes(currentUser.id) || 
        t.ideaOwnerIds?.includes(currentUser.id) || 
        t.editorIds?.includes(currentUser.id)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            
            {/* 1. Welcome & Gamification Header */}
            <WelcomeHeader 
                user={localUser}
                onUpdateStatus={handleUpdateStatus}
                onOpenShop={() => setIsShopOpen(true)}
                onOpenNotifications={onOpenNotifications || onOpenSettings} 
                onEditProfile={onEditProfile}
                unreadNotifications={unreadCount}
            />

            {/* 2. My Duty Warning (High Priority) */}
            <MyDutyWidget 
                duties={duties} 
                currentUser={currentUser} 
                onNavigate={onNavigate}
            />

            {/* 3. Focus Zone (Urgent / Revise) */}
            <FocusZone 
                tasks={myTasks} 
                onOpenTask={onEditTask} 
            />

            {/* 4. My Work Board (Kanban) - Show ONLY my tasks */}
            <MyWorkBoard 
                tasks={myTasks} 
                masterOptions={masterOptions}
                onOpenTask={onEditTask}
            />

            {/* 5. Weekly Quests - Pass ALL tasks for Team Goals Calculation */}
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

            {/* 6. Item Shop Modal */}
            <ItemShopModal 
                isOpen={isShopOpen}
                onClose={() => setIsShopOpen(false)}
                currentUser={localUser}
            />
        </div>
    );
};

export default MemberDashboard;
