import React, { useEffect } from 'react';
import { User, ViewMode } from '../../../types';
import { Trophy, ChevronRight, Crown, TrendingUp, Zap, Medal, Star, Sparkles } from 'lucide-react';
import { useLeaderboard, TimeRange } from '../../../hooks/useLeaderboard';
import UserAvatarWithHP from '../../common/UserAvatarWithHP';
import { motion, useAnimationControls } from 'framer-motion';

interface HallOfFameWidgetProps {
    users: User[];
    currentUser: User;
    onNavigate: (view: ViewMode) => void;
}

interface PodiumAvatarProps {
    user: User;
    rank: 1 | 2 | 3;
    score: number;
    timeRange: TimeRange;
}

const PodiumAvatar: React.FC<PodiumAvatarProps> = React.memo(({ user, rank, score, timeRange }) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const controls = useAnimationControls();

    const size: 'md' | 'lg' = isFirst ? 'lg' : 'md';

    const glowColor = isFirst
        ? 'shadow-[0_0_32px_rgba(251,191,36,0.28)]'
        : isSecond
            ? 'shadow-[0_0_20px_rgba(148,163,184,0.2)]'
            : 'shadow-[0_0_20px_rgba(251,146,60,0.18)]';

    const rankBadgeColor = isFirst
        ? 'bg-gradient-to-br from-amber-400 to-yellow-600'
        : isSecond
            ? 'bg-gradient-to-br from-slate-300 to-slate-500'
            : 'bg-gradient-to-br from-orange-300 to-orange-500';

    // Non-destructive in-place spring pulse when switching tabs (never unmounts DOM or resets HP ring)
    useEffect(() => {
        const staggerDelay = isSecond ? 0 : isFirst ? 0.035 : 0.07;
        controls.start({
            y: [6, 0],
            scale: [0.95, 1],
            transition: {
                type: 'spring',
                stiffness: 360,
                damping: 24,
                delay: staggerDelay,
            },
        });
    }, [timeRange, controls, isFirst, isSecond]);

    return (
        <motion.div animate={controls} className="flex flex-col items-center relative group select-none">
            {/* Top Floating Icon (Centered via static flex wrapper so Framer Motion doesn't overwrite translate-x) */}
            <div
                className={`absolute ${
                    isFirst ? '-top-9' : '-top-7'
                } inset-x-0 flex justify-center z-30 pointer-events-none`}
            >
                {isFirst ? (
                    <motion.div
                        animate={{
                            rotate: [0, -8, 8, -8, 0],
                            y: [0, -3, 0],
                        }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative"
                    >
                        <Crown
                            className="w-7 h-7 text-amber-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.75)]"
                            fill="currentColor"
                        />
                        <motion.div
                            animate={{ opacity: [0, 1, 0], scale: [0.8, 1.15, 0.8] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                            className="absolute -top-1 -right-1.5 text-amber-200"
                        >
                            <Sparkles className="w-3.5 h-3.5 fill-white" />
                        </motion.div>
                    </motion.div>
                ) : isSecond ? (
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Medal
                            className="w-5 h-5 text-slate-300 drop-shadow-[0_2px_8px_rgba(148,163,184,0.5)]"
                            fill="currentColor"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Star
                            className="w-5 h-5 text-orange-400 drop-shadow-[0_2px_8px_rgba(251,146,60,0.45)]"
                            fill="currentColor"
                        />
                    </motion.div>
                )}
            </div>

            {/* Avatar + Centered Rank Medal (Persistently mounted — zero image/SVG reload flicker) */}
            <div
                className={`relative rounded-full p-0.5 transition-transform duration-300 ${glowColor} group-hover:scale-105`}
            >
                <UserAvatarWithHP
                    user={user}
                    size={size}
                    showLevel={false}
                    showStatus={false}
                    showAdminBadge={false}
                />
                <div className="absolute -bottom-2 inset-x-0 flex justify-center z-30 pointer-events-none">
                    <div
                        className={`text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md tabular-nums ${rankBadgeColor}`}
                    >
                        {rank}
                    </div>
                </div>
            </div>

            {/* Name */}
            <span
                className={`text-xs font-bold mt-3.5 truncate max-w-[84px] tracking-tight transition-colors duration-200 ${
                    isFirst ? 'text-slate-900 text-[13px]' : 'text-slate-600'
                }`}
            >
                {user.name.split(' ')[0]}
            </span>

            {/* Score Pill */}
            <motion.div
                whileHover={{ scale: 1.06 }}
                className={`flex items-center gap-1 mt-1 bg-white/75 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/60 shadow-sm ${
                    isFirst ? 'ring-1 ring-amber-200/60' : ''
                }`}
            >
                <Zap
                    className={`w-3 h-3 shrink-0 ${
                        isFirst ? 'text-amber-500 fill-amber-500' : 'text-slate-400 fill-slate-400'
                    }`}
                />
                <span
                    className={`text-[11px] font-bold tabular-nums tracking-tight ${
                        isFirst ? 'text-amber-600' : 'text-slate-500'
                    }`}
                >
                    {score.toLocaleString()}
                </span>
            </motion.div>
        </motion.div>
    );
});

PodiumAvatar.displayName = 'PodiumAvatar';

const HallOfFameWidget: React.FC<HallOfFameWidgetProps> = ({ users, currentUser, onNavigate }) => {
    const { topThree, myStats, timeRange, setTimeRange, isLoading } = useLeaderboard(users, currentUser);
    const footerControls = useAnimationControls();

    useEffect(() => {
        footerControls.start({
            y: [3, 0],
            scale: [0.99, 1],
            transition: {
                type: 'spring',
                stiffness: 380,
                damping: 28,
            },
        });
    }, [timeRange, footerControls]);

    const tabs: { key: TimeRange; label: string }[] = [
        { key: 'WEEKLY', label: 'WEEK' },
        { key: 'ALL_TIME', label: 'ALL' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('LEADERBOARD')}
            className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/60 relative overflow-hidden flex flex-col justify-between h-full group hover:shadow-amber-200/30 transition-all duration-500 min-h-[420px] p-6 cursor-pointer"
        >
            {/* Ambient Background Glows */}
            <motion.div
                animate={{
                    scale: [1, 1.35, 1],
                    rotate: [0, 180, 0],
                    opacity: [0.2, 0.35, 0.2],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-32 -right-32 w-[380px] h-[380px] bg-gradient-to-br from-amber-200/40 to-orange-300/20 rounded-full blur-[100px] pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 30, 0],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-32 -left-32 w-[320px] h-[320px] bg-gradient-to-tr from-purple-200/30 to-indigo-300/20 rounded-full blur-[90px] pointer-events-none"
            />

            {/* 1. Compact Header */}
            <div className="flex items-center justify-between gap-2 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                    <motion.div
                        whileHover={{ rotate: 360, scale: 1.08 }}
                        transition={{ duration: 0.8 }}
                        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-200/50 flex items-center justify-center shrink-0"
                    >
                        <Trophy className="w-5 h-5" />
                    </motion.div>
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap truncate">
                            Hall of Fame
                        </h3>
                        <p className="text-amber-700/80 text-[10px] font-bold uppercase tracking-[0.18em] mt-0.5 whitespace-nowrap truncate transition-all duration-200">
                            {timeRange === 'WEEKLY' ? 'Weekly MVP' : 'All-Time Legends'}
                        </p>
                    </div>
                </div>

                {/* Segmented Time Toggle with Sliding layoutId Pill */}
                <div className="flex bg-white/50 p-1 rounded-2xl border border-white/70 backdrop-blur-xl shadow-inner shrink-0 relative">
                    {tabs.map((tab) => {
                        const isActive = timeRange === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (timeRange !== tab.key) {
                                        setTimeRange(tab.key);
                                    }
                                }}
                                className={`relative z-10 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors tracking-wider cursor-pointer whitespace-nowrap ${
                                    isActive ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="hallOfFameWidgetActiveTab"
                                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                        className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                                    />
                                )}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Persistently Mounted Podium Stage (Zero Unmount = Zero Flicker) */}
            <div className="flex-1 flex items-center justify-center pt-10 pb-4 relative z-10">
                {isLoading && topThree.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full"
                        />
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.18em] animate-pulse">
                            Syncing Legends...
                        </span>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 items-end gap-2 w-full relative pt-2 pb-5">
                        {/* Persistent Glass Podium Pedestals */}
                        <div className="absolute bottom-0 inset-x-0 h-20 grid grid-cols-3 items-end gap-2 pointer-events-none">
                            <div className="h-11 bg-white/25 backdrop-blur-md border-t border-x border-white/50 rounded-t-2xl shadow-inner" />
                            <div className="h-16 bg-white/40 backdrop-blur-xl border-t border-x border-white/70 rounded-t-2xl shadow-lg shadow-amber-200/20 relative overflow-hidden">
                                <motion.div
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                                />
                            </div>
                            <div className="h-9 bg-white/25 backdrop-blur-md border-t border-x border-white/50 rounded-t-2xl shadow-inner" />
                        </div>

                        {/* Rank 2 (Left) */}
                        <div className="flex justify-center z-20 pb-1">
                            {topThree[1] ? (
                                <PodiumAvatar
                                    user={topThree[1].user}
                                    rank={2}
                                    score={topThree[1].score}
                                    timeRange={timeRange}
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-100/30 border border-white/30" />
                            )}
                        </div>

                        {/* Rank 1 (Center) */}
                        <div className="flex justify-center z-30 -translate-y-3">
                            {topThree[0] ? (
                                <PodiumAvatar
                                    user={topThree[0].user}
                                    rank={1}
                                    score={topThree[0].score}
                                    timeRange={timeRange}
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-amber-100/30 border border-white/30" />
                            )}
                        </div>

                        {/* Rank 3 (Right) */}
                        <div className="flex justify-center z-20">
                            {topThree[2] ? (
                                <PodiumAvatar
                                    user={topThree[2].user}
                                    rank={3}
                                    score={topThree[2].score}
                                    timeRange={timeRange}
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-100/30 border border-white/30" />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Persistently Mounted My Rank Footer */}
            <div className="relative z-10">
                <motion.div
                    whileHover={{ scale: 1.015, y: -1 }}
                    className={`bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-3xl px-4 py-3.5 flex items-center justify-between gap-3 shadow-xl group/rank ${
                        isLoading && topThree.length === 0 ? 'opacity-50 pointer-events-none' : ''
                    }`}
                    onClick={() => onNavigate('LEADERBOARD')}
                >
                    <motion.div animate={footerControls} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-lg shadow-sm shadow-amber-500/30 tracking-tight whitespace-nowrap shrink-0 tabular-nums">
                                RANK #{myStats?.rank || '-'}
                            </span>
                            <span className="text-xs font-bold text-white/90 tracking-tight truncate">
                                {timeRange === 'WEEKLY' ? 'Weekly Status' : 'Your Legacy'}
                            </span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-semibold flex items-center min-w-0">
                            {myStats?.rank === 1 ? (
                                <span className="text-amber-400 font-bold flex items-center gap-1.5 truncate">
                                    <Crown className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
                                    <span className="truncate">UNSTOPPABLE! YOU ARE #1</span>
                                </span>
                            ) : myStats && myStats.diffFromNext > 0 ? (
                                <span className="flex items-center gap-1.5 truncate">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <b className="text-white font-bold tabular-nums shrink-0">
                                        {myStats.diffFromNext.toLocaleString()} XP
                                    </b>
                                    <span className="truncate">to reach next rank</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-slate-400 truncate">
                                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="truncate">Keep pushing for the top!</span>
                                </span>
                            )}
                        </div>
                    </motion.div>

                    <div className="w-10 h-10 bg-white/10 group-hover/rank:bg-amber-500 text-white rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-inner border border-white/5 shrink-0">
                        <ChevronRight className="w-5 h-5 group-hover/rank:translate-x-0.5 transition-transform" />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default HallOfFameWidget;