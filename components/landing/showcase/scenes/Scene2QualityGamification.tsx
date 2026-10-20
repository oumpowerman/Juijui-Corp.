import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';
import { SimulatedCursor } from '../SimulatedCursor';

interface Scene2Props {
  isPaused: boolean;
}

type ReviewPhase = 'REVIEWING' | 'CLICKING_APPROVE' | 'APPROVED_REWARD';

export const Scene2QualityGamification: React.FC<Scene2Props> = ({
  isPaused,
}) => {
  const [phase, setPhase] = useState<ReviewPhase>('REVIEWING');

  useEffect(() => {
    setPhase('REVIEWING');
    if (isPaused) return;

    const t1 = setTimeout(() => setPhase('CLICKING_APPROVE'), 1400);
    const t2 = setTimeout(() => setPhase('APPROVED_REWARD'), 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isPaused]);

  const isApproved = phase === 'APPROVED_REWARD';

  const cursorCoords = {
    REVIEWING: { x: '34%', y: '56%', clicking: false },
    CLICKING_APPROVE: { x: '43%', y: '74%', clicking: true },
    APPROVED_REWARD: { x: '74%', y: '38%', clicking: false },
  }[phase];

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none text-left">
      {/* Top Sub-Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Quality Gate & Creator Gamification
              </h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                RPG Reward System
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              ตรวจเช็กมาตรฐานงานก่อนโพสต์ พร้อมแจกแต้ม XP & HP ให้ทีมงานอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Floating Gamification Toast on Approval */}
        <AnimatePresence>
          {isApproved && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white px-3.5 py-1.5 rounded-xl shadow-lg shadow-orange-500/20"
            >
              <Sparkles className="w-4 h-4 animate-spin" />
              <span className="text-xs font-bold">อนุมัติผ่านเกณฑ์!</span>
              <span className="text-xs font-bold bg-white/25 px-2 py-0.5 rounded-lg">
                +50 XP
              </span>
              <span className="text-xs font-bold bg-emerald-500/90 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Heart className="w-3 h-3 fill-white" /> +20 HP
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Split Content: Left = Quality Gate Review Modal, Right = Creator RPG Card */}
      <div className="grid grid-cols-12 gap-3.5 my-3 flex-1 min-h-0 items-stretch">
        {/* Left 7 Cols: Quality Gate Inspection Card */}
        <div className="col-span-7 bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Quality Gate Checklist
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                ส่งตรวจโดย: นนท์ (Editor)
              </span>
            </div>

            <h5 className="text-sm font-bold text-slate-900 mb-2.5">
              รีวิวจัดโต๊ะทำงานสายโปรดักทีฟ EP.4 (Final Cut 4K)
            </h5>

            <div className="space-y-1.5">
              {[
                'ความคมชัด 4K 60fps & เกรดสีตรง Moodboard',
                'ซับไตเติลถูกต้อง ไม่มีคำผิด และอยู่ใน Safe Zone',
                'ปก Thumbnail โดดเด่น + ใส่ End Screen ครบถ้วน',
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              คะแนนคุณภาพ:{' '}
              <strong className="text-emerald-600 font-bold">
                100/100 (Perfect)
              </strong>
            </span>

            <motion.button
              type="button"
              animate={{
                scale: phase === 'CLICKING_APPROVE' ? 0.94 : 1,
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors ${
                isApproved
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-indigo-600 text-white shadow-indigo-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isApproved
                  ? 'อนุมัติงานเรียบร้อย (Approved)'
                  : 'อนุมัติงาน (Approve & Reward)'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Right 5 Cols: Employee Gamification RPG Profile */}
        <div className="col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3.5 border border-indigo-500/30 flex flex-col justify-between relative overflow-hidden">
          {/* Glow Effect when approved */}
          <AnimatePresence>
            {isApproved && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full bg-amber-400/25 blur-2xl"
              />
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white/20">
                นนท์
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">
                    นนท์ • Senior Editor
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {isApproved
                    ? 'Level 12 • Master Creator!'
                    : 'Level 11 • Pro Creator'}
                </span>
              </div>
            </div>

            <div className="px-2 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-300" />
              <span>{isApproved ? '2,450 XP' : '2,400 XP'}</span>
            </div>
          </div>

          {/* XP & HP Bars */}
          <div className="space-y-2.5 my-2">
            <div>
              <div className="flex justify-between text-[11px] font-semibold mb-1">
                <span className="text-indigo-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> EXP Level Progress
                </span>
                <span className="text-amber-300 font-bold">
                  {isApproved ? '100% (LEVEL UP!)' : '78%'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: '78%' }}
                  animate={{ width: isApproved ? '100%' : '78%' }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold mb-1">
                <span className="text-emerald-200 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-emerald-400 fill-emerald-400" />{' '}
                  พลังใจทีมงาน (HP)
                </span>
                <span className="text-emerald-300 font-bold">
                  {isApproved ? '100 / 100 HP' : '80 / 100 HP'}
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '80%' }}
                  animate={{ width: isApproved ? '100%' : '80%' }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  className="h-full rounded-full bg-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Unlocked Badge Footer */}
          <div className="flex items-center justify-between bg-white/10 rounded-xl px-2.5 py-2 border border-white/10">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-200">
                {isApproved
                  ? 'ปลดล็อกเหรียญ "ส่งงานตรงเวลา 10 คลิปติด!"'
                  : 'ส่งงานผ่านรอบแรก รับโบนัสพิเศษ'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Pill */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 font-bold text-[10px]">
            SCENE 2
          </span>
          <span className="font-semibold text-slate-200">
            {isApproved
              ? 'อนุมัติงานปุ๊บ แจก +50 XP / +20 HP และอัปเลเวลพนักงานทันที!'
              : 'หัวหน้าทีมตรวจเช็ก Quality Gate ก่อนกดอนุมัติงาน...'}
          </span>
        </div>
        <span className="text-[11px] font-bold text-amber-400 hidden sm:inline">
          Quality Gate + RPG Gamification
        </span>
      </div>

      {/* Simulated Cursor */}
      <SimulatedCursor
        x={cursorCoords.x}
        y={cursorCoords.y}
        isClicking={cursorCoords.clicking}
        label="พี่จุ้ย (Creative Director)"
        accentColor="purple"
      />
    </div>
  );
};
