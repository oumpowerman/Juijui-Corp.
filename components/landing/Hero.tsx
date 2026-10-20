
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { HeroVideo } from '../../services/landingService';
import { BRAND_CONFIG } from '../../config/brand.ts';
import { HeroMotionShowcase } from './showcase/HeroMotionShowcase';

interface HeroProps {
  onStart: () => void;
  onStartDemo?: () => void;
  onSeeFeatures: () => void;
  videoConfig?: HeroVideo;
}

const Hero: React.FC<HeroProps> = ({ onStart, onStartDemo, onSeeFeatures, videoConfig }) => {
  const getVideoEmbedUrl = () => {
    if (!videoConfig?.url) return null;
    const url = videoConfig.url;

    // YouTube 
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&modestbranding=1&rel=0`;
    }

    // Google Drive
    const gdMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (gdMatch) {
      return `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
    }

    return null;
  };

  const embedUrl = getVideoEmbedUrl();
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[40%] h-[60%] bg-purple-100/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[50%] bg-indigo-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-sm font-bold mb-8 border border-purple-100"
        >
          <Star className="w-4 h-4 fill-purple-600" />
          <span>Content Creator ERP ตัวแรกของไทย</span>
        </motion.div>

        <motion.h1 
          className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          จัดการ Content <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500">
            อย่างมืออาชีพ
          </span>
        </motion.h1>

        <motion.p 
          className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-12 font-medium leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
         >
          {BRAND_CONFIG.tagline} ด้วย {BRAND_CONFIG.name} <br />
          {BRAND_CONFIG.description}
         </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <button 
            onClick={onStartDemo || onStart}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2.5"
          >
            <Sparkles className="w-5 h-5" />
            <span>ทดลองเล่นระบบจริง (ฟรี 10 นาที)</span>
          </button>
          <button 
            onClick={onStart}
            className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-slate-200 hover:bg-slate-800 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
          >
            <span>เข้าสู่ระบบองค์กร</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={onSeeFeatures}
            className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-slate-700" /> ดูฟีเจอร์ทั้งหมด
          </button>
        </motion.div>

        {/* Interactive Motion Showcase Preview */}
        <motion.div 
          className="mt-16 sm:mt-20 relative p-2 sm:p-3 bg-white rounded-[2rem] shadow-2xl border border-slate-200/80 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <HeroMotionShowcase
            onStartDemo={onStartDemo || onStart}
            embedUrl={embedUrl}
          />
          
          {/* Floating tags */}
          <div className="absolute -left-5 top-1/4 bg-white px-4 py-3 rounded-xl shadow-xl border border-purple-100 hidden lg:block z-30">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="text-emerald-500 w-5 h-5" />
              <span className="text-xs font-bold text-slate-700">Sun Tracker & Calendar Sync</span>
            </div>
          </div>
          <div className="absolute -right-6 bottom-1/4 bg-white px-4 py-3 rounded-xl shadow-xl border border-indigo-100 hidden lg:block z-30">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="text-indigo-500 w-5 h-5" />
              <span className="text-xs font-bold text-slate-700">Quality Gate & RPG Rewards</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
