import React from 'react';
import { AlertCircle, Link2, ShieldAlert, ArrowUpRight, CheckCircle2, User as UserIcon, Calendar } from 'lucide-react';
import { RoadmapTask, timelineUtils } from '../../../services/roadmapService';
import { User } from '../../../types';

interface DelayedProjectsInsightModalProps {
  tasks: RoadmapTask[];
  users: User[];
  onSelectTask: (task: RoadmapTask) => void;
}

export const DelayedProjectsInsightModal: React.FC<DelayedProjectsInsightModalProps> = ({
  tasks,
  users,
  onSelectTask
}) => {
  const delayedTasks = tasks.filter(t => t.status === 'Delayed');
  const currentWeek = timelineUtils.getCurrentWeekIndex();

  // Find cascading impacted tasks: tasks that have dependencies pointing to a delayed task
  const delayedIds = new Set(delayedTasks.map(t => t.id));
  const impactedTasks = tasks.filter(t => 
    t.status !== 'Delayed' && 
    t.dependencies && 
    t.dependencies.some(depId => delayedIds.has(depId))
  );

  return (
    <div className="space-y-6">
      {/* Top Warning Banner */}
      {delayedTasks.length > 0 ? (
        <div className="p-5 bg-rose-50 rounded-2xl border border-rose-200/80 flex items-start gap-3.5">
          <div className="p-2 bg-rose-100 rounded-xl text-rose-700 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-900">
              พบ {delayedTasks.length} โครงการที่เสร็จไม่ทันตามกำหนดการ (Delayed Schedule Triage)
            </h4>
            <p className="text-xs text-rose-800 font-medium">
              อาจส่งผลกระทบต่อเนื่องไปยังโครงการตั้งต้นและส่งผลให้แผนงานในอนาคต {impactedTasks.length} โครงการเกิดความล่าช้าสะสม
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center gap-3.5">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
              ไม่มีโครงการที่ล่าช้า (All Clear)
            </h4>
            <p className="text-xs text-emerald-800 font-medium">
              ทุกโครงการดำเนินงานได้ตามกำหนดการและบัฟเฟอร์เวลาที่วางไว้
            </p>
          </div>
        </div>
      )}

      {/* Delayed Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            รายการโครงการที่อยู่ในสถานะล่าช้า (At Risk Initiatives)
          </h4>
          <span className="text-xs font-semibold text-slate-400">คลิกที่โครงการเพื่อขยายเวลาหรือปรับบัฟเฟอร์</span>
        </div>

        {delayedTasks.length === 0 ? (
          <div className="py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
            ไม่มีโครงการที่ล่าช้าในระบบ
          </div>
        ) : (
          <div className="grid gap-3 max-h-[260px] overflow-y-auto custom-slim-scrollbar pr-1">
            {delayedTasks.map(t => {
              const owner = t.owner_id ? users.find(u => u.id === t.owner_id) : null;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="group bg-white p-4 rounded-2xl border border-rose-200 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 uppercase">
                        ล่าช้า
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                        {t.initiative}
                      </h5>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {owner && (
                        <span className="flex items-center gap-1 font-semibold text-slate-600">
                          <UserIcon className="w-3.5 h-3.5" />
                          {owner.name}
                        </span>
                      )}
                      <span>
                        กำหนดการเดิม: W{t.start_week} - W{t.start_week + t.duration_weeks}
                      </span>
                      <span className="font-bold text-rose-600">
                        คืบหน้าเพียง {t.progress || 0}%
                      </span>
                      {t.buffer && (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Buffer: {t.buffer}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span>แก้ไขตาราง</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cascading Impact on Dependent Projects */}
      {impactedTasks.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-amber-500" />
              โครงการถัดไปที่อาจได้รับผลกระทบลูกโซ่ ({impactedTasks.length} โครงการ)
            </h4>
          </div>

          <div className="grid gap-2.5 max-h-[180px] overflow-y-auto custom-slim-scrollbar pr-1">
            {impactedTasks.map(it => (
              <div
                key={it.id}
                onClick={() => onSelectTask(it)}
                className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/70 hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{it.initiative}</p>
                  <p className="text-[11px] text-amber-800 font-medium">
                    เริ่ม W{it.start_week} (ผูกกับโครงการที่กำลังล่าช้าอยู่)
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg shrink-0">
                  รอโครงการตั้งต้น
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
