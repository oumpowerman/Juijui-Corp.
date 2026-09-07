import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Check, Filter } from 'lucide-react';

export type InsightType = 'ongoing' | 'high_impact' | 'peak' | 'delayed';

interface RoadmapInsightCardProps {
  type: InsightType;
  label: string;
  sub: string;
  value: number | string;
  icon: string;
  colorScheme: 'indigo' | 'emerald' | 'amber' | 'rose';
  isActiveFilter: boolean;
  onToggleFilter: () => void;
  onOpenDeepDive: () => void;
  badgeText?: string;
  alert?: boolean;
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50/60',
    border: 'border-indigo-200/80',
    activeRing: 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/40',
    badge: 'bg-indigo-100 text-indigo-700',
    text: 'text-indigo-600',
    hoverBorder: 'hover:border-indigo-300 hover:shadow-indigo-500/10',
    btn: 'text-indigo-600 hover:bg-indigo-100/70',
    filterChip: 'bg-indigo-600 text-white'
  },
  emerald: {
    bg: 'bg-emerald-50/60',
    border: 'border-emerald-200/80',
    activeRing: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/40',
    badge: 'bg-emerald-100 text-emerald-700',
    text: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-300 hover:shadow-emerald-500/10',
    btn: 'text-emerald-600 hover:bg-emerald-100/70',
    filterChip: 'bg-emerald-600 text-white'
  },
  amber: {
    bg: 'bg-amber-50/60',
    border: 'border-amber-200/80',
    activeRing: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-600',
    hoverBorder: 'hover:border-amber-300 hover:shadow-amber-500/10',
    btn: 'text-amber-700 hover:bg-amber-100/70',
    filterChip: 'bg-amber-600 text-white'
  },
  rose: {
    bg: 'bg-rose-50/60',
    border: 'border-rose-200/80',
    activeRing: 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/40',
    badge: 'bg-rose-100 text-rose-700',
    text: 'text-rose-600',
    hoverBorder: 'hover:border-rose-300 hover:shadow-rose-500/10',
    btn: 'text-rose-600 hover:bg-rose-100/70',
    filterChip: 'bg-rose-600 text-white'
  }
};

export const RoadmapInsightCard: React.FC<RoadmapInsightCardProps> = ({
  type,
  label,
  sub,
  value,
  icon,
  colorScheme,
  isActiveFilter,
  onToggleFilter,
  onOpenDeepDive,
  badgeText,
  alert = false
}) => {
  const c = colorMap[colorScheme];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative group bg-white rounded-2xl border p-5 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between ${
        isActiveFilter ? c.activeRing : `border-slate-200/90 ${c.hoverBorder}`
      }`}
      onClick={onToggleFilter}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub}</span>
              {badgeText && (
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${c.badge}`}>
                  {badgeText}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-2xl font-black tracking-tight ${c.text}`}>
                {value}
              </span>
              <span className="text-xs font-bold text-slate-600 truncate max-w-[130px]">
                {label}
              </span>
            </div>
          </div>
        </div>

        {/* Deep Dive Modal Trigger Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDeepDive();
          }}
          title="ดูรายละเอียดเชิงลึกและบทวิเคราะห์"
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all opacity-80 group-hover:opacity-100 shrink-0"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 font-semibold text-slate-400">
          {isActiveFilter ? (
            <span className={`flex items-center gap-1 font-bold ${c.text}`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              กำลังกรองในตาราง
            </span>
          ) : (
            <span className="group-hover:text-slate-600 transition-colors flex items-center gap-1">
              <Filter className="w-3 h-3" />
              คลิกเพื่อกรอง
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDeepDive();
          }}
          className={`font-bold px-2 py-0.5 rounded-lg transition-colors text-[10px] uppercase tracking-wider ${c.btn}`}
        >
          วิเคราะห์ลึก →
        </button>
      </div>

      {/* Pulsing indicator if active or alert */}
      {alert && !isActiveFilter && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
      )}
    </motion.div>
  );
};
