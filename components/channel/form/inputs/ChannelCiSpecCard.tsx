import React from 'react';
import { 
  Palette, 
  Smartphone, 
  Tv, 
  Sparkles, 
  CheckCircle2, 
  RotateCw, 
  BookOpen, 
  ExternalLink,
  Info
} from 'lucide-react';
import { BrandLink } from '../../../../types';
import { BRAND_LINK_SERVICES, extractDomain } from '../../helpers/brandLinkConfig';

interface ChannelCiSpecCardProps {
  channelName: string;
  channelColor: string;
  logoPreview: string | null;
  brandLinks: BrandLink[];
}

export const ChannelCiSpecCard: React.FC<ChannelCiSpecCardProps> = ({
  channelName,
  channelColor,
  logoPreview,
  brandLinks,
}) => {
  const colorParts = channelColor ? channelColor.split(' ') : ['bg-indigo-100', 'text-indigo-800', 'border-indigo-200', 'ring-indigo-500'];
  const bgClass = colorParts[0] || 'bg-indigo-100';
  const textClass = colorParts[1] || 'text-indigo-800';
  const borderClass = colorParts[2] || 'border-indigo-200';

  return (
    <div className="space-y-4">
      {/* 1. Live 3D Back-Card Simulator */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>ตัวอย่างบัตรคู่มือ 3D (Docs Hub Preview)</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
            FLIP-SIDE
          </span>
        </div>

        {/* Card Simulator Container */}
        <div className="p-3.5 space-y-3">
          {/* Mini Header Banner */}
          <div className={`p-2.5 ${bgClass} rounded-xl border ${borderClass} flex items-center justify-between`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white border border-white/80 shadow-2xs overflow-hidden flex items-center justify-center shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} className="w-full h-full object-cover" alt="logo" />
                ) : (
                  <span className={`font-bold text-[10px] uppercase ${textClass}`}>
                    {(channelName.trim() || 'CH').substring(0, 2)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h6 className="text-[11px] font-bold text-slate-800 truncate">
                  {channelName.trim() || 'ชื่อรายการของคุณ'}
                </h6>
                <p className="text-[9px] font-medium text-slate-500">
                  คู่มือ & ลิงก์ทำงาน ({brandLinks.length})
                </p>
              </div>
            </div>

            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/85 text-slate-700 border border-slate-200/60 shrink-0">
              พลิกกลับ
            </span>
          </div>

          {/* List Preview */}
          <div className="space-y-1.5 max-h-[170px] overflow-y-auto custom-scrollbar pr-0.5">
            {brandLinks.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center space-y-1 bg-slate-50/50">
                <BookOpen className="w-5 h-5 text-slate-300 mx-auto" />
                <p className="text-[11px] font-semibold text-slate-500">ยังไม่มีเอกสารในรายการ</p>
                <p className="text-[10px] text-slate-400">เพิ่ม Notion, Drive หรือ Figma เพื่อให้แสดงที่นี่</p>
              </div>
            ) : (
              brandLinks.map((link) => {
                const service = BRAND_LINK_SERVICES[link.type] || BRAND_LINK_SERVICES.OTHER;
                const ServiceIcon = service.icon;
                const domain = extractDomain(link.url);

                return (
                  <div
                    key={link.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-left ${service.cardBg} ${service.borderColor}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${service.iconContainerBg}`}>
                        <ServiceIcon className="w-3 h-3 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-800 truncate">
                          {link.title || service.label}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono truncate">
                          {link.description || domain || link.url}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2. CI & Standard Production Specs */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>สเปคการผลิต & อัตลักษณ์ (CI Specs)</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            Production Guidelines
          </span>
        </div>

        {/* Color Palette Display */}
        <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Palette className="w-3 h-3 text-indigo-500" />
              สีประจำแบรนด์ (Primary Theme)
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${channelColor}`}>
              {channelName.trim() || 'แบรนด์'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            สีธีมนี้จะถูกดึงไปใช้เป็นแถบระบุช่องในปฏิทินงาน, คลังคอนเทนต์ และแถบบนการ์ดคู่มือ
          </p>
        </div>

        {/* Video Production Aspect Ratio Chips */}
        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="p-2.5 rounded-xl bg-white border border-slate-100 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
              <Tv className="w-3.5 h-3.5 text-indigo-600" />
              <span>แนวนอน 16:9</span>
            </div>
            <p className="text-[10px] text-slate-400">1920x1080 (YouTube / Master)</p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-100 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>แนวตั้ง 9:16</span>
            </div>
            <p className="text-[10px] text-slate-400">1080x1920 (Reels / TikTok)</p>
          </div>
        </div>

        {/* Informational Tip */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/70 text-[10px] text-indigo-900 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            แชร์ลิงก์ Figma Design System หรือ Notion Brand Book ไว้ที่นี่ เพื่อให้ทีมตัดต่อและทีมกราฟิกหยิบใช้งานได้ทันทีโดยไม่ต้องถามหาในแชต
          </span>
        </div>
      </div>
    </div>
  );
};
export default ChannelCiSpecCard;
