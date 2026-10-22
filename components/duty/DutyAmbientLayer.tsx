import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { isSameDay, isWeekend } from 'date-fns';
import { Duty, User } from '../../types';

interface DutyAmbientLayerProps {
    duties: Duty[];
    users: User[];
    currentUser?: User;
}

export const DutyAmbientLayer: React.FC<DutyAmbientLayerProps> = ({
    duties,
    users,
    currentUser
}) => {
    const today = useMemo(() => new Date(), []);

    // Filter today's duties
    const todayDuties = useMemo(() => {
        return duties.filter(d => isSameDay(new Date(d.date), today));
    }, [duties, today]);

    const hasDuties = todayDuties.length > 0;
    const pendingDuties = useMemo(() => todayDuties.filter(d => !d.isDone), [todayDuties]);
    const isAllDone = hasDuties && pendingDuties.length === 0;
    const isPending = hasDuties && pendingDuties.length > 0;
    const isChillDay = !hasDuties || isWeekend(today);

    // Get today's assignees
    const assignees = useMemo(() => {
        return todayDuties.map(d => {
            const u = users.find(user => user.id === d.assigneeId);
            return { user: u, duty: d };
        });
    }, [todayDuties, users]);

    const firstAssignee = assignees[0]?.user?.name;
    const secondAssignee = assignees[1]?.user?.name;

    return (
        <div 
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10"
        >
            {/* 1. Seamless Office Silhouettes on Transparent Grid */}
            {/* Left Office Corner (Indoor Monstera & Water Station) */}
            <div className="absolute left-4 sm:left-12 bottom-9 opacity-45 dark:opacity-35 flex items-end gap-3 scale-90 sm:scale-100">
                {/* Office Monstera Plant */}
                <div className="flex flex-col items-center">
                    <svg className="w-12 h-14 text-emerald-600/70 dark:text-emerald-500/60" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8 2 5 6 6 10C7 14 11 15 12 18C13 15 17 14 18 10C19 6 16 2 12 2Z" />
                        <path d="M7 8C4 9 3 13 4 15C6 17 9 16 11 15" opacity="0.6" />
                        <path d="M17 8C20 9 21 13 20 15C18 17 15 16 13 15" opacity="0.6" />
                    </svg>
                    <div className="w-8 h-7 bg-amber-800/40 dark:bg-amber-900/40 rounded-b-lg border border-amber-800/30" />
                </div>

                {/* Recycle / Clean Sort Bin */}
                <div className="w-9 h-11 rounded-lg bg-indigo-500/25 dark:bg-indigo-400/20 border border-indigo-400/30 flex flex-col items-center justify-center text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs">
                    <span>♻️</span>
                    <span className="text-[8px] font-mono opacity-80">CLEAN</span>
                </div>
            </div>

            {/* Right Office Corner (Coffee & Break Lounge Stool) */}
            <div className="absolute right-4 sm:right-14 bottom-9 opacity-45 dark:opacity-35 flex items-end gap-4 scale-90 sm:scale-100">
                {/* Water Cooler / Coffee Maker Outline */}
                <div className="w-8 h-16 rounded-t-xl bg-slate-300/35 dark:bg-slate-700/30 border border-slate-400/30 flex flex-col items-center justify-between p-1">
                    <div className="w-5 h-6 rounded-t-full bg-cyan-400/30 border border-cyan-400/40" />
                    <div className="w-full h-1 bg-slate-400/40 rounded-full" />
                </div>
                {/* Round Bar Stool */}
                <div className="flex flex-col items-center">
                    <div className="w-8 h-2 rounded-full bg-amber-600/30 border border-amber-600/40" />
                    <div className="w-1 h-9 bg-slate-400/30" />
                    <div className="w-6 h-1 rounded-full bg-slate-400/30" />
                </div>
            </div>

            {/* 3. PATROLLING CHARACTER 1: The Sweeper (Weaves across bottom ground) */}
            <motion.div
                initial={{ x: '10vw' }}
                animate={{
                    // Keyframe cycle: Walk -> Stop & Clean -> Walk forward -> Stop & Clean -> Turn back
                    x: ['5vw', '30vw', '30vw', '55vw', '55vw', '80vw', '80vw', '55vw', '30vw', '5vw'],
                    scaleX: [1, 1, 1, 1, 1, -1, -1, -1, -1, 1],
                }}
                transition={{
                    duration: 36,
                    repeat: Infinity,
                    ease: 'linear',
                    times: [0, 0.22, 0.32, 0.50, 0.60, 0.65, 0.78, 0.88, 0.95, 1],
                }}
                className="absolute bottom-6 flex flex-col items-center opacity-75 dark:opacity-65"
            >
                {/* Assignee / Role Floating Tag */}
                <div className="mb-1 px-1.5 py-0.5 rounded-md bg-white/70 dark:bg-slate-800/70 border border-black/5 text-[9px] font-semibold text-gray-600 dark:text-gray-300 shadow-2xs whitespace-nowrap">
                    {firstAssignee ? `🧹 ${firstAssignee}` : '🧹 กวาดพื้น'}
                </div>

                {/* Chibi Character Model */}
                <div className="relative flex flex-col items-center">
                    {/* Head */}
                    <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 dark:bg-amber-200 flex items-center justify-center relative shadow-2xs">
                        <div className="absolute -top-1 w-6 h-2.5 bg-amber-800 rounded-t-full" />
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-0.5 h-0.5 bg-gray-800 rounded-full" />
                            <div className="w-0.5 h-0.5 bg-gray-800 rounded-full" />
                        </div>
                    </div>

                    {/* Torso & Tool */}
                    <div className="relative flex items-center justify-center">
                        <div className={`w-5 h-5 rounded-b-sm ${
                            isAllDone ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-indigo-500'
                        } flex items-center justify-center text-[7px] text-white font-bold`}>
                            {isAllDone ? '★' : '1'}
                        </div>

                        {/* Animated Broom (Swinging while sweeping) */}
                        <motion.div
                            animate={isPending ? {
                                rotate: [-18, 18, -18],
                                x: [-2, 2, -2]
                            } : isAllDone ? {
                                rotate: [0, 10, 0],
                                y: [-1, -3, -1]
                            } : {
                                rotate: [0, 5, 0]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: isPending ? 0.7 : 1.8,
                                ease: 'easeInOut'
                            }}
                            className="absolute -right-3 bottom-0 origin-bottom"
                        >
                            <div className="w-1 h-9 bg-amber-700/80 rounded-t" />
                            <div className="w-3.5 h-3 bg-amber-300 rounded-b border-t border-amber-500 -ml-1.5 flex items-center justify-center">
                                <div className="w-full h-0.5 bg-amber-400" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Stepping Feet Animation */}
                    <div className="flex gap-1.5 -mt-0.5">
                        <motion.div 
                            animate={{ rotate: [-15, 15, -15] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="w-1.5 h-1.5 bg-gray-700 rounded-b" 
                        />
                        <motion.div 
                            animate={{ rotate: [15, -15, 15] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="w-1.5 h-1.5 bg-gray-700 rounded-b" 
                        />
                    </div>
                </div>
            </motion.div>

            {/* 4. PATROLLING CHARACTER 2: The Mopper (Weaves behind the calendar middle area) */}
            <motion.div
                initial={{ x: '85vw', scaleX: -1 }}
                animate={{
                    // Keyframe cycle: Patrol from right to left behind the grid, stop to mop, turn and return
                    x: ['85vw', '62vw', '62vw', '38vw', '38vw', '15vw', '15vw', '45vw', '70vw', '85vw'],
                    scaleX: [-1, -1, -1, -1, -1, 1, 1, 1, 1, -1],
                }}
                transition={{
                    duration: 42,
                    repeat: Infinity,
                    ease: 'linear',
                    times: [0, 0.20, 0.32, 0.52, 0.64, 0.72, 0.82, 0.90, 0.96, 1],
                }}
                className="absolute top-[48%] md:top-[52%] flex flex-col items-center opacity-65 dark:opacity-55"
            >
                {/* Floating Tag */}
                <div className="mb-1 px-1.5 py-0.5 rounded-md bg-white/70 dark:bg-slate-800/70 border border-black/5 text-[9px] font-semibold text-gray-600 dark:text-gray-300 shadow-2xs whitespace-nowrap">
                    {secondAssignee ? `🧽 ${secondAssignee}` : isAllDone ? '✨ สะอาดกริบ' : '🧽 ถูพื้น'}
                </div>

                {/* Chibi Character Model */}
                <div className="relative flex flex-col items-center">
                    {/* Head */}
                    <div className="w-7 h-7 rounded-full bg-rose-100 border border-rose-300 dark:bg-rose-200 flex items-center justify-center relative shadow-2xs">
                        <div className="absolute -top-1 w-6 h-2.5 bg-stone-800 rounded-t-full" />
                        <div className="absolute -right-1 -top-0.5 w-1.5 h-2 bg-stone-800 rounded-full" />
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-0.5 h-0.5 bg-gray-800 rounded-full" />
                            <div className="w-0.5 h-0.5 bg-gray-800 rounded-full" />
                        </div>
                    </div>

                    {/* Torso & Mop Tool */}
                    <div className="relative flex items-center justify-center">
                        <div className={`w-5 h-5 rounded-b-sm ${
                            isAllDone ? 'bg-teal-500' : isPending ? 'bg-sky-500' : 'bg-purple-500'
                        } flex items-center justify-center text-[7px] text-white font-bold`}>
                            {isAllDone ? '★' : '2'}
                        </div>

                        {/* Animated Mop */}
                        <motion.div
                            animate={isPending ? {
                                x: [-3, 3, -3],
                                rotate: [-12, 12, -12]
                            } : {
                                rotate: [-4, 4, -4]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: isPending ? 0.8 : 2,
                                ease: 'easeInOut'
                            }}
                            className="absolute -left-3 bottom-0 origin-bottom"
                        >
                            <div className="w-1 h-10 bg-cyan-600/80 rounded-t" />
                            <div className="w-4 h-2 bg-cyan-200 rounded-t border border-cyan-400 -ml-1.5" />
                        </motion.div>
                    </div>

                    {/* Stepping Feet */}
                    <div className="flex gap-1.5 -mt-0.5">
                        <motion.div 
                            animate={{ rotate: [15, -15, 15] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="w-1.5 h-1.5 bg-gray-700 rounded-b" 
                        />
                        <motion.div 
                            animate={{ rotate: [-15, 15, -15] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="w-1.5 h-1.5 bg-gray-700 rounded-b" 
                        />
                    </div>
                </div>
            </motion.div>

            {/* 5. PATROLLING SMART ROBOT VACUUM (Autonomous Floor Roomba) */}
            <motion.div
                initial={{ x: '15vw' }}
                animate={{
                    x: ['10vw', '76vw', '10vw'],
                }}
                transition={{
                    duration: 28,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="absolute bottom-4 flex flex-col items-center opacity-80 dark:opacity-70"
            >
                <div className="relative flex items-center justify-center">
                    {/* Roomba Body */}
                    <div className="w-8 h-3.5 bg-slate-800 dark:bg-slate-700 rounded-full border border-slate-600 shadow-xs flex items-center justify-center relative">
                        <span className={`w-1 h-1 rounded-full ${
                            isAllDone ? 'bg-emerald-400' : isPending ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
                        }`} />
                        <div className="absolute -top-0.5 w-2.5 h-1 bg-slate-600 rounded-full" />
                    </div>
                    {/* Shadow underneath */}
                    <div className="absolute -bottom-1 w-6 h-1 bg-black/15 rounded-full blur-[1px]" />
                </div>
            </motion.div>

            {/* 6. AMBIENT PARTICLES (Clean sparkles or dust puffs according to status) */}
            {isAllDone ? (
                // Sparkling stars across the floor
                <>
                    <motion.div
                        animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute bottom-16 left-1/4 text-amber-400/50 text-sm"
                    >
                        ✨
                    </motion.div>
                    <motion.div
                        animate={{ opacity: [0.1, 0.6, 0.1], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
                        className="absolute top-[60%] right-1/3 text-emerald-400/50 text-xs"
                    >
                        ✨
                    </motion.div>
                    <motion.div
                        animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.7, 1.1, 0.7] }}
                        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                        className="absolute bottom-12 right-1/4 text-teal-400/50 text-sm"
                    >
                        🌟
                    </motion.div>
                </>
            ) : isPending ? (
                // Little water bubble and dust particles
                <>
                    <motion.div
                        animate={{ y: [0, -6, 0], opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                        className="absolute bottom-12 left-1/3 text-cyan-500/35 text-[10px]"
                    >
                        🫧
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, -5, 0], opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 2.8, repeat: Infinity, delay: 0.8 }}
                        className="absolute top-[54%] left-1/2 text-cyan-500/35 text-[10px]"
                    >
                        🫧
                    </motion.div>
                </>
            ) : (
                // Peaceful coffee / tea steam
                <motion.div
                    animate={{ y: [0, -8, -12], opacity: [0.3, 0.6, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute bottom-24 right-14 text-indigo-400/40 text-xs"
                >
                    ~
                </motion.div>
            )}
        </div>
    );
};

export default DutyAmbientLayer;
