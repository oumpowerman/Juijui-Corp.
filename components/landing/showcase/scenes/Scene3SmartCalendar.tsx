import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  Mic,
  Sun,
  Users,
} from 'lucide-react';
import { SimulatedCursor } from '../SimulatedCursor';

interface Scene3Props {
  isPaused: boolean;
}

type CalendarPhase = 'OVERVIEW' | 'HOVER_SHOOT' | 'POPOVER_OPEN';

export const Scene3SmartCalendar: React.FC<Scene3Props> = ({ isPaused }) => {
  const [phase, setPhase] = useState<CalendarPhase>('OVERVIEW');

  useEffect(() => {
    setPhase('OVERVIEW');
    if (isPaused) return;

    const t1 = setTimeout(() => setPhase('HOVER_SHOOT'), 900);
    const t2 = setTimeout(() => setPhase('POPOVER_OPEN'), 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isPaused]);

  const showPopover = phase === 'POPOVER_OPEN';

  const cursorCoords = {
    OVERVIEW: { x: '20%', y: '35%', clicking: false },
    HOVER_SHOOT: { x: '42%', y: '52%', clicking: true },
    POPOVER_OPEN: { x: '58%', y: '56%', clicking: false },
  }[phase];

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none text-left">
      {/* Top Sub-Header with Sun Tracker Golden Hour */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Smart Shoot Calendar & Sun Tracker
              </h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                Production Queue
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              วางตารางกองถ่ายพร้อมคำนวณแสง Golden Hour และเช็กคลังอุปกรณ์ในที่เดียว
            </p>
          </div>
        </div>

        {/* Golden Hour Weather Pill */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-3 py-1.5 rounded-xl">
          <Sun className="w-4 h-4 text-amber-500 animate-spin" />
          <div className="text-[11px]">
            <span className="font-bold text-amber-900">
              Golden Hour: 16:30 - 17:45 น.
            </span>
            <span className="hidden sm:inline text-amber-700 font-semibold ml-1.5">
              • ท้องฟ้าโปร่ง 31°C
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Timeline Grid */}
      <div className="grid grid-cols-3 gap-3 my-3 flex-1 min-h-0 relative">
        {/* Day 1: Thu 22 Oct */}
        <div className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                พฤหัส • 22 ต.ค.
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Studio A
              </span>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                10:00 - 13:00
              </span>
              <p className="text-xs font-bold text-slate-800">
                ถ่าย Packshot สินค้าใหม่ 8 ชิ้น
              </p>
              <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <Camera className="w-3 h-3 text-indigo-500" /> เซ็ตไฟสตูดิโอพร้อม
              </p>
            </div>
          </div>
          <div className="text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-200/60">
            อุปกรณ์ครบ 100%
          </div>
        </div>

        {/* Day 2: Fri 23 Oct (Target Interactive Shoot Card) */}
        <div className="bg-amber-50/60 rounded-2xl p-3 border-2 border-amber-300 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-950">
                ศุกร์ • 23 ต.ค. (วันนี้)
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">
                Outdoor
              </span>
            </div>

            <motion.div
              animate={{
                scale: phase !== 'OVERVIEW' ? 1.02 : 1,
                borderColor: phase !== 'OVERVIEW' ? '#F59E0B' : '#FDE68A',
              }}
              className="bg-white rounded-xl p-2.5 border-2 border-amber-300 shadow-md space-y-1.5 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> 15:30 - 18:00
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  แสงสวยมาก
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                กองถ่าย Vlog คาเฟ่สุขุมวิท 39
              </p>
              <p className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" /> Glasshouse Cafe BKK
              </p>
            </motion.div>
          </div>

          <div className="text-[10px] font-bold text-amber-800 pt-2 border-t border-amber-200/70 flex items-center justify-between">
            <span>ชี้เพื่อดูใบเบิกอุปกรณ์</span>
            <span>ทีม 4 คน</span>
          </div>
        </div>

        {/* Day 3: Sat 24 Oct */}
        <div className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                เสาร์ • 24 ต.ค.
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Live Room
              </span>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                19:00 - 21:00
              </span>
              <p className="text-xs font-bold text-slate-800">
                TikTok Live Mega Campaign
              </p>
              <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <Mic className="w-3 h-3 text-purple-500" /> เช็กระบบเสียงแล้ว
              </p>
            </div>
          </div>
          <div className="text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-200/60">
            นัดหมายพิธีกรเรียบร้อย
          </div>
        </div>

        {/* Popover Card: Shoot Location + Asset Registry */}
        <AnimatePresence>
          {showPopover && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="absolute right-2 top-2 bottom-2 w-[56%] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 border border-amber-400/40 shadow-2xl z-20 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      รายละเอียดกองถ่าย & อุปกรณ์ (Asset Registry)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    พร้อมออกกอง
                  </span>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" /> กล้อง
                      Sony FX3 + เลนส์ 24-70 GM
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> เบิกแล้ว (ต้อม)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-amber-400" /> ไมค์ไร้สาย
                      DJI Mic 2 (2 ตัวรับ)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ชาร์จเต็ม 100%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> ทีมกองถ่าย:
                  พี่จุ้ย, ต้อม, มุก, นนท์
                </span>
                <span className="text-amber-300 font-bold">
                  Golden Hour 16:30 น.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Status Pill */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 font-bold text-[10px]">
            SCENE 3
          </span>
          <span className="font-semibold text-slate-200">
            {showPopover
              ? 'ดูพิกัดโลเคชัน ช่วงเวลาแสงสวย และเช็กสถานะเบิกกล้องได้ในคลิกเดียว!'
              : 'เลื่อนเมาส์ไปที่คิวถ่ายทำเพื่อตรวจสอบความพร้อมของกองถ่าย...'}
          </span>
        </div>
        <span className="text-[11px] font-bold text-amber-400 hidden sm:inline">
          Sun Tracker & Asset Registry
        </span>
      </div>

      {/* Simulated Cursor */}
      <SimulatedCursor
        x={cursorCoords.x}
        y={cursorCoords.y}
        isClicking={cursorCoords.clicking}
        label="ต้อม (Production Lead)"
        accentColor="amber"
      />
    </div>
  );
};
