import React, { useState } from 'react';
import { 
  Youtube, 
  Facebook, 
  Instagram, 
  Video, 
  Globe, 
  Check, 
  LayoutTemplate, 
  ExternalLink, 
  Users, 
  ShieldAlert,
  Key,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Building2,
  ShieldCheck,
  ArrowRight,
  Link2
} from 'lucide-react';
import { Platform, SocialLinks, PlatformFollowers, ChannelMetaApiConfig } from '../../../../types';

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
  metaApi?: ChannelMetaApiConfig;
  onMetaApiChange?: (config: ChannelMetaApiConfig) => void;
  isSubmitting: boolean;
}

export const PlatformGridSelector: React.FC<PlatformGridSelectorProps> = ({
  selectedPlatforms,
  togglePlatform,
  socialLinks = {},
  onSocialLinkChange,
  followers = {},
  onFollowersChange,
  metaApi,
  onMetaApiChange,
  isSubmitting
}) => {
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [isTestingMeta, setIsTestingMeta] = useState(false);
  const [testMetaResult, setTestMetaResult] = useState<{
    tested: boolean;
    success: boolean;
    message?: string;
    targetMatch?: { matched: boolean; username: string; followersCount?: number; name?: string };
    accountsCount?: number;
  } | null>(null);

  const handleTestLink = (url?: string) => {
    if (!url || !url.trim()) return;
    let fullUrl = url.trim();
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = 'https://' + fullUrl;
    }
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const channelMeta: ChannelMetaApiConfig = metaApi || {
    enabled: false,
    accessToken: '',
    businessAccountId: '',
  };

  const updateChannelMeta = (fields: Partial<ChannelMetaApiConfig>) => {
    if (!onMetaApiChange) return;
    onMetaApiChange({
      ...channelMeta,
      ...fields,
    });
    setTestMetaResult(null);
  };

  const handleTestChannelMeta = async () => {
    const token = (channelMeta.accessToken || '').trim();
    if (!token) {
      setTestMetaResult({
        tested: true,
        success: false,
        message: 'กรุณากรอก Meta Access Token ก่อนทดสอบครับ',
      });
      return;
    }

    setIsTestingMeta(true);
    setTestMetaResult(null);

    try {
      const igUrl = socialLinks.INSTAGRAM || '';
      const res = await fetch('/api/follower-sync/test-meta-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: token,
          businessAccountId: channelMeta.businessAccountId?.trim() || undefined,
          targetUsername: igUrl || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestMetaResult({
          tested: true,
          success: true,
          targetMatch: data.targetMatch,
          accountsCount: Array.isArray(data.accounts) ? data.accounts.length : 0,
        });
      } else {
        setTestMetaResult({
          tested: true,
          success: false,
          message: data.error || 'Token ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง Instagram API',
        });
      }
    } catch (err: any) {
      setTestMetaResult({
        tested: true,
        success: false,
        message: err?.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อทดสอบ Token ได้',
      });
    } finally {
      setIsTestingMeta(false);
    }
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

                  {p.id.toUpperCase() === 'INSTAGRAM' && (
                    <div className="mt-3 p-3.5 bg-gradient-to-br from-pink-50/70 via-purple-50/50 to-indigo-50/50 border border-pink-200/70 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>Meta Graph API สำหรับ Instagram ช่องนี้</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-pink-100 text-pink-700">
                                Per-Channel
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              หากไม่กรอก ระบบจะดึงยอดผ่าน Token Pool ส่วนกลางของ Master Data อัตโนมัติ
                            </p>
                          </div>
                        </div>

                        {/* Toggle Per-Channel Override */}
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(channelMeta.enabled)}
                            onChange={(e) => updateChannelMeta({ enabled: e.target.checked })}
                            disabled={isSubmitting}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                          <span className="ml-2 text-xs font-medium text-slate-700">
                            {channelMeta.enabled ? 'กำหนดเอง' : 'ใช้ส่วนกลาง'}
                          </span>
                        </label>
                      </div>

                      {/* Fallback Notice when Disabled */}
                      {!channelMeta.enabled ? (
                        <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-3 py-2 rounded-xl">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>สลับใช้ <strong>Master Data Meta Token Pool</strong> อัตโนมัติ (ไม่จำเป็นต้องกรอก Token แยก)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateChannelMeta({ enabled: true })}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 shrink-0 ml-2"
                          >
                            ต้องการกรอก Token เฉพาะช่องนี้
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5 pt-1">
                          {/* Access Token Input */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                <Key className="w-3 h-3 text-pink-600" />
                                <span>Meta Access Token เฉพาะของช่องนี้:</span>
                              </label>
                              <span className="text-[10px] text-slate-400">
                                Override ค่าของ Master Data
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type={showMetaToken ? 'text' : 'password'}
                                value={channelMeta.accessToken || ''}
                                onChange={(e) => updateChannelMeta({ accessToken: e.target.value })}
                                placeholder="EAA..."
                                disabled={isSubmitting}
                                className="w-full text-xs font-mono px-3 py-2 pr-16 bg-white border border-pink-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-slate-800 transition-all placeholder:text-slate-300"
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setShowMetaToken(!showMetaToken)}
                                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                  title={showMetaToken ? 'ซ่อน' : 'แสดง'}
                                >
                                  {showMetaToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                {channelMeta.accessToken && (
                                  <button
                                    type="button"
                                    onClick={() => updateChannelMeta({ accessToken: '' })}
                                    className="text-[10px] text-slate-400 hover:text-rose-600 px-1 py-0.5"
                                  >
                                    ล้าง
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Business Account ID (Optional) */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                              <Building2 className="w-3 h-3 text-purple-600" />
                              <span>Instagram Business Account ID (ไม่บังคับ - Optional):</span>
                            </label>
                            <input
                              type="text"
                              value={channelMeta.businessAccountId || ''}
                              onChange={(e) => updateChannelMeta({ businessAccountId: e.target.value })}
                              placeholder="เช่น 17841400... (เว้นว่างเพื่อให้ค้นหาอัตโนมัติ)"
                              disabled={isSubmitting}
                              className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800 transition-all placeholder:text-slate-300"
                            />
                          </div>

                          {/* Test Token Action */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleTestChannelMeta}
                              disabled={isTestingMeta || !channelMeta.accessToken?.trim() || isSubmitting}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
                            >
                              {isTestingMeta ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>กำลังทดสอบ...</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>ทดสอบ Meta Token ของช่องนี้</span>
                                </>
                              )}
                            </button>
                            <span className="text-[11px] text-slate-400">
                              ทดสอบตรวจหาและดึงยอดผู้ติดตาม Instagram แบบเรียลไทม์
                            </span>
                          </div>

                          {/* Test Result Feedback */}
                          {testMetaResult?.tested && (
                            <div className={`p-3 rounded-xl border text-xs transition-all ${
                              testMetaResult.success
                                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                                : 'bg-rose-50/90 border-rose-200 text-rose-900'
                            }`}>
                              {testMetaResult.success ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>เชื่อมต่อ Meta Graph API สำเร็จ!</span>
                                  </div>
                                  {testMetaResult.targetMatch ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/80 p-2 rounded-lg border border-emerald-100">
                                      <div>
                                        <span className="font-bold text-slate-800">
                                          @{testMetaResult.targetMatch.username}
                                        </span>
                                        <span className="text-slate-500 ml-2">
                                          มียอดผู้ติดตาม: <strong>{(testMetaResult.targetMatch.followersCount || 0).toLocaleString()}</strong> คน
                                        </span>
                                      </div>
                                      {typeof testMetaResult.targetMatch.followersCount === 'number' && onFollowersChange && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (testMetaResult.targetMatch?.followersCount !== undefined) {
                                              onFollowersChange('INSTAGRAM', testMetaResult.targetMatch.followersCount);
                                            }
                                          }}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer self-start sm:self-auto"
                                        >
                                          <span>ใส่ายอดนี้ลงในฟอร์ม</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-emerald-700">
                                      Token ถูกต้อง สามารถเข้าถึงได้ {testMetaResult.accountsCount || 0} บัญชีธุรกิจ
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-start gap-1.5">
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                  <span>{testMetaResult.message}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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

