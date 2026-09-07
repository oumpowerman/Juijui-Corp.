import React, { useState } from 'react';
import { BarChart3, AlertTriangle, Calendar, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { RoadmapTask, timelineUtils } from '../../../services/roadmapService';
import { User } from '../../../types';

interface PeakCapacityInsightModalProps {
  tasks: RoadmapTask[];
  users: User[];
  onSelectTask: (task: RoadmapTask) => void;
}

export const PeakCapacityInsightModal: React.FC<PeakCapacityInsightModalProps> = ({
  tasks,
  users,
  onSelectTask
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // Active tasks (exclude Done)
  const activeTasks = tasks.filter(t => t.status !== 'Done');

  // Compute week-by-week load
  const weekLoadMap: Record<number, RoadmapTask[]> = {};
  const allWeeks: number[] = [];

  activeTasks.forEach(t => {
    for (let w = t.start_week; w < t.start_week + t.duration_weeks; w++) {
      if (!weekLoadMap[w]) {
        weekLoadMap[w] = [];
        allWeeks.push(w);
      }
      weekLoadMap[w].push(t);
    }
  });

  const sortedWeeks = allWeeks.sort((a, b) => a - b);
  const maxLoad = Math.max(0, ...Object.values(weekLoadMap).map(arr => arr.length));
  const bottleneckWeeks = sortedWeeks.filter(w => (weekLoadMap[w]?.length || 0) > 3);

  // Active inspected week
  const activeInspectWeek = selectedWeek !== null ? selectedWeek : (bottleneckWeeks[0] || sortedWeeks[0] || 1);
  const tasksInInspectedWeek = weekLoadMap[activeInspectWeek] || [];

  return (
    <div className="space-y-6">
      {/* Capacity Header Alert */}
      {maxLoad > 3 ? (
        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
              ตรวจพบจุดกระจุกตัวของภาระงาน (Capacity Bottleneck Alert)
            </h4>
            <p className="text-xs text-amber-800 font-medium">
              มี {bottleneckWeeks.length} สัปดาห์ที่มีโครงการรันซ้อนพร้อมกันเกิน 3 โครงการ (สูงสุด {maxLoad} โครงการ) ซึ่งอาจทำให้ทีมงานเกิดความตึงเครียดหรือล่าช้าสะสม
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center gap-3.5">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
              การจัดสรรภาระงานอยู่ในเกณฑ์สุขภาพดี (Healthy Resource Flow)
            </h4>
            <p className="text-xs text-emerald-800 font-medium">
              โครงการมีการกระจายตัวที่ดี ไม่มีการกระจุกตัวเกินขีดจำกัด (สูงสุด {maxLoad} โครงการพร้อมกัน)
            </p>
          </div>
        </div>
      )}

      {/* Week-by-Week Concurrency Bar Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            ตารางการกระจายภาระงานรายสัปดาห์ (Weekly Concurrency Histogram)
          </h4>
          <span className="text-xs font-semibold text-slate-400">คลิกที่แท่งสัปดาห์เพื่อดูรายการโครงการ</span>
        </div>

        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 overflow-x-auto custom-slim-scrollbar">
          <div className="flex items-end gap-2.5 min-w-[500px] h-36 pt-4 pb-2 px-2">
            {sortedWeeks.length === 0 ? (
              <p className="text-xs text-slate-400 m-auto">ไม่มีโครงการที่เปิดทำงานอยู่</p>
            ) : (
              sortedWeeks.map(w => {
                const count = weekLoadMap[w]?.length || 0;
                const isOverload = count > 3;
                const isSelected = activeInspectWeek === w;
                const heightPercent = maxLoad > 0 ? (count / maxLoad) * 100 : 0;

                return (
                  <div
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group"
                  >
                    <span className={`text-[10px] font-black transition-colors ${
                      isSelected ? 'text-indigo-600' : isOverload ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {count}
                    </span>

                    <div className="w-full bg-slate-200/60 rounded-lg h-24 flex items-end p-0.5 relative">
                      <div
                        className={`w-full rounded-md transition-all duration-300 ${
                          isSelected
                            ? 'bg-indigo-600 shadow-md ring-2 ring-indigo-400'
                            : isOverload
                            ? 'bg-amber-500 hover:bg-amber-600 group-hover:scale-105'
                            : 'bg-indigo-400/80 hover:bg-indigo-500 group-hover:scale-105'
                        }`}
                        style={{ height: `${Math.max(15, heightPercent)}%` }}
                      />
                    </div>

                    <span className={`text-[9px] font-bold uppercase transition-colors ${
                      isSelected ? 'text-indigo-600 font-black' : 'text-slate-400'
                    }`}>
                      W{w}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Breakdown for Selected Week */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-500" />
            โครงการที่ดำเนินงานใน สัปดาห์ W{activeInspectWeek} ({tasksInInspectedWeek.length} โครงการ)
          </h4>
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            {timelineUtils.getMonthName(Math.floor((activeInspectWeek - 1) / 4))}
          </span>
        </div>

        <div className="grid gap-2.5 max-h-[220px] overflow-y-auto custom-slim-scrollbar pr-1">
          {tasksInInspectedWeek.map(t => {
            const owner = t.owner_id ? users.find(u => u.id === t.owner_id) : null;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="group bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {t.initiative}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {t.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {owner && <span>Lead: {owner.name}</span>}
                    <span>W{t.start_week} - W{t.start_week + t.duration_weeks} ({t.duration_weeks} สัปดาห์)</span>
                    <span className="text-indigo-600 font-semibold">{t.progress || 0}% Done</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform shrink-0">
                  <span>ปรับเวลา</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
