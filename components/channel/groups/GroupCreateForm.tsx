import React, { useRef, useEffect } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { DEFAULT_GROUP_COLORS } from '../../../hooks/useChannelGroups';

interface GroupCreateFormProps {
  isCreating: boolean;
  onCancel: () => void;
  onSaveNewGroup: (e: React.FormEvent) => Promise<void>;
  newGroupName: string;
  setNewGroupName: (val: string) => void;
  newGroupDesc: string;
  setNewGroupDesc: (val: string) => void;
  newGroupColor: string;
  setNewGroupColor: (val: string) => void;
  isSubmitting: boolean;
}

export const GroupCreateForm: React.FC<GroupCreateFormProps> = ({
  isCreating = true,
  onCancel,
  onSaveNewGroup,
  newGroupName,
  setNewGroupName,
  newGroupDesc,
  setNewGroupDesc,
  newGroupColor,
  setNewGroupColor,
  isSubmitting,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  if (!isCreating) return null;

  return (
    <form
      onSubmit={onSaveNewGroup}
      className="relative p-5 bg-white/85 backdrop-blur-md rounded-2xl border border-white/80 border-b-[3.5px] border-b-indigo-300/80 ring-1 ring-slate-900/5 shadow-[0_12px_28px_-6px_rgba(99,102,241,0.12)] space-y-4 overflow-hidden"
    >
      {/* 3D Specular Top Rim Light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-indigo-500 opacity-15 blur-2xl" />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          เพิ่มกลุ่มใหม่ (เช่น Lifestyle, บันเทิง, รีวิวสินค้า)
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          ยกเลิก
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            ชื่อกลุ่ม <span className="text-rose-500">*</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="เช่น Lifestyle, การเงิน & การลงทุน, ข่าวบันเทิง"
            className="w-full px-3.5 py-2 text-sm bg-white/90 border border-slate-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium shadow-2xs transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            คำอธิบายกลุ่ม (ถ้ามี)
          </label>
          <input
            type="text"
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            placeholder="คำอธิบายสั้นๆ ของกลุ่มคอนเทนต์นี้"
            className="w-full px-3.5 py-2 text-sm bg-white/90 border border-slate-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* Color Picker */}
      <div className="relative z-10">
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          ธีมสีประจำกลุ่ม
        </label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_GROUP_COLORS.map(c => {
            const isSelected = newGroupColor === c.class;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setNewGroupColor(c.class)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isSelected 
                    ? `${c.class} ring-2 ring-offset-2 ring-indigo-500 shadow-xs scale-105` 
                    : 'bg-white/80 border-slate-200/90 text-slate-600 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${c.colorDot}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !newGroupName.trim()}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          บันทึกกลุ่ม
        </button>
      </div>
    </form>
  );
};
