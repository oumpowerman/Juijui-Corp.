import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    CheckCircle2,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
    MessageCircle,
    Flame,
    Shield,
    Skull,
    Moon,
} from 'lucide-react';
import { LeaderboardEntry, BadgeType } from '../../hooks/useLeaderboard';
import UserAvatarWithHP from '../common/UserAvatarWithHP';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CHEER_REACTIONS,
    CheerReactionKey,
    getInitialCheerCounts,
} from './LeaderboardProfileCardModal';

interface RankingListProps {
    list: LeaderboardEntry[];
    emptyMessage?: string;
    onSelectUser?: (entry: LeaderboardEntry) => void;
    cheerCounts?: Record<string, Record<CheerReactionKey, number>>;
    onQuickCheer?: (userId: string, reactionKey: CheerReactionKey) => void;
}

const RankingList: React.FC<RankingListProps> = ({
    list,
    emptyMessage = 'ยังไม่มีข้อมูลในรอบนี้',
    onSelectUser,
    cheerCounts = {},
    onQuickCheer,
}) => {
    const [flyingIcons, setFlyingIcons] = useState<
        { id: number; reactionKey: CheerReactionKey; x: number; y: number; driftX: number; rotate: number }[]
    >([]);

    const getBadgeIcon = (type: BadgeType) => {
        switch (type) {
            case 'FIRE':
                return <Flame className="w-3 h-3 text-orange-500 fill-orange-500 animate-pulse" />;
            case 'SHIELD':
                return <Shield className="w-3 h-3 text-blue-500 fill-blue-200" />;
            case 'RISK':
                return <Skull className="w-3 h-3 text-red-400" />;
            case 'SLEEPY':
                return <Moon className="w-3 h-3 text-indigo-300" />;
            default:
                return null;
        }
    };

    const getTrendIndicator = (entry: LeaderboardEntry) => {
        const isUp = entry.missions > 0 && entry.penalties === 0;
        const isDown = entry.penalties > 0;

        if (isUp) {
            return (
                <div className="flex flex-col items-center justify-center text-emerald-500" title="กำลังพุ่งขึ้น!">
                    <motion.div
                        animate={{ y: [1, -2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5px]" />
                    </motion.div>
                </div>
            );
        } else if (isDown) {
            return (
                <div className="flex flex-col items-center justify-center text-rose-500" title="แนวโน้มลดลง">
                    <motion.div
                        animate={{ y: [-1, 2, -1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <TrendingDown className="w-3.5 h-3.5 text-rose-500 stroke-[2.5px]" />
                    </motion.div>
                </div>
            );
        } else {
            return (
                <div className="flex flex-col items-center justify-center text-slate-300" title="แนวโน้มคงที่">
                    <span className="text-xs font-bold select-none">─</span>
                </div>
            );
        }
    };

    const handleCheer = (e: React.MouseEvent, userId: string, reactionKey: CheerReactionKey) => {
        e.stopPropagation();

        const newParticle = {
            id: Date.now() + Math.random(),
            reactionKey,
            x: e.clientX,
            y: e.clientY,
            driftX: Math.random() * 60 - 30,
            rotate: Math.random() * 40 - 20,
        };

        setFlyingIcons((prev) => [...prev, newParticle]);

        if (onQuickCheer) {
            onQuickCheer(userId, reactionKey);
        }

        setTimeout(() => {
            setFlyingIcons((prev) => prev.filter((item) => item.id !== newParticle.id));
        }, 1200);
    };

    return (
        <>
            {/* Viewport Portal for Flying Vector Icons */}
            {typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed inset-0 pointer-events-none z-[110] overflow-hidden">
                        <AnimatePresence>
                            {flyingIcons.map((item) => {
                                const meta =
                                    CHEER_REACTIONS.find((r) => r.key === item.reactionKey) || CHEER_REACTIONS[0];
                                const ReactionIcon = meta.Icon;
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ x: item.x - 20, y: item.y - 20, scale: 0.5, opacity: 1 }}
                                        animate={{
                                            y: item.y - 130,
                                            x: item.x - 20 + item.driftX,
                                            scale: [0.8, 1.35, 1.1, 0],
                                            opacity: [1, 1, 0.8, 0],
                                            rotate: [0, item.rotate],
                                        }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.15, ease: 'easeOut' }}
                                        className={`fixed top-0 left-0 w-10 h-10 rounded-2xl border flex items-center justify-center shadow-lg ${meta.flyingBadgeClass}`}
                                    >
                                        <ReactionIcon className={`w-5 h-5 ${meta.iconClass}`} />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>,
                    document.body
                )}

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-white/60 overflow-visible relative z-10 max-w-4xl mx-auto mb-32"
            >
                {/* Table Header */}
                <div className="grid grid-cols-12 px-6 py-5 bg-slate-50/50 border-b border-slate-100 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider backdrop-blur-sm sticky top-0 z-20 rounded-t-[2.5rem]">
                    <div className="col-span-3 sm:col-span-2 text-center flex items-center justify-center gap-1">
                        อันดับ & แนวโน้ม
                    </div>
                    <div className="col-span-5 sm:col-span-5 pl-2 flex items-center">เจ้าหน้าที่ & สถานะ</div>
                    <div className="col-span-2 sm:col-span-3 text-right flex items-center justify-end">คะแนน</div>
                    <div className="col-span-2 text-center flex items-center justify-center">ผลงาน</div>
                </div>

                <div className="divide-y divide-slate-100/60 pb-1">
                    {list.length === 0 && (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <TrendingDown className="w-12 h-12 mb-2 opacity-20" />
                            <p className="font-semibold">{emptyMessage}</p>
                        </div>
                    )}

                    {list.map((entry, index) => {
                        const userId = entry.user.id;
                        const userCheers = cheerCounts[userId] || getInitialCheerCounts(userId);

                        return (
                            <motion.div
                                key={userId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.05 }}
                                onClick={() => onSelectUser && onSelectUser(entry)}
                                className="grid grid-cols-12 px-3 md:px-6 py-4 items-center hover:bg-white/80 transition-all duration-200 group relative cursor-pointer select-none"
                            >
                                {/* Rank and Trend Indicator */}
                                <div className="col-span-3 sm:col-span-2 flex items-center justify-center gap-2.5">
                                    <span className="text-xl font-bold text-slate-300 group-hover:text-indigo-500 transition-colors group-hover:scale-110 inline-block tabular-nums">
                                        {entry.rank}
                                    </span>
                                    <div className="p-1 bg-slate-50/70 border border-slate-100 rounded-lg shadow-inner flex items-center justify-center w-7 h-7">
                                        {getTrendIndicator(entry)}
                                    </div>
                                </div>

                                {/* Agent Profile & Feeling Bubble */}
                                <div className="col-span-5 sm:col-span-5 flex items-center gap-2.5 sm:gap-4 pl-2">
                                    <div className="group-hover:scale-105 transition-transform duration-300 shrink-0">
                                        <UserAvatarWithHP
                                            user={entry.user}
                                            size="md"
                                            showLevel={true}
                                            showStatus={true}
                                            showAdminBadge={true}
                                        />
                                    </div>

                                    <div className="min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-slate-700 truncate text-xs sm:text-base group-hover:text-indigo-700 transition-colors">
                                                {entry.user.name}
                                            </p>

                                            {/* BADGES ROW */}
                                            <div className="flex gap-1">
                                                {entry.badges.map((badge) => (
                                                    <div
                                                        key={badge}
                                                        className="p-0.5 bg-white/75 rounded border border-slate-200"
                                                        title={badge}
                                                    >
                                                        {getBadgeIcon(badge)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Feeling in List */}
                                        {entry.user.feeling ? (
                                            <div className="flex items-center gap-1 mt-1">
                                                <MessageCircle className="w-3 h-3 text-indigo-400 shrink-0" />
                                                <p className="text-[10px] text-slate-500 italic truncate max-w-[100px] md:max-w-xs bg-indigo-50/30 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                                                    "{entry.user.feeling}"
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                                {entry.user.position || 'เจ้าหน้าที่'}
                                            </span>
                                        )}

                                        {/* Quick Cheer Vector Icon Reaction Buttons */}
                                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                            {CHEER_REACTIONS.map(({ key, label, Icon, iconClass, buttonBgClass }) => {
                                                const count = userCheers[key] || 0;
                                                return (
                                                    <motion.button
                                                        key={key}
                                                        whileHover={{ scale: 1.12, y: -2 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => handleCheer(e, userId, key)}
                                                        title={label}
                                                        className={`flex items-center gap-1 px-2 py-0.5 border rounded-full text-xs font-bold shadow-sm transition-colors cursor-pointer ${buttonBgClass}`}
                                                    >
                                                        <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
                                                        <span className="text-[10px] tracking-tight tabular-nums">
                                                            {count}
                                                        </span>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="col-span-2 sm:col-span-3 text-right pr-2">
                                    <div className="font-bold text-indigo-600 text-sm sm:text-lg group-hover:text-indigo-700 transition-colors tabular-nums">
                                        {entry.score.toLocaleString()}
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                        แต้ม XP
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="col-span-2 flex justify-center gap-1.5 md:gap-4 select-none">
                                    <div className="flex flex-col items-center group/stat" title="ภารกิจที่สำเร็จ">
                                        <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50/60 px-1.5 py-0.5 rounded-md mb-0.5 group-hover/stat:bg-emerald-100 transition-colors border border-emerald-100/60 tabular-nums">
                                            +{entry.missions}
                                        </span>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <div className="flex flex-col items-center group/stat" title="ส่งช้า/ขาด">
                                        <span
                                            className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md mb-0.5 transition-colors border tabular-nums ${
                                                entry.penalties > 0
                                                    ? 'text-red-500 bg-red-50/60 group-hover/stat:bg-red-100 border-red-100/60'
                                                    : 'text-gray-300 bg-gray-50/50 border-gray-100/50'
                                            }`}
                                        >
                                            -{entry.penalties}
                                        </span>
                                        <AlertTriangle
                                            className={`w-3.5 h-3.5 ${
                                                entry.penalties > 0 ? 'text-red-400' : 'text-gray-300'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </>
    );
};

export default RankingList;
