
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { Loader2, Layout, Plus, X } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand.ts';
import { 
  RoadmapTask, 
  timelineUtils,
  roadmapService,
  ROADMAP_CATEGORIES
} from '../../services/roadmapService';
import { supabase } from '../../lib/supabase';

import RoadmapTaskModal from './RoadmapTaskModal';
import RoadmapHeader from './RoadmapHeader';
import RoadmapMiniToolbar from './RoadmapMiniToolbar';
import RoadmapTimeline from './RoadmapTimeline';
import RoadmapTaskItem from './RoadmapTaskItem';
import { RoadmapInsightDashboard } from './insights/RoadmapInsightDashboard';
import { RoadmapInsightModal } from './insights/RoadmapInsightModal';
import { InsightType } from './insights/RoadmapInsightCard';
import GeneralTaskForm from '../task/GeneralTaskForm';
import { useTaskContext } from '../../context/TaskContext';
import { useUserSession } from '../../context/UserSessionContext';
import { useMasterDataContext } from '../../context/MasterDataContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useChannels } from '../../hooks/useChannels';
import { useTasks } from '../../hooks/useTasks';
import { Task, Goal } from '../../types';

const RoadmapView: React.FC = () => {
  const { showConfirm } = useGlobalDialog();
  const { tasks: allTasks } = useTaskContext();
  const { currentUserProfile, activeUsers } = useUserSession();
  const { masterOptions } = useMasterDataContext();
  const { channels } = useChannels();
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [categories, setCategories] = useState<{name: string, id: string, color?: string}[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sortMode, setSortMode] = useState<'manual' | 'timeline'>('manual');
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // Insight Filters & Deep Dive Modal State
  const [activeInsightFilter, setActiveInsightFilter] = useState<InsightType | null>(null);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [insightModalTab, setInsightModalTab] = useState<InsightType>('ongoing');

  // Execution Task Modal State
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [selectedExecTask, setSelectedExecTask] = useState<Task | null>(null);
  const [execInitialData, setExecInitialData] = useState<Partial<Task> | null>(null);

  const { handleSaveTask: handleSaveExecOp, handleDeleteTask: handleDeleteExecutionTask } = useTasks(() => setIsExecModalOpen(false));



  // Timeline Config
  const timelineConfig = useMemo(() => timelineUtils.getTimelineConfig(tasks), [tasks]);
  const realTodayWeek = useMemo(() => timelineUtils.getCurrentWeekIndex(), []);
  const [cursorWeek, setCursorWeek] = useState(realTodayWeek);

  // Sync cursor when realTodayWeek changes or tasks load
  useEffect(() => {
    setCursorWeek(timelineUtils.getCurrentWeekIndex());
  }, [tasks.length]);

  const timelineStartWeek = timelineConfig[0]?.start_week || 1;
  const totalWeeks = useMemo(() => timelineConfig.length * 4, [timelineConfig]);

  // Handle Cursor Dragging
  const [isDragging, setIsDragging] = useState(false);

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget;
    const x = e.clientX - rect.left + container.scrollLeft;
    
    // Sidebar Width + borders
    const sidebarWidth = 822;
    const relativeX = x - sidebarWidth;
    
    if (relativeX < 0) {
      setCursorWeek(timelineStartWeek);
      return;
    }
    
    const weekIdx = Math.floor(relativeX / 40);
    const targetWeek = timelineStartWeek + weekIdx;
    
    // Limit within the dynamic window
    if (targetWeek >= timelineStartWeek && targetWeek < timelineStartWeek + totalWeeks) {
      setCursorWeek(targetWeek);
    }
  };

  // Initial Fetch
  const fetchData = async () => {
    try {
      const [taskData, catData, goalsRes] = await Promise.all([
        roadmapService.getTasks(),
        roadmapService.getCategories(),
        supabase.from('goals').select('*').eq('is_archived', false).order('deadline', { ascending: true })
      ]);
      setTasks(taskData);
      setCategories(catData.map(c => ({ name: c.name, id: c.id, color: c.color })));
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
    } catch (error) {
      console.error('Failed to fetch roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const subscription = roadmapService.subscribeToChanges(() => fetchData());
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const allAvailableCategories = useMemo(() => {
    const catSet = new Set<string>();
    ROADMAP_CATEGORIES.forEach(c => catSet.add(c));
    categories.forEach(c => catSet.add(c.name));
    tasks.forEach(t => { if (t.category) catSet.add(t.category); });
    return Array.from(catSet);
  }, [categories, tasks]);

  // Compute Peak Weeks for Filtering
  const peakWeeksSet = useMemo(() => {
    const weekLoad: Record<number, number> = {};
    tasks.filter(t => t.status !== 'Done').forEach(t => {
      for (let w = t.start_week; w < t.start_week + t.duration_weeks; w++) {
        weekLoad[w] = (weekLoad[w] || 0) + 1;
      }
    });
    const peakLoad = Math.max(0, ...Object.values(weekLoad));
    const set = new Set<number>();
    if (peakLoad > 0) {
      Object.entries(weekLoad).forEach(([wStr, count]) => {
        if (count >= Math.max(3, peakLoad)) {
          set.add(Number(wStr));
        }
      });
    }
    return set;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const list = [...tasks]
      .filter(t => {
        const matchCategory = filter === 'All' || t.category === filter;
        const matchSearch = t.initiative.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Insight Quick Filter Match
        let matchInsight = true;
        if (activeInsightFilter === 'ongoing') {
          matchInsight = t.status === 'Ongoing';
        } else if (activeInsightFilter === 'high_impact') {
          matchInsight = (t.impact || 0) >= 4;
        } else if (activeInsightFilter === 'peak') {
          let runsInPeak = false;
          for (let w = t.start_week; w < t.start_week + t.duration_weeks; w++) {
            if (peakWeeksSet.has(w)) {
              runsInPeak = true;
              break;
            }
          }
          matchInsight = runsInPeak && t.status !== 'Done';
        } else if (activeInsightFilter === 'delayed') {
          matchInsight = t.status === 'Delayed';
        }

        return matchCategory && matchSearch && matchInsight;
      });

    if (sortMode === 'timeline') {
      return list.sort((a, b) => a.start_week - b.start_week);
    }
    
    return list.sort((a, b) => (a.no || 0) - (b.no || 0));
  }, [tasks, filter, searchTerm, sortMode, activeInsightFilter, peakWeeksSet]);

  const handleReorder = async (newOrder: RoadmapTask[]) => {
    // Only allow reorder in manual mode and when no filtering is active
    if (sortMode !== 'manual' || filter !== 'All' || searchTerm) {
      // Just update local state for the current view if filtering
      setTasks(prev => {
        const otherTasks = prev.filter(t => !newOrder.find(nt => nt.id === t.id));
        return [...newOrder, ...otherTasks].sort((a, b) => (a.no || 0) - (b.no || 0));
      });
      return;
    }

    setTasks(prev => {
      const otherTasks = prev.filter(t => !newOrder.find(nt => nt.id === t.id));
      const reordered = newOrder.map((task, idx) => ({ ...task, no: idx + 1 }));
      return [...reordered, ...otherTasks].sort((a, b) => (a.no || 0) - (b.no || 0));
    });

    // Persist to DB
    try {
      await Promise.all(newOrder.map((task, idx) => 
        roadmapService.updateTask(task.id, { no: idx + 1 })
      ));
    } catch (error) {
      console.error('Failed to save reorder:', error);
    }
  };

  const handleEditTask = (task: RoadmapTask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (savedTask: RoadmapTask) => {
    try {
      if (selectedTask) {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === savedTask.id ? { ...t, ...savedTask } : t));
        setIsModalOpen(false);
        await roadmapService.updateTask(savedTask.id, savedTask);
      } else {
        const nextNo = tasks.length > 0 ? Math.max(...tasks.map(t => t.no)) + 1 : 1;
        const { id, ...newTask } = savedTask;
        const payload = { 
          ...newTask, 
          no: nextNo,
          original_start_week: newTask.start_week,
          original_duration_weeks: newTask.duration_weeks
        };
        setIsModalOpen(false);
        const created = await roadmapService.createTask(payload);
        setTasks(prev => [...prev.filter(t => t.id !== id), created]);
      }
    } catch (error) {
      console.error('Save failed:', error);
      fetchData(); // Rollback/Resync
    }
  };

  const handleDeleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const initiativeName = taskToDelete?.initiative || 'โครงการนี้';
    const confirmed = await showConfirm(
      `คุณต้องการลบโครงการ "${initiativeName}" ใช่หรือไม่? งานปฏิบัติการหลักทั้งหมดที่เชื่อมกับ Roadmap นี้จะไม่สามารถอ้างอิงได้อีกต่อไป และการลบจะไม่สามารถย้อนกลับได้`,
      'ยืนยันการลบโครงการ'
    );
    
    if (!confirmed) return;

    try {
      // Optimistic update
      setTasks(prev => prev.filter(t => t.id !== id));
      setIsModalOpen(false);
      await roadmapService.deleteTask(id);
    } catch (error) {
      console.error('Delete failed:', error);
      fetchData(); // Rollback/Resync
    }
  };

  const handleAddExecTask = (roadmapId: string, initiative: string, startDate: Date, endDate: Date) => {
    setExecInitialData({
      title: `[${initiative}] `,
      roadmapId,
      startDate,
      endDate,
    });
    setSelectedExecTask(null);
    setIsExecModalOpen(true);
  };

  const handleEditExecTask = (task: Task) => {
    setSelectedExecTask(task);
    setExecInitialData(null);
    setIsExecModalOpen(true);
  };

  const handleSaveExecution = async (task: Task) => {
    await handleSaveExecOp(task, selectedExecTask);
    setIsExecModalOpen(false);
  };

  // --- Insight Dashboard Calculations (E) ---
  const insights = useMemo(() => {
    const ongoing = tasks.filter(t => t.status === 'Ongoing').length;
    const highImpact = tasks.filter(t => (t.impact || 0) >= 4).length;
    const delayed = tasks.filter(t => t.status === 'Delayed').length;
    
    // Resource Peak (C) - Exclude completed 'Done' tasks so past projects don't trigger active bottleneck alerts
    const weekLoad: Record<number, number> = {};
    tasks.filter(t => t.status !== 'Done').forEach(t => {
      for (let w = t.start_week; w < t.start_week + t.duration_weeks; w++) {
        weekLoad[w] = (weekLoad[w] || 0) + 1;
      }
    });
    const peakLoad = Math.max(0, ...Object.values(weekLoad));
    
    return { ongoing, highImpact, delayed, peakLoad };
  }, [tasks]);

  // Insight Actions
  const handleToggleInsightFilter = (type: InsightType) => {
    setActiveInsightFilter(prev => prev === type ? null : type);
  };

  const handleClearInsightFilter = () => {
    setActiveInsightFilter(null);
  };

  const handleOpenDeepDive = (tab: InsightType) => {
    setInsightModalTab(tab);
    setIsInsightModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold tracking-[0.3em] uppercase text-indigo-600/60 ml-1">{BRAND_CONFIG.name.toUpperCase()}</p>
          <p className="text-xs font-medium text-slate-400">กำลังซิงค์ข้อมูลโครงการ...</p>
        </div>
      </div>
    );
  }
  const sidebarWidth = 822;
  const cursorLeftOffset = (cursorWeek - timelineStartWeek) * 40;

  return (
    <div className={`flex flex-col h-full bg-white text-slate-900 select-none ${isFullScreen ? 'fixed inset-0 z-[100]' : ''}`}>
      {!isFullScreen ? (
        <>
          <RoadmapHeader 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filter={filter}
            onFilterChange={setFilter}
            categories={allAvailableCategories}
            onAddNew={handleAddNew}
            onToggleFullScreen={() => setIsFullScreen(true)}
            sortMode={sortMode}
            onToggleSort={() => setSortMode(prev => prev === 'manual' ? 'timeline' : 'manual')}
          />
          
          {/* Enhanced Modular Insight Dashboard & Advice Banner (E) */}
          <RoadmapInsightDashboard
            insights={insights}
            activeInsightFilter={activeInsightFilter}
            onToggleInsightFilter={handleToggleInsightFilter}
            onClearInsightFilter={handleClearInsightFilter}
            onOpenDeepDive={handleOpenDeepDive}
          />
        </>
      ) : (
        <RoadmapMiniToolbar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filter={filter}
          onFilterChange={setFilter}
          categories={allAvailableCategories}
          onAddNew={handleAddNew}
          sortMode={sortMode}
          onToggleSort={() => setSortMode(prev => prev === 'manual' ? 'timeline' : 'manual')}
          onExitFullScreen={() => setIsFullScreen(false)}
        />
      )}

      <div 
        className={`flex-1 overflow-auto relative bg-slate-100/30 scrollbar-thin`}
        onMouseMove={handleTimelineMouseMove}
        onMouseUp={() => {
          setIsDragging(false);
          setCursorWeek(realTodayWeek); // Snap back
        }}
        onMouseLeave={() => {
          if (isDragging) {
            setIsDragging(true);
            setCursorWeek(realTodayWeek);
          }
          setIsDragging(false);
        }}
      >
        <div className="inline-block min-w-full">
          <RoadmapTimeline 
            timelineConfig={timelineConfig} 
            currentWeekIndex={cursorWeek} 
          />

          <div className="flex flex-col bg-white relative">
             {/* New wrapper for the grid area to ensure alignment */}
             <div 
               className="absolute inset-0 pointer-events-none"
               style={{ left: sidebarWidth }}
             >
                {/* Red Vertical Line - Cursor Indicator with Spring Snap */}
                <motion.div 
                    animate={{ 
                      left: `${cursorLeftOffset}px`,
                      transition: isDragging ? { type: "tween", duration: 0 } : { type: "spring", stiffness: 400, damping: 25 }
                    }}
                    className={`absolute h-full w-[2px] bg-rose-500 z-[45] pointer-events-none opacity-90 transition-shadow ${isDragging ? 'shadow-[0_0_20px_rgba(244,63,94,0.8)]' : 'shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}
                >
                    <div 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      className="absolute top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-xl active:scale-125 transition-transform pointer-events-auto cursor-ew-resize hover:bg-rose-500" 
                    />
                    <div className="absolute top-4 left-2 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                      สัปดาห์ปัจจุบัน (W{cursorWeek})
                    </div>
                </motion.div>
             </div>

            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-48 bg-slate-50/20">
                <div className="w-32 h-32 bg-indigo-50 flex items-center justify-center rounded-full mb-8 animate-pulse">
                  <Layout className="w-16 h-16 text-indigo-200" />
                </div>
                <h3 className="text-3xl font-bold text-slate-700 tracking-tight">ยังไม่มีแผนโครงการในขณะนี้</h3>
                <p className="text-base font-semibold text-slate-400 mt-3 max-w-sm text-center leading-relaxed">
                   {BRAND_CONFIG.projectPlaceholder}
                </p>
                <button 
                  onClick={handleAddNew}
                  className="mt-8 flex items-center gap-3 bg-white border border-slate-200 text-indigo-600 px-8 py-4 rounded-3xl font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  เริ่มต้นสร้างแผนใหม่
                </button>
              </div>
            ) : (
              <Reorder.Group 
                axis="y" 
                values={filteredTasks} 
                onReorder={handleReorder}
                className="flex flex-col"
              >
                {filteredTasks.map((task) => (
                  <Reorder.Item 
                    key={task.id} 
                    value={task}
                    dragListener={sortMode === 'manual'}
                  >
                    <RoadmapTaskItem 
                      task={task}
                      timelineStartWeek={timelineStartWeek}
                      currentWeekIndex={cursorWeek}
                      totalWeeks={totalWeeks}
                      onEdit={handleEditTask}
                      isDraggable={sortMode === 'manual' && filter === 'All' && !searchTerm}
                      categories={categories}
                      hoveredTaskId={hoveredTaskId}
                      onHoverTask={setHoveredTaskId}
                      allTasks={tasks}
                      users={activeUsers}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
          
          {/* Capacity Meter (C) */}
          <div className="flex bg-slate-50/80 border-t border-slate-100 items-center">
            <div className={`w-[822px] min-w-[822px] py-3 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 sticky left-0 z-50 bg-slate-100/50 backdrop-blur-sm border-r border-slate-200 flex items-center justify-between`}>
              <span>Resource Capacity Check (Concurrency)</span>
              <span className="text-[9px] font-bold text-slate-400 lowercase italic">(นับเฉพาะงานที่ยังไม่เสร็จ)</span>
            </div>
            <div className="flex flex-1">
              {Array.from({ length: totalWeeks }).map((_, i) => {
                const weekIdx = timelineStartWeek + i;
                const count = tasks.filter(t => t.status !== 'Done' && weekIdx >= t.start_week && weekIdx < (t.start_week + t.duration_weeks)).length;
                const isOver = count > 3;
                return (
                  <div key={i} className="w-[40px] flex flex-col items-center justify-center py-2 border-r border-slate-100/50">
                    <div className={`w-1 h-3 rounded-full ${isOver ? 'bg-rose-500 animate-pulse' : count > 0 ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                    <span className={`text-[8px] mt-1 font-bold ${isOver ? 'text-rose-500' : 'text-slate-400'}`}>{count > 0 ? count : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

          <div className="flex flex-wrap gap-8 py-4 px-10 bg-white border-t border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] shrink-0 z-[50]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ตำแหน่งปัจจุบัน: สัปดาห์ {cursorWeek}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">จุดเริ่มต้นแผนงาน</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สัปดาห์ที่กำลังดำเนินการ (Active)</span>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <RoadmapTaskModal 
            isOpen={isModalOpen}
            task={selectedTask}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
            allTasks={tasks}
            executionTasks={allTasks.filter(t => t.roadmapId === selectedTask?.id)}
            users={activeUsers}
            goals={goals}
            onAddTask={handleAddExecTask}
            onEditTask={handleEditExecTask}
          />
        )}
      </AnimatePresence>

      {/* Strategic Insight Deep Dive Analytics Modal */}
      <AnimatePresence>
        {isInsightModalOpen && (
          <RoadmapInsightModal
            isOpen={isInsightModalOpen}
            onClose={() => setIsInsightModalOpen(false)}
            initialTab={insightModalTab}
            tasks={tasks}
            users={activeUsers}
            goals={goals}
            onSelectTask={handleEditTask}
            onApplyFilter={(tab) => {
              setActiveInsightFilter(tab);
              setIsInsightModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Execution Task Form Modal */}
      <AnimatePresence>
        {isExecModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExecModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-10 py-6 border-b border-slate-100 bg-white">
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedExecTask ? 'แก้ไขงานปฏิบัติงาน' : 'สั่งงานปฏิบัติงานใหม่'}
                </h3>
                <button 
                  onClick={() => setIsExecModalOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <GeneralTaskForm 
                   initialData={selectedExecTask || (execInitialData as any)}
                   users={activeUsers}
                   masterOptions={masterOptions}
                   channels={channels}
                   currentUser={currentUserProfile || undefined}
                   onSave={handleSaveExecution}
                   onDelete={handleDeleteExecutionTask}
                   onClose={() => setIsExecModalOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoadmapView;
