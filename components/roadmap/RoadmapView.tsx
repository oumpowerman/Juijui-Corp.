
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Layout, Plus } from 'lucide-react';
import { 
  RoadmapTask, 
  timelineUtils,
  roadmapService,
  ROADMAP_CATEGORIES
} from '../../services/roadmapService';

import RoadmapTaskModal from './RoadmapTaskModal';
import RoadmapHeader from './RoadmapHeader';
import RoadmapTimeline from './RoadmapTimeline';
import RoadmapTaskItem from './RoadmapTaskItem';

const RoadmapView: React.FC = () => {
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [categories, setCategories] = useState<{name: string, id: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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
      const [taskData, catData] = await Promise.all([
        roadmapService.getTasks(),
        roadmapService.getCategories()
      ]);
      setTasks(taskData);
      setCategories(catData.map(c => ({ name: c.name, id: c.id })));
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

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const matchCategory = filter === 'All' || t.category === filter;
        const matchSearch = t.initiative.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
      })
      .sort((a, b) => a.no - b.no);
  }, [tasks, filter, searchTerm]);

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
        await roadmapService.updateTask(savedTask.id, savedTask);
      } else {
        const nextNo = tasks.length > 0 ? Math.max(...tasks.map(t => t.no)) + 1 : 1;
        const { id, ...newTask } = savedTask;
        await roadmapService.createTask({ ...newTask, no: nextNo });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await roadmapService.deleteTask(id);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Delete failed:', error);
    }
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
          <p className="text-sm font-bold tracking-[0.3em] uppercase text-indigo-600/60 ml-1">CONTENT OS</p>
          <p className="text-xs font-medium text-slate-400">กำลังซิงค์ข้อมูลโครงการ...</p>
        </div>
      </div>
    );
  }

  // Sidebar Totals: 48 + 320 + 112 + 96 + 80 + 160 = 816px. 
  // With 5 internal borders (divide-x) and 1 right border = 822px exactly.
  const sidebarWidth = 822;
  const cursorLeftOffset = (cursorWeek - timelineStartWeek) * 40;

  return (
    <div className={`flex flex-col h-full bg-white text-slate-900 select-none ${isFullScreen ? 'fixed inset-0 z-[100]' : ''}`}>
      {!isFullScreen ? (
        <RoadmapHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filter={filter}
          onFilterChange={setFilter}
          categories={categories.map(c => c.name)}
          onAddNew={handleAddNew}
          onToggleFullScreen={() => setIsFullScreen(true)}
        />
      ) : (
        <button 
          onClick={() => setIsFullScreen(false)}
          className="fixed top-6 right-10 z-[60] bg-white/80 backdrop-blur border border-slate-200 p-4 rounded-2xl shadow-xl text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 group"
        >
          <Layout className="w-6 h-6" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">ออกจากการแสดงผลเต็มจอ</span>
        </button>
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
                <p className="text-base font-bold text-slate-400 mt-3 max-w-sm text-center leading-relaxed">
                   เริ่มต้นวางแผนกลยุทธ์ของคุณด้วยเครื่องมือ ContentOS โดยกดปุ่มสร้างโครงการใหม่ด้านบน
                </p>
                <button 
                  onClick={handleAddNew}
                  className="mt-8 flex items-center gap-3 bg-white border border-slate-200 text-indigo-600 px-8 py-4 rounded-3xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  เริ่มต้นสร้างแผนใหม่
                </button>
              </div>
            ) : filteredTasks.map((task) => (
              <RoadmapTaskItem 
                key={task.id} 
                task={task}
                timelineStartWeek={timelineStartWeek}
                currentWeekIndex={cursorWeek}
                totalWeeks={totalWeeks}
                onEdit={handleEditTask}
              />
            ))}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoadmapView;
