
import React, { useState, useEffect } from 'react';
import { User, Task, Channel, MasterOption, WorkStatus } from '../../types';
import { supabase } from '../../lib/supabase';
import WelcomeHeader from './member/WelcomeHeader';
import FocusZone from './member/FocusZone';
import MyWorkBoard from './member/MyWorkBoard';
import MyDutyWidget from './member/MyDutyWidget'; // Import Widget
import WeeklyQuestBoard from '../WeeklyQuestBoard'; 
import ItemShopModal from '../gamification/ItemShopModal';
import { useWeeklyQuests } from '../../hooks/useWeeklyQuests';
import { useDuty } from '../../hooks/useDuty'; // Import Hook
import { useToast } from '../../context/ToastContext';

interface MemberDashboardProps {
    currentUser: User;
    tasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onEditTask: (task: Task) => void;
    onOpenSettings: () => void;
    onEditProfile: () => void; // New Prop
    onRefreshMasterData?: () => Promise<void>;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ 
    currentUser, 
    tasks, 
    channels, 
    users, 
    masterOptions, 
    onEditTask, 
    onOpenSettings,
    onEditProfile 
}) => {
    // Local State for fast UI updates
    const [localUser, setLocalUser] = useState<User>(currentUser);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const { showToast } = useToast();
    
    // Weekly Quests Hook (Reused)
    const { quests, handleAddQuest, handleDeleteQuest } = useWeeklyQuests();

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

    // Filter Tasks specific to this user
    const myTasks = tasks.filter(t => 
        t.assigneeIds.includes(currentUser.id) || 
        t.ideaOwnerIds?.includes(currentUser.id) || 
        t.editorIds?.includes(currentUser.id)
    );

    // Mock Notification Count
    const unreadNotifications = 0; 

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            
            {/* 1. Welcome & Gamification Header */}
            <WelcomeHeader 
                user={localUser}
                onUpdateStatus={handleUpdateStatus}
                onOpenShop={() => setIsShopOpen(true)}
                onOpenNotifications={onOpenSettings}
                onEditProfile={onEditProfile}
                unreadNotifications={unreadNotifications}
            />

            {/* 2. My Duty Warning (High Priority) */}
            <MyDutyWidget 
                duties={duties} 
                currentUser={currentUser} 
            />

            {/* 3. Focus Zone (Urgent / Revise) */}
            <FocusZone 
                tasks={myTasks} 
                onOpenTask={onEditTask} 
            />

            {/* 4. My Work Board (Kanban) */}
            <MyWorkBoard 
                tasks={myTasks} 
                masterOptions={masterOptions}
                onOpenTask={onEditTask}
            />

            {/* 5. Weekly Quests */}
            <div className="pt-4 border-t border-gray-100">
                <WeeklyQuestBoard 
                    tasks={myTasks}
                    channels={channels}
                    quests={quests}
                    masterOptions={masterOptions}
                    onAddQuest={handleAddQuest}
                    onDeleteQuest={handleDeleteQuest}
                    onOpenSettings={onOpenSettings}
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
