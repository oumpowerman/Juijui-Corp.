import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  ArrowRight,
  Play,
  Sparkles,
  Building2,
  Lightbulb,
  CalendarCheck,
  Trophy,
  Heart,
  ThumbsUp,
  Share2,
  Bookmark,
} from 'lucide-react';
import { HeroVideo } from '../../services/landingService';
import { BRAND_CONFIG } from '../../config/brand.ts';
import { HeroMotionShowcase } from './showcase/HeroMotionShowcase';
import { SectionAuraHeader, ScrollRevealItem } from './ScrollRevealSection';

interface HeroProps {
  onStart: () => void;
  onStartDemo?: () => void;
  onStartFreeTrial?: () => void;
  onSeeFeatures: () => void;
  videoConfig?: HeroVideo;
  isZoomingOut?: boolean;
}

const QUICK_CREATOR_STEPS = [
  {
    step: '01',
    title: 'เก็บเรฟ & เขียนสคริปต์ไว',
    desc: 'บันทึกไอเดียไวรัล เขียนบท และแชร์สคริปต์ให้ทีมถ่ายทำในคลิกเดียว',
    icon: Lightbulb,
    iconBg: 'from-amber-400 to-rose-400',
    cardBorder: 'border-amber-200/80',
    reactionIcon: Bookmark,
    reactionLabel: 'Save Idea',
    reactionColor: 'text-amber-600 bg-amber-50 border-amber-200/70',
  },
  {
    step: '02',
    title: 'จัดคิวกองถ่าย & บอร์ดงานลื่นไหล',
    desc: 'ลากวางตารางโพสต์ เช็กคิวออกกองและอุปกรณ์ ไม่ตกหล่นแม้แต่คลิปเดียว',
    icon: CalendarCheck,
    iconBg: 'from-sky-400 to-indigo-500',
    cardBorder: 'border-sky-200/80',
    reactionIcon: ThumbsUp,
    reactionLabel: 'On Schedule',
    reactionColor: 'text-sky-600 bg-sky-50 border-sky-200/70',
  },
  {
    step: '03',
    title: 'ทีมสนุกด้วย XP & ดูแลหลายช่อง',
    desc: 'เปลี่ยนการส่งงานเป็นแต้มเลเวลอัป พร้อมแยกดูแลหลายแบรนด์ในบริษัทเดียว',
    icon: Trophy,
    iconBg: 'from-purple-500 to-pink-500',
    cardBorder: 'border-purple-200/80',
    reactionIcon: Heart,
    reactionLabel: 'Team Love',
    reactionColor: 'text-rose-600 bg-rose-50 border-rose-200/70',
  },
];

const Hero: React.FC<HeroProps> = ({
  onStart,
  onStartDemo,
  onStartFreeTrial,
  onSeeFeatures,
  videoConfig,
  isZoomingOut = false,
}) => {
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 90, damping: 24, mass: 0.35 });

  // Interactive scroll parallax for Hero foreground elements
  const showcaseY = useTransform(smoothScrollY, [0, 700], [0, -16]);

  const getVideoEmbedUrl = () => {
    if (!videoConfig?.url) return null;
    const url = videoConfig.url;

    const ytMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&modestbranding=1&rel=0`;
    }

    const gdMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (gdMatch) {
      return `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
    }

    return null;
  };

  const embedUrl = getVideoEmbedUrl();

  return (
    <section className="relative z-10 overflow-visible pt-28 pb-20 sm:pt-32 md:pt-36 md:pb-28 font-google-sans perspective-1000">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        {/* Hero Typography & CTA Skyward Zoom Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 1.06, y: -14, filter: 'blur(4px)' }}
          animate={
            isZoomingOut
              ? {
                  scale: 1.16,
                  y: -32,
                  opacity: 0,
                  filter: 'blur(7px)',
                }
              : {
                  scale: 1,
                  y: 0,
                  opacity: 1,
                  filter: 'blur(0px)',
                }
          }
          transition={{
            duration: isZoomingOut ? 0.46 : 0.52,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
          style={{ willChange: 'transform, opacity, filter', transformOrigin: '50% 38%' }}
        >
          {/* Hero Aura Header with White Halo Shield & Bidirectional Scroll Reveal */}
          <SectionAuraHeader
            as="h1"
            className="text-center mb-10"
            titleClassName="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.14] mb-6 tracking-tight max-w-5xl mx-auto"
            subtitleClassName="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-600 mb-10 font-medium leading-relaxed"
          badge={
            <div className="inline-flex flex-wrap items-center justify-center gap-2.5 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 mb-3 border border-purple-200/80 shadow-[0_10px_30px_-10px_rgba(139,92,246,0.24),inset_0_1px_2px_rgba(255,255,255,0.95)]">
              <span className="inline-flex items-center gap-1.5 text-rose-500">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                <span>Like</span>
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 text-sky-600">
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500">
                แพลตฟอร์มบริหารสตูดิโอและทีม Content Creator ยุคใหม่
              </span>
            </div>
          }
          title={
            <>
              เนรมิตทุกไอเดียคอนเทนต์ <br className="hidden sm:block" />
              ให้กลายเป็น{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600">
                ผลงานไวรัลที่ทีมรัก
              </span>
            </>
          }
          subtitle={
            <>
              {BRAND_CONFIG.tagline} ด้วย{' '}
              <span className="font-bold text-slate-800">{BRAND_CONFIG.name}</span>{' '}
              รวมตั้งแต่เก็บเรฟ เขียนสคริปต์ จัดคิวออกกอง ไปจนถึงระบบแต้ม XP ให้ทีมครีเอเตอร์ทำงานสนุกขึ้นทุกวัน
            </>
          }
        >
          {/* High-Dimensional Tactile Creator CTA Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={onStartFreeTrial || onStart}
              className="group relative w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 hover:from-indigo-500 hover:via-purple-500 hover:to-rose-500 text-white px-8 py-4 rounded-[1.35rem] font-bold text-base shadow-[0_20px_40px_-10px_rgba(124,58,237,0.45),0_6px_0_0_#4338ca,inset_0_1px_1px_rgba(255,255,255,0.5)] hover:-translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-base font-bold leading-tight">
                  เปิดสตูดิโอใหม่ฟรี 7 วัน (PRO)
                </span>
                <span className="block text-[11px] font-semibold text-indigo-100/90 mt-0.5">
                  ปลดล็อกครบทุกฟีเจอร์ · ไม่ต้องผูกบัตร
                </span>
              </div>
              <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onStartDemo || onStart}
              className="group relative w-full sm:w-auto bg-white/95 hover:bg-white text-slate-800 border-2 border-purple-200 hover:border-purple-300 px-7 py-4 rounded-[1.35rem] font-bold text-base shadow-[0_18px_35px_-10px_rgba(168,85,247,0.18),0_5px_0_0_#e9d5ff,inset_0_1px_2px_rgba(255,255,255,1)] hover:-translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-400 to-purple-500 text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-base font-bold text-slate-900 leading-tight">
                  ทดลองเล่น Sandbox ฟรี 10 นาที
                </span>
                <span className="block text-[11px] font-semibold text-purple-600 mt-0.5">
                  คลิกลองกดใช้งานได้ทันที · ไม่ต้องสมัคร
                </span>
              </div>
            </button>
          </div>

          {/* Secondary Friendly Action Links */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>มีรหัสทีมหรือบัญชีอยู่แล้ว? เข้าสู่ระบบองค์กร</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onSeeFeatures}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 text-sm font-bold shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
              <span>ดูฟีเจอร์ทั้งหมด</span>
            </button>
          </div>
        </SectionAuraHeader>
        </motion.div>

        {/* Secondary Foreground Cards & Showcase Skyward Zoom Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04, y: 12 }}
          animate={
            isZoomingOut
              ? {
                  scale: 1.12,
                  y: -18,
                  opacity: 0,
                  filter: 'blur(5px)',
                }
              : {
                  scale: 1,
                  y: 0,
                  opacity: 1,
                  filter: 'blur(0px)',
                }
          }
          transition={{
            duration: isZoomingOut ? 0.44 : 0.54,
            delay: isZoomingOut ? 0.02 : 0.04,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
          style={{ willChange: 'transform, opacity, filter', transformOrigin: '50% 25%' }}
        >
        {/* 1-Second Creator Workflow Cards with Bidirectional Scroll Reveal */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto text-left">
          {QUICK_CREATOR_STEPS.map((item, idx) => {
            const StepIcon = item.icon;
            const ReactionIcon = item.reactionIcon;
            return (
              <ScrollRevealItem
                key={item.step}
                index={idx}
                direction="up"
                className={`group relative rounded-3xl p-5 bg-white/88 hover:bg-white/96 backdrop-blur-xl border ${item.cardBorder} shadow-[0_16px_38px_-12px_rgba(139,92,246,0.14),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1 transition-all`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.iconBg} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 tracking-wider">
                      STEP {item.step}
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${item.reactionColor}`}
                  >
                    <ReactionIcon className="w-3.5 h-3.5" />
                    <span>{item.reactionLabel}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </ScrollRevealItem>
            );
          })}
        </div>

        {/* Interactive Motion Showcase Preview with Rainbow Glass Frame (Desktop & Tablet Only) */}
        <div className="hidden md:block">
          <ScrollRevealItem index={1} direction="scale" amount={0.12}>
            <motion.div
              style={{ y: showcaseY }}
              className="mt-12 sm:mt-16 relative p-2.5 sm:p-4 bg-gradient-to-b from-white/95 via-white/90 to-purple-50/75 backdrop-blur-2xl rounded-[2.2rem] shadow-[0_30px_80px_-20px_rgba(99,102,241,0.24),inset_0_1px_2px_rgba(255,255,255,1)] border border-white max-w-5xl mx-auto"
            >
              <HeroMotionShowcase onStartDemo={onStartDemo || onStart} embedUrl={embedUrl} />
            </motion.div>
          </ScrollRevealItem>
        </div>

        {/* Mobile-Only Clean Action Strip */}
        <div className="md:hidden mt-6 text-center">
          <button
            type="button"
            onClick={onStartDemo || onStart}
            className="w-full py-3.5 px-5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>ทดลองเล่น Sandbox ฟรี 10 นาที</span>
          </button>
        </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
