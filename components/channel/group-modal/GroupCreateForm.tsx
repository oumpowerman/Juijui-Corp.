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
      className="p-5 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4 overflow-hidden"
    >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
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
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
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
                        ? `${c.class} ring-2 ring-offset-1 ring-indigo-500 shadow-xs` 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${c.colorDot}`} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newGroupName.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              บันทึกกลุ่ม
            </button>
          </div>
    </form>
  );
};
