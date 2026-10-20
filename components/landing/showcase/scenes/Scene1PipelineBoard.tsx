import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Flame,
  GripVertical,
  Layers,
  MapPin,
  Package,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Users,
  Video,
  Youtube,
} from 'lucide-react';
import { SimulatedCursor } from '../SimulatedCursor';

interface Scene1PipelineBoardProps {
  isPaused?: boolean;
}

type PillDisplayMode = 'FULL' | 'EMOJI' | 'MINIMAL';
type CalendarMode = 'CONTENT' | 'TASK';

interface CalendarEventItem {
  id: string;
  day: number;
  title: string;
  platform: 'YouTube' | 'TikTok' | 'Reels' | 'Facebook';
  emoji: string;
  status: 'DONE' | 'EDITING' | 'SHOOTING' | 'READY';
  statusLabel: string;
  colorClass: string;
  dotColor: string;
  assignee: string;
  avatarBg: string;
  time?: string;
  location?: string;
}

interface StockCardItem {
  id: string;
  title: string;
  platform: 'YouTube' | 'TikTok' | 'Reels';
  pillar: string;
  statusLabel: string;
  badgeColor: string;
  assignee: string;
  avatarBg: string;
  isUrgent?: boolean;
}

const INITIAL_CALENDAR_EVENTS: CalendarEventItem[] = [
  {
    id: 'cal-1',
    day: 12,
    title: 'Vlog พาทัวร์ออฟฟิศใหม่',
    platform: 'YouTube',
    emoji: '🎬',
    status: 'DONE',
    statusLabel: 'เผยแพร่แล้ว',
    colorClass: 'bg-emerald-50/95 text-emerald-900 border-emerald-200/90',
    dotColor: 'bg-emerald-500',
    assignee: 'นนท์',
    avatarBg: 'bg-emerald-600',
    time: '18:00',
  },
  {
    id: 'cal-2',
    day: 13,
    title: '5 ทริคจัดแสงถ่ายคลิปด้วยงบประหยัด',
    platform: 'TikTok',
    emoji: '⚡',
    status: 'READY',
    statusLabel: 'พร้อมโพสต์',
    colorClass: 'bg-indigo-50/95 text-indigo-900 border-indigo-200/90',
    dotColor: 'bg-indigo-500',
    assignee: 'แพรว',
    avatarBg: 'bg-indigo-600',
    time: '19:30',
  },
  {
    id: 'cal-3',
    day: 15,
    title: 'เบื้องหลังกองถ่ายโฆษณาตัวใหม่',
    platform: 'Reels',
    emoji: '📸',
    status: 'SHOOTING',
    statusLabel: 'กำลังถ่ายทำ',
    colorClass: 'bg-purple-50/95 text-purple-900 border-purple-200/90',
    dotColor: 'bg-purple-500',
    assignee: 'มาร์ค',
    avatarBg: 'bg-purple-600',
    time: '10:00',
  },
  {
    id: 'cal-4',
    day: 15,
    title: 'Live Q&A อัปเดตเทรนด์คอนเทนต์ Q4',
    platform: 'TikTok',
    emoji: '🔥',
    status: 'READY',
    statusLabel: 'พร้อมไลฟ์',
    colorClass: 'bg-rose-50/95 text-rose-900 border-rose-200/90',
    dotColor: 'bg-rose-500',
    assignee: 'จูน',
    avatarBg: 'bg-rose-600',
    time: '20:00',
  },
  {
    id: 'cal-5',
    day: 16,
    title: 'สรุป Insight ยอดวิวประจำสัปดาห์',
    platform: 'Facebook',
    emoji: '📊',
    status: 'EDITING',
    statusLabel: 'รอตรวจกราฟิก',
    colorClass: 'bg-sky-50/95 text-sky-900 border-sky-200/90',
    dotColor: 'bg-sky-500',
    assignee: 'กานต์',
    avatarBg: 'bg-sky-600',
    time: '14:00',
  },
  {
    id: 'cal-6',
    day: 18,
    title: 'Teaser เปิดตัวแคมเปญปลายปี',
    platform: 'Reels',
    emoji: '✨',
    status: 'EDITING',
    statusLabel: 'กำลังตัดต่อ',
    colorClass: 'bg-amber-50/95 text-amber-900 border-amber-200/90',
    dotColor: 'bg-amber-500',
    assignee: 'แพรว',
    avatarBg: 'bg-indigo-600',
    time: '17:00',
  },
  {
    id: 'cal-7',
    day: 20,
    title: 'Podcast EP.9 สัมภาษณ์ครีเอเตอร์',
    platform: 'YouTube',
    emoji: '🎙️',
    status: 'SHOOTING',
    statusLabel: 'คิวสตูดิโอ A',
    colorClass: 'bg-violet-50/95 text-violet-900 border-violet-200/90',
    dotColor: 'bg-violet-500',
    assignee: 'นนท์',
    avatarBg: 'bg-emerald-600',
    time: '13:00',
  },
  {
    id: 'cal-8',
    day: 22,
    title: 'Short คลิปแกะกล่องไมค์ไร้สายรุ่นโปร',
    platform: 'TikTok',
    emoji: '📦',
    status: 'READY',
    statusLabel: 'พร้อมโพสต์',
    colorClass: 'bg-teal-50/95 text-teal-900 border-teal-200/90',
    dotColor: 'bg-teal-500',
    assignee: 'มาร์ค',
    avatarBg: 'bg-purple-600',
    time: '19:00',
  },
];

const INITIAL_STOCK_ITEMS: StockCardItem[] = [
  {
    id: 'stock-hero',
    title: 'EP.14 รีวิวจัดโต๊ะคอมสายโปรดักชัน 2026',
    platform: 'YouTube',
    pillar: 'Tech Setup',
    statusLabel: 'ตัดต่อเสร็จ 90%',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    assignee: 'แพรว',
    avatarBg: 'bg-indigo-600',
    isUrgent: true,
  },
  {
    id: 'stock-2',
    title: 'เปรียบเทียบเลนส์ 24-70mm ถ่ายงานอีเวนต์',
    platform: 'Reels',
    pillar: 'Gear Review',
    statusLabel: 'รอถ่าย B-Roll',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    assignee: 'มาร์ค',
    avatarBg: 'bg-purple-600',
  },
  {
    id: 'stock-3',
    title: 'รวมฮิตเบื้องหลังเทคหลุดประจำเดือน',
    platform: 'TikTok',
    pillar: 'Behind The Scene',
    statusLabel: 'ไอเดียผ่านแล้ว',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    assignee: 'จูน',
    avatarBg: 'bg-rose-600',
  },
];

const CALENDAR_DAYS = [
  { day: 11, dow: 0, isOtherMonth: false },
  { day: 12, dow: 1, isOtherMonth: false },
  { day: 13, dow: 2, isOtherMonth: false },
  { day: 14, dow: 3, isOtherMonth: false },
  { day: 15, dow: 4, isOtherMonth: false, isToday: true },
  { day: 16, dow: 5, isOtherMonth: false, isTargetDrop: true },
  { day: 17, dow: 6, isOtherMonth: false },
  { day: 18, dow: 0, isOtherMonth: false },
  { day: 19, dow: 1, isOtherMonth: false },
  { day: 20, dow: 2, isOtherMonth: false },
  { day: 21, dow: 3, isOtherMonth: false },
  { day: 22, dow: 4, isOtherMonth: false },
  { day: 23, dow: 5, isOtherMonth: false },
  { day: 24, dow: 6, isOtherMonth: false },
];

const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

/**
 * Scene 1: Authentic replica of CalendarView.tsx
 * Includes CalendarHeader, CalendarSecondaryHeader, CalendarGrid (with CalendarDayCell & CalendarTaskPill),
 * and StockSidePanel drawer on the right with simulated drag-and-drop scheduling onto Day 16.
 */
export const Scene1PipelineBoard: React.FC<Scene1PipelineBoardProps> = ({
  isPaused = false,
}) => {
  // 0: idle -> 1: hover stock card -> 2: dragging to Day 16 -> 3: dropped in Day 16 + Toast -> 4: open task popover on Day 16
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('CONTENT');
  const [pillMode, setPillMode] = useState<PillDisplayMode>('FULL');
  const [isStockOpen, setIsStockOpen] = useState<boolean>(true);
  const [activeChannelFilter, setActiveChannelFilter] = useState<string>('ALL');

  useEffect(() => {
    if (isPaused) return;

    setStep(0);
    const t1 = setTimeout(() => setStep(1), 650);
    const t2 = setTimeout(() => setStep(2), 1450);
    const t3 = setTimeout(() => setStep(3), 2850);
    const t4 = setTimeout(() => setStep(4), 3900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isPaused]);

  const isScheduled = step >= 3;
  const isDragging = step === 2;
  const isPopoverOpen = step === 4;

  // Compute cursor position across the 5-second scene
  const getCursorState = () => {
    switch (step) {
      case 0:
        return { x: '84%', y: '34%', isClicking: false, isDragging: false, label: undefined };
      case 1:
        return {
          x: '82%',
          y: '43%',
          isClicking: true,
          isDragging: false,
          label: 'คลิกจับการ์ดจาก Stock',
        };
      case 2:
        return {
          x: '51%',
          y: '48%',
          isClicking: true,
          isDragging: true,
          label: 'ลากลงตารางวันที่ 16 ต.ค.',
        };
      case 3:
        return {
          x: '50%',
          y: '51%',
          isClicking: false,
          isDragging: false,
          label: 'ลงตารางสำเร็จ!',
        };
      case 4:
        return {
          x: '49%',
          y: '53%',
          isClicking: true,
          isDragging: false,
          label: 'ดูรายละเอียดคิวงาน',
        };
    }
  };

  const cursor = getCursorState();

  // Merge initial events with the newly dropped Stock card when step >= 3
  const allEvents: CalendarEventItem[] = isScheduled
    ? [
        ...INITIAL_CALENDAR_EVENTS,
        {
          id: 'stock-hero-scheduled',
          day: 16,
          title: 'EP.14 รีวิวจัดโต๊ะคอมสายโปรดักชัน 2026',
          platform: 'YouTube',
          emoji: '🎥',
          status: 'READY',
          statusLabel: 'พร้อมโพสต์',
          colorClass: 'bg-rose-50/95 text-rose-900 border-rose-300 ring-1 ring-rose-400/50',
          dotColor: 'bg-rose-500',
          assignee: 'แพรว',
          avatarBg: 'bg-indigo-600',
          time: '19:00',
          location: 'Studio A • โต๊ะเซ็ตอัปหลัก',
        },
      ]
    : INITIAL_CALENDAR_EVENTS;

  const filteredEvents =
    activeChannelFilter === 'ALL'
      ? allEvents
      : allEvents.filter((ev) => ev.platform === activeChannelFilter);

  const stockCards = isScheduled
    ? INITIAL_STOCK_ITEMS.filter((item) => item.id !== 'stock-hero')
    : INITIAL_STOCK_ITEMS;

  const cyclePillMode = () => {
    setPillMode((prev) =>
      prev === 'FULL' ? 'EMOJI' : prev === 'EMOJI' ? 'MINIMAL' : 'FULL'
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col select-none bg-white/80 rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* =====================================================================
          ROW 1: CalendarHeader.tsx Replica
         ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-white/95 border-b border-slate-100 shrink-0">
        {/* Left: Animated Calendar Icon + Month Title + Navigation Capsule */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white p-2 rounded-xl shadow-sm shadow-indigo-200 shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight leading-none">
                  ตุลาคม 2026
                </h3>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                  Q4 Campaign
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                ตารางคอนเทนต์และคิวงานทีม • {allEvents.length} รายการในสัปดาห์นี้
              </p>
            </div>
          </div>

          {/* Month Navigation Capsule */}
          <div className="hidden lg:flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60">
            <button
              type="button"
              className="p-1 hover:bg-white rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
            >
              วันนี้
            </button>
            <button
              type="button"
              className="p-1 hover:bg-white rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Mode Switcher (Content / Task), View Switcher, Display Mode, Stock Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Segmented Mode Switcher: คอนเทนต์ | งานทั่วไป */}
          <div className="flex bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setCalendarMode('CONTENT')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                calendarMode === 'CONTENT'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>คอนเทนต์</span>
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode('TASK')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                calendarMode === 'TASK'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>งานทั่วไป</span>
            </button>
          </div>

          {/* CalendarViewSwitcher: เดือน | สัปดาห์ | วัน */}
          <div className="hidden sm:flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60 text-[10px] font-bold">
            <span className="px-2 py-1 rounded-lg bg-indigo-500 text-white shadow-2xs">
              เดือน
            </span>
            <span className="px-2 py-1 rounded-lg text-slate-500">สัปดาห์</span>
            <span className="px-2 py-1 rounded-lg text-slate-500">วัน</span>
          </div>

          {/* Pill Display Mode Toggle (FULL / EMOJI / MINIMAL) */}
          <button
            type="button"
            onClick={cyclePillMode}
            title="สลับโหมดแสดงผลการ์ดงาน (Full / Emoji / Minimal)"
            className="px-2 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all"
          >
            <span>
              {pillMode === 'FULL' ? 'T เต็ม' : pillMode === 'EMOJI' ? '😀 อีโมจิ' : '● ย่อ'}
            </span>
          </button>

          {/* Stock Drawer Toggle Button (matches CalendarHeader Stock CTA) */}
          <button
            type="button"
            onClick={() => setIsStockOpen((prev) => !prev)}
            className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 border ${
              isStockOpen
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-orange-400 shadow-xs shadow-orange-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50/50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>คลังงาน (Stock)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isStockOpen ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-700'
              }`}
            >
              {stockCards.length}
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          ROW 2: CalendarSecondaryHeader.tsx Replica (Search & Quick Filter Bar)
         ===================================================================== */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-1.5 bg-slate-50/90 border-b border-slate-200/70 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-slate-400 text-[10px] font-medium shrink-0">
            <Search className="w-3 h-3 text-slate-400" />
            <span>ค้นหาชื่อคลิป, แท็ก, ผู้รับผิดชอบ...</span>
          </div>

          <div className="h-3.5 w-px bg-slate-200 mx-0.5 shrink-0" />

          {(['ALL', 'YouTube', 'TikTok', 'Reels'] as const).map((channel) => {
            const isSelected = activeChannelFilter === channel;
            return (
              <button
                key={channel}
                type="button"
                onClick={() => setActiveChannelFilter(channel)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200/80 hover:border-indigo-300'
                }`}
              >
                {channel === 'ALL' ? 'ทุกช่องทาง' : channel}
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-500 shrink-0">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> โพสต์แล้ว
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> พร้อมโพสต์
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> กำลังตัดต่อ
          </span>
        </div>
      </div>

      {/* =====================================================================
          ROW 3: Main Split Workspace (CalendarGrid + StockSidePanel Drawer)
         ===================================================================== */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* LEFT/CENTER: CalendarGrid.tsx Replica */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* 7-Column Weekday Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 shrink-0">
            {WEEKDAYS.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-1.5 text-center text-[10px] font-bold uppercase tracking-wider ${
                  idx === 0
                    ? 'text-rose-500 bg-rose-50/40'
                    : idx === 6
                    ? 'text-indigo-500 bg-indigo-50/40'
                    : 'text-slate-500'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* 14-Day (2-Week Active Window) CalendarDayCell Grid - Strictly locked to 2 equal rows */}
          <div className="grid grid-cols-7 grid-rows-2 flex-1 min-h-0 overflow-hidden divide-x divide-y divide-slate-100">
            {CALENDAR_DAYS.map((cell) => {
              const dayEvents = filteredEvents.filter((ev) => ev.day === cell.day);
              const isDropTargetActive = cell.isTargetDrop && isDragging;
              const isDropTargetCompleted = cell.isTargetDrop && isScheduled;

              return (
                <div
                  key={cell.day}
                  className={`relative p-1.5 flex flex-col gap-1 transition-all duration-200 h-full min-h-0 overflow-hidden ${
                    isDropTargetActive
                      ? 'bg-indigo-50/90 ring-2 ring-inset ring-indigo-500 z-10'
                      : cell.isToday
                      ? 'bg-indigo-50/25 ring-1 ring-inset ring-indigo-300/70'
                      : isDropTargetCompleted
                      ? 'bg-emerald-50/20'
                      : cell.dow === 0 || cell.dow === 6
                      ? 'bg-slate-50/35 hover:bg-slate-50/80'
                      : 'bg-white hover:bg-indigo-50/15'
                  }`}
                >
                  {/* Day Number Header + Today Badge + Count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-lg transition-all ${
                          cell.isToday
                            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs'
                            : cell.dow === 0
                            ? 'text-rose-600'
                            : cell.dow === 6
                            ? 'text-indigo-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {cell.isToday && (
                        <span className="hidden xl:inline-block text-[8px] font-bold text-indigo-600 bg-indigo-100/90 px-1 py-0.2 rounded">
                          TODAY
                        </span>
                      )}
                    </div>

                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100/90 px-1.5 py-0.2 rounded-md">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Drop Target Cue when dragging over Day 16 */}
                  {isDropTargetActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-0.5 rounded-lg border border-dashed border-indigo-400 bg-indigo-100/70 px-1.5 py-1 text-[9px] font-bold text-indigo-700 text-center"
                    >
                      + วางการ์ดวันที่ 16 ต.ค.
                    </motion.div>
                  )}

                  {/* Task Pills inside Day Cell (CalendarTaskPill + TaskPillContent replica) */}
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    <AnimatePresence initial={false}>
                      {dayEvents.map((ev) => {
                        const isNewlyScheduled = ev.id === 'stock-hero-scheduled';
                        return (
                          <motion.div
                            key={ev.id}
                            layout
                            initial={
                              isNewlyScheduled
                                ? { opacity: 0, scale: 0.8, y: -10 }
                                : { opacity: 1, scale: 1 }
                            }
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 380,
                              damping: 26,
                            }}
                            className={`group/pill relative rounded-lg border px-1.5 py-1 text-left shadow-2xs transition-all cursor-pointer ${ev.colorClass}`}
                          >
                            {pillMode === 'MINIMAL' ? (
                              <div className="flex items-center gap-1">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.dotColor}`}
                                />
                                <span className="text-[9px] font-bold truncate">
                                  {ev.platform}
                                </span>
                              </div>
                            ) : pillMode === 'EMOJI' ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] shrink-0">{ev.emoji}</span>
                                <span className="text-[9px] font-bold truncate leading-tight">
                                  {ev.title}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-tight opacity-85 truncate">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.dotColor}`}
                                    />
                                    {ev.platform}
                                  </span>
                                  <span
                                    className={`w-3.5 h-3.5 rounded-full ${ev.avatarBg} text-white text-[8px] font-bold flex items-center justify-center shrink-0`}
                                  >
                                    {ev.assignee.slice(0, 1)}
                                  </span>
                                </div>
                                <div className="text-[10px] font-bold leading-snug truncate">
                                  {ev.title}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Quick Task Inspection Popover on Day 16 (Step 4) */}
                  <AnimatePresence>
                    {cell.isTargetDrop && isPopoverOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-56 bg-slate-900 text-white rounded-xl p-2.5 shadow-xl border border-slate-700 z-30 pointer-events-none"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[9px] font-bold flex items-center gap-1">
                            <Youtube className="w-2.5 h-2.5" /> YouTube Main
                          </span>
                          <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> ลงตารางแล้ว
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-white leading-snug mb-1.5">
                          EP.14 รีวิวจัดโต๊ะคอมสายโปรดักชัน 2026
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-300 pt-1.5 border-t border-slate-800">
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-indigo-400" /> 16 ต.ค. • 19:00 น.
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 text-amber-400" /> แพรว (Editor)
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: StockSidePanel.tsx / CalendarStockDrawer.tsx Replica */}
        <AnimatePresence initial={false}>
          {isStockOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 230, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="hidden sm:flex flex-col bg-slate-50/95 border-l border-slate-200/90 shrink-0 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-2.5 bg-white border-b border-slate-200/70">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-2xs">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 leading-none">
                        คลังงาน (Stock)
                      </div>
                      <div className="text-[9px] font-semibold text-slate-400 mt-0.5">
                        ลากการ์ดไปวางในวันที่ต้องการ
                      </div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                    {stockCards.length}
                  </span>
                </div>

                {/* Mini Filter Chips inside Stock Drawer */}
                <div className="flex items-center gap-1 mt-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold">
                    ทั้งหมด ({stockCards.length})
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 text-rose-500" /> ด่วน
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold">
                    รอคิวลง
                  </span>
                </div>
              </div>

              {/* Draggable Stock Card List */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                <AnimatePresence>
                  {stockCards.map((card) => {
                    const isHeroCard = card.id === 'stock-hero';
                    const isPickedUp = isHeroCard && (step === 1 || step === 2);

                    return (
                      <motion.div
                        key={card.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{
                          opacity: isHeroCard && isDragging ? 0.35 : 1,
                          scale: isHeroCard && step === 1 ? 1.02 : 1,
                          y: 0,
                        }}
                        exit={{ opacity: 0, scale: 0.9, height: 0 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                        className={`rounded-xl bg-white p-2.5 border transition-all ${
                          isPickedUp
                            ? 'border-indigo-400 ring-2 ring-indigo-500/20 shadow-md'
                            : 'border-slate-200/90 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${card.badgeColor}`}
                          >
                            <Film className="w-2.5 h-2.5" />
                            {card.platform}
                          </span>
                          <div className="flex items-center gap-1">
                            {card.isUrgent && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 text-[8px] font-bold flex items-center gap-0.5 border border-rose-200">
                                <Flame className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> ด่วน
                              </span>
                            )}
                            <GripVertical className="w-3 h-3 text-slate-300" />
                          </div>
                        </div>

                        <div className="text-[11px] font-bold text-slate-800 leading-snug mb-1.5">
                          {card.title}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            {card.pillar}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                              {card.statusLabel}
                            </span>
                            <span
                              className={`w-4 h-4 rounded-full ${card.avatarBg} text-white text-[8px] font-bold flex items-center justify-center`}
                            >
                              {card.assignee.slice(0, 1)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FLOATING DRAGGED CARD OVERLAY (Appears during Step 2 while dragging from Stock -> Day 16) */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ left: '72%', top: '34%', scale: 0.96, rotate: 0, opacity: 0 }}
              animate={{
                left: '44%',
                top: '38%',
                scale: 1.05,
                rotate: -2.5,
                opacity: 1,
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              className="pointer-events-none absolute z-30 w-52 rounded-xl bg-white p-2.5 border-2 border-indigo-500 shadow-2xl ring-4 ring-indigo-500/15"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <Youtube className="w-2.5 h-2.5" /> YouTube
                </span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[8px] font-bold">
                  16 ต.ค. 2026
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-900 leading-snug mb-1">
                EP.14 รีวิวจัดโต๊ะคอมสายโปรดักชัน 2026
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold text-indigo-600">
                <span>ปล่อยเมาส์เพื่อลงตารางงาน</span>
                <span>แพรว</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REAL-STYLE TOAST NOTIFICATION ON SCHEDULE COMPLETION (Step 3 & 4) */}
        <AnimatePresence>
          {isScheduled && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              className="pointer-events-none absolute bottom-2.5 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 text-white border border-emerald-500/40 shadow-lg"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-bold">
                ย้ายการ์ดจากคลังงาน (Stock) ลงวันที่ 16 ต.ค. เรียบร้อยแล้ว!
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Simulated Pointer Cursor */}
      <SimulatedCursor
        x={cursor.x}
        y={cursor.y}
        isClicking={cursor.isClicking}
        isDragging={cursor.isDragging}
        label={cursor.label}
      />
    </div>
  );
};
