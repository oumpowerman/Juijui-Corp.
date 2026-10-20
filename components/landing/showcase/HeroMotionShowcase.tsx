import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  Film,
  Layers,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import { BRAND_CONFIG } from '../../../config/brand';
import { Scene1PipelineBoard } from './scenes/Scene1PipelineBoard';
import { Scene2QualityGamification } from './scenes/Scene2QualityGamification';
import { Scene3SmartCalendar } from './scenes/Scene3SmartCalendar';
import { Scene4ExecutiveAnalytics } from './scenes/Scene4ExecutiveAnalytics';

interface HeroMotionShowcaseProps {
  onStartDemo?: () => void;
  embedUrl?: string | null;
}

interface SceneMeta {
  id: number;
  shortTitle: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  badgeColor: string;
}

const SCENES: SceneMeta[] = [
  {
    id: 0,
    shortTitle: '1. ปฏิทิน & คลังงาน',
    subtitle: 'ลากงานจาก Stock ลงวันที่จริง',
    icon: Calendar,
    badgeColor: 'from-indigo-600 to-purple-600',
  },
  {
    id: 1,
    shortTitle: '2. Quality Gate & XP',
    subtitle: 'ตรวจงาน & แจกแต้มเลเวลอัป',
    icon: ShieldCheck,
    badgeColor: 'from-purple-600 to-pink-600',
  },
  {
    id: 2,
    shortTitle: '3. Smart Calendar',
    subtitle: 'ตารางกองถ่าย & เช็กอุปกรณ์',
    icon: Layers,
    badgeColor: 'from-amber-500 to-orange-500',
  },
  {
    id: 3,
    shortTitle: '4. Executive KPI',
    subtitle: 'กราฟสรุปผลงานทีม On Track',
    icon: BarChart3,
    badgeColor: 'from-emerald-600 to-teal-600',
  },
];

const SCENE_DURATION_MS = 5600; // 5.6 seconds per scene for full 4-step choreography

const sceneTransitionVariants: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

export const HeroMotionShowcase: React.FC<HeroMotionShowcaseProps> = ({
  onStartDemo,
  embedUrl,
}) => {
  const [activeScene, setActiveScene] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'MOTION' | 'VIDEO'>('MOTION');
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  // Auto-advance timer for the 4-scene loop
  useEffect(() => {
    if (isPaused || viewMode === 'VIDEO') return;

    const tickMs = 50;
    const timer = setInterval(() => {
      setElapsedMs((prev) => {
        if (prev + tickMs >= SCENE_DURATION_MS) {
          setActiveScene((current) => (current + 1) % SCENES.length);
          return 0;
        }
        return prev + tickMs;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [isPaused, viewMode]);

  const handleSelectScene = (index: number) => {
    setViewMode('MOTION');
    setActiveScene(index);
    setElapsedMs(0);
  };

  const progressPercent = Math.min(100, (elapsedMs / SCENE_DURATION_MS) * 100);

  return (
    <div className="w-full flex flex-col bg-slate-900 rounded-[1.5rem] overflow-hidden border border-slate-200/80 shadow-inner">
      {/* 1. Simulated MacOS / SaaS App Window Topbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/90" />
            <span className="w-3 h-3 rounded-full bg-amber-400/90" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
          </div>
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-slate-200">
              {BRAND_CONFIG.name} • Interactive Product Tour
            </span>
          </div>
        </div>

        {/* Top-Right Controls: Play/Pause, Video Switcher (if embedUrl exists), and Quick Demo Launch */}
        <div className="flex items-center gap-2">
          {viewMode === 'MOTION' && (
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
              title={isPaused ? 'เล่นอนิเมชันต่อ' : 'หยุดดูฉากนี้ชั่วคราว'}
            >
              {isPaused ? (
                <>
                  <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                  <span>เล่นต่อ</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 text-amber-300" />
                  <span>หยุดดู</span>
                </>
              )}
            </button>
          )}

          {embedUrl && (
            <button
              type="button"
              onClick={() =>
                setViewMode((prev) => (prev === 'MOTION' ? 'VIDEO' : 'MOTION'))
              }
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-colors ${
                viewMode === 'VIDEO'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>
                {viewMode === 'VIDEO'
                  ? 'กลับสู่โหมด Interactive'
                  : 'ดูวิดีโอแนะนำ'}
              </span>
            </button>
          )}

          {onStartDemo && (
            <button
              type="button"
              onClick={onStartDemo}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3 h-3" />
              <span>ลองกดเล่นเอง (ฟรี 10 นาที)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Viewport Canvas (Locked Height App Shell so frame never stretches/shrinks) */}
      <div className="relative bg-slate-50 h-[450px] sm:h-[490px] overflow-hidden flex">
        {viewMode === 'VIDEO' && embedUrl ? (
          <div className="relative w-full h-full bg-black">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={`${BRAND_CONFIG.name} Video Preview`}
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-1 min-h-0 overflow-hidden">
            {/* Simulated Mini App Sidebar (Desktop/Tablet) */}
            <div className="hidden md:flex w-44 bg-white border-r border-slate-200/80 p-3 flex-col justify-between text-left shrink-0">
              <div>
                <div className="flex items-center gap-2 px-2 py-1.5 mb-3 rounded-xl bg-slate-900 text-white">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-xs">
                    JJ
                  </div>
                  <div className="truncate">
                    <div className="text-[11px] font-bold leading-tight truncate">
                      Juijui Studio
                    </div>
                    <div className="text-[9px] text-emerald-400 font-semibold">
                      PRO WORKSPACE
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {SCENES.map((scene, index) => {
                    const Icon = scene.icon;
                    const isActive = activeScene === index;
                    return (
                      <button
                        key={scene.id}
                        type="button"
                        onClick={() => handleSelectScene(index)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-indigo-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">
                          {scene.shortTitle.replace(/^\d+\.\s*/, '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-900 mb-0.5">
                  <Film className="w-3 h-3 text-indigo-600" />
                  <span>Auto-Play Storyline</span>
                </div>
                <p className="text-[10px] text-slate-600 font-medium leading-snug">
                  จำลองการทำงานจริง 4 ขั้นตอนตั้งแต่ต้นจนจบ
                </p>
              </div>
            </div>

            {/* Scene Stage */}
            <div className="flex-1 h-full min-h-0 p-3 sm:p-4 overflow-hidden relative flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScene}
                  variants={sceneTransitionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden"
                >
                  {activeScene === 0 && (
                    <Scene1PipelineBoard isPaused={isPaused} />
                  )}
                  {activeScene === 1 && (
                    <Scene2QualityGamification isPaused={isPaused} />
                  )}
                  {activeScene === 2 && (
                    <Scene3SmartCalendar isPaused={isPaused} />
                  )}
                  {activeScene === 3 && (
                    <Scene4ExecutiveAnalytics isPaused={isPaused} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* 3. Interactive Bottom Scene Selector & Progress Timeline Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-slate-900 border-t border-slate-800">
        {SCENES.map((scene, index) => {
          const Icon = scene.icon;
          const isCurrent = activeScene === index && viewMode === 'MOTION';
          const isCompleted = activeScene > index && viewMode === 'MOTION';

          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => handleSelectScene(index)}
              className={`group relative overflow-hidden rounded-xl px-3 py-2 text-left transition-all border ${
                isCurrent
                  ? 'bg-slate-800 border-indigo-500/60 shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-800/70 border-slate-800'
              }`}
            >
              {/* Progress Bar Fill at Bottom of Active Tab */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                <div
                  className={`h-full bg-gradient-to-r ${scene.badgeColor} transition-all duration-75`}
                  style={{
                    width: isCurrent
                      ? `${progressPercent}%`
                      : isCompleted
                      ? '100%'
                      : '0%',
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? `bg-gradient-to-br ${scene.badgeColor} text-white`
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-xs font-bold truncate ${
                      isCurrent ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {scene.shortTitle}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 truncate">
                    {scene.subtitle}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
