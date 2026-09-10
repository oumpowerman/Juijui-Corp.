import React from 'react';
import { Palette, Tag, FileText, Sparkles, CheckCircle2, Eye, Calendar, Layers, CheckCheck } from 'lucide-react';
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
  // Extract color classes for preview card styling
  const colorParts = color ? color.split(' ') : ['bg-indigo-100', 'text-indigo-800', 'border-indigo-200', 'ring-indigo-500'];
  const bgClass = colorParts[0] || 'bg-indigo-100';
  const textClass = colorParts[1] || 'text-indigo-800';

  return (
    <div className="space-y-6">
      {/* Top Section: Logo & Core Brand Information */}
      <div className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-6 items-start">
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
        <div className="flex-1 w-full space-y-4 min-w-0">
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

          {/* Description Input (Expanded height for comfortable input) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="channel-desc-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>รายละเอียด / คอนเซปต์รายการ (Description)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {description.length > 0 ? `${description.length} ตัวอักษร` : 'ไม่บังคับ'}
              </span>
            </div>
            <textarea
              id="channel-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น รายการวาไรตี้เน้นบันเทิงและไลฟ์สไตล์ ถ่ายทำนอกสถานที่ สัปดาห์ละ 2 คลิป กลุ่มผู้ชมวัย 18-35 ปี..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-slate-700 transition-all resize-none h-28 sm:h-32 text-xs sm:text-sm leading-relaxed disabled:opacity-70 placeholder:text-slate-300"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Brand Theme Color Selector Card */}
      <div className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-3.5">
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
            const swatchBgClass = c.class.split(' ')[0];
            const swatchTextClass = c.class.split(' ')[1];
            const swatchBorderClass = c.class.split(' ')[2];
            const swatchRingColor = c.class.split(' ')[3];

            return (
              <button
                key={c.id}
                type="button"
                id={`brand-color-${c.id}`}
                onClick={() => setColor(c.class)}
                disabled={isSubmitting}
                className={`
                  h-10 rounded-xl border-2 transition-all relative flex items-center justify-center
                  ${swatchBgClass} ${swatchBorderClass}
                  ${isSelected ? `ring-2 ring-offset-2 ${swatchRingColor} scale-105 shadow-sm font-bold` : 'hover:scale-105 opacity-80 hover:opacity-100'}
                  ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
                title={`เลือกโทนสี ${c.id}`}
              >
                {isSelected && (
                  <span className={`text-xs font-black ${swatchTextClass}`}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Column Area for Expanded Height: Live Channel Preview + Brand Identity Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Live Channel Preview Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>ตัวอย่างการแสดงผลบัตรรายการ (Live Preview)</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              CARD-PREVIEW
            </span>
          </div>

          {/* Simulated Channel Banner & Card Body */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              {/* Card Banner */}
              <div className={`h-16 w-full ${bgClass} rounded-xl relative overflow-hidden flex items-center justify-end px-3`}>
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{ 
                    backgroundImage: 'radial-gradient(circle, currentColor 1.2px, transparent 1.2px)', 
                    backgroundSize: '8px 8px',
                    color: 'inherit'
                  }} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-transparent" />
                <span className={`relative z-10 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${color}`}>
                  {name.trim() || 'แบรนด์ใหม่'}
                </span>
              </div>

              {/* Floating Crest & Channel Name */}
              <div className="flex items-end gap-3 -mt-6 px-2 mb-3">
                <div className="w-14 h-14 rounded-2xl border-[3px] border-white shadow-md bg-white overflow-hidden flex items-center justify-center shrink-0 z-10">
                  {logoPreview ? (
                    <img src={logoPreview} className="w-full h-full object-cover" alt="Channel preview logo" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center font-black text-lg uppercase ${bgClass} ${textClass}`}>
                      {(name.trim() || 'CH').substring(0, 2)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  <h4 className="font-bold text-sm text-slate-800 truncate" title={name.trim() || 'ยังไม่ได้ระบุชื่อ'}>
                    {name.trim() || 'ชื่อรายการของคุณ'}
                  </h4>
                  <p className="text-[10px] text-slate-400">สถานะ: แสดงผลในคลังและแดชบอร์ด</p>
                </div>
              </div>

              {/* Description preview */}
              <p className="text-xs text-slate-600 line-clamp-2 px-2 leading-relaxed">
                {description.trim() || 'ยังไม่มีคำอธิบายรายการ เมื่อกรอกข้อมูลในช่องด้านบน ตัวอย่างจะแสดงที่นี่ทันที...'}
              </p>
            </div>

            {/* Bottom mini status */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 px-2">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCheck className="w-3 h-3" /> เชื่อมต่อกับระบบงานอัตโนมัติ
              </span>
              <span>พร้อมบันทึก</span>
            </div>
          </div>
        </div>

        {/* Brand Identity Guide & Tips Card */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>คำแนะนำอัตลักษณ์ช่อง (Brand Identity Tips)</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-800">ปฏิทินงาน & ไทม์ไลน์ (Calendar)</h5>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                    สีประจำรายการจะใช้เป็นแท็กและแถบสีบนการ์ดงาน ช่วยให้ทีมงานแยกแยะช่องทางได้ทันที
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-800">คลังคอนเทนต์ (Content Stock)</h5>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                    ป้ายรายการและโลโก้จะถูกใช้จัดหมวดหมู่คลิป ฟุตเทจดิบ และสถิติการผลิต
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 bg-white/70 p-2.5 rounded-xl border border-slate-200/60 mt-3 flex items-center justify-between">
            <span>💡 สามารถตั้งค่าแพลตฟอร์มและหมวดหมู่เนื้อหาเพิ่มเติมได้ในแท็บถัดไป</span>
          </div>
        </div>
      </div>
    </div>
  );
};
