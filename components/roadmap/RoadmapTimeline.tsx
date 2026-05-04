
import React from 'react';

interface TimelineMonth {
  index: number;
  name: string;
  quarter: string;
  year: number;
  start_week: number;
}

interface RoadmapTimelineProps {
  timelineConfig: TimelineMonth[];
  currentWeekIndex: number;
}

const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ timelineConfig, currentWeekIndex }) => {
  // Each month is 4 weeks for this visualization
  const WEEKS_PER_MONTH = 4;
  
  // Calculate Quarters more robustly
  const quartersArr = timelineConfig.reduce((acc: { name: string; span: number }[], month) => {
    const last = acc[acc.length - 1];
    if (last && last.name === month.quarter) {
      last.span += 1;
    } else {
      acc.push({ name: month.quarter, span: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="flex sticky top-0 z-[100]">
      {/* Fixed Sidebar Table Headers - Ensure absolute position or fixed width */}
      <div className="flex divide-x divide-slate-100 bg-white border-b border-slate-200 shadow-sm shrink-0 sticky left-0 z-[110] border-r border-slate-200">
        <div className="w-[48px] min-w-[48px] max-w-[48px] py-5 px-2 text-[10px] font-bold text-slate-400 text-center uppercase tracking-tighter">ลำดับ</div>
        <div className="w-[320px] min-w-[320px] max-w-[320px] py-5 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left">โครงการ</div>
        <div className="w-[112px] min-w-[112px] max-w-[112px] py-5 px-2 text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest">หมวดหมู่</div>
        <div className="w-[96px] min-w-[96px] max-w-[96px] py-5 px-2 text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest">สถานะ</div>
        <div className="w-[80px] min-w-[80px] max-w-[80px] py-5 px-2 text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest">บัฟเฟอร์</div>
        <div className="w-[160px] min-w-[160px] max-w-[160px] py-5 px-2 text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest">เป้าหมาย</div>
      </div>

      {/* Timeline Header Area */}
      <div className="flex flex-col bg-white border-b border-slate-200 shadow-sm min-w-max">
        {/* Quarter Row */}
        <div className="flex border-b border-slate-50">
          {quartersArr.map((q, idx) => (
            <div 
              key={`${q.name}-${idx}`} 
              className="py-2 text-center text-[11px] font-bold text-slate-400 bg-slate-50/80 uppercase tracking-[0.4em] border-r border-slate-200"
              style={{ width: `${q.span * 160}px` }}
            >
              {q.name}
            </div>
          ))}
        </div>
        
        {/* Month Row */}
        <div className="flex border-b border-slate-50 text-indigo-500">
          {timelineConfig.map((m, idx) => (
            <div key={`${m.name}-${idx}`} className="w-[160px] py-3 text-center text-[12px] font-bold bg-indigo-50/20 uppercase tracking-[0.2em] border-r border-slate-100">
              {m.name} {m.year}
            </div>
          ))}
        </div>

        {/* Week Row */}
        <div className="flex">
          {timelineConfig.map((m, mIdx) => (
            <React.Fragment key={`weeks-${mIdx}`}>
              {[1, 2, 3, 4].map((w) => {
                const absoluteWeek = m.start_week + (w - 1);
                const isCurrent = absoluteWeek === currentWeekIndex;
                return (
                  <div 
                    key={`w-${mIdx}-${w}`} 
                    className={`w-[40px] py-2.5 text-center text-[10px] font-bold uppercase border-r border-slate-50 ${
                      isCurrent ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-300'
                    }`}
                  >
                    W{w}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapTimeline;
