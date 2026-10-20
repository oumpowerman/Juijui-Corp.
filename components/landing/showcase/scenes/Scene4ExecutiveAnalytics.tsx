import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { SimulatedCursor } from '../SimulatedCursor';

interface Scene4Props {
  isPaused: boolean;
}

export const Scene4ExecutiveAnalytics: React.FC<Scene4Props> = ({
  isPaused,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const steps = 25;
    let current = 0;

    const interval = setInterval(() => {
      current += 1;
      setProgress(Math.min(1, current / steps));
      if (current >= steps) {
        clearInterval(interval);
      }
    }, 65);

    return () => clearInterval(interval);
  }, [isPaused]);

  const publishedCount = Math.round(12 + progress * 36); // 12 -> 48
  const onTimeRate = Math.round(78 + progress * 20); // 78 -> 98
  const viewsReach = (0.4 + progress * 1.4).toFixed(1); // 0.4M -> 1.8M

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none text-left">
      {/* Top Sub-Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Executive Analytics & Team KPI
              </h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Real-Time Insights
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              วัดผลปริมาณการผลิตคอนเทนต์ ความตรงต่อเวลา และประสิทธิภาพรายบุคคล
            </p>
          </div>
        </div>

        {/* Green Team Status Badge: On Track 98% */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-600/20"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold">On Track {onTimeRate}%</span>
        </motion.div>
      </div>

      {/* Main Analytics Content */}
      <div className="grid grid-cols-12 gap-3 my-3 flex-1 min-h-0">
        {/* Left 5 Cols: 3 KPI Count-Up Metric Cards */}
        <div className="col-span-5 flex flex-col justify-between gap-2">
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500">
                คอนเทนต์ที่โพสต์สำเร็จเดือนนี้
              </span>
              <div className="text-xl font-bold text-slate-900 mt-0.5">
                {publishedCount}{' '}
                <span className="text-xs font-semibold text-slate-400">
                  / 50 คลิป
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +34%
            </span>
          </div>

          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500">
                อัตราส่งงานตรงตาม SLA
              </span>
              <div className="text-xl font-bold text-emerald-600 mt-0.5">
                {onTimeRate}%
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> ดีเยี่ยม
            </span>
          </div>

          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500">
                ยอดการมองเห็นรวมทุกช่องทาง
              </span>
              <div className="text-xl font-bold text-indigo-950 mt-0.5">
                {viewsReach}M{' '}
                <span className="text-xs font-semibold text-amber-600">
                  Views
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg flex items-center gap-0.5">
              <Flame className="w-3.5 h-3.5" /> Viral
            </span>
          </div>
        </div>

        {/* Right 7 Cols: Animated SVG Line Chart */}
        <div className="col-span-7 bg-slate-900 text-white rounded-2xl p-3.5 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                กราฟความเร็วการผลิตคอนเทนต์ (Velocity Trend)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                เปรียบเทียบเป้าหมายรายสัปดาห์ (W1 - W4)
              </span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              All Channels Active
            </span>
          </div>

          {/* Animated SVG Curve */}
          <div className="relative h-28 w-full my-1">
            <svg
              viewBox="0 0 320 100"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient
                  id="kpiLineGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="50%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient
                  id="kpiAreaGrad"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              <line
                x1="0"
                y1="25"
                x2="320"
                y2="25"
                stroke="#334155"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="55"
                x2="320"
                y2="55"
                stroke="#334155"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="85"
                x2="320"
                y2="85"
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Area under curve */}
              <motion.path
                d="M 10 80 C 70 72, 110 58, 165 46 C 220 34, 260 22, 310 14 L 310 85 L 10 85 Z"
                fill="url(#kpiAreaGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />

              {/* Animated Line */}
              <motion.path
                d="M 10 80 C 70 72, 110 58, 165 46 C 220 34, 260 22, 310 14"
                fill="none"
                stroke="url(#kpiLineGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
              />

              {/* Final Data Point Dot */}
              <motion.circle
                cx="310"
                cy="14"
                r="6"
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.3, type: 'spring', stiffness: 300 }}
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-1 border-t border-slate-800">
            <span>สัปดาห์ที่ 1 (10 คลิป)</span>
            <span>สัปดาห์ที่ 2 (22 คลิป)</span>
            <span>สัปดาห์ที่ 3 (35 คลิป)</span>
            <span className="text-emerald-400 font-bold">
              สัปดาห์ที่ 4 ({publishedCount} คลิป)
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Status Pill */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold text-[10px]">
            SCENE 4
          </span>
          <span className="font-semibold text-slate-200">
            สรุปภาพรวมผลงานทีมแบบ Real-Time พร้อมสถานะ On Track 98%!
          </span>
        </div>
        <span className="text-[11px] font-bold text-emerald-400 hidden sm:inline">
          Executive KPI Dashboard
        </span>
      </div>

      {/* Simulated Cursor */}
      <SimulatedCursor
        x="76%"
        y="36%"
        isClicking={false}
        label="ผู้บริหาร (CEO View)"
        accentColor="emerald"
      />
    </div>
  );
};
