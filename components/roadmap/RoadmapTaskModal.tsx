
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, PlayCircle, AlertCircle, Save, Trash2, Calendar, LayoutGrid, Tag } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ROADMAP_CATEGORIES, RoadmapTask, TaskStatus, roadmapService, timelineUtils } from '../../services/roadmapService';
import FilterDropdown from '../common/FilterDropdown';
import "react-datepicker/dist/react-datepicker.css";

interface RoadmapTaskModalProps {
  task: RoadmapTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: RoadmapTask) => void;
  onDelete?: (id: string) => void;
}

const RoadmapTaskModal: React.FC<RoadmapTaskModalProps> = ({ task, isOpen, onClose, onSave, onDelete }) => {
  const [categories, setCategories] = useState<{name: string, color: string, id: string}[]>([]);
  const [newCat, setNewCat] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  
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
  });

  const [startDate, setStartDate] = useState<Date>(new Date());

  useEffect(() => {
    const loadCats = async () => {
      try {
        const data = await roadmapService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Load categories failed', err);
      }
    };
    if (isOpen) {
      loadCats();
      setDeleteMode(false);
      if (task) {
        setFormData(task);
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
        });
        setStartDate(timelineUtils.getDateFromWeekIndex(currentWeek));
      }
    }
  }, [task, isOpen]);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      const weekIdx = timelineUtils.getWeekIndexFromDate(date);
      setFormData({ ...formData, start_week: weekIdx });
    }
  };

  const handleAddCategory = async () => {
    if (newCat && !categories.find(c => c.name === newCat)) {
      setLoading(true);
      try {
        const result = await roadmapService.addCategory(newCat);
        setCategories([...categories, result]);
        setFormData({ ...formData, category: newCat });
        setNewCat('');
      } catch (err) {
        console.error('Add category failed', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    setLoading(true);
    try {
      await roadmapService.deleteCategory(catId);
      setCategories(prev => prev.filter(c => c.id !== catId));
      // If the current task has this category, we might want to reset it or keep as is
      if (formData.category === categories.find(c => c.id === catId)?.name) {
        setFormData({ ...formData, category: 'Other' });
      }
    } catch (err) {
      console.error('Delete category failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[calc(100vh-100px)] my-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-slate-50 bg-white">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {task ? 'แก้ไขโครงการ' : 'สร้างโครงการใหม่'}
            </h3>
            <p className="text-sm font-medium text-slate-400 mt-1">จัดการรายละเอียดข้อมูล ContentOS Roadmap</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-slate-50 rounded-full text-slate-300 hover:text-slate-900 transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-10 py-8 space-y-8 overflow-y-auto custom-slim-scrollbar flex-1 bg-white">
          {/* Initiative Input */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-[0.2em] pl-1">ชื่อโครงการหลัก</label>
            <div className="relative">
              <input 
                type="text" 
                value={formData.initiative}
                onChange={(e) => setFormData({ ...formData, initiative: e.target.value })}
                placeholder="พิมพ์ชื่อโครงการ..."
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-lg text-slate-900 focus:outline-none focus:border-indigo-500/20 focus:bg-white transition-all font-bold placeholder:text-slate-200"
              />
            </div>
          </div>

          {/* Status Selection Row */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-[0.2em] pl-1">สถานะโครงการ</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['Planned', 'Ongoing', 'Done', 'Delayed'] as TaskStatus[]).map((status) => {
                const labels: Record<TaskStatus, string> = {
                  Planned: 'แผนงาน',
                  Ongoing: 'กำลังทำ',
                  Done: 'เสร็จสิ้น',
                  Delayed: 'ล่าช้า'
                };
                const isSelected = formData.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={`px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-slate-500'
                    }`}
                  >
                    {labels[status]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Management Row */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-[0.2em]">หมวดหมู่โครงการ</label>
              <button 
                onClick={() => setDeleteMode(!deleteMode)}
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg transition-all ${deleteMode ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-indigo-600 bg-slate-50'}`}
              >
                {deleteMode ? 'เสร็จสิ้น' : 'จัดการหมวดหมู่'}
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <FilterDropdown
                    label="เลือกหมวดหมู่"
                    icon={<Tag className="w-4 h-4" />}
                    options={categories.map(cat => ({ key: cat.name, label: cat.name }))}
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    showAllOption={false}
                    clearable={false}
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <input 
                    type="text" 
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="เพิ่ม..."
                    className="w-24 bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/20 transition-all font-bold"
                  />
                  <button 
                    disabled={loading || !newCat}
                    onClick={handleAddCategory}
                    className="px-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all font-bold"
                    type="button"
                  >
                    เพิ่ม
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {deleteMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2 p-4 bg-rose-50/30 rounded-2xl border border-dashed border-rose-100 overflow-hidden"
                  >
                    {categories.length === 0 ? (
                      <p className="text-[10px] font-bold text-rose-300 w-full text-center py-2">ไม่มีหมวดหมู่ให้จัดการ</p>
                    ) : (
                      categories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-rose-50 shadow-sm animate-in zoom-in-95">
                          <span className="text-xs font-bold text-slate-600">{cat.name}</span>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteCategory(cat.id);
                            }} 
                            className="p-1 hover:bg-rose-50 rounded-full text-rose-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-[0.2em] pl-1">ความคืบหน้าโครงการ</label>
                <span className="text-base font-bold text-indigo-600">{formData.progress}%</span>
             </div>
             <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
             />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-[0.2em] pl-1">วันที่เริ่มต้นโครงการ</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10 font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <DatePicker
                  selected={startDate}
                  onChange={handleDateChange}
                  dateFormat="dd MMMM yyyy"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-base text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold cursor-pointer"
                  popperClassName="custom-calendar-popper"
                  calendarClassName="custom-calendar"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-indigo-50 text-indigo-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter">
                  W{formData.start_week}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-[0.2em] pl-1">ระยะเวลา (สัปดาห์)</label>
              <input 
                type="number" 
                min="1" 
                max="52"
                value={formData.duration_weeks}
                onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-base text-slate-900 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-[0.2em] pl-1">ข้อมูลเพิ่มเติม (Milestone / Buffer)</label>
            <div className="grid grid-cols-2 gap-4">
               <input 
                  type="text" 
                  placeholder="เช่น 2d (Buffer)"
                  value={formData.buffer}
                  onChange={(e) => setFormData({ ...formData, buffer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm text-slate-900 focus:outline-none font-bold"
               />
               <input 
                  type="text" 
                  placeholder="เป้าหมายที่สำคัญ"
                  value={formData.milestone || ''}
                  onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm text-slate-900 focus:outline-none font-bold"
               />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-slate-50/50 flex gap-4 border-t border-slate-50 items-center">
           {task && onDelete && (
             <button 
                onClick={() => onDelete(task.id)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 font-bold text-xs transition-all active:scale-95"
             >
                <Trash2 className="w-3.5 h-3.5" />
                ลบโครงการ
             </button>
           )}
           <div className="flex-1" />
           <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-slate-900 font-bold text-xs transition-all"
           >
            ยกเลิก
           </button>
           <button 
            onClick={() => onSave(formData)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95"
           >
            <Save className="w-4 h-4" />
            บันทึก
           </button>
        </div>
      </motion.div>
    </div>

  );
};

export default RoadmapTaskModal;
