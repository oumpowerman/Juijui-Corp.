import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, Rocket, Layers } from 'lucide-react';

export type AuthPortalMode = 'LOGIN' | 'REGISTER_TRIAL' | 'REGISTER_JOIN';

const PORTAL_STORAGE_KEY = 'juijui_auth_portal_mode';
const PORTAL_EVENT_NAME = 'juijui-auth-portal-start';

export function triggerAuthPortalTransition(mode: AuthPortalMode) {
    try {
        sessionStorage.setItem(PORTAL_STORAGE_KEY, mode);
    } catch {
        // Ignore storage errors
    }
    window.dispatchEvent(new CustomEvent(PORTAL_EVENT_NAME, { detail: { mode } }));
}

export function consumeAuthPortalTransition(): AuthPortalMode | null {
    try {
        const val = sessionStorage.getItem(PORTAL_STORAGE_KEY) as AuthPortalMode | null;
        if (val) {
            sessionStorage.removeItem(PORTAL_STORAGE_KEY);
            return val;
        }
    } catch {
        // Ignore storage errors
    }
    return null;
}

export function peekAuthPortalTransition(): AuthPortalMode | null {
    try {
        return sessionStorage.getItem(PORTAL_STORAGE_KEY) as AuthPortalMode | null;
    } catch {
        return null;
    }
}

interface AuthPortalTransitionProps {
    mode: AuthPortalMode | null;
    isWorkspaceReady?: boolean;
    onComplete: () => void;
}

const PORTAL_THEMES: Record<
    AuthPortalMode,
    {
        badge: string;
        title: string;
        subtitle: string;
        primaryGlow: string;
        secondaryGlow: string;
        accentColor: string;
        curtainLeftBg: string;
        curtainRightBg: string;
        prismBorder: string;
        beamGradient: string;
        waveStops: [string, string, string];
        icon: React.FC<{ className?: string }>;
    }
> = {
    LOGIN: {
        badge: 'QUANTUM WORKSPACE LINKED',
        title: 'กำลังเปิดมิติเข้าสู่พื้นที่ทำงานของคุณ',
        subtitle: 'ซิงค์ข้อมูลโปรเจกต์ ตารางงาน และระบบประสานงานแบบเรียลไทม์...',
        primaryGlow: 'rgba(56, 189, 248, 0.55)',
        secondaryGlow: 'rgba(139, 92, 246, 0.5)',
        accentColor: '#38bdf8',
        curtainLeftBg: 'linear-gradient(135deg, #060b19 0%, #0f172a 45%, #1e1b4b 100%)',
        curtainRightBg: 'linear-gradient(225deg, #060b19 0%, #172554 45%, #2e1065 100%)',
        prismBorder: 'rgba(56, 189, 248, 0.45)',
        beamGradient: 'linear-gradient(180deg, transparent 0%, #38bdf8 25%, #e0f2fe 50%, #a855f7 75%, transparent 100%)',
        waveStops: ['#38bdf8', '#818cf8', '#c084fc'],
        icon: Layers,
    },
    REGISTER_TRIAL: {
        badge: 'ATELIER STUDIO INITIALIZED',
        title: 'กำลังเนรมิตอาณาจักรครีเอทีฟของคุณ',
        subtitle: 'จัดเตรียมฐานข้อมูลบริษัท สิทธิ์การใช้งาน Pro Trial และสตูดิโอส่วนตัว...',
        primaryGlow: 'rgba(244, 114, 182, 0.55)',
        secondaryGlow: 'rgba(251, 191, 36, 0.5)',
        accentColor: '#f472b6',
        curtainLeftBg: 'linear-gradient(135deg, #16071b 0%, #2e1065 45%, #4c0519 100%)',
        curtainRightBg: 'linear-gradient(225deg, #16071b 0%, #3b0764 45%, #78350f 100%)',
        prismBorder: 'rgba(251, 191, 36, 0.5)',
        beamGradient: 'linear-gradient(180deg, transparent 0%, #fbbf24 25%, #fffbeb 50%, #f472b6 75%, transparent 100%)',
        waveStops: ['#f472b6', '#fbbf24', '#c084fc'],
        icon: Rocket,
    },
    REGISTER_JOIN: {
        badge: 'CREATIVE IDENTITY VERIFIED',
        title: 'บันทึกข้อมูลตัวตนเข้าสู่องค์กรสำเร็จ',
        subtitle: 'กำลังส่งสัญญาณเชื่อมต่อคำขอเข้าร่วมทีมไปยังผู้ดูแลระบบ...',
        primaryGlow: 'rgba(167, 139, 250, 0.55)',
        secondaryGlow: 'rgba(244, 114, 182, 0.5)',
        accentColor: '#c084fc',
        curtainLeftBg: 'linear-gradient(135deg, #0f0720 0%, #1e1b4b 45%, #3b0764 100%)',
        curtainRightBg: 'linear-gradient(225deg, #0f0720 0%, #311042 45%, #4c1d95 100%)',
        prismBorder: 'rgba(192, 132, 252, 0.45)',
        beamGradient: 'linear-gradient(180deg, transparent 0%, #c084fc 25%, #fae8ff 50%, #f472b6 75%, transparent 100%)',
        waveStops: ['#c084fc', '#f472b6', '#38bdf8'],
        icon: ShieldCheck,
    },
};

const PRISM_SHARDS = [
    { id: 1, side: 'left', top: '14%', offset: '18%', w: 140, h: 220, rot: -18, delay: 0.04 },
    { id: 2, side: 'left', top: '52%', offset: '10%', w: 180, h: 260, rot: 12, delay: 0.08 },
    { id: 3, side: 'left', top: '76%', offset: '24%', w: 130, h: 190, rot: -8, delay: 0.12 },
    { id: 4, side: 'right', top: '16%', offset: '16%', w: 165, h: 240, rot: 16, delay: 0.05 },
    { id: 5, side: 'right', top: '48%', offset: '12%', w: 190, h: 250, rot: -14, delay: 0.09 },
    { id: 6, side: 'right', top: '78%', offset: '22%', w: 135, h: 200, rot: 10, delay: 0.13 },
] as const;

export const AuthPortalTransition: React.FC<AuthPortalTransitionProps> = ({
    mode,
    isWorkspaceReady = true,
    onComplete,
}) => {
    const [phase, setPhase] = useState<'CHARGE' | 'SPLIT'>('CHARGE');
    const [minChargeElapsed, setMinChargeElapsed] = useState(false);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // 1. Minimum charge timer on mode start + hard safety fallback
    useEffect(() => {
        if (!mode) return;
        setPhase('CHARGE');
        setMinChargeElapsed(false);

        const chargeDuration = mode === 'REGISTER_JOIN' ? 950 : 1150;
        const timer = window.setTimeout(() => {
            setMinChargeElapsed(true);
        }, chargeDuration);

        // Hard safety fallback so the overlay can never get stuck blocking clicks
        const safetyTimer = window.setTimeout(() => {
            consumeAuthPortalTransition();
            onCompleteRef.current();
        }, 4200);

        return () => {
            window.clearTimeout(timer);
            window.clearTimeout(safetyTimer);
        };
    }, [mode]);

    // 2. Trigger SPLIT phase when both charge timer and workspace are ready
    useEffect(() => {
        if (!mode) return;
        if (minChargeElapsed && isWorkspaceReady && phase === 'CHARGE') {
            setPhase('SPLIT');
        }
    }, [mode, minChargeElapsed, isWorkspaceReady, phase]);

    // 3. Dedicated unmount timer once SPLIT phase begins (not cancelled by phase transition!)
    useEffect(() => {
        if (!mode || phase !== 'SPLIT') return;
        const finishTimer = window.setTimeout(() => {
            consumeAuthPortalTransition();
            onCompleteRef.current();
        }, 900);
        return () => window.clearTimeout(finishTimer);
    }, [mode, phase]);

    if (!mode) return null;

    const theme = PORTAL_THEMES[mode];
    const ThemeIcon = theme.icon;
    const isSplitting = phase === 'SPLIT';

    return (
        <AnimatePresence>
            <motion.div
                key={`portal-${mode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center select-none ${
                    isSplitting ? 'pointer-events-none' : 'pointer-events-auto'
                }`}
                style={{ perspective: '1400px' }}
            >
                {/* LEFT 3D CRYSTAL PRISM CURTAIN */}
                <motion.div
                    initial={{ x: '-100%', rotateY: 18 }}
                    animate={
                        isSplitting
                            ? {
                                  x: '-106%',
                                  rotateY: -28,
                                  scale: 1.04,
                                  opacity: 0.15,
                              }
                            : {
                                  x: '0%',
                                  rotateY: 0,
                                  scale: 1,
                                  opacity: 1,
                              }
                    }
                    transition={
                        isSplitting
                            ? { duration: 0.88, ease: [0.22, 1, 0.36, 1] as const }
                            : { duration: 0.52, ease: [0.16, 1, 0.3, 1] as const }
                    }
                    style={{
                        background: theme.curtainLeftBg,
                        transformOrigin: 'left center',
                        willChange: 'transform, opacity',
                    }}
                    className="absolute inset-y-0 left-0 w-[50.5%] overflow-hidden border-r border-white/20 shadow-[30px_0_90px_rgba(0,0,0,0.65)]"
                >
                    {/* Diagonal Crystal Facet Lines */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: `linear-gradient(125deg, transparent 20%, rgba(255,255,255,0.12) 21%, transparent 22%, transparent 48%, ${theme.primaryGlow} 49%, transparent 51%, transparent 76%, rgba(255,255,255,0.08) 77%, transparent 79%)`,
                        }}
                    />

                    {/* Aurora glow inside left crystal */}
                    <motion.div
                        animate={{
                            scale: [1, 1.18, 1],
                            opacity: [0.35, 0.65, 0.35],
                        }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            background: `radial-gradient(circle at 85% 50%, ${theme.primaryGlow}, transparent 68%)`,
                        }}
                        className="absolute inset-0"
                    />

                    {/* Refracted Crystal Facet Shards (Left) */}
                    {PRISM_SHARDS.filter((s) => s.side === 'left').map((shard) => (
                        <motion.div
                            key={shard.id}
                            initial={{ opacity: 0, scale: 0.7, rotate: shard.rot - 10 }}
                            animate={
                                isSplitting
                                    ? {
                                          opacity: 0,
                                          x: -140,
                                          scale: 1.25,
                                          rotate: shard.rot - 25,
                                      }
                                    : {
                                          opacity: 0.65,
                                          x: 0,
                                          scale: 1,
                                          rotate: shard.rot,
                                      }
                            }
                            transition={{
                                duration: 0.65,
                                delay: shard.delay,
                                ease: [0.16, 1, 0.3, 1] as const,
                            }}
                            style={{
                                top: shard.top,
                                right: shard.offset,
                                width: shard.w,
                                height: shard.h,
                                borderColor: theme.prismBorder,
                                clipPath: 'polygon(18% 0%, 100% 12%, 84% 100%, 0% 82%)',
                            }}
                            className="absolute bg-gradient-to-br from-white/20 via-white/5 to-transparent backdrop-blur-xl border shadow-[inset_0_1px_2px_rgba(255,255,255,0.45)]"
                        />
                    ))}

                    {/* Glowing Crystal Seam Edge on Right Border */}
                    <div
                        className="absolute inset-y-0 right-0 w-[3px]"
                        style={{ background: theme.beamGradient }}
                    />
                </motion.div>

                {/* RIGHT 3D CRYSTAL PRISM CURTAIN */}
                <motion.div
                    initial={{ x: '100%', rotateY: -18 }}
                    animate={
                        isSplitting
                            ? {
                                  x: '106%',
                                  rotateY: 28,
                                  scale: 1.04,
                                  opacity: 0.15,
                              }
                            : {
                                  x: '0%',
                                  rotateY: 0,
                                  scale: 1,
                                  opacity: 1,
                              }
                    }
                    transition={
                        isSplitting
                            ? { duration: 0.88, ease: [0.22, 1, 0.36, 1] as const }
                            : { duration: 0.52, ease: [0.16, 1, 0.3, 1] as const }
                    }
                    style={{
                        background: theme.curtainRightBg,
                        transformOrigin: 'right center',
                        willChange: 'transform, opacity',
                    }}
                    className="absolute inset-y-0 right-0 w-[50.5%] overflow-hidden border-l border-white/20 shadow-[-30px_0_90px_rgba(0,0,0,0.65)]"
                >
                    {/* Diagonal Crystal Facet Lines */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: `linear-gradient(235deg, transparent 20%, rgba(255,255,255,0.12) 21%, transparent 22%, transparent 48%, ${theme.secondaryGlow} 49%, transparent 51%, transparent 76%, rgba(255,255,255,0.08) 77%, transparent 79%)`,
                        }}
                    />

                    {/* Aurora glow inside right crystal */}
                    <motion.div
                        animate={{
                            scale: [1, 1.18, 1],
                            opacity: [0.35, 0.65, 0.35],
                        }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                        style={{
                            background: `radial-gradient(circle at 15% 50%, ${theme.secondaryGlow}, transparent 68%)`,
                        }}
                        className="absolute inset-0"
                    />

                    {/* Refracted Crystal Facet Shards (Right) */}
                    {PRISM_SHARDS.filter((s) => s.side === 'right').map((shard) => (
                        <motion.div
                            key={shard.id}
                            initial={{ opacity: 0, scale: 0.7, rotate: shard.rot + 10 }}
                            animate={
                                isSplitting
                                    ? {
                                          opacity: 0,
                                          x: 140,
                                          scale: 1.25,
                                          rotate: shard.rot + 25,
                                      }
                                    : {
                                          opacity: 0.65,
                                          x: 0,
                                          scale: 1,
                                          rotate: shard.rot,
                                      }
                            }
                            transition={{
                                duration: 0.65,
                                delay: shard.delay,
                                ease: [0.16, 1, 0.3, 1] as const,
                            }}
                            style={{
                                top: shard.top,
                                left: shard.offset,
                                width: shard.w,
                                height: shard.h,
                                borderColor: theme.prismBorder,
                                clipPath: 'polygon(0% 14%, 86% 0%, 100% 84%, 14% 100%)',
                            }}
                            className="absolute bg-gradient-to-bl from-white/20 via-white/5 to-transparent backdrop-blur-xl border shadow-[inset_0_1px_2px_rgba(255,255,255,0.45)]"
                        />
                    ))}

                    {/* Glowing Crystal Seam Edge on Left Border */}
                    <div
                        className="absolute inset-y-0 left-0 w-[3px]"
                        style={{ background: theme.beamGradient }}
                    />
                </motion.div>

                {/* AURORA ENERGY WAVES (SVG Silk Waves across center horizon) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={
                        isSplitting
                            ? { opacity: 0, scale: 1.35 }
                            : { opacity: 0.85, scale: 1 }
                    }
                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] as const }}
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                >
                    <svg
                        viewBox="0 0 1440 600"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full object-cover opacity-70"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="portalAuroraGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={theme.waveStops[0]} stopOpacity="0" />
                                <stop offset="30%" stopColor={theme.waveStops[0]} stopOpacity="0.65" />
                                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
                                <stop offset="70%" stopColor={theme.waveStops[1]} stopOpacity="0.65" />
                                <stop offset="100%" stopColor={theme.waveStops[2]} stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="portalAuroraGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
                                <stop offset="0%" stopColor={theme.waveStops[2]} stopOpacity="0" />
                                <stop offset="35%" stopColor={theme.waveStops[1]} stopOpacity="0.45" />
                                <stop offset="65%" stopColor={theme.waveStops[0]} stopOpacity="0.45" />
                                <stop offset="100%" stopColor={theme.waveStops[2]} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <motion.path
                            d="M-100 300 C 280 140, 560 460, 920 260 C 1180 120, 1340 380, 1540 280"
                            stroke="url(#portalAuroraGrad1)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: [0.3, 0.95, 0.5] }}
                            transition={{ duration: 1.1, ease: 'easeInOut' }}
                        />
                        <motion.path
                            d="M-100 340 C 340 480, 640 120, 1020 340 C 1240 460, 1380 200, 1540 320"
                            stroke="url(#portalAuroraGrad2)"
                            strokeWidth="18"
                            strokeLinecap="round"
                            style={{ filter: 'blur(12px)' }}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: [0.2, 0.7, 0.35] }}
                            transition={{ duration: 1.25, ease: 'easeInOut', delay: 0.08 }}
                        />
                    </svg>
                </motion.div>

                {/* VERTICAL LASER PRISM SEAM & EXPANDING SHOCKWAVE RINGS */}
                <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={
                        isSplitting
                            ? { scaleY: 1.4, scaleX: 18, opacity: 0 }
                            : { scaleY: 1, scaleX: 1, opacity: 1 }
                    }
                    transition={
                        isSplitting
                            ? { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const }
                            : { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }
                    }
                    style={{ background: theme.beamGradient }}
                    className="absolute inset-y-0 w-[6px] z-10 shadow-[0_0_50px_12px_rgba(255,255,255,0.85)]"
                />

                {/* AURORA SHOCKWAVE RINGS */}
                {[0, 1, 2].map((ringIndex) => (
                    <motion.div
                        key={ringIndex}
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={
                            isSplitting
                                ? { scale: 3.2 + ringIndex * 0.6, opacity: 0 }
                                : {
                                      scale: [0.7 + ringIndex * 0.2, 1.35 + ringIndex * 0.25],
                                      opacity: [0.75, 0],
                                  }
                        }
                        transition={
                            isSplitting
                                ? { duration: 0.75, ease: 'easeOut' }
                                : {
                                      duration: 1.8,
                                      repeat: Infinity,
                                      delay: ringIndex * 0.35,
                                      ease: 'easeOut',
                                  }
                        }
                        style={{
                            borderColor: theme.prismBorder,
                            boxShadow: `0 0 60px ${theme.primaryGlow}, inset 0 0 40px ${theme.secondaryGlow}`,
                        }}
                        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 pointer-events-none z-10"
                    />
                ))}

                {/* CENTER 3D CRYSTAL CORE & STATUS HUD */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.82, y: 12 }}
                    animate={
                        isSplitting
                            ? { opacity: 0, scale: 1.35, filter: 'blur(12px)' }
                            : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
                    }
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                    className="relative z-20 flex flex-col items-center text-center px-6 max-w-lg"
                >
                    {/* Rotating 3D Octagonal Crystal Core */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-6 flex items-center justify-center">
                        {/* Outer rotating orbital ring */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                            style={{ borderColor: theme.prismBorder }}
                            className="absolute inset-0 rounded-full border border-dashed"
                        />
                        {/* Counter-rotating diamond prism frame */}
                        <motion.div
                            animate={{ rotate: -360, scale: [1, 1.06, 1] }}
                            transition={{
                                rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
                                scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                            }}
                            style={{
                                borderColor: theme.prismBorder,
                                boxShadow: `0 0 45px ${theme.primaryGlow}`,
                            }}
                            className="absolute inset-3 rounded-3xl rotate-45 bg-white/10 backdrop-blur-2xl border"
                        />
                        {/* Inner Crystal Badge */}
                        <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-white/30 via-white/10 to-transparent backdrop-blur-2xl border border-white/40 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.35)]"
                        >
                            <ThemeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                            <Sparkles
                                className="w-4 h-4 text-amber-200 absolute -top-1.5 -right-1.5 animate-pulse"
                            />
                        </motion.div>
                    </div>

                    {/* Sci-Fi Prism Status Pill */}
                    <div
                        style={{ borderColor: theme.prismBorder }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border text-[11px] font-bold tracking-[0.22em] text-white uppercase mb-3 shadow-lg"
                    >
                        <span
                            style={{ backgroundColor: theme.accentColor }}
                            className="w-2 h-2 rounded-full animate-ping"
                        />
                        <span>{theme.badge}</span>
                    </div>

                    {/* Main Title */}
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] mb-2">
                        {theme.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm font-medium text-white/80 max-w-md leading-relaxed">
                        {theme.subtitle}
                    </p>

                    {/* Refractive Light Progress Bar */}
                    <div className="w-56 sm:w-64 h-1.5 rounded-full bg-white/10 overflow-hidden mt-6 border border-white/15 p-0.5">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{
                                duration: 1.1,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            style={{
                                background: `linear-gradient(90deg, transparent, ${theme.accentColor}, #ffffff, transparent)`,
                            }}
                            className="w-full h-full rounded-full"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
