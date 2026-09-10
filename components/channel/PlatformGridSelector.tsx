import React from 'react';
import { Youtube, Facebook, Instagram, Video, Globe, Check, LayoutTemplate, ExternalLink, Link2, Users } from 'lucide-react';
import { Platform, SocialLinks, PlatformFollowers } from '../../types';

export const PLATFORM_OPTIONS: { id: Platform; label: string; icon: any; color: string; placeholder: string; prefixHelp: string }[] = [
  { id: 'YOUTUBE', label: 'YouTube', icon: Youtube, color: 'text-red-600', placeholder: 'https://youtube.com/@channel_name', prefixHelp: 'URL ช่อง YouTube เช่น https://youtube.com/@...' },
  { id: 'FACEBOOK', label: 'Facebook', icon: Facebook, color: 'text-blue-600', placeholder: 'https://facebook.com/page_name', prefixHelp: 'URL เพจ Facebook เช่น https://facebook.com/...' },
  { id: 'TIKTOK', label: 'TikTok', icon: Video, color: 'text-zinc-800', placeholder: 'https://tiktok.com/@channel_name', prefixHelp: 'URL ช่อง TikTok เช่น https://tiktok.com/@...' },
  { id: 'INSTAGRAM', label: 'Instagram', icon: Instagram, color: 'text-pink-600', placeholder: 'https://instagram.com/profile_name', prefixHelp: 'URL บัญชี IG เช่น https://instagram.com/...' },
  { id: 'OTHER', label: 'Other/Website', icon: Globe, color: 'text-gray-600', placeholder: 'https://...', prefixHelp: 'URL เว็บไซต์หรือช่องทางอื่นๆ' },
];

interface PlatformGridSelectorProps {
  selectedPlatforms: Platform[];
  togglePlatform: (platform: Platform) => void;
  socialLinks?: SocialLinks;
  onSocialLinkChange?: (platform: Platform, url: string) => void;
  followers?: PlatformFollowers;
  onFollowersChange?: (platform: Platform, count: number | undefined) => void;
  isSubmitting: boolean;
}

export const PlatformGridSelector: React.FC<PlatformGridSelectorProps> = ({
  selectedPlatforms,
  togglePlatform,
  socialLinks = {},
  onSocialLinkChange,
  followers = {},
  onFollowersChange,
  isSubmitting
}) => {
  const handleTestLink = (url?: string) => {
    if (!url || !url.trim()) return;
    let fullUrl = url.trim();
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = 'https://' + fullUrl;
    }
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  // Calculate live total followers for this channel
  const totalFollowers = selectedPlatforms.reduce((sum, p) => {
    const val = followers[p];
    return sum + (typeof val === 'number' && !isNaN(val) && val > 0 ? val : 0);
  }, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <label className="block text-sm font-bold text-gray-700 flex items-center">
          <LayoutTemplate className="w-4 h-4 mr-2 text-indigo-500" />
          3. แพลตฟอร์ม, ลิงก์หน้าช่อง และ ยอดผู้ติดตาม (Platforms & Followers)
        </label>
        <p className="text-xs text-gray-400 ml-6">
          เลือกแพลตฟอร์มที่ช่องนี้มีบัญชีใช้งาน พร้อมกรอก URL หน้าช่องและยอดผู้ติดตามเพื่อติดตามสถิติรวมของช่อง
        </p>
      </div>

      {/* Platform Chips Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {PLATFORM_OPTIONS.map((p) => {
          const isSelected = selectedPlatforms.includes(p.id);
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlatform(p.id)}
              disabled={isSubmitting}
              className={`
                flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative group/platform
                ${isSelected
                  ? `border-indigo-500 bg-indigo-50/50 shadow-sm`
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                }
                ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5 active:translate-y-0'}
              `}
            >
              <Icon className={`w-8 h-8 mb-2 ${isSelected ? p.color : 'text-slate-300 group-hover/platform:text-slate-400'} transition-all`} />
              <span className={`font-bold text-xs ${isSelected ? 'text-gray-800' : 'text-slate-400 group-hover/platform:text-slate-500'}`}>
                {p.label}
              </span>
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Social Links & Followers Inputs */}
      {selectedPlatforms.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>ลิงก์หน้าช่องหลัก & ยอดผู้ติดตามแต่ละแพลตฟอร์ม</span>
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              *กรอกเพื่อดูสถิติและคลิกเปิดหน้าช่องจริง
            </span>
          </div>

          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
            {PLATFORM_OPTIONS.filter(p => selectedPlatforms.includes(p.id)).map(p => {
              const Icon = p.icon;
              const currentLink = socialLinks[p.id] || '';
              const currentFollowers = followers[p.id];
              const hasLink = Boolean(currentLink.trim());

              return (
                <div key={p.id} className="p-3 bg-white border border-slate-100/80 rounded-xl shadow-2xs space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    {/* Platform Header */}
                    <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0">
                      <Icon className={`w-4 h-4 ${p.color}`} />
                      <span className="text-xs font-bold text-slate-700 truncate">{p.label}</span>
                    </div>

                    {/* URL Input + Test Button */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={currentLink}
                          onChange={(e) => onSocialLinkChange && onSocialLinkChange(p.id, e.target.value)}
                          placeholder={p.placeholder}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTestLink(currentLink)}
                        disabled={!hasLink || isSubmitting}
                        className={`
                          px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all border
                          ${hasLink 
                            ? 'bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-200 hover:border-indigo-300 shadow-2xs cursor-pointer active:scale-95' 
                            : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-60'
                          }
                        `}
                        title={hasLink ? `ทดสอบเปิดลิงก์ ${p.label}` : 'กรุณากรอก URL ก่อนกดทดสอบ'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ทดสอบ</span>
                      </button>
                    </div>

                    {/* Followers Input */}
                    <div className="flex items-center gap-1.5 w-full sm:w-44 shrink-0">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={currentFollowers !== undefined && currentFollowers !== null ? currentFollowers : ''}
                          onChange={(e) => {
                            if (!onFollowersChange) return;
                            const val = e.target.value.trim();
                            if (val === '') {
                              onFollowersChange(p.id, undefined);
                            } else {
                              const num = parseInt(val, 10);
                              onFollowersChange(p.id, isNaN(num) ? 0 : Math.max(0, num));
                            }
                          }}
                          placeholder="ผู้ติดตาม (คน)"
                          disabled={isSubmitting}
                          className="w-full pl-8 pr-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-right"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium shrink-0">คน</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live Total Followers Preview */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl text-indigo-900">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold">ยอดผู้ติดตามรวมทุกแพลตฟอร์มของช่องนี้:</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-indigo-600">
                  {totalFollowers.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-indigo-400">คน</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

