import React from 'react';
import { PlayCircle, User as UserIcon, Calendar, CheckCircle2, ArrowUpRight, Diamond } from 'lucide-react';
import { RoadmapTask, timelineUtils } from '../../../services/roadmapService';
import { User, Goal } from '../../../types';

interface ActiveProjectsInsightModalProps {
  tasks: RoadmapTask[];
  users: User[];
  goals: Goal[];
  onSelectTask: (task: RoadmapTask) => void;
}

export const ActiveProjectsInsightModal: React.FC<ActiveProjectsInsightModalProps> = ({
  tasks,
  users,
  goals,
  onSelectTask
}) => {
  const ongoingTasks = tasks.filter(t => t.status === 'Ongoing');
  const currentWeek = timelineUtils.getCurrentWeekIndex();

  const avgProgress = ongoingTasks.length > 0
    ? Math.round(ongoingTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / ongoingTasks.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100/80">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">โครงการที่รันอยู่ขณะนี้</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-indigo-700">{ongoingTasks.length}</span>
            <span className="text-xs font-bold text-indigo-500">โครงการ</span>
          </div>
        </div>

        <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-100/80">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">ความคืบหน้าเฉลี่ย</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-emerald-700">{avgProgress}%</span>
            <span className="text-xs font-bold text-emerald-600">Completion</span>
          </div>
        </div>

        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สัปดาห์ปัจจุบัน</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-800">W{currentWeek}</span>
            <span className="text-xs font-bold text-slate-500">
              {timelineUtils.getMonthName(Math.floor((currentWeek - 1) / 4))}
            </span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <PlayCircle className="w-4 h-4 text-indigo-600" />
            รายการโครงการที่กำลังดำเนินการ (Active Pipeline)
          </h4>
          <span className="text-xs font-semibold text-slate-400">คลิกที่แถวเพื่อแก้ไขข้อมูล</span>
        </div>

        {ongoingTasks.length === 0 ? (
          <div className="py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
            ไม่มีโครงการที่กำลังดำเนินการอยู่ในสถานะ "Ongoing"
          </div>
        ) : (
          <div className="grid gap-3 max-h-[380px] overflow-y-auto custom-slim-scrollbar pr-1">
            {ongoingTasks.map((t) => {
              const owner = t.owner_id ? users.find(u => u.id === t.owner_id) : null;
              const goal = t.goal_id ? goals.find(g => g.id === t.goal_id) : null;
              const weeksRemaining = Math.max(0, (t.start_week + t.duration_weeks) - currentWeek);

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="group bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {t.category || 'General'}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {t.initiative}
                      </h5>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      {owner && (
                        <span className="flex items-center gap-1 font-semibold">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          {owner.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        W{t.start_week} - W{t.start_week + t.duration_weeks} ({t.duration_weeks}w)
                      </span>
                      {weeksRemaining > 0 ? (
                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          เหลือ {weeksRemaining} สัปดาห์
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                          ครบกำหนดสัปดาห์นี้
                        </span>
                      )}
                      {t.milestone && (
                        <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                          <Diamond className="w-3 h-3 text-amber-500" />
                          {t.milestone}
                        </span>
                      )}
                      {goal && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Goal: {goal.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress side */}
                  <div className="flex items-center gap-4 sm:w-48 shrink-0">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-indigo-600">{t.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${t.progress || 0}%` }}
                        />
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
