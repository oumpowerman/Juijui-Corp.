import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Copy, Check, Users, Sparkles, Loader2, Globe, AlertCircle } from 'lucide-react';
import { Platform } from '../../types';
import { PLATFORM_OPTIONS } from './PlatformGridSelector';

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
  favicon?: string;
  cached?: boolean;
  extractedFollowers?: number;
}

// Client-side sanitizer & entity decoder fallback (handles hex &#x...;, decimal &#...;, and named entities)
function sanitizePreviewText(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return _;
      }
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch {
        return _;
      }
    })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '•')
    .replace(/&middot;/g, '·')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

interface SocialLinkPreviewCardProps {
  platform: Platform;
  url?: string;
  channelName: string;
  channelLogoUrl?: string;
  channelColor?: string;
  followersCount?: number;
  children: React.ReactNode;
}

// Client-side cache across cards to prevent repeated network requests
const clientPreviewCache = new Map<string, { data: LinkPreviewData; timestamp: number }>();
const CLIENT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const SocialLinkPreviewCard: React.FC<SocialLinkPreviewCardProps> = ({
  platform,
  url,
  channelName,
  channelLogoUrl,
  channelColor = 'bg-indigo-500',
  followersCount,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
  const [copied, setCopied] = useState(false);
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [position, setPosition] = useState<{
    top: number;
    left: number;
    placement: 'top' | 'bottom';
    arrowLeft: number;
  } | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(340, window.innerWidth - 32);
    const triggerCenterX = rect.left + rect.width / 2;
    const idealLeft = triggerCenterX - popoverWidth / 2;
    const left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, idealLeft));
    const arrowLeft = Math.max(20, Math.min(popoverWidth - 20, triggerCenterX - left));

    // Determine placement: prefer top unless not enough room above
    const placement: 'top' | 'bottom' = rect.top >= 330 || (window.innerHeight - rect.bottom < 300)
      ? 'top'
      : 'bottom';

    const top = placement === 'top' ? rect.top - 10 : rect.bottom + 10;

    setPosition({ top, left, placement, arrowLeft });
  }, []);

  const platformMeta = PLATFORM_OPTIONS.find((opt) => opt.id === platform) || {
    id: platform,
    label: platform,
    icon: Globe,
    color: 'text-indigo-600',
  };

  const hasLink = Boolean(url && url.trim());
  const formattedUrl = url?.trim()
    ? /^https?:\/\//i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`
    : '';

  // Fetch Open Graph preview when popover opens
  useEffect(() => {
    if (!isOpen || !hasLink || !formattedUrl) return;

    // Check client cache first
    const cached = clientPreviewCache.get(formattedUrl);
    if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
      setPreviewData(cached.data);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchPreview = async () => {
      try {
        const res = await fetch(`/api/preview-link?url=${encodeURIComponent(formattedUrl)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (isMounted) {
          const data: LinkPreviewData = {
            title: json.title,
            description: json.description,
            image: json.image,
            siteName: json.siteName,
            url: formattedUrl,
            favicon: json.favicon,
            extractedFollowers: json.extractedFollowers,
          };
          setPreviewData(data);
          clientPreviewCache.set(formattedUrl, { data, timestamp: Date.now() });
        }
      } catch (err) {
        if (isMounted) {
          // Graceful fallback using local channel metadata
          const fallbackData: LinkPreviewData = {
            title: channelName,
            description: `หน้าทางการของ ${channelName} บน ${platformMeta.label}`,
            image: channelLogoUrl,
            siteName: platformMeta.label,
            url: formattedUrl,
          };
          setPreviewData(fallbackData);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [isOpen, hasLink, formattedUrl, channelName, channelLogoUrl, platformMeta.label]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    updatePosition();
    hoverTimeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, 180); // Quick debounce to avoid flashing during mouse movement
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  // Re-calculate position on window scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleScrollOrResize = () => {
      updatePosition();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!formattedUrl) return;
    try {
      await navigator.clipboard.writeText(formattedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy link:', err);
    }
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!formattedUrl) return;
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  // Header background theme according to platform
  const getPlatformHeaderStyle = () => {
    switch (platform) {
      case 'YOUTUBE':
        return 'bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white';
      case 'FACEBOOK':
        return 'bg-gradient-to-r from-blue-600 via-blue-500 to-sky-600 text-white';
      case 'TIKTOK':
        return 'bg-gradient-to-r from-zinc-900 via-slate-800 to-zinc-950 text-white';
      case 'INSTAGRAM':
        return 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white';
      default:
        return 'bg-gradient-to-r from-slate-700 to-slate-900 text-white';
    }
  };

  const PlatformIcon = platformMeta.icon;

  // Format compact number (e.g. 1.2M, 54.3K)
  const formatFollowers = (num?: number) => {
    if (typeof num !== 'number' || isNaN(num) || num <= 0) return null;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const effectiveFollowersCount = typeof followersCount === 'number' && followersCount > 0
    ? followersCount
    : previewData?.extractedFollowers;

  const formattedFollowers = formatFollowers(effectiveFollowersCount);

  // Shorten URL for clean display
  const displayUrl = formattedUrl
    ? formattedUrl.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
    : 'ยังไม่มีการระบุ URL';

  const rawTitle = previewData?.title || channelName;
  const previewTitle = sanitizePreviewText(rawTitle);

  const rawDescription = previewData?.description;
  const previewDescription = sanitizePreviewText(rawDescription);
  const previewImage = previewData?.image || channelLogoUrl;

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Anchor Trigger Component */}
        {children}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && position && (
            <div
              style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: position.placement === 'top' ? 'translateY(-100%)' : 'none',
                zIndex: 99999,
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: position.placement === 'top' ? 8 : -8, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: position.placement === 'top' ? 6 : -6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="w-80 sm:w-84 bg-white rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.2),0_0_1px_rgba(0,0,0,0.25)] border border-slate-200/90 overflow-hidden text-left pointer-events-auto backdrop-blur-xl relative"
                style={{ filter: 'drop-shadow(0 15px 25px rgba(15, 23, 42, 0.15))' }}
              >
            {/* 1. Header Banner */}
            <div className={`px-4 py-2.5 flex items-center justify-between text-xs font-bold ${getPlatformHeaderStyle()}`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <PlatformIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{platformMeta.label} Link Preview</span>
              </div>
              
              {loading ? (
                <div className="flex items-center gap-1 text-[11px] font-medium bg-black/20 px-2 py-0.5 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>กำลังดึงข้อมูล...</span>
                </div>
              ) : previewData?.cached ? (
                <span className="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full text-white/90">
                  ⚡ Cached
                </span>
              ) : null}
            </div>

            {/* 2. Main Content Body */}
            <div className="p-4 space-y-3.5">
              {/* Image / Thumbnail Preview */}
              {previewImage ? (
                <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200/80 group">
                  <img
                    src={previewImage}
                    alt={previewTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // If remote image fails, hide or fallback
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  
                  {/* Floating Logo Badge on Thumbnail */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-md overflow-hidden border border-white/80 shrink-0">
                      {channelLogoUrl ? (
                        <img src={channelLogoUrl} alt={channelName} className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-xs text-white ${channelColor.split(' ')[0] || 'bg-indigo-600'}`}>
                          {channelName.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow-md truncate max-w-[170px]">
                      {channelName}
                    </span>
                  </div>
                </div>
              ) : (
                /* Compact Logo Row if No Large Image */
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 shadow-inner overflow-hidden border border-slate-200/80 shrink-0">
                    {channelLogoUrl ? (
                      <img src={channelLogoUrl} alt={channelName} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-bold text-sm text-white ${channelColor.split(' ')[0] || 'bg-indigo-600'}`}>
                        {channelName.substring(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-slate-800 truncate" title={previewTitle}>
                      {previewTitle}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {previewData?.siteName || platformMeta.label}
                    </p>
                  </div>
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 line-clamp-1 leading-snug" title={previewTitle}>
                  {previewTitle}
                </h4>
                {previewDescription && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {previewDescription}
                  </p>
                )}
              </div>

              {/* Audience & URL Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {formattedFollowers && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-bold shadow-2xs">
                    <Users className="w-3 h-3 text-indigo-500" />
                    <span>{formattedFollowers} ผู้ติดตาม</span>
                  </div>
                )}

                <div 
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium max-w-full truncate border border-slate-200/60"
                  title={formattedUrl}
                >
                  <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate text-[11px]">{displayUrl}</span>
                </div>
              </div>
            </div>

            {/* 3. Action Footer */}
            <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center gap-2">
              {hasLink ? (
                <>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>คัดลอกลิงก์</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenLink}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer ${
                      platform === 'YOUTUBE'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : platform === 'FACEBOOK'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : platform === 'TIKTOK'
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
                        : platform === 'INSTAGRAM'
                        ? 'bg-pink-600 hover:bg-pink-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <span>เปิดดูหน้าช่อง</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-amber-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ยังไม่ได้ผูกลิงก์หน้าช่อง (คลิกการ์ดเพื่อตั้งค่า)</span>
                </div>
              )}
            </div>

            {/* Tooltip Arrow Pointer */}
            {position.placement === 'top' ? (
              <div 
                className="absolute top-full -mt-[1px] border-8 border-transparent border-t-white drop-shadow-xs pointer-events-none" 
                style={{ left: `${position.arrowLeft}px`, transform: 'translateX(-50%)' }}
              />
            ) : (
              <div 
                className="absolute bottom-full -mb-[1px] border-8 border-transparent border-b-white drop-shadow-xs pointer-events-none" 
                style={{ left: `${position.arrowLeft}px`, transform: 'translateX(-50%)' }}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )}
</>
  );
};

export default SocialLinkPreviewCard;
