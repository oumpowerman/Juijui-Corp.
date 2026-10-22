import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

interface SidebarDutyEdgeMascotProps {
    currentView: string;
    isCollapsed: boolean;
    isDarkTheme?: boolean;
}

const mascotVariants: Variants = {
    initial: {
        opacity: 0,
        x: -16,
        scale: 0.85
    },
    animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1] as const
        }
    },
    exit: {
        opacity: 0,
        x: -12,
        scale: 0.85,
        transition: {
            duration: 0.25,
            ease: 'easeOut'
        }
    }
};

const speechBubbleVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
        x: -4,
        y: 6
    },
    visible: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25
        }
    }
};

const DIALOGUES = [
    'เช็ดกระจกขอบจอให้เงาวับครับ! ✨',
    'ยินดีต้อนรับสู่ห้องตารางเวร 🧹',
    'เวรวันนี้สะอาดเอี่ยม 100% 🧼',
    'อย่าลืมตรวจสอบเวรประจำสัปดาห์นะ!'
];

export const SidebarDutyEdgeMascot: React.FC<SidebarDutyEdgeMascotProps> = ({
    currentView,
    isCollapsed,
    isDarkTheme = false
}) => {
    const isDutyView = currentView === 'DUTY';
    const [isHovered, setIsHovered] = useState(false);
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [isBlinking, setIsBlinking] = useState(false);

    // Periodic blinking animation
    useEffect(() => {
        if (!isDutyView) return;
        const interval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 180);
        }, 3200);
        return () => clearInterval(interval);
    }, [isDutyView]);

    const handleClick = () => {
        setDialogueIndex((prev) => (prev + 1) % DIALOGUES.length);
        setIsHovered(true);
    };

    return (
        <AnimatePresence>
            {isDutyView && (
                <motion.div
                    key="sidebar-duty-edge-mascot"
                    variants={mascotVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={handleClick}
                    className="absolute -right-5 bottom-28 z-40 select-none cursor-pointer group"
                    title="เจ้าหน้าที่เวรทำความสะอาดประจำขอบจอ"
                >
                    {/* Speech Bubble Tooltip */}
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                variants={speechBubbleVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className="absolute left-full ml-2.5 -top-3 z-50 pointer-events-none whitespace-nowrap"
                            >
                                <div className="relative px-3 py-1.5 rounded-2xl bg-indigo-900 text-white dark:bg-white dark:text-gray-900 shadow-xl border border-indigo-700/50 dark:border-gray-200 text-xs font-semibold flex items-center gap-1.5">
                                    <span className="text-amber-300 dark:text-amber-500 text-xs">✨</span>
                                    <span>{DIALOGUES[dialogueIndex]}</span>

                                    {/* Arrow pointing left to mascot */}
                                    <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-indigo-900 dark:border-r-white" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Edge Clinging Mascot Main Body */}
                    <div className="relative w-11 h-12 flex items-center justify-center">
                        {/* Peeking Character Container with gentle sway */}
                        <motion.div
                            animate={{
                                rotate: isHovered ? [-3, 3, -3] : [-1.5, 1.5, -1.5],
                                y: [0, -1.5, 0]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: isHovered ? 1.2 : 2.5,
                                ease: 'easeInOut'
                            }}
                            className="relative flex flex-col items-center"
                        >
                            {/* Head & Cleaning Bandana */}
                            <div className="relative">
                                {/* Bandana Ears / Knot */}
                                <motion.div
                                    animate={{ rotate: [-4, 4, -4] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                    className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none"
                                >
                                    <div className="w-1.5 h-2.5 bg-amber-500 rounded-full rotate-[-25deg] shadow-2xs" />
                                    <div className="w-1.5 h-2.5 bg-amber-500 rounded-full rotate-[25deg] shadow-2xs" />
                                </motion.div>

                                {/* Head Round Body */}
                                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-200 border-2 border-indigo-700 dark:border-indigo-900 shadow-md flex flex-col items-center justify-center relative overflow-hidden">
                                    {/* Bandana Forehead Strip */}
                                    <div className="absolute top-0 inset-x-0 h-2 bg-amber-500 border-b border-amber-600 flex items-center justify-center">
                                        <div className="w-1 h-1 rounded-full bg-white/70" />
                                    </div>

                                    {/* Face Features */}
                                    <div className="mt-1 flex items-center gap-1.5">
                                        {/* Eyes (Blinking state or happy curve on hover) */}
                                        {isHovered ? (
                                            <>
                                                <div className="text-[7px] text-gray-800 font-bold leading-none">^</div>
                                                <div className="text-[7px] text-gray-800 font-bold leading-none">^</div>
                                            </>
                                        ) : isBlinking ? (
                                            <>
                                                <div className="w-1 h-0.5 bg-gray-800 rounded-full" />
                                                <div className="w-1 h-0.5 bg-gray-800 rounded-full" />
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-1 h-1 bg-gray-800 rounded-full" />
                                                <div className="w-1 h-1 bg-gray-800 rounded-full" />
                                            </>
                                        )}
                                    </div>

                                    {/* Rosy Cheeks */}
                                    <div className="flex items-center justify-between w-4.5 -mt-0.5">
                                        <div className="w-1 h-0.5 bg-rose-400/80 rounded-full" />
                                        <div className="w-1 h-0.5 bg-rose-400/80 rounded-full" />
                                    </div>

                                    {/* Small Happy Mouth */}
                                    <div className="w-1 h-0.5 bg-rose-600 rounded-b-full -mt-0.5" />
                                </div>
                            </div>

                            {/* Torso & Little Blue Uniform */}
                            <div className="w-4 h-3 bg-indigo-600 dark:bg-indigo-700 rounded-b-md border-x-2 border-b-2 border-indigo-800 -mt-0.5 flex items-center justify-center relative shadow-xs">
                                <div className="w-1 h-1 rounded-full bg-amber-300" />
                            </div>

                            {/* Left Paw: Clinging tightly to the border seam (left side) */}
                            <div className="absolute -left-1.5 top-5 w-2.5 h-2 rounded-full bg-amber-100 dark:bg-amber-200 border border-indigo-800 shadow-2xs z-30" />

                            {/* Right Arm & Active Cleaning Sponge (Scrubbing Action) */}
                            <motion.div
                                animate={{
                                    y: [-3, 3, -3],
                                    x: [0, 2, 0],
                                    rotate: [-12, 12, -12]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: isHovered ? 0.6 : 1.1,
                                    ease: 'easeInOut'
                                }}
                                className="absolute -right-2.5 top-4 z-30 origin-top-left"
                            >
                                {/* Yellow Cleaning Sponge */}
                                <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-br from-yellow-300 to-amber-400 border border-amber-500 shadow-xs flex items-center justify-center relative">
                                    {/* Tiny soap foam dots on sponge */}
                                    <div className="w-1 h-1 rounded-full bg-white/90 absolute -top-0.5 -right-0.5 shadow-2xs" />
                                    <div className="w-0.5 h-0.5 rounded-full bg-cyan-200 absolute bottom-0.5 left-0.5" />
                                    <div className="w-0.5 h-0.5 rounded-full bg-white/80 absolute top-1 left-1" />
                                </div>
                                {/* Little glove hand holding sponge */}
                                <div className="w-2 h-2 rounded-full bg-amber-100 dark:bg-amber-200 border border-indigo-800 absolute -left-1 top-0.5" />
                            </motion.div>
                        </motion.div>

                        {/* Floating Soap Bubbles & Sparkles on Border Seam */}
                        <motion.span
                            animate={{
                                opacity: [0, 0.9, 0],
                                y: [2, -10],
                                x: [0, 4]
                            }}
                            transition={{
                                duration: 2.2,
                                repeat: Infinity,
                                ease: 'easeOut',
                                delay: 0.2
                            }}
                            className="absolute -top-1 right-0 text-[10px] pointer-events-none"
                        >
                            ✨
                        </motion.span>
                        <motion.span
                            animate={{
                                opacity: [0, 0.7, 0],
                                y: [4, -8],
                                x: [-2, 2]
                            }}
                            transition={{
                                duration: 1.8,
                                repeat: Infinity,
                                ease: 'easeOut',
                                delay: 1.1
                            }}
                            className="absolute bottom-2 -right-1 text-[9px] pointer-events-none"
                        >
                            🫧
                        </motion.span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SidebarDutyEdgeMascot;
