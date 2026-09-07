import React from 'react';
import { AlertTriangle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { InsightType } from './RoadmapInsightCard';

interface RoadmapAdviceBannerProps {
  peakLoad: number;
  delayedCount: number;
  onOpenDeepDive: (tab: InsightType) => void;
}

export const RoadmapAdviceBanner: React.FC<RoadmapAdviceBannerProps> = ({
  peakLoad,
  delayedCount,
  onOpenDeepDive
}) => {
  if (peakLoad > 3) {
    return (
      <div className="px-10 pb-6 bg-slate-50/50 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-amber-50/80 border border-amber-200/60 rounded-2xl text-xs text-amber-800 animate-in fade-in slide-in-from-top-1 font-medium">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2 bg-amber-100/80 rounded-xl text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">ตรวจพบการกระจุกตัวของภาระงาน (Creator Hustle Congestion)</p>
              <p className="text-amber-800/80 mt-0.5">
                มีโครงการที่รันซ้อนพร้อมกันสูงสุดถึง <strong className="font-bold text-amber-950">{peakLoad} แผนงาน</strong> ในบางสัปดาห์ แนะนำให้ลากขยับจุดเริ่มต้น หรือเปิดดูจุดกระจุกตัวเพื่อเกลี่ยงาน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenDeepDive('peak')}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all shrink-0 self-start sm:self-auto"
          >
            <span>ดูแผนที่ภาระงาน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (delayedCount > 0) {
    return (
      <div className="px-10 pb-6 bg-slate-50/50 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-rose-50/80 border border-rose-200/60 rounded-2xl text-xs text-rose-800 animate-in fade-in slide-in-from-top-1 font-medium">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2 bg-rose-100/80 rounded-xl text-rose-800 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-rose-900 text-sm">พบแผนคอนเทนต์สะสมล่าช้า (Delayed Schedule Alert)</p>
              <p className="text-rose-800/80 mt-0.5">
                มีโครงการที่เสร็จไม่ทันตารางเดิมอยู่ <strong className="font-bold text-rose-950">{delayedCount} แผนงาน</strong> อาจส่งผลกระทบลูกโซ่ แนะนำให้ปรับขยายบัฟเฟอร์หรือจัดสรรลำดับใหม่
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenDeepDive('delayed')}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all shrink-0 self-start sm:self-auto"
          >
            <span>จัดการความเสี่ยง</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 pb-6 bg-slate-50/50 border-b border-slate-100">
      <div className="flex items-center gap-3.5 px-6 py-4 bg-indigo-50/70 border border-indigo-100/50 rounded-2xl text-xs text-indigo-800 animate-in fade-in slide-in-from-top-1 font-medium">
        <div className="p-2 bg-indigo-100/60 rounded-xl text-indigo-600 font-bold shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-indigo-900">ตารางการผลิตและปล่อยคอนเทนต์อยู่ในเกณฑ์ยอดเยี่ยม (Healthy Pipeline)</p>
          <p className="text-indigo-800/80 mt-0.5">
            ไม่มีโครงการล่าช้า และการกระจายงานอยู่ในระดับที่ทีมทำงานได้อย่างมีประสิทธิภาพสูงสุด
          </p>
        </div>
      </div>
    </div>
  );
};
