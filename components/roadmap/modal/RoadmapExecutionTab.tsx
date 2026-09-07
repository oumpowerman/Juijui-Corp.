import React from 'react';
import { CheckCircle2, Plus, LayoutGrid, AlertCircle, User as UserIcon, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { RoadmapTask, timelineUtils } from '../../../services/roadmapService';
import { Task, User } from '../../../types';

interface RoadmapExecutionTabProps {
  formData: RoadmapTask;
  setFormData: React.Dispatch<React.SetStateAction<RoadmapTask>>;
  executionTasks: Task[];
  users: User[];
  onAddTask?: (roadmapId: string, initiative: string, startDate: Date, endDate: Date) => void;
  onEditTask?: (task: Task) => void;
  isExistingTask: boolean;
}

export const RoadmapExecutionTab: React.FC<RoadmapExecutionTabProps> = ({
  formData,
  setFormData,
  executionTasks,
  users,
  onAddTask,
  onEditTask,
  isExistingTask
}) => {
  const completedCount = executionTasks.filter(t => t.status === 'DONE').length;
  const autoPercent = executionTasks.length > 0 
    ? Math.round((completedCount / executionTasks.length) * 100) 
    : 0;

  const handleSyncProgress = () => {
    setFormData(prev => ({ ...prev, progress: autoPercent }));
  };

  const handleCreateNewExecutionTask = () => {
    const sDate = timelineUtils.getDateFromWeekIndex(formData.start_week);
    const eDate = timelineUtils.getDateFromWeekIndex(formData.start_week + formData.duration_weeks);
    onAddTask?.(formData.id, formData.initiative, sDate, eDate);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Progress Section */}
      <div className="p-5 bg-slate-50/70 border border-slate-200/60 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                ความคืบหน้าโครงการรวม (Overall Progress)
              </label>
              <div className="px-3 py-0.5 bg-indigo-600 text-white rounded-full text-xs font-black shadow-sm">
                {formData.progress}%
              </div>
            </div>
            {executionTasks.length > 0 && (
              <p className="text-xs font-medium text-slate-400">
                งานปฏิบัติการย่อย: {completedCount}/{executionTasks.length} เสร็จสิ้น
              </p>
            )}
          </div>

          {executionTasks.length > 0 && (
            <button
              type="button"
              onClick={handleSyncProgress}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs border border-indigo-100/80 transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ซิงค์จากงานย่อย ({autoPercent}%)</span>
            </button>
          )}
        </div>

        {/* Progress Range Bar */}
        <div className="space-y-3 pt-1">
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            value={formData.progress}
            onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
            className="w-full h-3 bg-slate-200/80 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
          />

          {/* Quick Step Buttons */}
          <div className="flex gap-2 justify-between">
            {[0, 25, 50, 75, 100].map(step => (
              <button
                key={step}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, progress: step }))}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  formData.progress === step
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {step}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Execution Tasks List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-0.5">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              งานปฏิบัติการย่อย (Execution Tasks)
            </label>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              รายการงานที่มอบหมายให้ทีมงานเพื่อผลักดันโครงการนี้ให้สำเร็จ
            </p>
          </div>

          {isExistingTask ? (
            <button 
              type="button"
              onClick={handleCreateNewExecutionTask}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-xs shadow-md shadow-indigo-100 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              สั่งงานใหม่
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">
              (บันทึกโครงการก่อนเพื่อสั่งงานย่อย)
            </span>
          )}
        </div>

        <div className="grid gap-2.5 max-h-64 overflow-y-auto custom-slim-scrollbar pr-1">
          {executionTasks.length === 0 ? (
            <div className="py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-4 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600">ยังไม่มีงานปฏิบัติการที่เชื่อมโยง</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  คุณสามารถสั่งงานทีม เช่น ถ่ายทำ, ตัดต่อ, สรุปสคริปต์ เพื่อผูกกับ Roadmap นี้ได้
                </p>
              </div>
              {isExistingTask && (
                <button
                  type="button"
                  onClick={handleCreateNewExecutionTask}
                  className="mt-2 flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 text-indigo-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  สั่งงานปฏิบัติการแรก
                </button>
              )}
            </div>
          ) : (
            executionTasks.map(execTask => (
              <div 
                key={execTask.id}
                onClick={() => onEditTask?.(execTask)}
                className="group flex items-center gap-3.5 bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/50 transition-all cursor-pointer"
              >
                {/* Status Dot */}
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  execTask.status === 'DONE' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 
                  execTask.status === 'ON_GOING' ? 'bg-indigo-500 shadow-sm shadow-indigo-200' : 'bg-slate-300'
                }`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {execTask.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    {/* Assignees */}
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {execTask.assigneeIds.slice(0, 3).map(uid => {
                        const user = users.find(u => u.id === uid);
                        return (
                          <div 
                            key={uid} 
                            className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center shrink-0" 
                            title={user?.name}
                          >
                            {user?.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <UserIcon className="w-2.5 h-2.5 text-slate-400" />
                            )}
                          </div>
                        );
                      })}
                      {execTask.assigneeIds.length > 3 && (
                        <div className="w-5 h-5 rounded-full bg-slate-50 border border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                          +{execTask.assigneeIds.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Due Date */}
                    {execTask.endDate && (
                      <span className="flex items-center gap-1 font-semibold text-slate-400 text-[10px]">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(execTask.endDate), 'dd/MM/yyyy')}
                      </span>
                    )}

                    {/* Status Pill */}
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                      execTask.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' :
                      execTask.status === 'ON_GOING' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {execTask.status === 'DONE' ? 'เสร็จสิ้น' : execTask.status === 'ON_GOING' ? 'กำลังทำ' : 'รอดำเนินการ'}
                    </span>
                  </div>
                </div>

                <AlertCircle className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
