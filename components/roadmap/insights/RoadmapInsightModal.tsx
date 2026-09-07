import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, BarChart3, AlertCircle, PlayCircle, Filter } from 'lucide-react';
import { RoadmapTask } from '../../../services/roadmapService';
import { User, Goal } from '../../../types';
import { InsightType } from './RoadmapInsightCard';
import { ActiveProjectsInsightModal } from './ActiveProjectsInsightModal';
import { HighImpactInsightModal } from './HighImpactInsightModal';
import { PeakCapacityInsightModal } from './PeakCapacityInsightModal';
import { DelayedProjectsInsightModal } from './DelayedProjectsInsightModal';

interface RoadmapInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: InsightType;
  tasks: RoadmapTask[];
  users: User[];
  goals: Goal[];
  onSelectTask: (task: RoadmapTask) => void;
  onApplyFilter: (type: InsightType) => void;
}

export const RoadmapInsightModal: React.FC<RoadmapInsightModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'ongoing',
  tasks,
  users,
  goals,
  onSelectTask,
  onApplyFilter
}) => {
  const [activeTab, setActiveTab] = useState<InsightType>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const tabs: { id: InsightType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'ongoing', label: 'โครงการกำลังทำ', icon: <PlayCircle className="w-4 h-4" />, color: 'text-indigo-600' },
    { id: 'high_impact', label: 'ผลกระทบสูง & Matrix', icon: <Zap className="w-4 h-4" />, color: 'text-emerald-600' },
    { id: 'peak', label: 'ภาระงาน & จุดกระจุกตัว', icon: <BarChart3 className="w-4 h-4" />, color: 'text-amber-600' },
    { id: 'delayed', label: 'ความเสี่ยง & ล่าช้า', icon: <AlertCircle className="w-4 h-4" />, color: 'text-rose-600' },
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

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-full max-w-4xl bg-white border border-slate-200/80 rounded-[2.5rem] shadow-[0_32px_80px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[calc(100vh-60px)]"
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Roadmap Strategic Analytics & Deep Dive
                </h3>
                <p className="text-xs font-semibold text-slate-400">
                  วิเคราะห์ขีดความสามารถ โครงการผลกระทบสูง และการบริหารจัดการความเสี่ยง
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

          {/* Tab Selection */}
          <div className="flex gap-1.5 p-1.5 bg-slate-100/70 rounded-2xl mt-5 border border-slate-200/50 overflow-x-auto custom-slim-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                    isActive ? 'text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-insight-tab"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto custom-slim-scrollbar px-8 py-6 bg-white">
          {activeTab === 'ongoing' && (
            <ActiveProjectsInsightModal
              tasks={tasks}
              users={users}
              goals={goals}
              onSelectTask={(t) => {
                onClose();
                onSelectTask(t);
              }}
            />
          )}

          {activeTab === 'high_impact' && (
            <HighImpactInsightModal
              tasks={tasks}
              goals={goals}
              users={users}
              onSelectTask={(t) => {
                onClose();
                onSelectTask(t);
              }}
            />
          )}

          {activeTab === 'peak' && (
            <PeakCapacityInsightModal
              tasks={tasks}
              users={users}
              onSelectTask={(t) => {
                onClose();
                onSelectTask(t);
              }}
            />
          )}

          {activeTab === 'delayed' && (
            <DelayedProjectsInsightModal
              tasks={tasks}
              users={users}
              onSelectTask={(t) => {
                onClose();
                onSelectTask(t);
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              onApplyFilter(activeTab);
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs border border-indigo-100 transition-all"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>กรองหมวดนี้ในตาราง Gantt</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-slate-500 hover:text-slate-800 font-bold text-xs transition-all hover:bg-slate-200/50"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </motion.div>
    </div>
  );
};
