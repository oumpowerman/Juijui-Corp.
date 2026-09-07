import React, { useState } from 'react';
import { Flame, Sparkles, Target, Zap, Trophy, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { RoadmapTask } from '../../../services/roadmapService';
import { Goal, User } from '../../../types';

interface HighImpactInsightModalProps {
  tasks: RoadmapTask[];
  goals: Goal[];
  users: User[];
  onSelectTask: (task: RoadmapTask) => void;
}

export const HighImpactInsightModal: React.FC<HighImpactInsightModalProps> = ({
  tasks,
  goals,
  users,
  onSelectTask
}) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<'all' | 'quick_wins' | 'major_projects' | 'fill_ins' | 'time_sinks'>('all');

  // Categorize tasks into 2x2 Matrix
  // High Impact: >= 4
  // Low Impact: <= 3
  // High Effort: >= 4
  // Low Effort: <= 3
  const matrix = {
    quickWins: tasks.filter(t => (t.impact || 3) >= 4 && (t.effort || 3) <= 3), // High Impact, Low Effort
    majorProjects: tasks.filter(t => (t.impact || 3) >= 4 && (t.effort || 3) >= 4), // High Impact, High Effort
    fillIns: tasks.filter(t => (t.impact || 3) <= 3 && (t.effort || 3) <= 3), // Low Impact, Low Effort
    timeSinks: tasks.filter(t => (t.impact || 3) <= 3 && (t.effort || 3) >= 4) // Low Impact, High Effort
  };

  const highImpactTasks = tasks.filter(t => (t.impact || 0) >= 4);

  const filteredList = selectedQuadrant === 'all' 
    ? highImpactTasks 
    : selectedQuadrant === 'quick_wins' 
    ? matrix.quickWins 
    : selectedQuadrant === 'major_projects' 
    ? matrix.majorProjects 
    : selectedQuadrant === 'fill_ins' 
    ? matrix.fillIns 
    : matrix.timeSinks;

  return (
    <div className="space-y-6">
      {/* 2x2 Strategic Value Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-500" />
            2x2 Strategic Value Matrix (Effort vs Impact)
          </h4>
          <span className="text-xs font-semibold text-slate-400">คลิกที่ช่องเพื่อกรองหมวดกลยุทธ์</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrant 1: Quick Wins */}
          <div
            onClick={() => setSelectedQuadrant(prev => prev === 'quick_wins' ? 'all' : 'quick_wins')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedQuadrant === 'quick_wins'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-200 ring-2 ring-emerald-500'
                : 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200/80 text-slate-800 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💎</span>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider">Quick Wins (ผลตอบแทนสูง/ทำง่าย)</h5>
                  <p className={`text-[11px] font-medium ${selectedQuadrant === 'quick_wins' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                    High Impact (≥4) + Low Effort (≤3)
                  </p>
                </div>
              </div>
              <span className={`text-2xl font-black ${selectedQuadrant === 'quick_wins' ? 'text-white' : 'text-emerald-700'}`}>
                {matrix.quickWins.length}
              </span>
            </div>
            <p className={`text-[11px] mt-2 font-medium ${selectedQuadrant === 'quick_wins' ? 'text-emerald-50' : 'text-slate-500'}`}>
              โครงการที่ควรเร่งทำเป็นอันดับแรก (Priority สูงสุด) เพื่อสร้างผลลัพธ์ทันที
            </p>
          </div>

          {/* Quadrant 2: Major Projects */}
          <div
            onClick={() => setSelectedQuadrant(prev => prev === 'major_projects' ? 'all' : 'major_projects')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedQuadrant === 'major_projects'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-200 ring-2 ring-indigo-500'
                : 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200/80 text-slate-800 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider">Strategic Bets (โครงการเปลี่ยนเกม)</h5>
                  <p className={`text-[11px] font-medium ${selectedQuadrant === 'major_projects' ? 'text-indigo-100' : 'text-indigo-700'}`}>
                    High Impact (≥4) + High Effort (≥4)
                  </p>
                </div>
              </div>
              <span className={`text-2xl font-black ${selectedQuadrant === 'major_projects' ? 'text-white' : 'text-indigo-700'}`}>
                {matrix.majorProjects.length}
              </span>
            </div>
            <p className={`text-[11px] mt-2 font-medium ${selectedQuadrant === 'major_projects' ? 'text-indigo-50' : 'text-slate-500'}`}>
              ต้องวางแผนทีมงานและจัดสรร Buffer ให้รอบคอบ เพราะใช้พลังงานและเวลาสูง
            </p>
          </div>

          {/* Quadrant 3: Fill-ins */}
          <div
            onClick={() => setSelectedQuadrant(prev => prev === 'fill_ins' ? 'all' : 'fill_ins')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedQuadrant === 'fill_ins'
                ? 'bg-slate-700 text-white border-slate-800 shadow-lg ring-2 ring-slate-700'
                : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200 text-slate-800 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider">Fill-ins (งานเสริมคั่นเวลา)</h5>
                  <p className={`text-[11px] font-medium ${selectedQuadrant === 'fill_ins' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Low Impact (≤3) + Low Effort (≤3)
                  </p>
                </div>
              </div>
              <span className={`text-2xl font-black ${selectedQuadrant === 'fill_ins' ? 'text-white' : 'text-slate-700'}`}>
                {matrix.fillIns.length}
              </span>
            </div>
            <p className={`text-[11px] mt-2 font-medium ${selectedQuadrant === 'fill_ins' ? 'text-slate-300' : 'text-slate-500'}`}>
              ทำเมื่อมีเวลาว่าง หรือมอบหมายให้ทีมงานฝึกหัด
            </p>
          </div>

          {/* Quadrant 4: Time Sinks */}
          <div
            onClick={() => setSelectedQuadrant(prev => prev === 'time_sinks' ? 'all' : 'time_sinks')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedQuadrant === 'time_sinks'
                ? 'bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-200 ring-2 ring-rose-500'
                : 'bg-rose-50/50 hover:bg-rose-50 border-rose-200/80 text-slate-800 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider">Time Sinks (งานเปลืองแรงผลลัพธ์ต่ำ)</h5>
                  <p className={`text-[11px] font-medium ${selectedQuadrant === 'time_sinks' ? 'text-rose-100' : 'text-rose-700'}`}>
                    Low Impact (≤3) + High Effort (≥4)
                  </p>
                </div>
              </div>
              <span className={`text-2xl font-black ${selectedQuadrant === 'time_sinks' ? 'text-white' : 'text-rose-700'}`}>
                {matrix.timeSinks.length}
              </span>
            </div>
            <p className={`text-[11px] mt-2 font-medium ${selectedQuadrant === 'time_sinks' ? 'text-rose-50' : 'text-slate-500'}`}>
              ควรพิจารณาลดขอบเขต (De-scope) หรือยกเลิกเพื่อคืนเวลาให้ทีม
            </p>
          </div>
        </div>
      </div>

      {/* Filtered Project List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-emerald-500" />
            {selectedQuadrant === 'all'
              ? `โครงการที่มีผลกระทบสูงทั้งหมด (${highImpactTasks.length})`
              : `โครงการในหมวดที่เลือก (${filteredList.length})`}
          </h4>
          {selectedQuadrant !== 'all' && (
            <button
              onClick={() => setSelectedQuadrant('all')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              แสดงทั้งหมด
            </button>
          )}
        </div>

        {filteredList.length === 0 ? (
          <div className="py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
            ไม่มีโครงการในหมวดหมู่นี้
          </div>
        ) : (
          <div className="grid gap-2.5 max-h-[300px] overflow-y-auto custom-slim-scrollbar pr-1">
            {filteredList.map((t) => {
              const goal = t.goal_id ? goals.find(g => g.id === t.goal_id) : null;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="group bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors truncate">
                        {t.initiative}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {t.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="font-semibold text-emerald-600">Impact: {t.impact || 3}/5</span>
                      <span className="font-semibold text-indigo-600">Effort: {t.effort || 3}/5</span>
                      {t.target_kpi && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          KPI: {t.target_kpi}
                        </span>
                      )}
                      {goal && (
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          Goal: {goal.title}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
