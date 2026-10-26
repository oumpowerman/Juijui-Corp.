import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, Rocket, CheckCircle2, Compass } from 'lucide-react';
import { FluffyCloud3D } from '../landing/sky-background/Sky3DIllustrations';

export type AuthPortalMode = 'LOGIN' | 'REGISTER_TRIAL' | 'REGISTER_JOIN';

const PORTAL_STORAGE_KEY = 'juijui_auth_portal_mode';
const PORTAL_EVENT_NAME = 'juijui-auth-portal-start';

/**
 * Stages the portal mode in sessionStorage without immediately firing the UI overlay event.
 * Useful right before an async signIn call so onAuthStateChange can pick it up immediately on success,
 * while allowing clean cancellation if credentials fail.
 */
export function stageAuthPortalTransition(mode: AuthPortalMode) {
    try {
        sessionStorage.setItem(PORTAL_STORAGE_KEY, mode);
    } catch {
        // Ignore storage errors
    }
}

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

interface PortalThemeConfig {
    passCode: string;
    passTier: string;
    title: string;
    steps: string[];
    readyText: string;
    badgeGradient: string;
    accentColor: string;
    icon: React.FC<{ className?: string }>;
}

const PORTAL_THEMES: Record<AuthPortalMode, PortalThemeConfig> = {
    LOGIN: {
        passCode: 'CREATOR PASS · STUDIO ACCESS',
        passTier: 'VERIFIED MEMBER',
        title: 'บัตรผ่านเข้าสู่อาณาจักรครีเอเตอร์',
        steps: [
            'กำลังจัดเตรียมโต๊ะทำงานของคุณ...',
            'ซิงค์ตารางงานและภารกิจครีเอเตอร์...',
            'เชื่อมต่อข้อมูลทีมและกระดานงานพร้อมใช้งาน...',
        ],
        readyText: 'พร้อมแล้ว! กำลังทะยานข้ามสะพานสายรุ้งเข้าสู่สตูดิโอ ✨',
        badgeGradient: 'from-rose-400 via-amber-300 to-sky-400',
        accentColor: '#ec4899',
        icon: Compass,
    },
    REGISTER_TRIAL: {
        passCode: 'FOUNDER PASS · PRO STUDIO TRIAL',
        passTier: '7-DAY PRO ACCESS',
        title: 'เปิดใช้งานสตูดิโอครีเอเตอร์ของคุณ',
        steps: [
            'กำลังเนรมิตพื้นที่ทำงานและฐานข้อมูลบริษัท...',
            'กำลังจัดเตรียมโต๊ะทำงานของคุณ...',
            'ซิงค์ตารางงานและภารกิจเริ่มต้นสำหรับทีม...',
        ],
        readyText: 'สตูดิโอพร้อมแล้ว! กำลังทะยานเข้าสู่อาณาจักรของคุณ ✨',
        badgeGradient: 'from-amber-400 via-rose-400 to-violet-500',
        accentColor: '#f59e0b',
        icon: Rocket,
    },
    REGISTER_JOIN: {
        passCode: 'CREATOR PASS · TEAM IDENTITY',
        passTier: 'IDENTITY VERIFIED',
        title: 'บันทึกบัตรผ่านทีมครีเอเตอร์สำเร็จ',
        steps: [
            'กำลังลงทะเบียนข้อมูลโปรไฟล์เข้าสู่องค์กร...',
            'ซิงค์สิทธิ์การเข้าถึงและข้อมูลประจำตัว...',
        ],
        readyText: 'ส่งคำขอเข้าร่วมสตูดิโอเรียบร้อยแล้ว ✨',
        badgeGradient: 'from-violet-400 via-rose-400 to-sky-400',
        accentColor: '#8b5cf6',
        icon: ShieldCheck,
    },
};

interface SkybridgeCloudItem {
    id: string;
    plane: 'back' | 'mid' | 'front' | 'canopy';
    partDirection: 'left' | 'right' | 'top';
    topClass: string;
    posClass: string;
    widthClass: string;
    baseScale: number;
    rotate: number;
    flip?: boolean;
    enterDelay: number;
    partDelay: number;
}

const SKYBRIDGE_CLOUDS: SkybridgeCloudItem[] = [
    // --- TOP CANOPY CLOUDS (Part Upward on Reveal) ---
    {
        id: 'sb-canopy-left',
        plane: 'canopy',
        partDirection: 'top',
        topClass: '-top-[14%]',
        posClass: 'left-[2%] sm:left-[8%]',
        widthClass: 'w-[70vw] sm:w-[52vw] max-w-[700px]',
        baseScale: 1.18,
        rotate: -3,
        flip: false,
        enterDelay: 0.02,
        partDelay: 0,
    },
    {
        id: 'sb-canopy-right',
        plane: 'canopy',
        partDirection: 'top',
        topClass: '-top-[12%]',
        posClass: 'right-[2%] sm:right-[8%]',
        widthClass: 'w-[70vw] sm:w-[52vw] max-w-[700px]',
        baseScale: 1.2,
        rotate: 3,
        flip: true,
        enterDelay: 0.04,
        partDelay: 0.02,
    },

    // --- LEFT CLOUD BANKS (Part Left on Reveal) ---
    {
        id: 'sb-left-back',
        plane: 'back',
        partDirection: 'left',
        topClass: 'top-[18%]',
        posClass: '-left-[16%]',
        widthClass: 'w-[76vw] sm:w-[58vw] max-w-[780px]',
        baseScale: 1.24,
        rotate: 2,
        flip: false,
        enterDelay: 0,
        partDelay: 0.03,
    },
    {
        id: 'sb-left-mid',
        plane: 'mid',
        partDirection: 'left',
        topClass: 'top-[42%]',
        posClass: '-left-[10%]',
        widthClass: 'w-[80vw] sm:w-[60vw] max-w-[800px]',
        baseScale: 1.22,
        rotate: -2,
        flip: true,
        enterDelay: 0.03,
        partDelay: 0.01,
    },
    {
        id: 'sb-left-front',
        plane: 'front',
        partDirection: 'left',
        topClass: 'top-[62%]',
        posClass: '-left-[4%] sm:left-[2%]',
        widthClass: 'w-[84vw] sm:w-[56vw] max-w-[740px]',
        baseScale: 1.16,
        rotate: 3,
        flip: false,
        enterDelay: 0.05,
        partDelay: 0,
    },

    // --- RIGHT CLOUD BANKS (Part Right on Reveal) ---
    {
        id: 'sb-right-back',
        plane: 'back',
        partDirection: 'right',
        topClass: 'top-[20%]',
        posClass: '-right-[16%]',
        widthClass: 'w-[76vw] sm:w-[58vw] max-w-[780px]',
        baseScale: 1.24,
        rotate: -2,
        flip: true,
        enterDelay: 0.01,
        partDelay: 0.03,
    },
    {
        id: 'sb-right-mid',
        plane: 'mid',
        partDirection: 'right',
        topClass: 'top-[44%]',
        posClass: '-right-[10%]',
        widthClass: 'w-[80vw] sm:w-[60vw] max-w-[800px]',
        baseScale: 1.22,
        rotate: 2,
        flip: false,
        enterDelay: 0.04,
        partDelay: 0.01,
    },
    {
        id: 'sb-right-front',
        plane: 'front',
        partDirection: 'right',
        topClass: 'top-[60%]',
        posClass: '-right-[4%] sm:right-[2%]',
        widthClass: 'w-[84vw] sm:w-[56vw] max-w-[740px]',
        baseScale: 1.16,
        rotate: -3,
        flip: true,
        enterDelay: 0.06,
        partDelay: 0,
    },
];

export const AuthPortalTransition: React.FC<AuthPortalTransitionProps> = ({
    mode,
    isWorkspaceReady = true,
    onComplete,
}) => {
    const [phase, setPhase] = useState<'CHARGE' | 'SPLIT'>('CHARGE');
    const [minChargeElapsed, setMinChargeElapsed] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // 1. Minimum skybridge & creator pass morph duration + cycling status steps + hard safety fallback
    useEffect(() => {
        if (!mode) return;
        setPhase('CHARGE');
        setMinChargeElapsed(false);
        setStepIndex(0);

        const steps = PORTAL_THEMES[mode].steps;
        const stepInterval = window.setInterval(() => {
            setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 520);

        const chargeDuration = mode === 'REGISTER_JOIN' ? 1150 : 1450;
        const timer = window.setTimeout(() => {
            setMinChargeElapsed(true);
        }, chargeDuration);

        // Hard safety fallback so the overlay can never get stuck blocking clicks
        const safetyTimer = window.setTimeout(() => {
            consumeAuthPortalTransition();
            onCompleteRef.current();
        }, 5200);

        return () => {
            window.clearInterval(stepInterval);
            window.clearTimeout(timer);
            window.clearTimeout(safetyTimer);
        };
    }, [mode]);

    // 2. Trigger SPLIT (Camera Ascent along Rainbow Skybridge & Cloud Parting) when ready
    useEffect(() => {
        if (!mode) return;
        if (minChargeElapsed && isWorkspaceReady && phase === 'CHARGE') {
            setPhase('SPLIT');
        }
    }, [mode, minChargeElapsed, isWorkspaceReady, phase]);

    // 3. Dedicated unmount timer once SPLIT phase begins
    useEffect(() => {
        if (!mode || phase !== 'SPLIT') return;
        const finishTimer = window.setTimeout(() => {
            consumeAuthPortalTransition();
            onCompleteRef.current();
        }, 780);
        return () => window.clearTimeout(finishTimer);
    }, [mode, phase]);

    if (!mode) return null;

    const theme = PORTAL_THEMES[mode];
    const ThemeIcon = theme.icon;
    const isSplitting = phase === 'SPLIT';
    const currentStatusText =
        isWorkspaceReady && minChargeElapsed
            ? theme.readyText
            : theme.steps[Math.min(stepIndex, theme.steps.length - 1)];

    return (
        <AnimatePresence>
            <motion.div
                key={`rainbow-skybridge-portal-${mode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24 }}
                className={`fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center select-none font-sans ${
                    isSplitting ? 'pointer-events-none' : 'pointer-events-auto'
                }`}
                style={{ perspective: '1400px' }}
            >
                {/* =====================================================================
                    LAYER 1: PASTEL RAINBOW SKY HORIZON VEIL (Dissolves on Ascent Reveal)
                   ===================================================================== */}
                <motion.div
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={
                        isSplitting
                            ? { opacity: 0, scale: 1.16 }
                            : { opacity: 1, scale: 1 }
                    }
                    transition={
                        isSplitting
                            ? { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const }
                            : { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const }
                    }
                    className="absolute inset-0 backdrop-blur-2xl"
                    style={{
                        background:
                            'radial-gradient(circle at 50% 32%, rgba(255,255,255,0.98) 0%, rgba(252,231,243,0.94) 28%, rgba(254,243,199,0.92) 52%, rgba(224,242,254,0.95) 78%, rgba(243,232,255,0.96) 100%)',
                        willChange: 'opacity, transform',
                    }}
                />

                {/* Warm Sunrise Horizon Halo at the End of the Skybridge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.7, y: 30 }}
                    animate={
                        isSplitting
                            ? { opacity: 0, scale: 2.6, y: -60 }
                            : { opacity: 0.95, scale: [1, 1.08, 1], y: 0 }
                    }
                    transition={
                        isSplitting
                            ? { duration: 0.74, ease: [0.22, 1, 0.36, 1] as const }
                            : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                    }
                    className="absolute top-[8%] sm:top-[10%] w-[75vw] max-w-[680px] h-[340px] rounded-full blur-3xl pointer-events-none z-10"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(251,191,36,0.45) 34%, rgba(244,114,182,0.42) 64%, rgba(56,189,248,0.35) 85%, transparent 100%)',
                        willChange: 'transform, opacity',
                    }}
                />

                {/* =====================================================================
                    LAYER 2: BACK & CANOPY 3D VOLUMETRIC CLOUDS (Behind Rainbow Bridge)
                   ===================================================================== */}
                {SKYBRIDGE_CLOUDS.filter((c) => c.plane === 'back' || c.plane === 'canopy').map((cloud) => {
                    const partTarget =
                        cloud.partDirection === 'top'
                            ? { x: '0vw', y: '-115vh', scale: cloud.baseScale * 1.18, opacity: 0 }
                            : cloud.partDirection === 'left'
                            ? { x: '-120vw', y: '0vh', scale: cloud.baseScale * 1.14, opacity: 0 }
                            : { x: '120vw', y: '0vh', scale: cloud.baseScale * 1.14, opacity: 0 };

                    const initialTarget =
                        cloud.partDirection === 'top'
                            ? { x: '0vw', y: '-35vh', scale: cloud.baseScale * 0.9, opacity: 0 }
                            : cloud.partDirection === 'left'
                            ? { x: '-45vw', y: '8vh', scale: cloud.baseScale * 0.9, opacity: 0 }
                            : { x: '45vw', y: '8vh', scale: cloud.baseScale * 0.9, opacity: 0 };

                    return (
                        <motion.div
                            key={cloud.id}
                            initial={initialTarget}
                            animate={
                                isSplitting
                                    ? partTarget
                                    : {
                                          x: '0vw',
                                          y: '0vh',
                                          scale: cloud.baseScale,
                                          opacity: 0.95,
                                          rotate: cloud.rotate,
                                      }
                            }
                            transition={
                                isSplitting
                                    ? {
                                          duration: 0.74,
                                          delay: cloud.partDelay,
                                          ease: [0.32, 0.04, 0.24, 1] as const,
                                      }
                                    : {
                                          duration: 0.52,
                                          delay: cloud.enterDelay,
                                          ease: [0.22, 1, 0.36, 1] as const,
                                      }
                            }
                            className={`absolute ${cloud.topClass} ${cloud.posClass} ${cloud.widthClass} z-10 pointer-events-none`}
                            style={{ willChange: 'transform, opacity' }}
                        >
                            <FluffyCloud3D idPrefix={cloud.id} flip={cloud.flip} />
                        </motion.div>
                    );
                })}

                {/* =====================================================================
                    LAYER 3: 3D PERSPECTIVE PASTEL RAINBOW SKYBRIDGE (Rose ➔ Amber ➔ Sky ➔ Violet)
                    Draws across the clouds during loading, then camera zooms along it on Reveal!
                   ===================================================================== */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 24 }}
                    animate={
                        isSplitting
                            ? {
                                  opacity: 0,
                                  scale: 2.35,
                                  y: 110,
                              }
                            : {
                                  opacity: 1,
                                  scale: 1,
                                  y: 0,
                              }
                    }
                    transition={
                        isSplitting
                            ? { duration: 0.76, ease: [0.22, 1, 0.36, 1] as const }
                            : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }
                    }
                    className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
                    style={{
                        transformOrigin: '50% 28%',
                        willChange: 'transform, opacity',
                    }}
                >
                    <svg
                        viewBox="0 0 1440 900"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full object-cover"
                        preserveAspectRatio="xMidYMid slice"
                    >
                        <defs>
                            {/* Primary Pastel Rainbow Gradient: Rose ➔ Amber ➔ Sky ➔ Violet */}
                            <linearGradient id="pastelRainbowSkybridge" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#fb7185" stopOpacity="0.95" />
                                <stop offset="33%" stopColor="#fbbf24" stopOpacity="0.95" />
                                <stop offset="66%" stopColor="#38bdf8" stopOpacity="0.95" />
                                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.95" />
                            </linearGradient>

                            {/* Soft Underglow Rainbow Gradient */}
                            <linearGradient id="pastelRainbowGlow" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f472b6" stopOpacity="0.55" />
                                <stop offset="35%" stopColor="#fde047" stopOpacity="0.55" />
                                <stop offset="70%" stopColor="#7dd3fc" stopOpacity="0.55" />
                                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.55" />
                            </linearGradient>

                            {/* Ascending Perspective Bridge Surface Fill */}
                            <linearGradient id="skybridgeDeckGrad" x1="50%" y1="100%" x2="50%" y2="18%">
                                <stop offset="0%" stopColor="#fb7185" stopOpacity="0.42" />
                                <stop offset="32%" stopColor="#fbbf24" stopOpacity="0.38" />
                                <stop offset="64%" stopColor="#38bdf8" stopOpacity="0.36" />
                                <stop offset="90%" stopColor="#a855f7" stopOpacity="0.28" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* 1. Wide Sweeping Pastel Rainbow Arch Aura (Blurred Backdrop Arch) */}
                        <motion.path
                            d="M -80 780 C 260 320, 520 170, 720 170 C 920 170, 1180 320, 1520 780"
                            stroke="url(#pastelRainbowGlow)"
                            strokeWidth="68"
                            strokeLinecap="round"
                            style={{ filter: 'blur(24px)' }}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.9 }}
                            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] as const }}
                        />

                        {/* 2. 3D Perspective Ascending Rainbow Skybridge Deck (From bottom foreground to top center studio portal) */}
                        <motion.path
                            d="M 240 920 Q 560 520 685 210 L 755 210 Q 880 520 1200 920 Z"
                            fill="url(#skybridgeDeckGrad)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.4, 0.85, 0.65] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* 3. Multi-Band Pastel Rainbow Arch Ribbons (Rose / Amber / Sky / Violet) */}
                        <motion.path
                            d="M -40 760 C 280 330, 525 182, 720 182 C 915 182, 1160 330, 1480 760"
                            stroke="#fb7185"
                            strokeWidth="10"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.82 }}
                            transition={{ duration: 0.88, ease: [0.22, 1, 0.36, 1] as const }}
                        />
                        <motion.path
                            d="M -40 774 C 285 344, 528 194, 720 194 C 912 194, 1155 344, 1480 774"
                            stroke="#fbbf24"
                            strokeWidth="10"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.85 }}
                            transition={{ duration: 0.92, delay: 0.04, ease: [0.22, 1, 0.36, 1] as const }}
                        />
                        <motion.path
                            d="M -40 788 C 290 358, 531 206, 720 206 C 909 206, 1150 358, 1480 788"
                            stroke="#38bdf8"
                            strokeWidth="10"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.85 }}
                            transition={{ duration: 0.96, delay: 0.08, ease: [0.22, 1, 0.36, 1] as const }}
                        />
                        <motion.path
                            d="M -40 802 C 295 372, 534 218, 720 218 C 906 218, 1145 372, 1480 802"
                            stroke="#a855f7"
                            strokeWidth="10"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.82 }}
                            transition={{ duration: 1.0, delay: 0.12, ease: [0.22, 1, 0.36, 1] as const }}
                        />

                        {/* 4. Left & Right Perspective Skybridge Guide Rails */}
                        <motion.path
                            d="M 290 910 Q 575 520 692 210"
                            stroke="url(#pastelRainbowSkybridge)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.9 }}
                            transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] as const }}
                        />
                        <motion.path
                            d="M 1150 910 Q 865 520 748 210"
                            stroke="url(#pastelRainbowSkybridge)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.9 }}
                            transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] as const }}
                        />

                        {/* 5. High-Speed Pearlescent Light Streamer Racing Up the Skybridge */}
                        <motion.path
                            d="M 720 890 L 720 205"
                            stroke="#ffffff"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="60 160"
                            initial={{ strokeDashoffset: 440, opacity: 0 }}
                            animate={{ strokeDashoffset: [440, 0], opacity: [0.2, 0.95, 0.2] }}
                            transition={{ duration: 0.95, repeat: Infinity, ease: 'linear' }}
                        />
                    </svg>
                </motion.div>

                {/* =====================================================================
                    LAYER 4: MID & FRONT 3D VOLUMETRIC CLOUDS (Weaving in front of the Skybridge)
                   ===================================================================== */}
                {SKYBRIDGE_CLOUDS.filter((c) => c.plane === 'mid' || c.plane === 'front').map((cloud) => {
                    const partTarget =
                        cloud.partDirection === 'left'
                            ? { x: '-126vw', y: '6vh', scale: cloud.baseScale * 1.18, opacity: 0 }
                            : { x: '126vw', y: '6vh', scale: cloud.baseScale * 1.18, opacity: 0 };

                    const initialTarget =
                        cloud.partDirection === 'left'
                            ? { x: '-60vw', y: '18vh', scale: cloud.baseScale * 0.88, opacity: 0 }
                            : { x: '60vw', y: '18vh', scale: cloud.baseScale * 0.88, opacity: 0 };

                    const zClass = cloud.plane === 'front' ? 'z-30' : 'z-20';

                    return (
                        <motion.div
                            key={cloud.id}
                            initial={initialTarget}
                            animate={
                                isSplitting
                                    ? partTarget
                                    : {
                                          x: '0vw',
                                          y: '0vh',
                                          scale: cloud.baseScale,
                                          opacity: 1,
                                          rotate: cloud.rotate,
                                      }
                            }
                            transition={
                                isSplitting
                                    ? {
                                          duration: 0.72,
                                          delay: cloud.partDelay,
                                          ease: [0.32, 0.04, 0.24, 1] as const,
                                      }
                                    : {
                                          duration: 0.5,
                                          delay: cloud.enterDelay,
                                          ease: [0.22, 1, 0.36, 1] as const,
                                      }
                            }
                            className={`absolute ${cloud.topClass} ${cloud.posClass} ${cloud.widthClass} ${zClass} pointer-events-none`}
                            style={{ willChange: 'transform, opacity' }}
                        >
                            <FluffyCloud3D idPrefix={cloud.id} flip={cloud.flip} />
                        </motion.div>
                    );
                })}

                {/* Center Floating Cloud Cushion directly beneath Creator Pass Badge */}
                <motion.div
                    initial={{ y: 80, scale: 0.82, opacity: 0 }}
                    animate={
                        isSplitting
                            ? { y: 180, scale: 1.55, opacity: 0 }
                            : { y: [0, -6, 0], scale: 1.06, opacity: 0.98 }
                    }
                    transition={
                        isSplitting
                            ? { duration: 0.68, ease: [0.32, 0.04, 0.24, 1] as const }
                            : {
                                  y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
                                  scale: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
                                  opacity: { duration: 0.42 },
                              }
                    }
                    className="absolute top-[52%] sm:top-[50%] w-[86vw] sm:w-[540px] max-w-[580px] z-30 pointer-events-none"
                    style={{ willChange: 'transform, opacity' }}
                >
                    <FluffyCloud3D idPrefix="creator-pass-pedestal-cloud" />
                </motion.div>

                {/* =====================================================================
                    LAYER 5: AUTH CARD ➔ "CREATOR PASS / STUDIO BADGE" MORPH STAGE
                    Shrinks from AuthPage glass card dimensions into the Studio Pass floating on clouds,
                    then rockets forward along the Rainbow Skybridge on Reveal!
                   ===================================================================== */}
                <motion.div
                    initial={{
                        width: 660,
                        height: 430,
                        borderRadius: 42,
                        scale: 0.94,
                        y: 18,
                        opacity: 0,
                        rotateX: 8,
                    }}
                    animate={
                        isSplitting
                            ? {
                                  width: 400,
                                  height: 256,
                                  borderRadius: 28,
                                  scale: 1.55,
                                  y: -115,
                                  opacity: 0,
                                  rotateX: 16,
                                  filter: 'blur(8px)',
                              }
                            : {
                                  width: 400,
                                  height: 256,
                                  borderRadius: 28,
                                  scale: 1,
                                  y: -12,
                                  opacity: 1,
                                  rotateX: 0,
                                  filter: 'blur(0px)',
                              }
                    }
                    transition={
                        isSplitting
                            ? {
                                  duration: 0.68,
                                  ease: [0.22, 1, 0.36, 1] as const,
                              }
                            : {
                                  duration: 0.54,
                                  ease: [0.22, 1, 0.36, 1] as const,
                              }
                    }
                    style={{
                        maxWidth: '92vw',
                        willChange: 'width, height, transform, opacity, filter',
                    }}
                    className="relative z-40 bg-white/88 backdrop-blur-2xl border-2 border-white shadow-[0_35px_90px_-15px_rgba(139,92,246,0.28),0_15px_35px_-10px_rgba(244,114,182,0.22),inset_0_1px_2px_rgba(255,255,255,0.98)] overflow-hidden flex flex-col justify-between p-5 sm:p-6"
                >
                    {/* Top Pastel Rainbow Holographic Rim Bar */}
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-400 via-amber-300 via-sky-400 to-violet-500" />

                    {/* Animated Iridescent Foil Shimmer Sweeping Across the Creator Pass */}
                    <motion.div
                        initial={{ x: '-120%' }}
                        animate={{ x: '220%' }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
                        className="absolute inset-y-0 w-1/2 pointer-events-none -skew-x-12"
                        style={{
                            background:
                                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.75) 50%, transparent 100%)',
                        }}
                    />

                    {/* Die-Cut Studio Lanyard Slot at Top Center */}
                    <div className="w-14 h-2 rounded-full bg-slate-200/75 border border-white shadow-inner mx-auto mb-1 shrink-0" />

                    {/* Pass Header: Emblem + Editorial Metadata + Holographic Stamp */}
                    <div className="relative z-10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <motion.div
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                                className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${theme.badgeGradient} p-[1.5px] shadow-md shrink-0`}
                            >
                                <div className="w-full h-full rounded-[14px] bg-white/95 flex items-center justify-center">
                                    <ThemeIcon className="w-5 h-5 text-slate-800" />
                                </div>
                            </motion.div>

                            <div className="min-w-0 text-left">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase truncate">
                                    <span>{theme.passCode}</span>
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate mt-0.5">
                                    {theme.title}
                                </h3>
                            </div>
                        </div>

                        {/* Holographic Studio Verification Seal */}
                        <div className="shrink-0 flex flex-col items-end">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{theme.passTier}</span>
                            </div>
                            {/* Subtle Studio Pass Barcode Lines */}
                            <div className="flex items-center gap-[2px] mt-1 opacity-40" aria-hidden="true">
                                {[2, 4, 1.5, 3, 1.5, 4, 2, 1.5, 3].map((w, i) => (
                                    <span
                                        key={i}
                                        style={{ width: `${w}px` }}
                                        className="h-3 bg-slate-700 rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pass Body: Live Step-by-Step Studio Sync Message */}
                    <div className="relative z-10 my-auto py-2 px-3.5 rounded-2xl bg-gradient-to-r from-rose-50/80 via-amber-50/70 to-sky-50/80 border border-white/90 shadow-inner flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-white shadow-sm shrink-0">
                            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentStatusText}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-xs sm:text-sm font-bold text-slate-700 truncate"
                                >
                                    {currentStatusText}
                                </motion.p>
                            </AnimatePresence>
                            <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                                เส้นทางสายรุ้งพาสเทล · กำลังเชื่อมต่อสตูดิโอจริง
                            </p>
                        </div>
                    </div>

                    {/* Pass Footer: Pastel Rainbow Skybridge Progress Track (Rose ➔ Amber ➔ Sky ➔ Violet) */}
                    <div className="relative z-10 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>SKYBRIDGE ASCENT</span>
                            <span className="text-slate-600">
                                {isWorkspaceReady && minChargeElapsed ? '100% READY' : 'SYNCING STUDIO...'}
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100/90 overflow-hidden p-[1px] border border-slate-200/60 shadow-inner">
                            <motion.div
                                initial={{ width: '18%' }}
                                animate={{
                                    width: isWorkspaceReady && minChargeElapsed ? '100%' : ['22%', '74%', '88%'],
                                }}
                                transition={
                                    isWorkspaceReady && minChargeElapsed
                                        ? { duration: 0.25, ease: 'easeOut' }
                                        : { duration: 1.4, ease: 'easeInOut' }
                                }
                                className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 via-sky-400 to-violet-500 relative"
                            >
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(244,114,182,0.9)]" />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
