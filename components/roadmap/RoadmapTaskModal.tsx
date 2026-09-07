import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Layers, CalendarDays, CheckSquare, Sparkles } from 'lucide-react';
import { RoadmapTask, TaskStatus, roadmapService, timelineUtils } from '../../services/roadmapService';
import { Task, User, Goal } from '../../types';
import { supabase } from '../../lib/supabase';
import { RoadmapStrategyTab } from './modal/RoadmapStrategyTab';
import { RoadmapScheduleTab } from './modal/RoadmapScheduleTab';
import { RoadmapExecutionTab } from './modal/RoadmapExecutionTab';

interface RoadmapTaskModalProps {
  task: RoadmapTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: RoadmapTask) => void;
  onDelete?: (id: string) => void;
  allTasks?: RoadmapTask[];
  executionTasks?: Task[];
  users?: User[];
  goals?: Goal[];
  onAddTask?: (roadmapId: string, initiative: string, startDate: Date, endDate: Date) => void;
  onEditTask?: (task: Task) => void;
}

type ModalTab = 'strategy' | 'schedule' | 'execution';

const RoadmapTaskModal: React.FC<RoadmapTaskModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  allTasks = [], 
  executionTasks = [], 
  users = [], 
  goals: initialGoals = [],
  onAddTask, 
  onEditTask 
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('strategy');
  const [categories, setCategories] = useState<{ name: string; color: string; id: string }[]>([]);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  
  const [formData, setFormData] = useState<RoadmapTask>({
    id: '',
    no: 0,
    initiative: '',
    category: 'Other',
    status: 'Planned',
    progress: 0,
    buffer: '0d',
    start_week: 1,
    duration_weeks: 1,
    effort: 3,
    impact: 3,
    dependencies: [],
    owner_id: undefined,
    description: '',
    target_kpi: '',
    goal_id: undefined
  });

  const [startDate, setStartDate] = useState<Date>(new Date());

  // Fetch categories and goals when modal opens
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catData, goalsRes] = await Promise.all([
          roadmapService.getCategories(),
          supabase.from('goals').select('*').eq('is_archived', false).order('deadline', { ascending: true })
        ]);
        setCategories(catData);
        if (goalsRes.data) {
          setGoals(goalsRes.data.map((g: any) => ({
            id: g.id,
            title: g.title,
            platform: g.platform,
            currentValue: g.current_value,
            targetValue: g.target_value,
            deadline: new Date(g.deadline),
            channelId: g.channel_id,
            isArchived: g.is_archived,
            rewardXp: g.reward_xp || 500,
            rewardCoin: g.reward_coin || 100,
            owners: [],
            boosts: []
          })));
        }
      } catch (err) {
        console.error('Load modal metadata failed', err);
      }
    };

    if (isOpen) {
      loadData();
      setActiveTab('strategy'); // Reset to first tab

      if (task) {
        setFormData({
          ...task,
          effort: task.effort || 3,
          impact: task.impact || 3,
          dependencies: task.dependencies || [],
          owner_id: task.owner_id,
          description: task.description || '',
          target_kpi: task.target_kpi || '',
          goal_id: task.goal_id
        });
        setStartDate(timelineUtils.getDateFromWeekIndex(task.start_week));
      } else {
        const currentWeek = timelineUtils.getCurrentWeekIndex();
        setFormData({
          id: '',
          no: 0,
          initiative: '',
          category: 'Other',
          status: 'Planned',
          progress: 0,
          buffer: '0d',
          start_week: currentWeek,
          duration_weeks: 1,
          effort: 3,
          impact: 3,
          dependencies: [],
          owner_id: undefined,
          description: '',
          target_kpi: '',
          goal_id: undefined
        });
        setStartDate(timelineUtils.getDateFromWeekIndex(currentWeek));
      }
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.initiative.trim()) {
      setActiveTab('strategy');
      return;
    }
    onSave(formData);
  };

  const tabs: { id: ModalTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { 
      id: 'strategy', 
      label: 'รายละเอียด & กลยุทธ์', 
      icon: <Layers className="w-4 h-4" /> 
    },
    { 
      id: 'schedule', 
      label: 'ตารางเวลา & เป้าหมาย', 
      icon: <CalendarDays className="w-4 h-4" />,
      badge: `W${formData.start_week}`
    },
    { 
      id: 'execution', 
      label: 'งานปฏิบัติการ', 
      icon: <CheckSquare className="w-4 h-4" />,
      badge: executionTasks.length > 0 ? `${executionTasks.length}` : undefined
    },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      {/* Modal Dialog */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-full max-w-3xl bg-white border border-slate-200/80 rounded-[2.5rem] shadow-[0_32px_80px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[calc(100vh-60px)]"
      >
        {/* Modal Header */}
        <div className="px-8 pt-7 pb-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {task ? 'แก้ไขข้อมูลโครงการ' : 'สร้างโครงการ Roadmap ใหม่'}
                </h3>
                <p className="text-xs font-semibold text-slate-400">
                  {formData.initiative ? formData.initiative : 'กำหนดทิศทางเชิงกลยุทธ์ ตารางเวลา และการมอบหมายงาน'}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-700 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1.5 p-1.5 bg-slate-100/70 rounded-2xl mt-5 border border-slate-200/50">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    isActive ? 'text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-modal-tab"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                        isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body with Tab Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-slim-scrollbar px-8 py-6 bg-white">
          {activeTab === 'strategy' && (
            <RoadmapStrategyTab
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              setCategories={setCategories}
              users={users}
              goals={goals}
            />
          )}

          {activeTab === 'schedule' && (
            <RoadmapScheduleTab
              formData={formData}
              setFormData={setFormData}
              startDate={startDate}
              setStartDate={setStartDate}
              allTasks={allTasks}
              currentTaskId={task?.id}
            />
          )}

          {activeTab === 'execution' && (
            <RoadmapExecutionTab
              formData={formData}
              setFormData={setFormData}
              executionTasks={executionTasks}
              users={users}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
              isExistingTask={Boolean(task?.id)}
            />
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-8 py-5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div>
            {task && onDelete && (
              <button 
                type="button"
                onClick={() => onDelete(task.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 font-bold text-xs transition-all active:scale-95 border border-transparent hover:border-rose-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบโครงการนี้</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-bold text-xs transition-all hover:bg-slate-200/50"
            >
              ยกเลิก
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-200/80 transition-all active:scale-95 border border-indigo-500"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RoadmapTaskModal;
