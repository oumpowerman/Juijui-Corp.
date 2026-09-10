import React from 'react';
import { Palette, Tag, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { ChannelLogoSelector } from '../ChannelLogoSelector';

export interface BrandColorOption {
  id: string;
  class: string;
}

interface ChannelBrandTabProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  color: string;
  setColor: (color: string) => void;
  brandColors: BrandColorOption[];
  logoPreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (e: React.MouseEvent) => void;
  isSubmitting: boolean;
}

export const ChannelBrandTab: React.FC<ChannelBrandTabProps> = ({
  name,
  setName,
  description,
  setDescription,
  color,
  setColor,
  brandColors,
  logoPreview,
  onFileChange,
  onRemovePhoto,
  isSubmitting,
}) => {
  return (
    <div className="space-y-5">
      {/* Top Section: Logo & Core Brand Information */}
      <div className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-5 items-start">
        {/* Logo Upload Box */}
        <div className="flex flex-col items-center justify-center self-center sm:self-start shrink-0">
          <ChannelLogoSelector
            logoPreview={logoPreview}
            onFileChange={onFileChange}
            onRemovePhoto={onRemovePhoto}
            isSubmitting={isSubmitting}
          />
          <span className="text-[10px] text-slate-400 mt-2 text-center max-w-[110px] leading-tight">
            ขนาดแนะนำ 500x500px (PNG, JPG)
          </span>
        </div>

        {/* Inputs (Name + Description) */}
        <div className="flex-1 w-full space-y-3.5 min-w-0">
          {/* Name Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="channel-name-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>ชื่อรายการ / แบรนด์ (Channel Name)</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              {name.trim() && (
                <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> พร้อมใช้งาน
                </span>
              )}
            </div>
            <input
              type="text"
              id="channel-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Juijui Vlog, สรุปข่าวเช้า, Tech Talk..."
              className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-slate-800 transition-all text-sm placeholder:font-normal placeholder:text-slate-300 disabled:opacity-70 disabled:bg-slate-50"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label htmlFor="channel-desc-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>รายละเอียด / คอนเซปต์รายการ (Description)</span>
            </label>
            <textarea
              id="channel-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น รายการวาไรตี้เน้นบันเทิงและไลฟ์สไตล์ ถ่ายทำนอกสถานที่ สัปดาห์ละ 2 คลิป..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-slate-700 transition-all resize-none h-20 text-xs leading-relaxed disabled:opacity-70 placeholder:text-slate-300"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Brand Theme Color Selector Card */}
      <div className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-500" />
            <span>สีประจำรายการ (Brand Theme Color)</span>
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">ตัวอย่างแท็ก:</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border transition-all ${color}`}>
              {name.trim() || 'ตัวอย่างชื่อรายการ'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-1">
          {brandColors.map((c) => {
            const isSelected = color === c.class;
            const bgClass = c.class.split(' ')[0];
            const textClass = c.class.split(' ')[1];
            const borderClass = c.class.split(' ')[2];
            const ringColor = c.class.split(' ')[3];

            return (
              <button
                key={c.id}
                type="button"
                id={`brand-color-${c.id}`}
                onClick={() => setColor(c.class)}
                disabled={isSubmitting}
                className={`
                  h-10 rounded-xl border-2 transition-all relative flex items-center justify-center
                  ${bgClass} ${borderClass}
                  ${isSelected ? `ring-2 ring-offset-2 ${ringColor} scale-105 shadow-sm font-bold` : 'hover:scale-105 opacity-80 hover:opacity-100'}
                  ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
                title={`เลือกโทนสี ${c.id}`}
              >
                {isSelected && (
                  <span className={`text-xs font-black ${textClass}`}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
