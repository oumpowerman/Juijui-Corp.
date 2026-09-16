import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Sparkles, 
  Link as LinkIcon, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  BookmarkCheck,
  FolderOpen,
  Figma,
  Hash,
  Globe
} from 'lucide-react';
import { BrandLink, BrandLinkType } from '../../../../types';
import { 
  BRAND_LINK_SERVICES, 
  BRAND_LINK_SERVICE_OPTIONS, 
  normalizeUrl 
} from '../../helpers/brandLinkConfig';

interface ChannelBrandLinksManagerProps {
  brandLinks: BrandLink[];
  setBrandLinks: React.Dispatch<React.SetStateAction<BrandLink[]>>;
  disabled?: boolean;
}

// Bright Pastel Theme Definitions for each service type
interface PastelTheme {
  accentColor: string;
  bgGradient: string;
  borderColor: string;
  hoverBorder: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
  chipHover: string;
  lightRing: string;
}

const PASTEL_THEMES: Record<BrandLinkType, PastelTheme> = {
  NOTION: {
    accentColor: 'bg-slate-700',
    bgGradient: 'from-slate-50/70 via-white to-white',
    borderColor: 'border-slate-200/90',
    hoverBorder: 'hover:border-slate-300',
    iconBg: 'bg-slate-800 text-white',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    chipBg: 'bg-slate-100/80',
    chipText: 'text-slate-700',
    chipBorder: 'border-slate-200/90',
    chipHover: 'hover:bg-slate-200/80 hover:border-slate-300 hover:text-slate-900',
    lightRing: 'ring-slate-300/40',
  },
  GOOGLE_DOCS: {
    accentColor: 'bg-sky-400',
    bgGradient: 'from-sky-50/45 via-white to-white',
    borderColor: 'border-sky-100/90',
    hoverBorder: 'hover:border-sky-300',
    iconBg: 'bg-sky-500 text-white shadow-sky-200/60',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    chipBg: 'bg-sky-50/90',
    chipText: 'text-sky-700',
    chipBorder: 'border-sky-200/80',
    chipHover: 'hover:bg-sky-100/90 hover:border-sky-300 hover:text-sky-800',
    lightRing: 'ring-sky-300/40',
  },
  GOOGLE_DRIVE: {
    accentColor: 'bg-emerald-400',
    bgGradient: 'from-emerald-50/45 via-white to-white',
    borderColor: 'border-emerald-100/90',
    hoverBorder: 'hover:border-emerald-300',
    iconBg: 'bg-emerald-500 text-white shadow-emerald-200/60',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    chipBg: 'bg-emerald-50/90',
    chipText: 'text-emerald-700',
    chipBorder: 'border-emerald-200/80',
    chipHover: 'hover:bg-emerald-100/90 hover:border-emerald-300 hover:text-emerald-800',
    lightRing: 'ring-emerald-300/40',
  },
  FIGMA: {
    accentColor: 'bg-purple-400',
    bgGradient: 'from-purple-50/45 via-white to-white',
    borderColor: 'border-purple-100/90',
    hoverBorder: 'hover:border-purple-300',
    iconBg: 'bg-purple-500 text-white shadow-purple-200/60',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    chipBg: 'bg-purple-50/90',
    chipText: 'text-purple-700',
    chipBorder: 'border-purple-200/80',
    chipHover: 'hover:bg-purple-100/90 hover:border-purple-300 hover:text-purple-800',
    lightRing: 'ring-purple-300/40',
  },
  SLACK: {
    accentColor: 'bg-teal-400',
    bgGradient: 'from-teal-50/45 via-white to-white',
    borderColor: 'border-teal-100/90',
    hoverBorder: 'hover:border-teal-300',
    iconBg: 'bg-teal-500 text-white shadow-teal-200/60',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    chipBg: 'bg-teal-50/90',
    chipText: 'text-teal-700',
    chipBorder: 'border-teal-200/80',
    chipHover: 'hover:bg-teal-100/90 hover:border-teal-300 hover:text-teal-800',
    lightRing: 'ring-teal-300/40',
  },
  WEBSITE: {
    accentColor: 'bg-indigo-400',
    bgGradient: 'from-indigo-50/45 via-white to-white',
    borderColor: 'border-indigo-100/90',
    hoverBorder: 'hover:border-indigo-300',
    iconBg: 'bg-indigo-500 text-white shadow-indigo-200/60',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    chipBg: 'bg-indigo-50/90',
    chipText: 'text-indigo-700',
    chipBorder: 'border-indigo-200/80',
    chipHover: 'hover:bg-indigo-100/90 hover:border-indigo-300 hover:text-indigo-800',
    lightRing: 'ring-indigo-300/40',
  },
  OTHER: {
    accentColor: 'bg-amber-400',
    bgGradient: 'from-amber-50/35 via-white to-white',
    borderColor: 'border-amber-100/90',
    hoverBorder: 'hover:border-amber-300',
    iconBg: 'bg-amber-500 text-white shadow-amber-200/60',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    chipBg: 'bg-amber-50/90',
    chipText: 'text-amber-700',
    chipBorder: 'border-amber-200/80',
    chipHover: 'hover:bg-amber-100/90 hover:border-amber-300 hover:text-amber-800',
    lightRing: 'ring-amber-300/40',
  },
};

export const ChannelBrandLinksManager: React.FC<ChannelBrandLinksManagerProps> = ({
  brandLinks,
  setBrandLinks,
  disabled = false,
}) => {
  const [openTypeDropdownId, setOpenTypeDropdownId] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `link_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  const handleAddLink = (defaultType: BrandLinkType = 'NOTION') => {
    const newId = generateId();
    const newLink: BrandLink = {
      id: newId,
      title: '',
      url: '',
      type: defaultType,
      description: '',
    };

    setJustAddedId(newId);
    setBrandLinks(prev => [...prev, newLink]);

    setTimeout(() => {
      setJustAddedId(null);
    }, 1800);

    setTimeout(() => {
      const el = document.getElementById(`brand-link-card-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const input = el.querySelector('input[type="text"]') as HTMLInputElement | null;
        if (input) input.focus({ preventScroll: true });
      }
    }, 120);
  };

  const handleUpdateLink = (id: string, updates: Partial<BrandLink>) => {
    setBrandLinks(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteLink = (id: string) => {
    setBrandLinks(prev => prev.filter(item => item.id !== id));
    if (openTypeDropdownId === id) {
      setOpenTypeDropdownId(null);
    }
  };

  const handleDuplicateLink = (link: BrandLink) => {
    const newId = generateId();
    const duplicated: BrandLink = {
      ...link,
      id: newId,
      title: link.title ? `${link.title} (สำเนา)` : '',
    };

    setJustAddedId(newId);
    setBrandLinks(prev => {
      const index = prev.findIndex(item => item.id === link.id);
      if (index === -1) return [...prev, duplicated];
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });

    setTimeout(() => {
      setJustAddedId(null);
    }, 1800);

    setTimeout(() => {
      const el = document.getElementById(`brand-link-card-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setBrandLinks(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= brandLinks.length - 1) return;
    setBrandLinks(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleTestLink = (url: string) => {
    if (!url.trim()) return;
    const finalUrl = normalizeUrl(url);
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const isValidUrl = (url: string) => {
    if (!url.trim()) return false;
    try {
      const parsed = new URL(normalizeUrl(url));
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Quick Action Toolbar - Fresh Bright Pastel Gradient */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-50/60 via-indigo-50/40 to-purple-50/50 rounded-2xl border border-indigo-100/80 shadow-2xs space-y-3.5 relative overflow-hidden">
        {/* Soft decorative background circles */}
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-indigo-100/40 blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-sky-100/50 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <motion.div 
              whileHover={{ rotate: [0, -6, 6, 0], scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow-xs shadow-indigo-200 shrink-0"
            >
              <BookOpen className="w-5 h-5" />
            </motion.div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                  คู่มือ SOP & เอกสารทำงานประจำช่อง
                </h4>
                {/* Stable Pastel Document Counter Badge */}
                <motion.span 
                  key={brandLinks.length}
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="text-[11px] font-bold text-indigo-700 bg-white/90 px-2.5 py-0.5 rounded-full border border-indigo-200/80 inline-flex items-center gap-1 shrink-0 shadow-2xs"
                >
                  <BookmarkCheck className="w-3 h-3 text-indigo-600" />
                  <span>{brandLinks.length} รายการ</span>
                </motion.span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                ศูนย์รวม Notion SOP, บรีฟงาน, ไดรฟ์ฟุตเทจ และ Asset ประจำช่อง
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleAddLink('NOTION')}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold shadow-xs shadow-indigo-200/80 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-start sm:self-auto"
          >
            <motion.span
              animate={{ rotate: [0, 90, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
            >
              <Plus className="w-4 h-4" />
            </motion.span>
            <span>เพิ่มเอกสารใหม่</span>
          </motion.button>
        </div>

        {/* Quick Add Template Buttons - Bright Pastel Chips */}
        <div className="relative flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-indigo-100/70">
          <span className="text-[10px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> เพิ่มด่วน:
          </span>
          {[
            { type: 'NOTION' as BrandLinkType, label: 'Notion SOP', icon: BookOpen },
            { type: 'GOOGLE_DOCS' as BrandLinkType, label: 'Google Docs', icon: FileText },
            { type: 'GOOGLE_DRIVE' as BrandLinkType, label: 'Drive Assets', icon: FolderOpen },
            { type: 'FIGMA' as BrandLinkType, label: 'Figma CI', icon: Figma },
            { type: 'SLACK' as BrandLinkType, label: 'Slack ทีม', icon: Hash },
            { type: 'WEBSITE' as BrandLinkType, label: 'เว็บไซต์', icon: Globe },
          ].map(item => {
            const theme = PASTEL_THEMES[item.type] || PASTEL_THEMES.OTHER;
            const ItemIcon = item.icon;
            return (
              <motion.button
                key={item.type}
                type="button"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.95 }}
                disabled={disabled}
                onClick={() => handleAddLink(item.type)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shadow-2xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 ${theme.chipBg} ${theme.chipText} ${theme.chipBorder} ${theme.chipHover}`}
              >
                <ItemIcon className="w-3 h-3 shrink-0" />
                <span>+ {item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Empty State with Bright Pastel Card */}
      {brandLinks.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="p-8 bg-gradient-to-b from-white to-slate-50/60 rounded-2xl border-2 border-dashed border-indigo-100/90 text-center flex flex-col items-center justify-center space-y-3"
        >
          <motion.div 
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-50 to-sky-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-xs"
          >
            <BookOpen className="w-6 h-6" />
          </motion.div>
          <div className="max-w-md space-y-1">
            <h5 className="text-sm font-bold text-slate-700">ยังไม่มีเอกสารคู่มือในรายการ</h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              เพิ่มลิงก์ Notion SOP, เอกสารบรีฟงาน, ไดรฟ์ฟุตเทจ หรือ Figma ประจำช่อง เพื่อให้ทีมงานทุกคนเปิดใช้งานได้สะดวกจากที่เดียว
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleAddLink('NOTION')}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มเอกสารคู่มือแรก</span>
          </motion.button>
        </motion.div>
      )}

      {/* Brand Links Rows - Full Framer Motion on Add & Delete */}
      {brandLinks.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {brandLinks.map((link, index) => {
              const currentConfig = BRAND_LINK_SERVICES[link.type] || BRAND_LINK_SERVICES.OTHER;
              const theme = PASTEL_THEMES[link.type] || PASTEL_THEMES.OTHER;
              const Icon = currentConfig.icon;
              const isDropdownOpen = openTypeDropdownId === link.id;
              const hasValidUrl = isValidUrl(link.url);
              const isJustAdded = justAddedId === link.id;

              return (
                <motion.div 
                  key={link.id}
                  id={`brand-link-card-${link.id}`}
                  layout
                  initial={{ 
                    opacity: 0, 
                    scale: 0.95, 
                    y: -12 
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: {
                      duration: 0.24,
                      ease: [0.16, 1, 0.3, 1]
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.92,
                    height: 0,
                    marginTop: 0,
                    marginBottom: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    overflow: 'hidden',
                    transition: { 
                      duration: 0.18, 
                      ease: 'easeInOut' 
                    } 
                  }}
                  transition={{
                    layout: {
                      type: 'spring',
                      stiffness: 450,
                      damping: 32
                    }
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs space-y-3 transition-colors relative overflow-hidden bg-gradient-to-r ${theme.bgGradient} ${
                    isDropdownOpen 
                      ? 'border-indigo-400 ring-2 ring-indigo-400/20' 
                      : isJustAdded
                        ? 'border-indigo-300 ring-2 ring-indigo-400/30'
                        : `${theme.borderColor} ${theme.hoverBorder}`
                  }`}
                >
                  {/* Left Pastel Accent Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.accentColor} rounded-r-full`} />

                  {/* Top Row: Index + Service Dropdown + Title Input + Action Buttons */}
                  <div className="flex items-center gap-2 sm:gap-2.5 pl-1.5">
                    {/* Order & Reorder Controls */}
                    <div className="flex items-center gap-1 bg-white/90 border border-slate-200/90 rounded-xl px-1.5 py-1 shrink-0 shadow-2xs">
                      <span className="text-[10px] font-mono font-bold text-slate-400 w-4 text-center">
                        #{index + 1}
                      </span>
                      <div className="flex flex-col -my-0.5">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.25 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || disabled}
                          className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                          title="เลื่อนขึ้น"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.25 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleMoveDown(index)}
                          disabled={index === brandLinks.length - 1 || disabled}
                          className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                          title="เลื่อนลง"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Service Type Selector Dropdown with Pastel Styling */}
                    <div className="relative shrink-0">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={disabled}
                        onClick={() => setOpenTypeDropdownId(isDropdownOpen ? null : link.id)}
                        className={`h-9 px-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isDropdownOpen 
                            ? 'border-indigo-400 ring-2 ring-indigo-400/20 bg-white' 
                            : 'border-slate-200/90 bg-white/90 hover:bg-white'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${theme.iconBg}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-slate-700 hidden sm:inline">{currentConfig.label}</span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </motion.button>

                      {/* Animated Dropdown Menu */}
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-20" 
                              onClick={() => setOpenTypeDropdownId(null)} 
                            />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.94, y: -6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.94, y: -6 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="absolute left-0 top-full mt-1.5 w-60 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl py-1.5 z-30 max-h-68 overflow-y-auto"
                            >
                              {BRAND_LINK_SERVICE_OPTIONS.map(opt => {
                                const OptIcon = opt.icon;
                                const optTheme = PASTEL_THEMES[opt.type] || PASTEL_THEMES.OTHER;
                                const isSelected = opt.type === link.type;
                                return (
                                  <button
                                    key={opt.type}
                                    type="button"
                                    onClick={() => {
                                      handleUpdateLink(link.id, { type: opt.type });
                                      setOpenTypeDropdownId(null);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                                      isSelected 
                                        ? 'bg-indigo-50/80 text-indigo-700 font-bold' 
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${optTheme.iconBg}`}>
                                      <OptIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="truncate font-semibold">{opt.label}</div>
                                      <div className="text-[10px] text-slate-400 truncate">{opt.description}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Title Input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => handleUpdateLink(link.id, { title: e.target.value })}
                        placeholder={currentConfig.placeholderTitle}
                        disabled={disabled}
                        className="w-full px-3 py-2 bg-white/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all placeholder:font-normal placeholder:text-slate-300 shadow-2xs"
                      />
                    </div>

                    {/* Row Actions: Duplicate, Test Link, Delete with Micro-Interactions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDuplicateLink(link)}
                        disabled={disabled}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
                        title="คัดลอกรายการนี้"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={hasValidUrl ? { scale: 1.12, x: 1, y: -1 } : {}}
                        whileTap={hasValidUrl ? { scale: 0.9 } : {}}
                        onClick={() => handleTestLink(link.url)}
                        disabled={!link.url.trim() || disabled}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          hasValidUrl 
                            ? 'text-indigo-600 hover:bg-indigo-50/80 bg-white/80 shadow-2xs' 
                            : 'text-slate-300 hover:text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed'
                        }`}
                        title={link.url.trim() ? "ทดสอบเปิดลิงก์ในแท็บใหม่" : "กรุณากรอก URL ก่อนทดสอบ"}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.12, rotate: -4 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={disabled}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer"
                        title="ลบเอกสารนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Bottom Row: URL Input & Optional Description with Pastel Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-0.5 pl-1.5">
                    <div className="sm:col-span-7">
                      <div className="relative flex items-center">
                        <div className="absolute left-2.5 text-slate-400 pointer-events-none">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleUpdateLink(link.id, { url: e.target.value })}
                          placeholder={currentConfig.placeholderUrl}
                          disabled={disabled}
                          className={`w-full pl-8 pr-8 py-1.5 bg-white/80 hover:bg-white focus:bg-white border rounded-xl text-xs text-slate-700 outline-none transition-all placeholder:text-slate-300 font-mono shadow-2xs ${
                            link.url.trim() && !hasValidUrl
                              ? 'border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                              : 'border-slate-200/90 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20'
                          }`}
                        />
                        {link.url.trim() && (
                          <div className="absolute right-2.5 pointer-events-none">
                            {hasValidUrl ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-5">
                      <div className="relative flex items-center">
                        <div className="absolute left-2.5 text-slate-400 pointer-events-none">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          value={link.description || ''}
                          onChange={(e) => handleUpdateLink(link.id, { description: e.target.value })}
                          placeholder="คำอธิบายสั้นๆ (เช่น สิทธิ์เข้าถึง, แผนกที่ใช้)"
                          disabled={disabled}
                          className="w-full pl-8 pr-3 py-1.5 bg-white/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 rounded-xl text-xs text-slate-700 outline-none transition-all placeholder:text-slate-300 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Quick Bottom Add Button when list has items */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAddLink('NOTION')}
            disabled={disabled}
            className="w-full py-2.5 rounded-xl border border-dashed border-indigo-200/80 hover:border-indigo-400 bg-gradient-to-r from-indigo-50/30 via-sky-50/20 to-purple-50/30 text-slate-500 hover:text-indigo-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            <span>เพิ่มเอกสารอีกรายการ...</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default ChannelBrandLinksManager;
