import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Info,
  Link2,
  ChevronDown
} from 'lucide-react';
import { BrandGuidelineLink, BrandLinkType } from '../../../types';
import { 
  BRAND_LINK_CONFIGS, 
  detectBrandLinkType, 
  sanitizeUrl, 
  PRESET_GUIDELINE_TITLES 
} from '../brandGuidelinesHelper';

interface ChannelGuidelinesTabProps {
  links: BrandGuidelineLink[];
  setLinks: React.Dispatch<React.SetStateAction<BrandGuidelineLink[]>>;
  isSubmitting: boolean;
}

export const ChannelGuidelinesTab: React.FC<ChannelGuidelinesTabProps> = ({
  links,
  setLinks,
  isSubmitting,
}) => {
  // New link form state
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<BrandLinkType>('NOTION');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Handle URL Change with Auto Detection
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewUrl(val);
    if (val.trim()) {
      const detected = detectBrandLinkType(val);
      setNewType(detected);
      setIsAutoDetected(true);
    }
  };

  const handleAddLink = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newEntry: BrandGuidelineLink = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      url: sanitizeUrl(newUrl),
      type: newType,
      description: newDescription.trim() || undefined,
    };

    setLinks(prev => [...prev, newEntry]);

    // Reset Form
    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
    setNewType('NOTION');
    setIsAutoDetected(false);
    setShowPresets(false);
  };

  const handleDeleteLink = (id: string) => {
    setLinks(prev => prev.filter(item => item.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setLinks(prev => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === links.length - 1) return;
    setLinks(prev => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleSelectPreset = (title: string) => {
    setNewTitle(title);
    setShowPresets(false);
  };

  return (
    <div className="space-y-6">
      {/* Intro Box */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/30 rounded-2xl border border-indigo-100/90 border-b-[2.5px] border-b-indigo-200 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            เอกลักษณ์แบรนด์ & คู่มือการทำงาน (Brand Guidelines & SOP)
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            เพิ่มลิงก์เอกสารสำคัญ เช่น Notion CI, คู่มือการถ่าย/ตัดต่อ, Google Drive เก็บ Asset, Moodboard หรือ Canva Template เพื่อให้ทีมงานเปิดอ่านได้ทันทีจากการ์ดหน้าหลัก
          </p>
        </div>
      </div>

      {/* Add New Link Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/90 border-b-[3px] border-b-slate-300 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              เพิ่มเอกสาร / ลิงก์ใหม่
            </span>
          </div>
          {/* Preset Title Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-lg border border-indigo-200/60 flex items-center gap-1 transition-all"
            >
              <span>เทมเพลตชื่อ</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showPresets && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">
                  เลือกชื่อแนะนำ
                </div>
                {PRESET_GUIDELINE_TITLES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium truncate"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* 1. Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>ชื่อเอกสาร / หัวข้อ</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="เช่น Brand Identity & CI Guide"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl outline-none text-xs font-bold text-slate-800 shadow-2xs transition-all"
              disabled={isSubmitting}
            />
          </div>

          {/* 2. Platform Type */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">ประเภทเครื่องมือ / แพลตฟอร์ม</label>
              {isAutoDetected && (
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ตรวจจับอัตโนมัติ
                </span>
              )}
            </div>
            <select
              value={newType}
              onChange={(e) => {
                setNewType(e.target.value as BrandLinkType);
                setIsAutoDetected(false);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl outline-none text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              {Object.entries(BRAND_LINK_CONFIGS).map(([k, cfg]) => (
                <option key={k} value={k}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. URL */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>ลิงก์ปลายทาง (URL)</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              <Link2 className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={newUrl}
              onChange={handleUrlChange}
              placeholder="เช่น https://notion.so/..., https://docs.google.com/..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl outline-none text-xs font-medium text-slate-800 shadow-2xs transition-all"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* 4. Description (Optional) */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>คำอธิบายสั้นๆ (ทางเลือก)</span>
            <span className="text-[10px] text-slate-400 font-normal">(เช่น "อัปเดต 2026", "สำหรับทีมถ่ายทำ")</span>
          </label>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="เช่น โทนสีและฟอนต์หลักประจำช่อง, สคริปต์กลาง"
            className="w-full px-3.5 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl outline-none text-xs font-medium text-slate-800 shadow-2xs transition-all"
            disabled={isSubmitting}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAddLink}
            disabled={!newTitle.trim() || !newUrl.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold rounded-xl border border-indigo-600 border-b-[2.5px] border-b-indigo-800 shadow-sm transition-all active:translate-y-[1px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายการนี้</span>
          </button>
        </div>
      </div>

      {/* List of Existing Links */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            รายการเอกสารที่บันทึกไว้ ({links.length})
          </h4>
          {links.length > 1 && (
            <span className="text-[11px] text-slate-400 font-medium">
              สามารถกดเลื่อนลำดับขึ้น-ลงได้
            </span>
          )}
        </div>

        {links.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 p-4">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-600">ยังไม่มีลิงก์เอกสารสำหรับแบรนด์นี้</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              กรอกฟอร์มด้านบนเพื่อเพิ่มคู่มือ Notion, Google Docs หรือ Drive
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {links.map((link, idx) => {
              const cfg = BRAND_LINK_CONFIGS[link.type || 'OTHER'] || BRAND_LINK_CONFIGS.OTHER;
              const Icon = cfg.icon;

              return (
                <div
                  key={link.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200/90 border-b-[2.5px] border-b-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-indigo-200 transition-all group"
                >
                  {/* Left: Platform badge + Title + URL */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl ${cfg.badgeBg} ${cfg.badgeText} flex items-center justify-center shrink-0 shadow-2xs`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 truncate" title={link.title}>
                          {link.title}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                          {cfg.label}
                        </span>
                      </div>
                      {link.description && (
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {link.description}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                        {link.url}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Test Link + Move + Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={sanitizeUrl(link.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="เปิดลิงก์ทดสอบ"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <div className="flex items-center border-l border-slate-200 pl-1 ml-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded-lg"
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === links.length - 1}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded-lg"
                        title="เลื่อนลง"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
