import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  ExternalLink,
  Clock,
  Sparkles,
  Video,
  Link2,
  Check,
  RotateCcw,
} from 'lucide-react';

export interface FeatureVideoItem {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  videoUrl: string;
  durationLabel?: string;
  videoDescription?: string;
}

interface FeatureVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFeature: FeatureVideoItem | null;
  allFeatures: FeatureVideoItem[];
  onSelectFeature: (feature: FeatureVideoItem) => void;
}

interface ParsedVideoSource {
  type: 'youtube' | 'gdrive' | 'direct' | 'unknown';
  embedUrl: string;
  originalUrl: string;
  providerLabel: string;
}

/**
 * แปลงลิงก์ Google Drive หรือ YouTube ปกติ ให้กลายเป็น Embed URL พร้อมเล่นในหน้าเว็บทันที
 */
export function parseVideoUrl(rawUrl: string): ParsedVideoSource {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return {
      type: 'unknown',
      embedUrl: '',
      originalUrl: '',
      providerLabel: 'ไม่พบลิงก์วิดีโอ',
    };
  }

  // 1. ตรวจสอบลิงก์ Google Drive
  // รองรับรูปแบบ:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/file/d/FILE_ID/preview
  // - https://drive.google.com/open?id=FILE_ID
  const gdriveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  const gdriveIdParamMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?.*?id=([a-zA-Z0-9_-]+)/i);
  const gdriveId = gdriveFileMatch?.[1] || gdriveIdParamMatch?.[1];

  if (gdriveId) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gdriveId}/preview`,
      originalUrl: trimmed,
      providerLabel: 'Google Drive Video',
    };
  }

  // 2. ตรวจสอบลิงก์ YouTube
  // รองรับรูปแบบ:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/i
  );
  if (ytMatch?.[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
      originalUrl: trimmed,
      providerLabel: 'YouTube Player',
    };
  }

  // 3. ตรวจสอบไฟล์วิดีโอโดยตรง (.mp4, .webm, .ogg, .mov)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'direct',
      embedUrl: trimmed,
      originalUrl: trimmed,
      providerLabel: 'Direct Video Stream',
    };
  }

  return {
    type: 'unknown',
    embedUrl: trimmed,
    originalUrl: trimmed,
    providerLabel: 'External Video Link',
  };
}

const FeatureVideoModal: React.FC<FeatureVideoModalProps> = ({
  isOpen,
  onClose,
  activeFeature,
  allFeatures,
  onSelectFeature,
}) => {
  const [customUrlMap, setCustomUrlMap] = useState<Record<string, string>>({});
  const [isUrlEditorOpen, setIsUrlEditorOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (activeFeature) {
      const currentEffectiveUrl = customUrlMap[activeFeature.id] ?? activeFeature.videoUrl;
      setDraftUrl(currentEffectiveUrl);
    }
  }, [activeFeature, customUrlMap]);

  if (typeof document === 'undefined') return null;

  const effectiveUrl = activeFeature
    ? customUrlMap[activeFeature.id] ?? activeFeature.videoUrl
    : '';
  const parsedVideo = parseVideoUrl(effectiveUrl);

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFeature || !draftUrl.trim()) return;
    setCustomUrlMap((prev) => ({
      ...prev,
      [activeFeature.id]: draftUrl.trim(),
    }));
    setIsUrlEditorOpen(false);
  };

  const handleResetUrl = () => {
    if (!activeFeature) return;
    setCustomUrlMap((prev) => {
      const next = { ...prev };
      delete next[activeFeature.id];
      return next;
    });
    setDraftUrl(activeFeature.videoUrl);
    setIsUrlEditorOpen(false);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && activeFeature && (
        <motion.div
          key="feature-video-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-md font-google-sans"
          onClick={onClose}
        >
          <motion.div
            key="feature-video-dialog"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-slate-900 text-white rounded-t-[2rem] sm:rounded-3xl border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden"
          >
            {/* 1. Rigid Header */}
            <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-white/10 bg-slate-900/95 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${activeFeature.color} flex items-center justify-center shrink-0 shadow-md`}
                >
                  <activeFeature.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      <Sparkles className="w-3 h-3" />
                      Feature Video Walkthrough
                    </span>
                    {activeFeature.durationLabel && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-slate-300">
                        <Clock className="w-3 h-3" />
                        {activeFeature.durationLabel}
                      </span>
                    )}
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
                      <Video className="w-3 h-3" />
                      {parsedVideo.providerLabel}
                    </span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-white truncate mt-1">
                    {activeFeature.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUrlEditorOpen((prev) => !prev)}
                  title="ทดสอบวางลิงก์ Google Drive หรือ YouTube"
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all min-h-[40px] ${
                    isUrlEditorOpen
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ทดสอบลิงก์คลิป</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="ปิดหน้าต่างวิดีโอ"
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 sm:py-5 space-y-4 scrollbar-hide">
              {/* Collapsible Live Link Tester (for testing Google Drive / YouTube links immediately) */}
              <AnimatePresence initial={false}>
                {isUrlEditorOpen && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
                    onSubmit={handleApplyCustomUrl}
                    className="overflow-hidden"
                  >
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/90 border border-indigo-500/30 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5" />
                          วางลิงก์ Google Drive หรือ YouTube เพื่อทดสอบเล่นทันที (หรือแก้ไขถาวรได้ที่ไฟล์ config/brand.ts)
                        </span>
                        {customUrlMap[activeFeature.id] && (
                          <button
                            type="button"
                            onClick={handleResetUrl}
                            className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            รีเซ็ตกลับค่าเริ่มต้น
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={draftUrl}
                          onChange={(e) => setDraftUrl(e.target.value)}
                          placeholder="เช่น https://drive.google.com/file/d/XXXX/view?usp=sharing หรือ https://youtu.be/XXXX"
                          className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/90 border border-white/15 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-md transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          แสดงวิดีโอนี้
                        </button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* 16:9 Cinema Video Stage */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-inner">
                {parsedVideo.type === 'direct' ? (
                  <video
                    key={parsedVideo.embedUrl}
                    src={parsedVideo.embedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : parsedVideo.embedUrl ? (
                  <iframe
                    key={parsedVideo.embedUrl}
                    src={parsedVideo.embedUrl}
                    title={activeFeature.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                    <Play className="w-12 h-12 text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-300">ยังไม่ได้ตั้งค่าลิงก์วิดีโอสำหรับการ์ดใบนี้</p>
                    <p className="text-xs text-slate-500 mt-1">
                      สามารถใส่ลิงก์ Google Drive หรือ YouTube ได้ที่ไฟล์ config/brand.ts
                    </p>
                  </div>
                )}
              </div>

              {/* Description Box */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-300">รายละเอียดฟีเจอร์</div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {activeFeature.videoDescription || activeFeature.desc}
                  </p>
                </div>

                {parsedVideo.originalUrl && (
                  <a
                    href={parsedVideo.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white border border-white/10 shrink-0 transition-colors"
                  >
                    <span>เปิดลิงก์ต้นฉบับ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Quick Switcher Between All 6 Feature Cards */}
              {allFeatures.length > 1 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400">
                    เลือกดูวิดีโอฟีเจอร์อื่นๆ ({allFeatures.length} หัวข้อ)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {allFeatures.map((item) => {
                      const isCurrent = item.id === activeFeature.id;
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelectFeature(item)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                            isCurrent
                              ? 'bg-indigo-600/25 border-indigo-400/60 shadow-sm'
                              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08]'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}
                          >
                            <ItemIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                              <Play className="w-2.5 h-2.5 text-indigo-400 fill-indigo-400 shrink-0" />
                              <span>{item.durationLabel || 'ดูวิดีโอแนะนำ'}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Rigid Sticky Footer */}
            <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-slate-950/90 border-t border-white/10 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <p className="text-[11px] text-slate-400 text-center sm:text-left">
                รองรับลิงก์วิดีโอจาก Google Drive (ตั้งค่าแชร์เป็นทุกคนที่มีลิงก์) และ YouTube
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
              >
                ปิดหน้าต่างวิดีโอ
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default FeatureVideoModal;
