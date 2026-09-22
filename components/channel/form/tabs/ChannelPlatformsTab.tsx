import React from 'react';
import { 
  Coins, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  FileText,
  Check
} from 'lucide-react';
import { PlatformGridSelector } from '../inputs/PlatformGridSelector';
import { 
  Platform, 
  SocialLinks, 
  PlatformFollowers, 
  ChannelMetaApiConfig,
  ChannelMonetization 
} from '../../../../types';
import { PLATFORM_ICONS } from '../../../../constants';

interface ChannelPlatformsTabProps {
  selectedPlatforms: Platform[];
  togglePlatform: (platform: Platform) => void;
  socialLinks: SocialLinks;
  onSocialLinkChange: (platform: Platform, url: string) => void;
  followers: PlatformFollowers;
  onFollowersChange: (platform: Platform, count: number | undefined) => void;
  metaApi?: ChannelMetaApiConfig;
  onMetaApiChange?: (config: ChannelMetaApiConfig) => void;
  monetization: ChannelMonetization;
  onMonetizationChange: (monetization: ChannelMonetization) => void;
  isSubmitting: boolean;
}

export const ChannelPlatformsTab: React.FC<ChannelPlatformsTabProps> = ({
  selectedPlatforms,
  togglePlatform,
  socialLinks,
  onSocialLinkChange,
  followers,
  onFollowersChange,
  metaApi,
  onMetaApiChange,
  monetization,
  onMonetizationChange,
  isSubmitting,
}) => {
  const hasYouTube = selectedPlatforms.includes('YOUTUBE');
  const hasFacebook = selectedPlatforms.includes('FACEBOOK');
  const canMonetize = hasYouTube || hasFacebook;

  const isMonetized = Boolean(
    (hasYouTube && monetization?.youtube) || (hasFacebook && monetization?.facebook)
  );

  const handleTogglePlatformMonetization = (platform: 'youtube' | 'facebook') => {
    const nextVal = !monetization?.[platform];
    const nextMonetization: ChannelMonetization = {
      ...monetization,
      [platform]: nextVal,
      is_monetized: platform === 'youtube'
        ? (nextVal || Boolean(hasFacebook && monetization?.facebook))
        : (nextVal || Boolean(hasYouTube && monetization?.youtube)),
    };
    onMonetizationChange(nextMonetization);
  };

  const handleNoteChange = (note: string) => {
    onMonetizationChange({
      ...monetization,
      monetization_note: note,
    });
  };

  return (
    <div className="space-y-6">
      {/* Platform selection and social links */}
      <PlatformGridSelector
        selectedPlatforms={selectedPlatforms}
        togglePlatform={togglePlatform}
        socialLinks={socialLinks}
        onSocialLinkChange={onSocialLinkChange}
        followers={followers}
        onFollowersChange={onFollowersChange}
        metaApi={metaApi}
        onMetaApiChange={onMetaApiChange}
        isSubmitting={isSubmitting}
      />

      {/* Monetization Status Section */}
      <div className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  สถานะการเปิดสร้างรายได้ (Monetization Status)
                </h4>
              </div>
              <p className="text-[11px] text-slate-400">
                รองรับการเปิดรับรายได้บน YouTube Partner Program (YPP) และ Facebook Ads
              </p>
            </div>
          </div>

          <div className="self-start sm:self-center">
            {isMonetized ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/80 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>เปิดสร้างรายได้แล้ว</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                <span>ยังไม่เปิดสร้างรายได้</span>
              </span>
            )}
          </div>
        </div>

        {canMonetize ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* YouTube Monetization Toggle */}
              {hasYouTube && (
                <div 
                  onClick={() => handleTogglePlatformMonetization('youtube')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    monetization?.youtube 
                      ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/15 shadow-xs' 
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        {PLATFORM_ICONS.YOUTUBE ? (
                          <span className="w-4 h-4 flex items-center justify-center font-bold text-xs">YT</span>
                        ) : null}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">YouTube Monetization</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">YouTube Partner Program (YPP)</p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      monetization?.youtube 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs' 
                        : 'bg-slate-100 border-slate-200 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {monetization?.youtube ? '🟢 ผ่านเกณฑ์ & เปิดรับรายได้แล้ว' : '⚪ ยังไม่เปิดสร้างรายได้'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      monetization?.youtube 
                        ? 'bg-rose-100 text-rose-800 border-rose-200' 
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {monetization?.youtube ? 'YPP Active' : 'Off'}
                    </span>
                  </div>
                </div>
              )}

              {/* Facebook Monetization Toggle */}
              {hasFacebook && (
                <div 
                  onClick={() => handleTogglePlatformMonetization('facebook')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    monetization?.facebook 
                      ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/15 shadow-xs' 
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        {PLATFORM_ICONS.FACEBOOK ? (
                          <span className="w-4 h-4 flex items-center justify-center font-bold text-xs">FB</span>
                        ) : null}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">Facebook Monetization</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">In-stream Ads & Bonus</p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      monetization?.facebook 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                        : 'bg-slate-100 border-slate-200 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {monetization?.facebook ? '🟢 ผ่านเกณฑ์ & เปิดรับรายได้แล้ว' : '⚪ ยังไม่เปิดสร้างรายได้'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      monetization?.facebook 
                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {monetization?.facebook ? 'FB Active' : 'Off'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Monetization Note Input */}
            <div className="space-y-1.5 pt-1">
              <label htmlFor="monetization-note-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>หมายเหตุการสร้างรายได้ (Monetization Note)</span>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
                  ทางเลือก
                </span>
              </label>
              <input
                id="monetization-note-input"
                type="text"
                value={monetization?.monetization_note || ''}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="เช่น ได้รับอนุมัติ YPP วันที่ 15 ม.ค. 2026, หรือ รอส่งตรวจ Facebook รอบ 2..."
                className="w-full px-4 py-2.5 bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-200/90 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl outline-none text-slate-800 text-xs sm:text-sm font-medium shadow-2xs transition-all placeholder:text-slate-300 placeholder:font-normal disabled:opacity-70"
                disabled={isSubmitting}
              />
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 flex items-center gap-3 text-slate-500">
            <Info className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">
              การสร้างรายได้สามารถเปิดใช้งานได้เมื่อช่องมีบัญชี <span className="font-bold text-slate-700">YouTube</span> หรือ <span className="font-bold text-slate-700">Facebook</span> (สามารถคลิกเลือกแพลตฟอร์มด้านบนเพื่อเปิดการตั้งค่านี้)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

