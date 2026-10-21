import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    Camera,
    Video,
    Mic,
    Clapperboard,
    BatteryCharging,
    HardDrive,
    Briefcase,
    Sparkles,
    Aperture,
    Radio
} from 'lucide-react';
import { ShootRoundKey } from '../../types';
import Round1PackOutScene from './backgrounds/Round1PackOutScene';
import Round2PackBackScene from './backgrounds/Round2PackBackScene';
import Round3ReturnStorageScene from './backgrounds/Round3ReturnStorageScene';

interface ShootPackingBackgroundProps {
    currentRound: ShootRoundKey;
    progress: number; // 0 to 100
    activeViewTab: 'ACTIVE' | 'HISTORY';
    totalItems: number;
}

const sceneTransitionVariants: Variants = {
    initial: {
        opacity: 0,
        y: 8,
        scale: 0.99
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1] as const
        }
    },
    exit: {
        opacity: 0,
        y: -6,
        scale: 0.99,
        transition: {
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1] as const
        }
    }
};

// Margin-pinned floating production icons so center cards remain 100% clean and legible
const MARGIN_GEAR_ICONS = [
    { id: 'g1', Icon: Camera, top: '12%', left: '2.5%', size: 36, rotate: -12, delay: 0, duration: 7 },
    { id: 'g2', Icon: Clapperboard, top: '32%', left: '4%', size: 32, rotate: 10, delay: -2, duration: 8.5 },
    { id: 'g3', Icon: Mic, top: '55%', left: '2%', size: 34, rotate: -8, delay: -4, duration: 7.5 },
    { id: 'g4', Icon: BatteryCharging, top: '75%', left: '4.5%', size: 30, rotate: 14, delay: -1, duration: 6.5 },
    { id: 'g5', Icon: Video, top: '16%', left: '94%', size: 38, rotate: 12, delay: -3, duration: 8 },
    { id: 'g6', Icon: Aperture, top: '40%', left: '95%', size: 32, rotate: -15, delay: -5, duration: 7.2 },
    { id: 'g7', Icon: HardDrive, top: '62%', left: '93.5%', size: 30, rotate: 8, delay: -2.5, duration: 9 },
    { id: 'g8', Icon: Briefcase, top: '78%', left: '94.5%', size: 34, rotate: -10, delay: -6, duration: 7.8 },
    { id: 'g9', Icon: Radio, top: '26%', left: '91%', size: 26, rotate: 6, delay: -1.5, duration: 8.2 }
];

const CLOUDS = [
    { id: 'c1', top: '5%', scale: 0.85, duration: 38, delay: -6, opacity: 0.65 },
    { id: 'c2', top: '12%', scale: 0.65, duration: 48, delay: -22, opacity: 0.5 },
    { id: 'c3', top: '19%', scale: 0.72, duration: 42, delay: -31, opacity: 0.42 }
];

export const getRoundScenePalette = (round: ShootRoundKey, isHistory = false) => {
    if (isHistory) {
        return {
            skyGradient: 'from-slate-100 via-indigo-50/50 to-amber-50/40',
            stageGradient: 'from-slate-100/90 via-indigo-50/70 to-amber-50/70',
            orbPrimary: 'bg-indigo-200/30',
            orbSecondary: 'bg-amber-200/25',
            iconColor: 'text-indigo-500',
            sunColor: 'bg-amber-300/70 shadow-[0_0_50px_rgba(251,191,36,0.45)]',
            badgeBg: 'bg-slate-800 text-white',
            loopBarColor: 'from-indigo-500 via-sky-400 to-amber-400',
            stageLabel: 'ประวัติการออกกอง'
        };
    }

    switch (round) {
        case 'PACK_OUT':
            return {
                skyGradient: 'from-sky-200/60 via-amber-100/50 to-orange-100/60',
                stageGradient: 'from-sky-100/95 via-indigo-50/85 to-amber-100/90',
                orbPrimary: 'bg-amber-300/35',
                orbSecondary: 'bg-sky-300/35',
                iconColor: 'text-indigo-600',
                sunColor: 'bg-amber-300/90 shadow-[0_0_75px_rgba(251,191,36,0.85)]',
                badgeBg: 'bg-indigo-600 text-white',
                loopBarColor: 'from-indigo-500 via-amber-400 to-emerald-500',
                stageLabel: 'รอบที่ 1: เช้าตรู่ — เข็นกระเป๋าออกจากคลังขึ้นรถตู้กองถ่าย (วนลูป 15 วินาที)'
            };
        case 'PACK_BACK':
            return {
                skyGradient: 'from-amber-200/60 via-orange-100/60 to-rose-200/50',
                stageGradient: 'from-amber-100/95 via-orange-100/85 to-rose-100/90',
                orbPrimary: 'bg-orange-300/35',
                orbSecondary: 'bg-rose-300/35',
                iconColor: 'text-amber-600',
                sunColor: 'bg-orange-400/85 shadow-[0_0_80px_rgba(249,115,22,0.8)]',
                badgeBg: 'bg-amber-500 text-white',
                loopBarColor: 'from-amber-500 via-orange-500 to-emerald-500',
                stageLabel: 'รอบที่ 2: เลิกกอง — เคลียร์ของหน้าเซ็ตกลับขึ้นรถตู้ (วนลูป 15 วินาที)'
            };
        case 'RETURN_STORAGE':
            return {
                skyGradient: 'from-slate-100 via-teal-100/50 to-emerald-100/50',
                stageGradient: 'from-teal-100/90 via-emerald-50/85 to-slate-100/95',
                orbPrimary: 'bg-emerald-300/30',
                orbSecondary: 'bg-teal-300/35',
                iconColor: 'text-emerald-600',
                sunColor: 'bg-teal-300/80 shadow-[0_0_70px_rgba(20,184,166,0.65)]',
                badgeBg: 'bg-emerald-600 text-white',
                loopBarColor: 'from-emerald-500 via-teal-400 to-indigo-500',
                stageLabel: 'รอบที่ 3: กลับถึงออฟฟิศ — ขนอุปกรณ์จากรถตู้เข้าชั้นวางคลัง (วนลูป 15 วินาที)'
            };
    }
};

/**
 * 100% Fixed Viewport Production Background Layer
 * Portaled to document.body with `position: fixed; inset: 0; z-index: 0`
 * This guarantees it stays completely stationary on screen when scrolling the page!
 */
const ShootPackingBackground: React.FC<ShootPackingBackgroundProps> = ({
    currentRound,
    progress,
    activeViewTab,
    totalItems
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isHistory = activeViewTab === 'HISTORY';
    const clampedProgress = Math.max(0, Math.min(100, progress));
    const isReady100 = totalItems > 0 && clampedProgress === 100 && !isHistory;

    const palette = useMemo(
        () => getRoundScenePalette(currentRound, isHistory),
        [currentRound, isHistory]
    );

    if (!mounted || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            id="shoot-packing-fixed-portal-bg"
            className="fixed inset-0 pointer-events-none overflow-hidden select-none"
            style={{ zIndex: 0 }}
            aria-hidden="true"
        >
            <style>{`
                @keyframes shoot-cloud-drift {
                    0% { transform: translateX(-20vw); }
                    100% { transform: translateX(110vw); }
                }
                @keyframes shoot-gear-float {
                    0%, 100% { transform: translateY(0px) rotate(var(--gear-rot, 0deg)); }
                    50% { transform: translateY(-14px) rotate(calc(var(--gear-rot, 0deg) + 8deg)); }
                }
                @keyframes shoot-sun-breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
            `}</style>

            {/* 1. Dynamic Time-of-Day Sky Gradient */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${palette.skyGradient} transition-colors duration-700`}
            />

            {/* 2. Subtle Production Blueprint Grid */}
            <div
                className="absolute inset-0 opacity-[0.035]"
                style={{
                    backgroundImage:
                        'linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)',
                    backgroundSize: '36px 36px'
                }}
            />

            {/* 3. Soft Ambient Glow Orbs */}
            <div
                className={`absolute -top-20 -right-20 w-[460px] h-[460px] rounded-full blur-[100px] transition-colors duration-700 ${palette.orbPrimary}`}
            />
            <div
                className={`absolute bottom-0 -left-20 w-[460px] h-[460px] rounded-full blur-[110px] transition-colors duration-700 ${palette.orbSecondary}`}
            />

            {/* 4. Morning / Golden Hour / Studio Sun Orb */}
            <div
                className={`absolute top-8 right-8 sm:right-16 w-20 h-20 sm:w-28 sm:h-28 rounded-full transition-all duration-700 ${palette.sunColor}`}
                style={{ animation: 'shoot-sun-breathe 5s ease-in-out infinite' }}
            />

            {/* 5. Drifting Soft Clouds */}
            {CLOUDS.map(cloud => (
                <div
                    key={cloud.id}
                    className="absolute left-0"
                    style={{
                        top: cloud.top,
                        opacity: cloud.opacity,
                        animation: `shoot-cloud-drift ${cloud.duration}s linear infinite`,
                        animationDelay: `${cloud.delay}s`
                    }}
                >
                    <svg
                        width="180"
                        height="54"
                        viewBox="0 0 200 60"
                        fill="white"
                        style={{ transform: `scale(${cloud.scale})` }}
                    >
                        <path d="M50 30 C 50 10, 90 10, 90 30 C 90 0, 150 0, 150 30 C 180 30, 180 60, 150 60 L 50 60 C 20 60, 20 30, 50 30 Z" />
                    </svg>
                </div>
            ))}

            {/* 6. Outer-Margin Floating Production Gear Silhouettes */}
            {!isHistory &&
                MARGIN_GEAR_ICONS.map(item => (
                    <div
                        key={item.id}
                        className={`hidden sm:block absolute ${palette.iconColor} transition-colors duration-700`}
                        style={
                            {
                                top: item.top,
                                left: item.left,
                                opacity: isReady100 ? 0.25 : 0.16,
                                '--gear-rot': `${item.rotate}deg`,
                                animation: `shoot-gear-float ${item.duration}s ease-in-out infinite`,
                                animationDelay: `${item.delay}s`
                            } as React.CSSProperties
                        }
                    >
                        <item.Icon style={{ width: item.size, height: item.size }} />
                    </div>
                ))}

            {/* 7. Bottom Viewport Horizon 15-Second Looping Scene (Fixed at screen bottom, never scrolls away) */}
            <div className="absolute bottom-0 inset-x-0 h-48 sm:h-60 flex items-end justify-center overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/70 via-white/30 to-transparent" />

                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={isHistory ? 'bg-round-history' : `bg-round-${currentRound}`}
                        variants={sceneTransitionVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className={`relative w-full max-w-6xl h-full flex items-end justify-between px-4 sm:px-10 pb-1 ${
                            isHistory ? 'opacity-30' : 'opacity-75 sm:opacity-85'
                        }`}
                    >
                        {currentRound === 'PACK_OUT' && (
                            <Round1PackOutScene
                                progress={clampedProgress}
                                isReady100={isReady100}
                            />
                        )}
                        {currentRound === 'PACK_BACK' && (
                            <Round2PackBackScene
                                progress={clampedProgress}
                                isReady100={isReady100}
                            />
                        )}
                        {currentRound === 'RETURN_STORAGE' && (
                            <Round3ReturnStorageScene
                                progress={clampedProgress}
                                isReady100={isReady100}
                            />
                        )}

                        {isReady100 && (
                            <div className="absolute right-12 sm:right-24 bottom-28 flex items-center gap-3 text-emerald-500">
                                <Sparkles className="w-5 h-5 animate-bounce" />
                                <Sparkles className="w-4 h-4 animate-pulse" />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>,
        document.body
    );
};

export default ShootPackingBackground;

