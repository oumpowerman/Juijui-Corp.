import React from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Cake, IceCream, Cookie, Cherry, Sparkles, Heart } from 'lucide-react';

interface SweetDessertSkyBackgroundProps {
  isWarping?: boolean;
}

const CottonCandyCloudSvg: React.FC<{
  className?: string;
  tint?: 'pink' | 'vanilla' | 'mint' | 'lavender';
}> = ({ className = 'w-64 h-36', tint = 'pink' }) => {
  const colorMap = {
    pink: {
      top: '#FFF5F8',
      mid: '#FFE4EE',
      bottom: '#FBCFE8',
      glow: 'rgba(244, 114, 182, 0.22)',
    },
    vanilla: {
      top: '#FFFFFF',
      mid: '#FEF9E7',
      bottom: '#FDE68A',
      glow: 'rgba(251, 191, 36, 0.18)',
    },
    mint: {
      top: '#F0FDF9',
      mid: '#CCFBF1',
      bottom: '#99F6E4',
      glow: 'rgba(45, 212, 191, 0.18)',
    },
    lavender: {
      top: '#FAF5FF',
      mid: '#F3E8FF',
      bottom: '#E9D5FF',
      glow: 'rgba(192, 132, 252, 0.2)',
    },
  }[tint];

  const gradId = `sweet-cloud-grad-${tint}`;

  return (
    <svg
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: `drop-shadow(0 18px 28px ${colorMap.glow})` }}
    >
      <defs>
        <linearGradient id={gradId} x1="160" y1="20" x2="160" y2="165" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colorMap.top} />
          <stop offset="62%" stopColor={colorMap.mid} />
          <stop offset="100%" stopColor={colorMap.bottom} />
        </linearGradient>
      </defs>
      <path
        d="M72 148H254C280.5 148 302 126.5 302 100C302 76.2 284.7 56.4 261.9 52.6C254.2 25.7 229.4 6 200 6C174.9 6 153.1 20.4 142.4 41.4C133.9 37.3 124.3 35 114 35C80.9 35 53.8 60.4 51.2 92.8C32.4 98.4 18 115.8 18 136.5C18 142.8 42.2 148 72 148Z"
        fill={`url(#${gradId})`}
      />
      {/* Sugar Sprinkles on Cloud */}
      <rect x="115" y="68" width="12" height="5" rx="2.5" transform="rotate(-18 115 68)" fill="#F472B6" opacity="0.65" />
      <rect x="188" y="54" width="12" height="5" rx="2.5" transform="rotate(22 188 54)" fill="#34D399" opacity="0.65" />
      <rect x="225" y="88" width="12" height="5" rx="2.5" transform="rotate(-12 225 88)" fill="#FBBF24" opacity="0.7" />
      <circle cx="152" cy="82" r="3.5" fill="#A78BFA" opacity="0.65" />
    </svg>
  );
};

export const SweetDessertSkyBackground: React.FC<SweetDessertSkyBackgroundProps> = ({
  isWarping = false,
}) => {
  const { scrollY } = useScroll();
  const smoothY = useSpring(scrollY, { stiffness: 80, damping: 24, mass: 0.35 });

  const cloudSlowY = useTransform(smoothY, [0, 1600], [0, -90]);
  const cloudMidY = useTransform(smoothY, [0, 1600], [0, -160]);
  const charmFastY = useTransform(smoothY, [0, 1600], [0, -230]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none select-none z-0"
    >
      {/* Layer 1: Cotton Candy & Vanilla Cream Sky Base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(155deg, #FFF0F6 0%, #FFF7FB 28%, #FFFDF7 56%, #F0FDF9 82%, #F5F3FF 100%)',
        }}
      />

      {/* Layer 2: Soft Pastel Sugar Aura Orbs */}
      <div className="absolute -top-32 -left-24 w-[34rem] h-[34rem] rounded-full bg-pink-200/45 blur-3xl" />
      <div className="absolute top-1/4 -right-28 w-[36rem] h-[36rem] rounded-full bg-amber-100/60 blur-3xl" />
      <div className="absolute -bottom-32 left-1/4 w-[38rem] h-[38rem] rounded-full bg-teal-100/50 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[28rem] rounded-full bg-purple-200/30 blur-3xl" />

      {/* Layer 3: Swirling Sugar Ribbon Waves */}
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full object-cover opacity-75"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="sugar-ribbon-1" x1="0" y1="0" x2="1440" y2="900" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F472B6" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="sugar-ribbon-2" x1="1440" y1="100" x2="0" y2="800" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C084FC" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#FB7185" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#FDE047" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          d="M-120 240 C 320 80, 680 420, 1120 210 C 1320 110, 1480 220, 1600 180"
          stroke="url(#sugar-ribbon-1)"
          strokeWidth="64"
          strokeLinecap="round"
        />
        <path
          d="M-80 650 C 380 460, 820 790, 1260 540 C 1410 460, 1520 510, 1620 490"
          stroke="url(#sugar-ribbon-2)"
          strokeWidth="48"
          strokeLinecap="round"
        />
        <path
          d="M-80 650 C 380 460, 820 790, 1260 540"
          stroke="#F472B6"
          strokeOpacity="0.28"
          strokeWidth="2.5"
          strokeDasharray="10 12"
        />
      </svg>

      {/* Layer 4: Fluffy Cotton Candy Clouds with Scroll Parallax */}
      <motion.div
        style={{ y: cloudSlowY }}
        animate={isWarping ? { scale: 1.25, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="absolute inset-0"
      >
        <motion.div
          animate={{ x: [0, 18, 0], y: [0, -10, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-14 -left-10 opacity-90"
        >
          <CottonCandyCloudSvg className="w-64 sm:w-80 h-auto" tint="pink" />
        </motion.div>

        <motion.div
          animate={{ x: [0, -22, 0], y: [0, 12, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-20 -right-12 opacity-90"
        >
          <CottonCandyCloudSvg className="w-72 sm:w-88 h-auto" tint="vanilla" />
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: cloudMidY }}
        animate={isWarping ? { scale: 1.35, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="absolute inset-0"
      >
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute bottom-16 left-6 opacity-80 hidden md:block"
        >
          <CottonCandyCloudSvg className="w-64 h-auto" tint="mint" />
        </motion.div>

        <motion.div
          animate={{ x: [0, -16, 0], y: [0, -12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute bottom-10 right-8 opacity-85 hidden md:block"
        >
          <CottonCandyCloudSvg className="w-72 h-auto" tint="lavender" />
        </motion.div>
      </motion.div>

      {/* Layer 5: Floating Patisserie Dessert Badges (Desktop Ambient World Decor) */}
      <motion.div
        style={{ y: charmFastY }}
        className="absolute inset-0 hidden xl:block"
      >
        {/* Left Floating Dessert Card */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-4, -1, -4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-44 left-7 bg-white/85 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-pink-200/80 shadow-lg shadow-pink-500/10 flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-white flex items-center justify-center shadow-xs">
            <Cake className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-rose-950">Vanilla Sponge Base</div>
            <div className="text-[10px] font-semibold text-pink-600">เค้กพื้นฐาน + ท็อปปิ้งอิสระ</div>
          </div>
        </motion.div>

        {/* Right Floating Dessert Card */}
        <motion.div
          animate={{ y: [0, 14, 0], rotate: [4, 1, 4] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute top-60 right-7 bg-white/85 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-amber-200/80 shadow-lg shadow-amber-500/10 flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white flex items-center justify-center shadow-xs">
            <IceCream className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-950">26 Sweet Flavors</div>
            <div className="text-[10px] font-semibold text-amber-600">หยิบรสชาติ Sidebar ได้ตามใจ</div>
          </div>
        </motion.div>

        {/* Bottom Left Macaron Charm */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [3, -3, 3] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          className="absolute bottom-44 left-10 w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-md border border-teal-200/80 shadow-md flex items-center justify-center text-teal-600"
        >
          <Cookie className="w-5 h-5" />
        </motion.div>

        {/* Bottom Right Cherry Charm */}
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [-5, 3, -5] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="absolute bottom-52 right-12 w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-md border border-rose-200/80 shadow-md flex items-center justify-center text-rose-500"
        >
          <Cherry className="w-5 h-5" />
        </motion.div>

        {/* Ambient Sugar Sparkles */}
        <div className="absolute top-1/3 left-16 text-pink-400/70">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="absolute top-1/2 right-16 text-amber-400/80">
          <Heart className="w-4 h-4 fill-amber-300/60" />
        </div>
      </motion.div>
    </div>
  );
};

export default SweetDessertSkyBackground;
