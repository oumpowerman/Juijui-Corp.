
import React, { useState, useEffect, useMemo } from 'react';
import { User, Task, Channel, MasterOption, WorkStatus, ViewMode, Duty, AppNotification } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

// dnd-kit
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';

// Components
import WelcomeHeader from './member/WelcomeHeader';
import FocusZone from './member/FocusZone';
import MyWorkBoard from './member/MyWorkBoard';
import ItemShopModal from '../gamification/ItemShopModal';
import WorkloadModal from '../workload/WorkloadModal'; 
import MemberReportModal from './member/MemberReportModal'; 
import NegligenceLockModal from '../duty/NegligenceLockModal'; // Import the Modal
import SortableWidget from './widgets/SortableWidget';

// New Refactored Widgets
import SmartAttendance from './widgets/SmartAttendance';
import QuestOverviewWidget from './widgets/QuestOverviewWidget';
import GoalOverviewWidget from './widgets/GoalOverviewWidget';
import HallOfFameWidget from './widgets/HallOfFameWidget';
import MyDutyWidget from './member/MyDutyWidget'; 
import TribunalPublicBulletin from '../dashboard/TribunalPublicBulletin';

// Hooks
import { useWeeklyQuests } from '../../hooks/useWeeklyQuests';
import { useGoals } from '../../hooks/useGoals';
import { useTasks } from '../../hooks/useTasks'; 
import { useDuty } from '../../hooks/useDuty'; // To pass duties to MyDutyWidget manually if we skip DailyMission or customize it

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
    onRefreshProfile?: () => Promise<any>;
    onNavigate: (view: ViewMode) => void;
    onUpdateTask?: (task: Task) => void; 
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
    onRefreshProfile,
    onNavigate
}) => {
    // Local State
    const [localUser, setLocalUser] = useState<User>(currentUser);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [isWorkloadOpen, setIsWorkloadOpen] = useState(false); 
    const [isReportOpen, setIsReportOpen] = useState(false); 
    
    // Negligence Logic
    const [negligenceDuty, setNegligenceDuty] = useState<Duty | null>(null);

    const { showToast } = useToast();

    // Data Hooks
    const { quests } = useWeeklyQuests();
    const { goals } = useGoals(currentUser);
    const { handleSaveTask, handleDeleteTask } = useTasks(); 
    const { duties, setDuties, calendarMetadata } = useDuty(currentUser); // Direct fetch for custom passing

    // --- 🧩 Draggable Widgets Logic ---
    type WidgetId = 'attendance' | 'duty' | 'quest' | 'goal' | 'hall_of_fame' | 'focus_zone' | 'work_board' | 'tribunal_bulletin';

    const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
        const saved = localStorage.getItem(`dashboard_layout_${currentUser.id}`);
        return saved ? JSON.parse(saved) : ['attendance', 'duty', 'focus_zone', 'work_board', 'quest', 'goal', 'hall_of_fame', 'tribunal_bulletin'];
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Avoid accidental drags on click
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setWidgetOrder((items) => {
                const oldIndex = items.indexOf(active.id as WidgetId);
                const newIndex = items.indexOf(over.id as WidgetId);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem(`dashboard_layout_${currentUser.id}`, JSON.stringify(newOrder));
                return newOrder;
            });
        }
    };

    const WIDGET_CONFIG: Record<WidgetId, { span: string }> = {
        attendance: { span: 'xl:col-span-8' },
        duty: { span: 'xl:col-span-4' },
        quest: { span: 'xl:col-span-4' },
        goal: { span: 'xl:col-span-4' },
        hall_of_fame: { span: 'xl:col-span-4' },
        focus_zone: { span: 'xl:col-span-4' },
        work_board: { span: 'xl:col-span-8' },
        tribunal_bulletin: { span: 'xl:col-span-4' },
    };

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

    const handleAcknowledgeNegligence = async () => {
        if (!negligenceDuty) return;
        
        // Optimistic Update
        setDuties(prev => prev.map(d => 
            d.id === negligenceDuty.id ? { ...d, clearedBySystem: true } : d
        ));

        try {
            // Update DB to clear from screen
            const { error } = await supabase.from('duties')
                .update({ cleared_by_system: true })
                .eq('id', negligenceDuty.id);
            
            if (error) throw error;
            
            showToast('รับทราบความผิดแล้ว (Cleared from screen)', 'success');
            setNegligenceDuty(null);
        } catch (err) {
            console.error(err);
            // Revert on error
            setDuties(prev => prev.map(d => 
                d.id === negligenceDuty.id ? { ...d, clearedBySystem: false } : d
            ));
            showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
        }
    };

    const renderWidget = (id: WidgetId) => {
        switch (id) {
            case 'attendance':
                return (
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-sm p-2 hover:shadow-md transition-all h-full">
                        <SmartAttendance 
                            user={currentUser} 
                            masterOptions={masterOptions} 
                            onNavigate={onNavigate}
                        />
                    </div>
                );
            case 'duty':
                return (
                    <div className="h-full bg-gradient-to-br from-orange-50 to-amber-50/50 rounded-[2.5rem] border border-orange-100 shadow-sm p-1 relative overflow-hidden group min-h-[200px]">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110"></div>
                        <MyDutyWidget 
                            duties={duties} 
                            currentUser={currentUser} 
                            users={users}
                            onNavigate={onNavigate}
                            onFixNegligence={setNegligenceDuty}
                            calendarMetadata={calendarMetadata}
                        />
                    </div>
                );
            case 'quest':
                return (
                    <QuestOverviewWidget 
                        quests={quests} 
                        tasks={tasks} 
                        onNavigate={onNavigate} 
                    />
                );
            case 'goal':
                return (
                    <GoalOverviewWidget 
                        goals={goals} 
                        onNavigate={onNavigate} 
                    />
                );
            case 'hall_of_fame':
                return (
                    <HallOfFameWidget 
                        users={users} 
                        currentUser={currentUser} 
                        onNavigate={onNavigate} 
                    />
                );
            case 'focus_zone':
                return (
                    <FocusZone 
                        tasks={myTasks} 
                        channels={channels}
                        users={users}
                        masterOptions={masterOptions}
                        onOpenTask={onEditTask} 
                    />
                );
            case 'work_board':
                return (
                    <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-sm p-6 h-full">
                        <MyWorkBoard 
                            tasks={myTasks} 
                            masterOptions={masterOptions}
                            users={users}
                            currentUser={currentUser} 
                            onOpenTask={onEditTask}
                            onUpdateTask={(t) => handleSaveTask(t, null)} 
                            onDeleteTask={handleDeleteTask}
                        />
                    </div>
                );
            case 'tribunal_bulletin':
                return <TribunalPublicBulletin />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-full bg-[#FDFBF7] pb-24 relative overflow-hidden">
            
            {/* Pastel Ambient Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply animate-pulse"></div>
            <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-[0%] left-[20%] w-[600px] h-[600px] bg-sky-200/30 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" style={{ animationDelay: '4s' }}></div>

            <div className="relative z-10 space-y-6 px-4 pt-4 md:px-6">
                
                {/* --- HEADER (Fixed) --- */}
                <div className="relative z-30">
                    <WelcomeHeader 
                        user={localUser}
                        onUpdateStatus={handleUpdateStatus}
                        onOpenShop={() => setIsShopOpen(true)}
                        onOpenNotifications={onOpenNotifications || onOpenSettings} 
                        onEditProfile={onEditProfile}
                        unreadNotifications={unreadCount}
                        onOpenWorkload={() => setIsWorkloadOpen(true)}
                        onOpenReport={() => setIsReportOpen(true)} 
                    />
                </div>

                {/* --- DRAGGABLE WIDGETS GRID --- */}
                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={widgetOrder}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                            {widgetOrder.map((id) => (
                                <SortableWidget 
                                    key={id} 
                                    id={id} 
                                    className={WIDGET_CONFIG[id].span}
                                >
                                    {renderWidget(id)}
                                </SortableWidget>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {/* Modals */}
            <ItemShopModal 
                isOpen={isShopOpen}
                onClose={() => setIsShopOpen(false)}
                currentUser={localUser}
                onRefreshProfile={onRefreshProfile}
            />

            <WorkloadModal 
                isOpen={isWorkloadOpen}
                onClose={() => setIsWorkloadOpen(false)}
                tasks={tasks}
                users={users}
                currentUser={currentUser}
            />

            <MemberReportModal 
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                user={currentUser}
                tasks={tasks}
            />

            {/* Negligence Lock Modal */}
            {negligenceDuty && (
                <NegligenceLockModal 
                    notification={{
                        id: 'manual_lock_trigger',
                        type: 'SYSTEM_LOCK_PENALTY',
                        title: '⚠️ ละเลยหน้าที่ (Negligence)',
                        message: `คุณได้ปล่อยปละละเลยเวร "${negligenceDuty.title}" จนเกินกำหนด ระบบจำเป็นต้องบันทึกประวัติความผิด (ABANDONED)`,
                        date: new Date(),
                        isRead: false,
                        metadata: { hp: -20 } // Visual feedback
                    } as AppNotification}
                    onAcknowledge={handleAcknowledgeNegligence}
                />
            )}
        </div>
    );
};

export default MemberDashboard;
