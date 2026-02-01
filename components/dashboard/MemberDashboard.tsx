
import React, { useState, useEffect } from 'react';
import { User, Task, Channel, MasterOption, WorkStatus, ViewMode } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

// Components
import WelcomeHeader from './member/WelcomeHeader';
import FocusZone from './member/FocusZone';
import MyWorkBoard from './member/MyWorkBoard';
import ItemShopModal from '../gamification/ItemShopModal';

// New Refactored Widgets
import SmartAttendance from './widgets/SmartAttendance';
import DailyMission from './widgets/DailyMission';
import QuestBoardWidget from './widgets/QuestBoardWidget';

interface MemberDashboardProps {
    currentUser: User;
    tasks: Task[];
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onEditTask: (task: Task) => void;
    onOpenSettings: () => void;
    onOpenNotifications?: () => void;
    unreadCount?: number; 
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
    // Local State for UI responsiveness
    const [localUser, setLocalUser] = useState<User>(currentUser);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const { showToast } = useToast();

    // Sync local user
    useEffect(() => {
        setLocalUser(currentUser);
    }, [currentUser]);

    // Handle Status Update (Optimistic)
    const handleUpdateStatus = async (status: WorkStatus) => {
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
            setLocalUser(currentUser); // Revert
            showToast('เปลี่ยนสถานะไม่สำเร็จ', 'error');
        }
    };

    // Filter My Tasks for Board & Focus Zone
    const myTasks = tasks.filter(t => 
        t.assigneeIds.includes(currentUser.id) || 
        t.ideaOwnerIds?.includes(currentUser.id) || 
        t.editorIds?.includes(currentUser.id)
    );

    return (
        <div className="min-h-full bg-[#FDFBF7] pb-24 relative overflow-hidden">
            
            {/* Pastel Ambient Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply animate-pulse"></div>
            <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-[0%] left-[20%] w-[600px] h-[600px] bg-sky-200/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" style={{ animationDelay: '4s' }}></div>

            <div className="relative z-10 space-y-6 px-4 pt-4 md:px-6">
                
                {/* --- ROW 1: HEADER & ATTENDANCE --- */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    
                    {/* Left: Profile & Attendance */}
                    <div className="xl:col-span-8 flex flex-col gap-6">
                         <WelcomeHeader 
                            user={localUser}
                            onUpdateStatus={handleUpdateStatus}
                            onOpenShop={() => setIsShopOpen(true)}
                            onOpenNotifications={onOpenNotifications || onOpenSettings} 
                            onEditProfile={onEditProfile}
                            unreadNotifications={unreadCount}
                        />
                        {/* Attendance Bar */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-sm p-2 hover:shadow-md transition-all">
                             <SmartAttendance 
                                user={currentUser} 
                                masterOptions={masterOptions} 
                            />
                        </div>
                    </div>

                    {/* Right: Daily Mission */}
                    <div className="xl:col-span-4 flex flex-col h-full">
                        <div className="h-full bg-gradient-to-br from-orange-50 to-amber-50/50 rounded-[2.5rem] border border-orange-100 shadow-sm p-1 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-40 h-40 bg-white/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110"></div>
                             <DailyMission 
                                currentUser={currentUser}
                                onNavigate={onNavigate}
                            />
                        </div>
                    </div>
                </div>

                {/* --- ROW 2: WORKSPACE --- */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    
                    {/* Focus Zone (Left Side - 35% ish on XL) */}
                    <div className="xl:col-span-4 flex flex-col gap-4">
                        <FocusZone 
                            tasks={myTasks} 
                            channels={channels}
                            users={users}
                            onOpenTask={onEditTask} 
                        />
                    </div>

                    {/* My Work Board (Right Side - 65% ish on XL) */}
                    <div className="xl:col-span-8">
                        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-sm p-6 h-full">
                             <MyWorkBoard 
                                tasks={myTasks} 
                                masterOptions={masterOptions}
                                users={users}
                                onOpenTask={onEditTask}
                            />
                        </div>
                    </div>
                </div>

                {/* --- ROW 3: TEAM QUESTS --- */}
                <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 rounded-[2.5rem] border border-white/50 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 opacity-30"></div>
                    <QuestBoardWidget 
                        tasks={tasks}
                        channels={channels}
                        masterOptions={masterOptions}
                        onOpenSettings={onOpenSettings}
                    />
                </div>
            </div>

            {/* Modals */}
            <ItemShopModal 
                isOpen={isShopOpen}
                onClose={() => setIsShopOpen(false)}
                currentUser={localUser}
            />
        </div>
    );
};

export default MemberDashboard;
