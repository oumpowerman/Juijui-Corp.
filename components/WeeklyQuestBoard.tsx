
import React, { useState, useMemo } from 'react';
import { Target, ChevronLeft, ChevronRight, Plus, Bell, Info } from 'lucide-react';
import { endOfWeek, addWeeks, format, isWithinInterval, addDays, areIntervalsOverlapping } from 'date-fns';
import { Task, Channel, WeeklyQuest, MasterOption } from '../types';
import MentorTip from './MentorTip';
import { useWeeklyQuests } from '../hooks/useWeeklyQuests';

// Import New Sub-components
import QuestCard from './weekly-quest/QuestCard';
import CreateQuestModal from './weekly-quest/CreateQuestModal';
import QuestDetailModal from './weekly-quest/QuestDetailModal';
import InfoModal from './ui/InfoModal';
import QuestGuide from './weekly-quest/QuestGuide';

interface WeeklyQuestBoardProps {
    tasks: Task[];
    channels: Channel[];
    quests: WeeklyQuest[];
    masterOptions?: MasterOption[]; 
    onAddQuest: (quest: Omit<WeeklyQuest, 'id'>) => void;
    onDeleteQuest: (id: string) => void;
    onOpenSettings: () => void;
}

const WeeklyQuestBoard: React.FC<WeeklyQuestBoardProps> = ({ tasks, channels, quests, masterOptions = [], onAddQuest, onDeleteQuest, onOpenSettings }) => {
    const { updateManualProgress } = useWeeklyQuests();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingChannelId, setViewingChannelId] = useState<string | null>(null); 
    const [isInfoOpen, setIsInfoOpen] = useState(false); // Info Modal State

    // Manual startOfWeek (Monday start)
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1); // Monday start
        d.setDate(d.getDate() - day + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const weekStart = getStartOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

    // --- FILTER QUESTS (Overlap Logic) ---
    // Show quest if its duration overlaps with the current view week
    const currentQuests = useMemo(() => {
        return quests.filter(q => {
            const qStart = new Date(q.weekStartDate);
            qStart.setHours(0, 0, 0, 0);
            
            // Use custom endDate if available, else default to +6 days (1 week)
            const qEnd = q.endDate ? new Date(q.endDate) : addDays(qStart, 6);
            qEnd.setHours(23, 59, 59, 999);
            
            // Check overlap: (StartA <= EndB) and (EndA >= StartB)
            return areIntervalsOverlapping(
                { start: qStart, end: qEnd },
                { start: weekStart, end: weekEnd }
            );
        });
    }, [quests, weekStart, weekEnd]);

    const groupedQuests = useMemo(() => {
        const groups: Record<string, WeeklyQuest[]> = {};
        const miscQuests: WeeklyQuest[] = [];

        currentQuests.forEach(q => {
            if (q.channelId) {
                if (!groups[q.channelId]) groups[q.channelId] = [];
                groups[q.channelId].push(q);
            } else {
                miscQuests.push(q);
            }
        });

        return { groups, miscQuests };
    }, [currentQuests]);

    // Data for Modal
    const viewingChannel = viewingChannelId && viewingChannelId !== 'MISC' 
        ? channels.find(c => c.id === viewingChannelId) 
        : undefined;
    
    const viewingQuests = viewingChannelId 
        ? (viewingChannelId === 'MISC' ? groupedQuests.miscQuests : groupedQuests.groups[viewingChannelId] || [])
        : [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip 
                variant="purple" 
                messages={[
                    "ใหม่! ระบบ Quest ยืดหยุ่น: สร้างเควสเริ่มวันไหนก็ได้ กำหนดวันจบเองได้ ไม่ต้องล็อค 7 วัน",
                    "เควสที่ระยะเวลาคาบเกี่ยว (Overlap) กับสัปดาห์นี้ จะโผล่ขึ้นมาให้เห็นเอง",
                    "การนับยอดงาน (Auto) จะนับตามช่วงเวลาจริงของเควสนั้นๆ ไม่ใช่ตามปฏิทิน"
                ]} 
            />

            {/* Header & Nav */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex items-start gap-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                            ภารกิจประจำสัปดาห์ 🎯 (Weekly Quests)
                        </h1>
                        <p className="text-gray-500 mt-1">
                            วางแผนเป้าหมายรายช่อง ติดตามความคืบหน้าแบบ Hybrid
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsInfoOpen(true)}
                        className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors mt-1"
                        title="ดูคู่มือการใช้งาน"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-4 text-center min-w-[160px]">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">VIEWING WEEK</p>
                            <p className="text-indigo-600 font-black">
                                {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM yyyy')}
                            </p>
                        </div>
                        <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <button onClick={onOpenSettings} className="hidden md:flex p-2.5 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95">
                        <Bell className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* --- MAIN GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {/* Create Button Card */}
                <button onClick={() => setIsCreateModalOpen(true)} className="border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all min-h-[250px] group">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 group-hover:scale-110 transition-all shadow-sm">
                        <Plus className="w-8 h-8 stroke-[3px]" />
                    </div>
                    <span className="font-bold text-lg">สร้างแผนใหม่ (Create Plan)</span>
                    <span className="text-sm mt-1 opacity-70">เพิ่มภารกิจรายสัปดาห์</span>
                </button>

                {/* Render Channel Groups */}
                {Object.keys(groupedQuests.groups).map(channelId => {
                    const channel = channels.find(c => c.id === channelId);
                    const channelQuests = groupedQuests.groups[channelId];
                    if(!channel) return null;

                    return (
                        <QuestCard 
                            key={channelId}
                            channel={channel}
                            quests={channelQuests}
                            allTasks={tasks} // Pass ALL tasks to let card filter by quest date range
                            onClick={() => setViewingChannelId(channelId)}
                        />
                    );
                })}

                {/* Misc Quests */}
                {groupedQuests.miscQuests.length > 0 && (
                    <QuestCard 
                        key="MISC"
                        quests={groupedQuests.miscQuests}
                        allTasks={tasks}
                        onClick={() => setViewingChannelId('MISC')}
                    />
                )}
            </div>

            {/* --- MODALS --- */}
            <CreateQuestModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                channels={channels}
                masterOptions={masterOptions}
                weekStart={weekStart}
                onAddQuest={onAddQuest}
            />

            <QuestDetailModal 
                isOpen={!!viewingChannelId}
                onClose={() => setViewingChannelId(null)}
                channel={viewingChannel}
                quests={viewingQuests}
                allTasks={tasks}
                weekStart={weekStart}
                weekEnd={weekEnd}
                onUpdateManualProgress={updateManualProgress}
            />

            {/* INFO GUIDE MODAL */}
            <InfoModal 
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="คู่มือระบบภารกิจ (Quest Guide)"
            >
                <QuestGuide />
            </InfoModal>
        </div>
    );
};

export default WeeklyQuestBoard;
