import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Minus } from 'lucide-react';
import { SEAT_QUICK_STEPS, SPRING_TAB_TRANSITION } from './types';

interface TeamSeatConfiguratorProps {
  seatCount: number;
  includedBaseSeats: number;
  extraSeatMonthlyPrice: number;
  extraSeats: number;
  extraSeatsMonthly: number;
  onChangeSeatCount: (nextCount: number) => void;
}

export const TeamSeatConfigurator: React.FC<TeamSeatConfiguratorProps> = ({
  seatCount,
  includedBaseSeats,
  extraSeatMonthlyPrice,
  extraSeats,
  extraSeatsMonthly,
  onChangeSeatCount,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-slate-200/85 shadow-lg shadow-indigo-500/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              ขั้นตอนที่ 2: กำหนดโควตาสมาชิกในองค์กร (Team Seat Quota)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              โครงสร้าง Base Core รองรับฟรี{' '}
              <strong className="text-indigo-700">{includedBaseSeats} บัญชีแรก</strong> ·
              บัญชีส่วนเพิ่มคิดตามจริง ฿{extraSeatMonthlyPrice}/คน/เดือน
            </p>
          </div>
        </div>

        {/* Numeric Stepper */}
        <div className="flex items-center gap-2 bg-slate-100/95 p-1.5 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => onChangeSeatCount(Math.max(1, seatCount - 1))}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </motion.button>
          <div className="px-3 text-center min-w-[92px]">
            <span className="text-lg font-bold text-indigo-700 font-google-sans tabular-nums">
              {seatCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1">บัญชี</span>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => onChangeSeatCount(Math.min(500, seatCount + 1))}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Range Slider + Quick Step Tabs with Framer Motion layoutId */}
      <div className="space-y-3.5">
        <input
          type="range"
          min={1}
          max={100}
          value={Math.min(100, seatCount)}
          onChange={(e) => onChangeSeatCount(Number(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {SEAT_QUICK_STEPS.map((step) => {
              const isStepSelected = seatCount === step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => onChangeSeatCount(step)}
                  className={`relative z-10 px-3 py-1.5 rounded-xl text-xs font-bold font-google-sans tabular-nums transition-colors cursor-pointer ${
                    isStepSelected
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                  }`}
                >
                  {isStepSelected && (
                    <motion.div
                      layoutId="custom-builder-seat-tab"
                      transition={SPRING_TAB_TRANSITION}
                      className="absolute inset-0 rounded-xl bg-indigo-600 shadow-xs -z-10"
                    />
                  )}
                  <span>{step} คน</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-semibold text-slate-600 font-google-sans tabular-nums">
            {extraSeats > 0 ? (
              <span>
                สมาชิกส่วนเพิ่ม {extraSeats} บัญชี ={' '}
                <strong className="text-indigo-700">
                  +฿{extraSeatsMonthly.toLocaleString()}/เดือน
                </strong>
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">
                ✓ อยู่ในโควตาฟรี {includedBaseSeats} บัญชีแรกของ Base Core
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
