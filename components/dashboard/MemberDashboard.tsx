
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { User, Task, Channel, MasterOption, WorkStatus, ViewMode, Duty, AppNotification } from '../../types';

const WORKSPACE_SPRING = {
    type: 'spring' as const,
    stiffness: 260,
    damping: 28,
    mass: 0.9,
};
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { isTaskCompleted } from '../../constants';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

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
import NegligenceLockModal from '../duty/NegligenceLockModal'; 
import SortableWidget from './widgets/SortableWidget';
import AppBackground from '../common/AppBackground';
import PastelWaveBackground from './member/PastelWaveBackground';
import { BACKGROUND_SHOP_CONFIG } from '../../config/backgroundShop';
import { Sparkles } from 'lucide-react';

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
    const { goals } = useGoals(currentUser, channels);
    const { handleSaveTask, handleDeleteTask } = useTasks(); 
    const { duties, setDuties, calendarMetadata } = useDuty(currentUser); // Direct fetch for custom passing

    // --- 🧩 Draggable Widgets Logic ---
    type WidgetId = 'attendance' | 'duty' | 'quest' | 'goal' | 'hall_of_fame' | 'focus_zone' | 'work_board' | 'tribunal_bulletin';

    const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
        const saved = localStorage.getItem(`dashboard_layout_${currentUser.id}`);
        return saved ? JSON.parse(saved) : ['attendance', 'duty', 'focus_zone', 'work_board', 'quest', 'goal', 'hall_of_fame', 'tribunal_bulletin'];
    });

    // WorkBoard Full-Width Expansion State (Persistent in DB profiles.settings & LocalStorage)
    const [isWorkBoardExpanded, setIsWorkBoardExpanded] = useState<boolean>(() => {
        const savedLocal = localStorage.getItem(`member_workboard_expanded_${currentUser.id}`);
        if (savedLocal === 'true' || savedLocal === 'false') {
            return savedLocal === 'true';
        }
        if (currentUser?.settings?.workboard_expanded !== undefined) {
            return Boolean(currentUser.settings.workboard_expanded);
        }
        return false;
    });

    // Synchronize when DB profile settings load or change
    useEffect(() => {
        if (currentUser?.settings?.workboard_expanded !== undefined) {
            const dbVal = Boolean(currentUser.settings.workboard_expanded);
            setIsWorkBoardExpanded(dbVal);
            localStorage.setItem(`member_workboard_expanded_${currentUser.id}`, String(dbVal));
        }
    }, [currentUser.id, currentUser?.settings?.workboard_expanded]);

    // Track XL breakpoint (1280px+) for horizontal vs vertical coordinated slide physics
    const [isXlViewport, setIsXlViewport] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia('(min-width: 1280px)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mql = window.matchMedia('(min-width: 1280px)');
        const onChange = (e: MediaQueryListEvent) => setIsXlViewport(e.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    const handleToggleWorkBoardExpand = async () => {
        const next = !isWorkBoardExpanded;
        // 1. Optimistic UI update
        setIsWorkBoardExpanded(next);
        // 2. LocalStorage fast cache fallback (persists across view navigation & reload)
        localStorage.setItem(`member_workboard_expanded_${currentUser.id}`, String(next));

        // 3. Persist to DB profiles table under settings JSONB
        try {
            const baseSettings =
                localUser.settings && typeof localUser.settings === 'object'
                    ? localUser.settings
                    : currentUser.settings && typeof currentUser.settings === 'object'
                      ? currentUser.settings
                      : {};
            const updatedSettings = {
                ...baseSettings,
                workboard_expanded: next,
            };

            setLocalUser(prev => ({ ...prev, settings: updatedSettings }));

            const { error } = await supabase
                .from('profiles')
                .update({ settings: updatedSettings })
                .eq('id', currentUser.id);

            if (error) {
                console.warn('Could not persist workboard_expanded to profiles.settings:', error.message);
            } else if (onRefreshProfile) {
                onRefreshProfile();
            }
        } catch (err: any) {
            console.warn('DB settings sync error:', err);
        }
    };

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

    const WIDGET_CONFIG: Record<WidgetId, { span: string; hFull?: boolean }> = {
        attendance: { span: 'xl:col-span-8', hFull: true },
        duty: { span: 'xl:col-span-4', hFull: true },
        quest: { span: 'xl:col-span-4', hFull: true },
        goal: { span: 'xl:col-span-4', hFull: true },
        hall_of_fame: { span: 'xl:col-span-4', hFull: true },
        focus_zone: { span: 'xl:col-span-4', hFull: true },
        work_board: { span: isWorkBoardExpanded ? 'xl:col-span-12' : 'xl:col-span-8', hFull: true },
        tribunal_bulletin: { span: 'xl:col-span-4', hFull: true },
    };

    // Sync local user + fallback setting for wave background
    useEffect(() => {
        let isWaveEnabled = currentUser.waveBgEnabled;
        if (currentUser && currentUser.waveBgEnabled === undefined) {
            const saved = localStorage.getItem(`wave_bg_enabled_${currentUser.id}`);
            isWaveEnabled = saved !== 'false'; // Default to true
        }
        setLocalUser(prev => ({ 
            ...currentUser, 
            waveBgEnabled: isWaveEnabled 
        }));
    }, [currentUser]);

    // Handle Wave Background Toggle (Persistent)
    const handleToggleWaveBg = async () => {
        const newValue = localUser.waveBgEnabled === false ? true : false;
        
        // Optimistic update
        setLocalUser(prev => ({ ...prev, waveBgEnabled: newValue }));
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ wave_bg_enabled: newValue })
                .eq('id', currentUser.id);
                
            if (error) throw error;
            showToast(newValue ? 'เปิดเอฟเฟกต์คลื่นน้ำพาสเทลแล้ว' : 'ปิดเอฟเฟกต์คลื่นน้ำพาสเทลแล้ว', 'success');
        } catch (err: any) {
            console.error('Failed to update wave background setting in DB:', err);
            // Save to localStorage as a robust sandbox fallback
            localStorage.setItem(`wave_bg_enabled_${currentUser.id}`, String(newValue));
            showToast('บันทึกการตั้งค่าลงในเครื่องแล้ว', 'success');
        }
    };

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

    // Calculate Urgent + Overdue Tasks Count for 5-Tier Alert Badge (100% synced with FocusZone criteria)
    const urgencyStats = useMemo(() => {
        const today = startOfDay(new Date());

        let urgentCount = 0;
        let overdueCount = 0;

        myTasks.forEach(t => {
            if (t.isUnscheduled) return;
            const s = (t.status || '').toString();
            if (isTaskCompleted(s)) return;

            const isReviseStatus =
                s === 'FEEDBACK' ||
                s === 'WAITING' ||
                s === 'REVISE' ||
                s.includes('EDIT_DRAFT');

            if (isReviseStatus) {
                urgentCount++;
                return;
            }

            if (!t.endDate) {
                if (t.priority === 'URGENT') urgentCount++;
                return;
            }

            const taskDate = startOfDay(new Date(t.endDate));
            const diff = differenceInCalendarDays(taskDate, today);
            const isOverdue = diff < 0;
            const isDueSoon = diff >= 0 && diff <= 2;

            if (isOverdue) {
                overdueCount++;
            } else if (isDueSoon || t.priority === 'URGENT') {
                urgentCount++;
            }
        });

        const totalScore = urgentCount + overdueCount;
        let tier: 1 | 2 | 3 | 4 | 5 = 1;
        if (totalScore >= 13) tier = 5;
        else if (totalScore >= 9) tier = 4;
        else if (totalScore >= 6) tier = 3;
        else if (totalScore >= 3) tier = 2;
        else tier = 1;

        return {
            urgentCount,
            overdueCount,
            totalScore,
            tier,
        };
    }, [myTasks]);

    const renderWidget = (id: WidgetId) => {
        switch (id) {
            case 'attendance':
                return (
                    <SmartAttendance 
                        user={currentUser} 
                        masterOptions={masterOptions} 
                        onNavigate={onNavigate}
                        hFull={WIDGET_CONFIG[id].hFull}
                    />
                );
            case 'duty':
                return (
                    <MyDutyWidget 
                        duties={duties} 
                        currentUser={currentUser} 
                        users={users}
                        onNavigate={onNavigate}
                        onFixNegligence={setNegligenceDuty}
                        calendarMetadata={calendarMetadata}
                    />
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
                        onToggleCollapse={handleToggleWorkBoardExpand}
                    />
                );
            case 'work_board':
                return (
                    <MyWorkBoard 
                        tasks={myTasks} 
                        masterOptions={masterOptions}
                        users={users}
                        currentUser={currentUser} 
                        onOpenTask={onEditTask}
                        onUpdateTask={(t) => handleSaveTask(t, null)} 
                        onDeleteTask={handleDeleteTask}
                        isExpanded={isWorkBoardExpanded}
                        onToggleExpand={handleToggleWorkBoardExpand}
                        urgentCount={urgencyStats.totalScore}
                        urgencyStats={urgencyStats}
                    />
                );
            case 'tribunal_bulletin':
                return <TribunalPublicBulletin />;
            default:
                return null;
        }
    };

    const currentBg = BACKGROUND_SHOP_CONFIG.find(b => b.id === (localUser as any).equippedBgId) 
                      || BACKGROUND_SHOP_CONFIG[0];

    return (
        <AppBackground theme={currentBg.theme} pattern={currentBg.pattern} className="p-4 md:p-8 min-h-screen relative overflow-hidden">
            {/* Ambient Animated Pastel Wave Background */}
            <AnimatePresence initial={false}>
                {currentBg.id === 'bg-pastel-wave' && (
                    <motion.div
                        key="pastel-wave-scene"
                        initial={{ clipPath: 'inset(0% 100% 0% 0%)', opacity: 1 }}
                        animate={{
                            clipPath: 'inset(0% 0% 0% 0%)',
                            opacity: 1,
                            transition: { duration: 1.18, ease: [0.22, 1, 0.36, 1] as const },
                        }}
                        exit={{
                            opacity: [1, 1, 0],
                            transition: { duration: 1.18, times: [0, 0.9, 1], ease: 'linear' },
                        }}
                        className="fixed inset-0 pointer-events-none z-0"
                    >
                        <PastelWaveBackground enabled={localUser.waveBgEnabled !== false} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 space-y-6 pb-20">
                
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

                {/* --- APP FEATURES BAR (Pastel glass pill) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20">
                    <div id="live-waves-toggle" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 bg-white/70 backdrop-blur-md rounded-3xl border border-white/60 shadow-xs transition-all duration-500">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 bg-gradient-to-tr from-pink-400 via-rose-350 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-sm">
                                <Sparkles className="w-4 h-4 animate-pulse" />
                            </span>
                            <div className="text-left">
                                <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">ธีมคลื่นน้ำพาสเทลเคลื่อนไหว (Live Ambient Waves)</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">สัมผัสความน่ารัก สบายตา ด้วยอะนิเมชันจำลองยอดคลื่นสายน้ำพาสเทล ไหลลื่นและเปลี่ยนคู่สีได้อิสระ</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-full transition-all duration-300 ${
                                localUser.waveBgEnabled !== false
                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-150/50'
                                    : 'bg-slate-50 text-slate-400 border border-slate-150/40'
                            }`}>
                                {localUser.waveBgEnabled !== false ? 'เปิดคลื่นน้ำอยู่ 🌊' : 'ปิดคลื่นน้ำแล้ว 💤'}
                            </span>
                            
                            {/* Custom Elegant Toggle Switch */}
                            <button
                                type="button"
                                onClick={handleToggleWaveBg}
                                aria-label="Toggle wave background animation"
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-500 focus:outline-none cursor-pointer ${
                                    localUser.waveBgEnabled !== false 
                                        ? 'bg-gradient-to-r from-pink-400 to-indigo-500' 
                                        : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400/90 transition-all shadow-inner'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-500 ${
                                        localUser.waveBgEnabled !== false 
                                            ? 'translate-x-[24px]' 
                                            : 'translate-x-[4px]'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* COZY ULTIMATE WORKROOM ACCESS PILL */}
                    <button
                        type="button"
                        onClick={() => onNavigate('ULTIMATE_WORKROOM')}
                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 bg-gradient-to-tr from-slate-900/90 via-indigo-950/85 to-indigo-900/90 border border-indigo-500/30 text-left rounded-3xl shadow-lg relative overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_8px_24px_rgba(99,102,241,0.25)] hover:border-indigo-400/50 cursor-pointer"
                    >
                        {/* Shimmer glowing backdrop light */}
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        
                        <div className="flex items-center gap-3 relative z-10">
                            <span className="p-2.5 bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                <span className="animate-pulse">🌌</span>
                            </span>
                            <div>
                                <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                                    <span>Cozy Interactive Workroom</span>
                                    <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-bold">COCKPIT</span>
                                </h4>
                                <p className="text-[10px] text-slate-300 mt-0.5 font-medium leading-relaxed">
                                    วาร์ปเข้าสู่ห้องจำลองจำเนียรเวทมนตร์ดวงดาวเงียบสงบ เพื่อปั้นพลังเวทมนตร์สะกดสมาธิ
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto relative z-10">
                            <span className="text-[9.5px] font-bold px-3 py-1 bg-gradient-to-r from-pink-500 to-indigo-500 group-hover:from-pink-400 group-hover:to-indigo-400 text-white rounded-full shadow-md transition-all duration-300">
                                ประตูมิติมาร์ป ⚡
                            </span>
                        </div>
                    </button>
                </div>

                {/* --- DRAGGABLE WIDGETS GRID --- */}
                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={isWorkBoardExpanded ? widgetOrder.filter(id => id !== 'focus_zone') : widgetOrder}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch relative">
                            {widgetOrder.map((id) => {
                                // Skip standalone focus_zone since it renders in the coordinated interactive row with work_board
                                if (id === 'focus_zone') return null;

                                if (id === 'work_board') {
                                    const focusIdx = widgetOrder.indexOf('focus_zone');
                                    const boardIdx = widgetOrder.indexOf('work_board');
                                    const isFocusOnRight = focusIdx !== -1 && focusIdx > boardIdx;
                                    const slideOffset = isFocusOnRight ? 180 : -180;

                                    const drawerContainerVariants: Variants = isXlViewport
                                        ? {
                                              initial: {
                                                  width: 0,
                                                  opacity: 0,
                                                  marginRight: 0,
                                                  marginLeft: 0,
                                              },
                                              animate: {
                                                  width: 'calc(33.333333% - 16px)',
                                                  opacity: 1,
                                                  marginRight: isFocusOnRight ? 0 : 24,
                                                  marginLeft: isFocusOnRight ? 24 : 0,
                                                  transition: WORKSPACE_SPRING,
                                              },
                                              exit: {
                                                  width: 0,
                                                  opacity: 0,
                                                  marginRight: 0,
                                                  marginLeft: 0,
                                                  transition: WORKSPACE_SPRING,
                                              },
                                          }
                                        : {
                                              initial: {
                                                  height: 0,
                                                  opacity: 0,
                                                  marginBottom: 0,
                                              },
                                              animate: {
                                                  height: 'auto',
                                                  opacity: 1,
                                                  marginBottom: 24,
                                                  transition: WORKSPACE_SPRING,
                                              },
                                              exit: {
                                                  height: 0,
                                                  opacity: 0,
                                                  marginBottom: 0,
                                                  transition: WORKSPACE_SPRING,
                                              },
                                          };

                                    const drawerCardSlideVariants: Variants = {
                                        initial: {
                                            x: slideOffset,
                                            opacity: 0,
                                            scale: 0.94,
                                        },
                                        animate: {
                                            x: 0,
                                            opacity: 1,
                                            scale: 1,
                                            transition: WORKSPACE_SPRING,
                                        },
                                        exit: {
                                            x: slideOffset,
                                            opacity: 0,
                                            scale: 0.94,
                                            transition: WORKSPACE_SPRING,
                                        },
                                    };

                                    const focusDrawerElement = (
                                        <AnimatePresence initial={false}>
                                            {!isWorkBoardExpanded && (
                                                <motion.div
                                                    key="focus-zone-drawer"
                                                    variants={drawerContainerVariants}
                                                    initial="initial"
                                                    animate="animate"
                                                    exit="exit"
                                                    className="overflow-hidden flex-shrink-0 flex flex-col"
                                                >
                                                    <motion.div
                                                        variants={drawerCardSlideVariants}
                                                        initial="initial"
                                                        animate="animate"
                                                        exit="exit"
                                                        className="w-full min-w-[300px] xl:min-w-[360px] h-full flex flex-col"
                                                    >
                                                        <SortableWidget
                                                            id="focus_zone"
                                                            className="w-full h-full"
                                                            hFull={true}
                                                        >
                                                            {renderWidget('focus_zone')}
                                                        </SortableWidget>
                                                    </motion.div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    );

                                    const workBoardElement = (
                                        <div key="work-board-flex" className="flex-1 min-w-0 flex flex-col">
                                            <SortableWidget
                                                id="work_board"
                                                className="w-full h-full"
                                                hFull={true}
                                            >
                                                {renderWidget('work_board')}
                                            </SortableWidget>
                                        </div>
                                    );

                                    return (
                                        <div
                                            key="workspace_interactive_row"
                                            className="xl:col-span-12 flex flex-col xl:flex-row gap-0 items-stretch relative"
                                        >
                                            {isFocusOnRight ? (
                                                <>
                                                    {workBoardElement}
                                                    {focusDrawerElement}
                                                </>
                                            ) : (
                                                <>
                                                    {focusDrawerElement}
                                                    {workBoardElement}
                                                </>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <SortableWidget 
                                        key={id} 
                                        id={id} 
                                        className={WIDGET_CONFIG[id].span}
                                        hFull={WIDGET_CONFIG[id].hFull}
                                    >
                                        {renderWidget(id)}
                                    </SortableWidget>
                                );
                            })}
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
                onOpenTask={onEditTask}
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
        </AppBackground>
    );
};

export default MemberDashboard;
