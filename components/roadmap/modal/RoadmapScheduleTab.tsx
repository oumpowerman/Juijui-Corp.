import React from 'react';
import { Calendar, Clock, Diamond, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { RoadmapTask, timelineUtils } from '../../../services/roadmapService';
import "react-datepicker/dist/react-datepicker.css";

interface RoadmapScheduleTabProps {
  formData: RoadmapTask;
  setFormData: React.Dispatch<React.SetStateAction<RoadmapTask>>;
  startDate: Date;
  setStartDate: React.Dispatch<React.SetStateAction<Date>>;
  allTasks: RoadmapTask[];
  currentTaskId?: string;
}

export const RoadmapScheduleTab: React.FC<RoadmapScheduleTabProps> = ({
  formData,
  setFormData,
  startDate,
  setStartDate,
  allTasks,
  currentTaskId
}) => {
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      const weekIdx = timelineUtils.getWeekIndexFromDate(date);
      setFormData(prev => ({ ...prev, start_week: weekIdx }));
    }
  };

  const otherTasks = allTasks.filter(t => t.id !== currentTaskId);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Date & Duration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Date */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            วันที่เริ่มต้นโครงการ (Start Date)
          </label>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10">
              <Calendar className="w-4 h-4" />
            </div>
            <DatePicker
              selected={startDate}
              onChange={handleDateChange}
              dateFormat="dd MMMM yyyy"
              className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl pl-12 pr-16 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-semibold cursor-pointer shadow-sm"
              popperClassName="custom-calendar-popper"
              calendarClassName="custom-calendar"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-tight border border-indigo-100/50 shadow-sm">
              สัปดาห์ W{formData.start_week}
            </div>
          </div>
        </div>

        {/* Duration in Weeks */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            ระยะเวลาดำเนินงาน (Duration)
          </label>
          <div className="relative">
            <input 
              type="number" 
              min="1" 
              max="52"
              value={formData.duration_weeks}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_weeks: Math.max(1, parseInt(e.target.value) || 1) }))}
              className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-5 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-semibold shadow-sm"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none uppercase">
              สัปดาห์ ({formData.duration_weeks * 7} วัน)
            </div>
          </div>
        </div>
      </div>

      {/* Buffer & Milestone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Buffer Time */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            บัฟเฟอร์เวลาเผื่อล่าช้า (Buffer)
          </label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="เช่น 2d, 1w, 3d..."
              value={formData.buffer}
              onChange={(e) => setFormData(prev => ({ ...prev, buffer: e.target.value }))}
              className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-5 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-semibold placeholder:text-slate-300 shadow-sm"
            />
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            ระยะเวลาเผื่อแก้ชิ้นงาน หรือขั้นตอนตรวจรับงานก่อนปล่อยจริง
          </p>
        </div>

        {/* Milestone */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Diamond className="w-3.5 h-3.5 text-amber-500" />
            หมุดหมายสำคัญ (Key Milestone)
          </label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="เช่น Launch Event, ปล่อยคลิป EP.1..."
              value={formData.milestone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, milestone: e.target.value }))}
              className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-5 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all font-semibold placeholder:text-slate-300 shadow-sm"
            />
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            จุดเช็คพอยต์สำคัญที่สุดของโครงการนี้
          </p>
        </div>
      </div>

      {/* Dependencies Section */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-amber-500" />
            โครงการตั้งต้นที่ต้องเสร็จก่อน (Predecessor Dependencies)
          </label>
          {(formData.dependencies?.length || 0) > 0 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
              ผูกไว้ {formData.dependencies?.length} โครงการ
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          หากโครงการตั้งต้นที่เลือกไว้เกิด "ล่าช้า (Delayed)" ระบบจะแจ้งเตือนความเสี่ยงบนตาราง Gantt ทันที
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {otherTasks.length === 0 ? (
            <div className="w-full py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              ยังไม่มีโครงการอื่นใน Roadmap ให้เลือกเชื่อมโยง
            </div>
          ) : (
            otherTasks.map(t => {
              const isDep = formData.dependencies?.includes(t.id);
              const isTaskDelayed = t.status === 'Delayed';
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const current = formData.dependencies || [];
                    if (isDep) {
                      setFormData(prev => ({ ...prev, dependencies: current.filter(id => id !== t.id) }));
                    } else {
                      setFormData(prev => ({ ...prev, dependencies: [...current, t.id] }));
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isDep 
                      ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50/20'
                  }`}
                >
                  <Diamond className={`w-3 h-3 ${isDep ? 'fill-white' : 'fill-none'}`} />
                  <span>{t.initiative}</span>
                  {isTaskDelayed && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${isDep ? 'bg-rose-900/40 text-rose-200' : 'bg-rose-100 text-rose-600'}`}>
                      ล่าช้า
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
