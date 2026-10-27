import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BRAND_CONFIG } from '../../config/brand.ts';
import {
  BarChart3,
  Calendar,
  Users,
  Video,
  Layers,
  MessageSquare,
  ShieldCheck,
  Zap,
  Heart,
  ThumbsUp,
  Share2,
  Bookmark,
  CheckCircle2,
  Sparkles,
  Play,
} from 'lucide-react';
import { SectionAuraHeader, ScrollRevealItem } from './ScrollRevealSection';
import FeatureVideoModal, { type FeatureVideoItem } from './FeatureVideoModal';

const FEATURE_LIST = [
  {
    id: 'feature-1' as const,
    title: 'Dashboard ภาพรวมสตูดิโอ',
    desc: 'ดูสถานะงานทั้งหมดแบบ Real-time ไม่ว่าจะเป็น Content ที่กำลังผลิต คิวกองถ่าย หรือยอด KPI ของทีม',
    icon: BarChart3,
    color: 'from-sky-400 to-blue-500 text-white shadow-sky-200',
    cardBorder: 'hover:border-sky-300',
    hoverBadge: 'bg-sky-50 text-sky-700 border-sky-200/90 group-hover:bg-gradient-to-r group-hover:from-sky-500 group-hover:to-blue-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-sky-200/80',
    glowRing: 'group-hover:ring-sky-200/70',
  },
  {
    id: 'feature-2' as const,
    title: 'Calendar & Content Plan',
    desc: 'วางแผนตารางโพสต์ง่ายๆ แค่ลากวาง เห็นภาพรวมความถี่ของ Content ในแต่ละแพลตฟอร์มและแต่ละช่อง',
    icon: Calendar,
    color: 'from-purple-500 to-indigo-500 text-white shadow-purple-200',
    cardBorder: 'hover:border-purple-300',
    hoverBadge: 'bg-purple-50 text-purple-700 border-purple-200/90 group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-indigo-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-purple-200/80',
    glowRing: 'group-hover:ring-purple-200/70',
  },
  {
    id: 'feature-3' as const,
    title: 'Team & Quality Gate',
    desc: 'มอบหมายงาน ตรวจงานพร้อมแจกแต้ม XP และให้ Feedback ทีมงานได้ในที่เดียว ไม่ตกหล่นในแชทส่วนตัว',
    icon: Users,
    color: 'from-rose-400 to-pink-500 text-white shadow-rose-200',
    cardBorder: 'hover:border-rose-300',
    hoverBadge: 'bg-rose-50 text-rose-700 border-rose-200/90 group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-pink-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-rose-200/80',
    glowRing: 'group-hover:ring-rose-200/70',
  },
  {
    id: 'feature-4' as const,
    title: 'Content Script & Idea Hub',
    desc: 'เก็บเรฟไวรัล เขียนบท สคริปต์ และสตอรี่บอร์ด พร้อมแชร์ลิงก์หน้ากองถ่ายแบบไม่ต้องกลัวไฟล์ทับกัน',
    icon: Video,
    color: 'from-amber-400 to-orange-500 text-white shadow-amber-200',
    cardBorder: 'hover:border-amber-300',
    hoverBadge: 'bg-amber-50 text-amber-700 border-amber-200/90 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-orange-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-amber-200/80',
    glowRing: 'group-hover:ring-amber-200/70',
  },
  {
    id: 'feature-5' as const,
    title: 'Shoot Queue & Duty Roster',
    desc: 'จัดคิวออกกอง เช็กลิสต์อุปกรณ์การถ่ายทำ และมอบหมายเวรประจำวันให้ทีมงานได้ครบจบ',
    icon: Layers,
    color: 'from-emerald-400 to-teal-500 text-white shadow-emerald-200',
    cardBorder: 'hover:border-emerald-300',
    hoverBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-emerald-200/80',
    glowRing: 'group-hover:ring-emerald-200/70',
  },
  {
    id: 'feature-6' as const,
    title: 'Multi-Brand Workspace',
    desc: 'ดูแลหลายช่อง หลายเพจ หรือหลายแบรนด์ในเครือภายใต้บริษัทเดียวกัน แยกหมวดหมู่งานชัดเจน',
    icon: MessageSquare,
    color: 'from-indigo-500 to-violet-600 text-white shadow-indigo-200',
    cardBorder: 'hover:border-indigo-300',
    hoverBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200/90 group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-violet-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-indigo-200/80',
    glowRing: 'group-hover:ring-indigo-200/70',
  },
];

interface FeaturesProps {
  featureVideos?: Record<string, { videoUrl: string; durationLabel?: string; description?: string }>;
}

const Features: React.FC<FeaturesProps> = ({ featureVideos }) => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureVideoItem | null>(null);

  const enrichedFeatures: FeatureVideoItem[] = useMemo(() => {
    const defaultMap = BRAND_CONFIG.featureShowcaseVideos || {};
    const videoConfigMap = { ...defaultMap, ...(featureVideos || {}) };

    return FEATURE_LIST.map((f) => {
      const videoMeta = videoConfigMap[f.id];
      return {
        ...f,
        videoUrl: videoMeta?.videoUrl || '',
        durationLabel: videoMeta?.durationLabel || '02:00',
        videoDescription: videoMeta?.description || f.desc,
      };
    });
  }, [featureVideos]);

  return (
    <section className="relative z-10 py-20 md:py-24 font-google-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* High-Contrast Aura Header with Soft White Halo Shield & Bidirectional Scroll Reveal */}
        <SectionAuraHeader
          badge={
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-purple-200/80 text-purple-700 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>All-in-One Creator Workflow</span>
            </div>
          }
          title={
            <>
              ฟีเจอร์ที่ออกแบบมาเพื่อ{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600">
                Content Creator
              </span>{' '}
              โดยเฉพาะ
            </>
          }
          subtitle={
            <>
              เพราะการทำคอนเทนต์ให้ปังต้องอาศัยทั้งไอเดียและทีมเวิร์กที่ลื่นไหล{' '}
              <br className="hidden md:block" />
              {BRAND_CONFIG.name} จึงรวบรวมทุกเครื่องมือที่สตูดิโอครีเอเตอร์ต้องใช้มาไว้ในที่เดียว
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURE_LIST.map((f, i) => {
            const featureVideoItem = enrichedFeatures[i];
            // จังหวะดุ๊กดิ๊กช้าๆ ตลอดเวลา แตกต่างกันเล็กน้อยในแต่ละใบให้ดูมีชีวิตชีวาเป็นธรรมชาติ
            const floatDuration = 4.8 + (i % 3) * 0.6;
            const floatDelay = i * 0.35;
            const tiltDirection = i % 2 === 0 ? 1 : -1;

            return (
              <ScrollRevealItem
                key={f.title}
                index={i}
                direction="up"
                className="h-full"
                once={true}
              >
                <motion.div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedFeature(featureVideoItem)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedFeature(featureVideoItem);
                    }
                  }}
                  animate={{
                    y: [0, -5, 0, 3, 0],
                    rotate: [
                      0,
                      -0.45 * tiltDirection,
                      0,
                      0.45 * tiltDirection,
                      0,
                    ],
                    scale: 1,
                  }}
                  transition={{
                    duration: floatDuration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: floatDelay,
                  }}
                  whileHover={{
                    y: -8,
                    rotate: 0,
                    scale: 1.015,
                    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const },
                  }}
                  whileTap={{ scale: 0.985 }}
                  className={`relative h-full flex flex-col p-7 sm:p-8 rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white/95 ${f.cardBorder} shadow-[0_18px_42px_-14px_rgba(15,23,42,0.08),inset_0_1px_2px_rgba(255,255,255,1)] hover:shadow-2xl group-hover:ring-4 ${f.glowRing} transition-shadow cursor-pointer group overflow-hidden select-none`}
                >
                  {/* Top Row: Wiggling Icon + Hover Video Badge */}
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <motion.div
                      animate={{
                        rotate: [0, -5 * tiltDirection, 5 * tiltDirection, -2.5 * tiltDirection, 0],
                      }}
                      transition={{
                        duration: 4.2 + (i % 2) * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: floatDelay * 0.5,
                      }}
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} shadow-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <f.icon className="w-7 h-7" />
                    </motion.div>

                    {/* Play Video Capsule Pill Indicator */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm transition-all duration-300 opacity-85 sm:opacity-0 sm:translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:shadow-md ${f.hoverBadge}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-current/15 flex items-center justify-center">
                        <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                      </span>
                      <span>กดดูวิดีโอ</span>
                      {featureVideoItem?.durationLabel && (
                        <span className="text-[10px] font-semibold opacity-80">
                          · {featureVideoItem.durationLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2.5 group-hover:text-indigo-950 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed font-medium text-sm sm:text-base flex-1">
                    {f.desc}
                  </p>

                  {/* Subtle Interactive Footer Hint on Hover */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100/90 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <span className="flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-current text-indigo-500 group-hover:scale-110 transition-transform" />
                      คลิกเพื่อดูคลิปตัวอย่างการใช้งาน
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      Video Demo
                    </span>
                  </div>
                </motion.div>
              </ScrollRevealItem>
            );
          })}
        </div>

        {/* Creator Studio Live Pulse Banner */}
        <ScrollRevealItem index={1} direction="scale" amount={0.15} className="mt-20">
          <div className="p-8 sm:p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-[2.5rem] text-white overflow-hidden relative shadow-2xl border border-white/10">
            <div className="w-72 h-72 bg-rose-500/20 rounded-full blur-3xl absolute -right-16 -top-16 pointer-events-none" />
            <div className="w-72 h-72 bg-sky-500/20 rounded-full blur-3xl absolute -left-16 -bottom-16 pointer-events-none" />

            <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 leading-tight">
                  ทำงานไว ลื่นไหล และปลอดภัยระดับ Enterprise
                </h2>
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-300/30 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Real-Time Creator Synergy</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        อัปเดตคิวถ่ายทำ สถานะดราฟต์ และแจ้งเตือนผ่าน LINE ทันทีแบบเรียลไทม์ ไม่มีงานหลุดคิว
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-400/15 border border-emerald-300/30 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">100% Isolated Studio Workspace</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        แยกพื้นที่ข้อมูลสคริปต์ การเงิน และรายชื่อทีมงานของแต่ละบริษัทออกจากกันอย่างปลอดภัย
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Creator Studio Card */}
              <div className="flex justify-center md:justify-end">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                  className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-6 sm:p-7 rounded-[2rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-rose-400" />
                      <span className="w-3 h-3 rounded-full bg-amber-300" />
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold text-white/90 ml-1">
                        {BRAND_CONFIG.name} · Live Studio
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      On Track
                    </span>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">EP.12 Vlog เบื้องหลังกองถ่าย</p>
                        <p className="text-[11px] font-medium text-sky-200 mt-0.5">
                          Script Ready · กำลังเข้าห้องตัดต่อ
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-300">+150 XP</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/15 text-center">
                    <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-300/25 flex flex-col items-center gap-1">
                      <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
                      <span className="text-[11px] font-bold text-white">Love</span>
                    </div>
                    <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-300/25 flex flex-col items-center gap-1">
                      <ThumbsUp className="w-4 h-4 text-sky-300 fill-sky-300" />
                      <span className="text-[11px] font-bold text-white">Like</span>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-300/25 flex flex-col items-center gap-1">
                      <Share2 className="w-4 h-4 text-purple-300" />
                      <span className="text-[11px] font-bold text-white">Share</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-300/25 flex flex-col items-center gap-1">
                      <Bookmark className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span className="text-[11px] font-bold text-white">Save</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </ScrollRevealItem>
      </div>

      {/* In-App Video Walkthrough Modal (Supports Google Drive & YouTube) */}
      <FeatureVideoModal
        isOpen={Boolean(selectedFeature)}
        onClose={() => setSelectedFeature(null)}
        activeFeature={selectedFeature}
        allFeatures={enrichedFeatures}
        onSelectFeature={(item) => setSelectedFeature(item)}
      />
    </section>
  );
};

export default Features;
