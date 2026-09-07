import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tag, Plus, X, User as UserIcon, Target, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { RoadmapTask, TaskStatus, roadmapService } from '../../../services/roadmapService';
import FilterDropdown from '../../common/FilterDropdown';
import { User, Goal } from '../../../types';

interface RoadmapStrategyTabProps {
  formData: RoadmapTask;
  setFormData: React.Dispatch<React.SetStateAction<RoadmapTask>>;
  categories: { name: string; color: string; id: string }[];
  setCategories: React.Dispatch<React.SetStateAction<{ name: string; color: string; id: string }[]>>;
  users: User[];
  goals: Goal[];
}

export const RoadmapStrategyTab: React.FC<RoadmapStrategyTabProps> = ({
  formData,
  setFormData,
  categories,
  setCategories,
  users,
  goals
}) => {
  const [newCat, setNewCat] = useState('');
  const [selectedColor, setSelectedColor] = useState('#818CF8');
  const [loading, setLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  const handleAddCategory = async () => {
    if (newCat && !categories.find(c => c.name.toLowerCase() === newCat.toLowerCase())) {
      setLoading(true);
      try {
        const result = await roadmapService.addCategory(newCat, selectedColor);
        setCategories([...categories, result]);
        setFormData(prev => ({ ...prev, category: newCat }));
        setNewCat('');
        setSelectedColor('#818CF8');
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
      if (formData.category === categories.find(c => c.id === catId)?.name) {
        setFormData(prev => ({ ...prev, category: 'Other' }));
      }
    } catch (err) {
      console.error('Delete category failed', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedOwner = users.find(u => u.id === formData.owner_id);
  const selectedGoal = goals.find(g => g.id === formData.goal_id);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Initiative Input */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            ชื่อโครงการหลัก (Initiative Title)
            <span className="text-rose-500">*</span>
          </label>
        </div>
        <input 
          type="text" 
          value={formData.initiative}
          onChange={(e) => setFormData(prev => ({ ...prev, initiative: e.target.value }))}
          placeholder="เช่น Re-branding Brand Identity, เปิดตัว Line Official 2026..."
          className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-5 py-3.5 text-base text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-semibold placeholder:text-slate-300 shadow-sm"
        />
      </div>

      {/* Status Selection */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          สถานะโครงการ (Project Status)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(['Planned', 'Ongoing', 'Done', 'Delayed'] as TaskStatus[]).map((status) => {
            const labels: Record<TaskStatus, { label: string; sub: string }> = {
              Planned: { label: 'แผนงาน', sub: 'Planned' },
              Ongoing: { label: 'กำลังทำ', sub: 'In Progress' },
              Done: { label: 'เสร็จสิ้น', sub: 'Completed' },
              Delayed: { label: 'ล่าช้า', sub: 'At Risk' }
            };
            const isSelected = formData.status === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status }))}
                className={`p-3 rounded-2xl text-left transition-all border ${
                  isSelected 
                    ? status === 'Done'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]'
                      : status === 'Delayed'
                      ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-200 scale-[1.02]'
                      : 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/20'
                }`}
              >
                <p className="text-xs font-bold leading-tight">{labels[status].label}</p>
                <p className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  {labels[status].sub}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row: Project Owner & Goal Connection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Project Owner / DRI */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
            เจ้าของโครงการหลัก (Project Lead / DRI)
          </label>
          <div className="relative">
            <FilterDropdown
              label="ระบุ Project Lead..."
              placeholder="-- ไม่ระบุผู้รับผิดชอบหลัก --"
              icon={
                selectedOwner ? (
                  selectedOwner.avatarUrl ? (
                    <img src={selectedOwner.avatarUrl} alt={selectedOwner.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {selectedOwner.name.charAt(0)}
                    </div>
                  )
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-400" />
                )
              }
              options={users.map(u => ({
                key: u.id,
                label: `${u.name} ${u.role ? `(${u.role})` : ''}`,
                icon: u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                ) : undefined
              }))}
              value={formData.owner_id || ''}
              onChange={(val) => setFormData(prev => ({ ...prev, owner_id: val || undefined }))}
              showAllOption={true}
              clearable={true}
            />
          </div>
        </div>

        {/* Goal Alignment (OKR Connection) */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            เป้าหมายใหญ่ที่ตอบโจทย์ (Goal / OKR Link)
          </label>
          <div>
            <FilterDropdown
              label="เลือกเป้าหมายบริษัท..."
              placeholder="-- ไม่เชื่อมโยงกับ Goal --"
              icon={<Target className="w-4 h-4 text-emerald-500" />}
              options={goals.map(g => ({
                key: g.id,
                label: `${g.title} (${g.platform || 'All'})`,
              }))}
              value={formData.goal_id || ''}
              onChange={(val) => setFormData(prev => ({ ...prev, goal_id: val || undefined }))}
              showAllOption={true}
              clearable={true}
            />
            {selectedGoal && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50/70 border border-emerald-100 px-3 py-1.5 rounded-xl font-medium">
                <span className="truncate">เป้าหมาย: {selectedGoal.title}</span>
                <span className="font-bold shrink-0 ml-2">{selectedGoal.currentValue}/{selectedGoal.targetValue}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Management */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center px-0.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            หมวดหมู่โครงการ (Category)
          </label>
          <button 
            type="button"
            onClick={() => setDeleteMode(!deleteMode)}
            className={`text-[10px] font-bold uppercase px-3 py-1 rounded-lg transition-all ${
              deleteMode 
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-100' 
                : 'text-slate-400 hover:text-indigo-600 bg-slate-50 border border-slate-200'
            }`}
          >
            {deleteMode ? 'เสร็จสิ้นการจัดการ' : 'จัดการหมวดหมู่'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1">
            <FilterDropdown
              label="เลือกหมวดหมู่..."
              icon={<Tag className="w-4 h-4 text-slate-400" />}
              options={categories.map(cat => ({ key: cat.name, label: cat.name }))}
              value={formData.category}
              onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
              showAllOption={false}
              clearable={false}
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <input 
              type="text" 
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="เพิ่มหมวดหมู่ใหม่..."
              className="w-40 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold placeholder:text-slate-300"
            />
            <button 
              disabled={loading || !newCat.trim()}
              onClick={handleAddCategory}
              className="px-5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-bold text-xs border border-indigo-100 shadow-sm"
              type="button"
            >
              เพิ่ม
            </button>
          </div>
        </div>

        {/* Color Palette Dots */}
        <div className="flex flex-col gap-2 p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">โค้ดสีประจำหมวดหมู่:</span>
            {[
              '#EF4444', // Red
              '#E11D48', // Rose/TikTok
              '#D946EF', // Fuchsia/IG
              '#8B5CF6', // Purple
              '#3B82F6', // Blue
              '#0D9488', // Teal
              '#10B981', // Emerald
              '#F59E0B', // Gold/Sponsor
              '#6366F1', // Indigo
              '#64748B'  // Slate
            ].map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setSelectedColor(hex)}
                className="w-5 h-5 rounded-full border transition-all hover:scale-110 active:scale-95 flex items-center justify-center relative shadow-sm"
                style={{ 
                  backgroundColor: hex, 
                  borderColor: selectedColor === hex ? '#1E1B4B' : 'transparent' 
                }}
                title={hex}
              >
                {selectedColor === hex && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                )}
              </button>
            ))}
          </div>
          {newCat && (
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 mt-0.5">
              <span>ตัวอย่างป้าย:</span>
              <span 
                className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider" 
                style={{ 
                  backgroundColor: `${selectedColor}15`, 
                  borderColor: `${selectedColor}40`, 
                  color: selectedColor 
                }}
              >
                {newCat}
              </span>
            </div>
          )}
        </div>

        {/* Delete category list */}
        <AnimatePresence>
          {deleteMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 p-4 bg-rose-50/30 rounded-2xl border border-dashed border-rose-200 overflow-hidden"
            >
              {categories.length === 0 ? (
                <p className="text-xs font-medium text-rose-400 w-full text-center py-1">ยังไม่มีหมวดหมู่ที่กำหนดเอง</p>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-rose-100 shadow-sm animate-in zoom-in-95">
                    <span className="text-xs font-semibold text-slate-700">{cat.name}</span>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }} 
                      className="p-1 hover:bg-rose-50 rounded-full text-rose-400 hover:text-rose-600 transition-colors"
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

      {/* Row: Overview & Target KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Description / Problem Statement */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            รายละเอียดสังเขป (Overview / Scope)
          </label>
          <textarea
            rows={3}
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="สรุปวัตถุประสงค์และขอบเขตงาน เช่น ปรับโทนคอนเทนต์ใหม่ เพื่อเพิ่ม CTR และขยายฐานคนดู..."
            className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium placeholder:text-slate-300 resize-none shadow-sm"
          />
        </div>

        {/* Target KPI / Success Metric */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ตัวชี้วัดความสำเร็จ (Target KPI / Success Metric)
          </label>
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              value={formData.target_kpi || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, target_kpi: e.target.value }))}
              placeholder="เช่น ยอดวิวเฉลี่ย 1.5M, ปิดสปอนเซอร์ 3 ราย..."
              className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl px-5 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all font-semibold placeholder:text-slate-300 shadow-sm"
            />
            <p className="text-[11px] text-slate-400 font-medium">
              กำหนดตัวเลขหรือผลลัพธ์ที่เป็นรูปธรรมที่ใช้วัดผลเมื่อโครงการนี้เสร็จสิ้น
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Analysis - Effort & Impact */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Strategic Prioritization (Value Matrix)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Effort */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">Effort (ความยาก/ทรัพยากร)</span>
              <span className="text-xs font-bold text-indigo-600 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-100 shadow-sm">
                {formData.effort}/5
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, effort: lvl }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    formData.effort === lvl 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {lvl === 1 ? 'ง่าย' : lvl === 5 ? 'ยากมาก' : lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Impact */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">Impact (ผลกระทบต่อธุรกิจ)</span>
              <span className="text-xs font-bold text-emerald-600 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-100 shadow-sm">
                {formData.impact}/5
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, impact: lvl }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    formData.impact === lvl 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
                  }`}
                >
                  {lvl === 1 ? 'น้อย' : lvl === 5 ? 'สูงมาก' : lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
