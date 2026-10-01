import React from 'react';
import { motion } from 'framer-motion';

interface CompanyChecklistBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Memoized visual layer for the "Apple VisionOS Caustic Daylight" background.
 * Never re-renders when checklist items or inputs change, guaranteeing 60fps performance.
 */
const VisionOSCausticVisuals = React.memo(
    () => {
        return (
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
            >
                {/* 1. Base Pearl & Spatial Daylight Canvas */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#f4f8ff] via-[#f8fafc] to-[#eefbf6]" />

                {/* 2. Ambient Prism Diffusion Orbs (Sky, Mint, Pearl Indigo) */}
                <motion.div
                    animate={{
                        x: [0, 35, -15, 0],
                        y: [0, -25, 20, 0],
                        scale: [1, 1.08, 0.96, 1]
                    }}
                    transition={{
                        duration: 26,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                    className="absolute -top-28 left-[6%] w-[540px] h-[540px] rounded-full bg-gradient-to-br from-sky-200/55 via-indigo-200/35 to-transparent blur-3xl"
                />

                <motion.div
                    animate={{
                        x: [0, -40, 25, 0],
                        y: [0, 30, -20, 0],
                        scale: [1, 0.94, 1.06, 1]
                    }}
                    transition={{
                        duration: 32,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                    className="absolute top-[22%] -right-24 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-emerald-200/50 via-teal-100/40 to-transparent blur-3xl"
                />

                <motion.div
                    animate={{
                        x: [0, 25, -30, 0],
                        y: [0, -20, 25, 0]
                    }}
                    transition={{
                        duration: 28,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                    className="absolute -bottom-32 left-[24%] w-[600px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-200/40 via-sky-100/45 to-emerald-100/30 blur-3xl"
                />

                {/* 3. Soft Diagonal Caustic Light Beams (ลำแสงแนวทแยงส่องผ่านกระจกปริซึม) */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Primary Pearl-Sky Diagonal Beam */}
                    <motion.div
                        animate={{
                            x: ['-4%', '4%', '-4%'],
                            opacity: [0.55, 0.8, 0.55]
                        }}
                        transition={{
                            duration: 18,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                        className="absolute -top-[35%] left-[8%] w-[38%] h-[170%] -rotate-[32deg] bg-gradient-to-r from-transparent via-white/85 to-transparent blur-2xl"
                    />

                    {/* Secondary Mint-Cyan Caustic Beam */}
                    <motion.div
                        animate={{
                            x: ['3%', '-5%', '3%'],
                            opacity: [0.4, 0.68, 0.4]
                        }}
                        transition={{
                            duration: 22,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                        className="absolute -top-[30%] left-[42%] w-[28%] h-[170%] -rotate-[32deg] bg-gradient-to-r from-transparent via-sky-100/70 to-transparent blur-2xl"
                    />

                    {/* Tertiary Soft Emerald Specular Ray */}
                    <motion.div
                        animate={{
                            x: ['-2%', '5%', '-2%'],
                            opacity: [0.35, 0.6, 0.35]
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                        className="absolute -top-[25%] right-[6%] w-[24%] h-[165%] -rotate-[32deg] bg-gradient-to-r from-transparent via-emerald-100/65 to-transparent blur-2xl"
                    />
                </div>

                {/* 4. Concentric Glass Rings — Top Right (วงแหวนเรขาคณิตโปร่งแสงมุมบนขวา) */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 90,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                    className="absolute -top-44 -right-44 w-[620px] h-[620px] flex items-center justify-center"
                >
                    <div className="absolute inset-0 rounded-full border border-white/80 bg-gradient-to-br from-white/25 via-sky-100/10 to-transparent shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)]" />
                    <div className="w-[460px] h-[460px] rounded-full border border-white/75 bg-gradient-to-tr from-white/20 via-transparent to-emerald-100/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />
                    <div className="w-[300px] h-[300px] rounded-full border border-dashed border-indigo-300/35 bg-white/15" />
                    <div className="w-[150px] h-[150px] rounded-full border border-white/90 bg-gradient-to-br from-white/40 to-transparent" />
                </motion.div>

                {/* 5. Concentric Glass Rings — Bottom Left (วงแหวนเรขาคณิตโปร่งแสงมุมล่างซ้าย) */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: 110,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                    className="absolute -bottom-56 -left-48 w-[680px] h-[680px] flex items-center justify-center"
                >
                    <div className="absolute inset-0 rounded-full border border-white/75 bg-gradient-to-tr from-white/25 via-indigo-100/10 to-transparent shadow-[inset_0_1px_2px_rgba(255,255,255,0.85)]" />
                    <div className="w-[500px] h-[500px] rounded-full border border-white/70 bg-gradient-to-br from-emerald-100/15 via-transparent to-white/25" />
                    <div className="w-[330px] h-[330px] rounded-full border border-dashed border-sky-300/35 bg-white/10" />
                </motion.div>

                {/* 6. Subtle Spatial Micro-Grid Overlay for Precision Depth */}
                <div
                    className="absolute inset-0 opacity-[0.28]"
                    style={{
                        backgroundImage:
                            'radial-gradient(rgba(99, 102, 241, 0.16) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                        maskImage:
                            'radial-gradient(ellipse 80% 70% at 50% 40%, #000 35%, transparent 100%)',
                        WebkitMaskImage:
                            'radial-gradient(ellipse 80% 70% at 50% 40%, #000 35%, transparent 100%)'
                    }}
                />

                {/* 7. Top Specular Horizon Sheen */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/60 to-transparent" />
            </div>
        );
    },
    () => true
);

export const CompanyChecklistBackground: React.FC<CompanyChecklistBackgroundProps> = ({
    children,
    className = ''
}) => {
    return (
        <div
            className={`relative min-h-full w-full flex-1 flex flex-col overflow-x-hidden ${className}`}
        >
            <VisionOSCausticVisuals />
            <div className="relative z-10 flex-1">{children}</div>
        </div>
    );
};

export default CompanyChecklistBackground;
