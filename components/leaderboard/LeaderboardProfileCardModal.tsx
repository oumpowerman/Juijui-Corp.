import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Trophy,
    Shield,
    Swords,
    MessageCircle,
    Heart,
    Activity,
    Award,
    Flame,
    ThumbsUp,
    PartyPopper,
    Crown,
    Zap,
    Skull,
    Moon,
    Compass,
    type LucideIcon,
} from 'lucide-react';
import { LeaderboardEntry } from '../../hooks/useLeaderboard';
import UserAvatarWithHP from '../common/UserAvatarWithHP';

export type CheerReactionKey = 'FIRE' | 'LIKE' | 'LOVE' | 'PARTY' | 'CROWN';

export interface CheerReactionMeta {
    key: CheerReactionKey;
    label: string;
    Icon: LucideIcon;
    iconClass: string;
    buttonBgClass: string;
    flyingBadgeClass: string;
}

export const CHEER_REACTIONS: CheerReactionMeta[] = [
    {
        key: 'FIRE',
        label: 'ไฟลุก',
        Icon: Flame,
        iconClass: 'text-orange-500 fill-orange-400/25',
        buttonBgClass: 'bg-orange-50/70 hover:bg-orange-100/80 border-orange-200/70 text-orange-600',
        flyingBadgeClass: 'bg-white/95 border-orange-200 text-orange-500 shadow-orange-500/20',
    },
    {
        key: 'LIKE',
        label: 'เยี่ยมยอด',
        Icon: ThumbsUp,
        iconClass: 'text-indigo-600 fill-indigo-400/20',
        buttonBgClass: 'bg-indigo-50/70 hover:bg-indigo-100/80 border-indigo-200/70 text-indigo-600',
        flyingBadgeClass: 'bg-white/95 border-indigo-200 text-indigo-600 shadow-indigo-500/20',
    },
    {
        key: 'LOVE',
        label: 'ส่งใจ',
        Icon: Heart,
        iconClass: 'text-pink-500 fill-pink-400/25',
        buttonBgClass: 'bg-pink-50/70 hover:bg-pink-100/80 border-pink-200/70 text-pink-600',
        flyingBadgeClass: 'bg-white/95 border-pink-200 text-pink-500 shadow-pink-500/20',
    },
    {
        key: 'PARTY',
        label: 'ฉลอง',
        Icon: PartyPopper,
        iconClass: 'text-purple-600 fill-purple-400/20',
        buttonBgClass: 'bg-purple-50/70 hover:bg-purple-100/80 border-purple-200/70 text-purple-600',
        flyingBadgeClass: 'bg-white/95 border-purple-200 text-purple-600 shadow-purple-500/20',
    },
    {
        key: 'CROWN',
        label: 'ตัวตึง',
        Icon: Crown,
        iconClass: 'text-amber-500 fill-amber-300/35',
        buttonBgClass: 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200/70 text-amber-600',
        flyingBadgeClass: 'bg-white/95 border-amber-200 text-amber-500 shadow-amber-500/20',
    },
];

export const getInitialCheerCounts = (userId: string): Record<CheerReactionKey, number> => {
    const seed = userId.split('').reduce((sum, cur) => sum + cur.charCodeAt(0), 0);
    return {
        FIRE: (seed % 4) + 1,
        LIKE: ((seed + 2) % 5) + 2,
        LOVE: ((seed + 5) % 4) + 1,
        PARTY: (seed + 3) % 3,
        CROWN: (seed + 1) % 2,
    };
};

interface LeaderboardProfileCardModalProps {
    entry: LeaderboardEntry | null;
    onClose: () => void;
    userCheers?: Record<CheerReactionKey, number>;
    onQuickCheer?: (userId: string, reactionKey: CheerReactionKey) => void;
}

const LeaderboardProfileCardModal: React.FC<LeaderboardProfileCardModalProps> = ({
    entry,
    onClose,
    userCheers,
    onQuickCheer,
}) => {
    const [modalFlying, setModalFlying] = useState<
        { id: number; reactionKey: CheerReactionKey; x: number; y: number; driftX: number; rotate: number }[]
    >([]);

    useEffect(() => {
        if (!entry) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [entry, onClose]);

    const handleLocalReaction = (e: React.MouseEvent, reactionKey: CheerReactionKey) => {
        if (!entry) return;
        const newParticle = {
            id: Date.now() + Math.random(),
            reactionKey,
            x: e.clientX,
            y: e.clientY,
            driftX: Math.random() * 80 - 40,
            rotate: Math.random() * 40 - 20,
        };

        setModalFlying((prev) => [...prev, newParticle]);

        if (onQuickCheer) {
            onQuickCheer(entry.user.id, reactionKey);
        }

        setTimeout(() => {
            setModalFlying((prev) => prev.filter((item) => item.id !== newParticle.id));
        }, 1200);
    };

    const getRPGClass = (currentEntry: LeaderboardEntry) => {
        const { badges, rank } = currentEntry;
        if (badges.includes('FIRE')) {
            return {
                title: 'Blazing Speedrunner',
                ClassIcon: Zap,
                iconClass: 'text-orange-500 fill-orange-400',
                description: 'จอมเวทย์อัคคีความเร็วแสง สนุกกับการคลี่คลายงานพริบตาเดียวยอดเยี่ยม!',
                color: 'text-orange-600 bg-orange-50/80 border-orange-200/80',
            };
        }
        if (badges.includes('SHIELD')) {
            return {
                title: 'Iron Discipline Paladin',
                ClassIcon: Shield,
                iconClass: 'text-blue-600 fill-blue-200',
                description: 'อัศวินเกราะเหล็กวิถีแห่งความสม่ำเสมอ แกร่งกล้าปราศจากข้อผิดพลาดใดๆ!',
                color: 'text-blue-600 bg-blue-50/80 border-blue-200/80',
            };
        }
        if (badges.includes('RISK')) {
            return {
                title: 'Danger Zone Raider',
                ClassIcon: Skull,
                iconClass: 'text-red-500',
                description: 'ขุนศึกจอมบุ่มบ่าม ท้าทายกำหนดส่งเดดไลน์อย่างใจหายใจคว่ำ!',
                color: 'text-red-500 bg-red-50/80 border-red-200/80',
            };
        }
        if (badges.includes('SLEEPY')) {
            return {
                title: 'Dreamwalker Nomad',
                ClassIcon: Moon,
                iconClass: 'text-indigo-500 fill-indigo-200',
                description: 'ผู้สัญจรต่างมิติ พักสมองในห้วงนิทรา รอวันปลุกพลังขยันระเบิดออก!',
                color: 'text-indigo-600 bg-indigo-50/80 border-indigo-200/80',
            };
        }
        if (rank === 1) {
            return {
                title: 'Hall of Fame Monarch',
                ClassIcon: Crown,
                iconClass: 'text-amber-500 fill-amber-300',
                description: 'ราชันย์ผู้ไร้เทียมทาน ส่องประกายอยู่บนพิกัดสูงสุดของตารางตระการตา!',
                color: 'text-yellow-700 bg-yellow-50/80 border-yellow-200/80',
            };
        }
        return {
            title: 'Pathfinder Recruit',
            ClassIcon: Compass,
            iconClass: 'text-slate-600',
            description: 'ผู้กล้านักสำรวจแห่งสายงาน กำลังสั่งสมชั่วโมงฝึกฝนเพื่อมุ่งสู่อันดับท็อปเซียน!',
            color: 'text-slate-600 bg-slate-50/80 border-slate-200/80',
        };
    };

    if (typeof document === 'undefined') return null;

    const resolvedCheers = entry ? userCheers || getInitialCheerCounts(entry.user.id) : null;

    return createPortal(
        <AnimatePresence>
            {entry && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Micro-blur Backdrop overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
                    />

                    {/* Viewport-level Floating Vector Icons Layer (outside modal overflow/transform) */}
                    <div className="fixed inset-0 pointer-events-none z-[120] overflow-hidden">
                        <AnimatePresence>
                            {modalFlying.map((item) => {
                                const meta =
                                    CHEER_REACTIONS.find((r) => r.key === item.reactionKey) || CHEER_REACTIONS[0];
                                const ReactionIcon = meta.Icon;
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ x: item.x - 24, y: item.y - 24, scale: 0.5, opacity: 1 }}
                                        animate={{
                                            y: item.y - 160,
                                            x: item.x - 24 + item.driftX,
                                            scale: [0.8, 1.35, 1.1, 0],
                                            opacity: [1, 1, 0.85, 0],
                                            rotate: [0, item.rotate],
                                        }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.15, ease: 'easeOut' }}
                                        className={`fixed top-0 left-0 w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xl ${meta.flyingBadgeClass}`}
                                    >
                                        <ReactionIcon className={`w-6 h-6 ${meta.iconClass}`} />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* 3-Layer Flexbox Card Container (Max Height 85vh Desktop / 92vh Mobile) */}
                    <motion.div
                        initial={{ scale: 0.92, y: 32, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.92, y: 32, opacity: 0 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                        className="relative w-full max-w-sm max-h-[92vh] sm:max-h-[85vh] bg-white/95 backdrop-blur-2xl border border-white/80 rounded-t-[2.25rem] sm:rounded-[2.75rem] shadow-[0_35px_70px_rgba(30,41,59,0.28)] overflow-hidden z-10 flex flex-col"
                    >
                        {/* Top Accent Light Beam */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-400 via-indigo-500 to-amber-400 z-20" />

                        {/* Subtle Ambient Glow Orbs */}
                        <div className="absolute top-12 left-1/4 w-32 h-32 bg-indigo-300/15 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute bottom-20 right-1/4 w-32 h-32 bg-pink-300/15 rounded-full blur-2xl pointer-events-none" />

                        {/* 1. Rigid Header */}
                        <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-slate-100/80 flex justify-between items-center relative z-10">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 bg-slate-100/70 px-3 py-1.5 rounded-xl">
                                <Activity className="w-3.5 h-3.5 text-indigo-500" /> Stats Card
                            </span>
                            <motion.button
                                whileHover={{ scale: 1.08, rotate: 90 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={onClose}
                                className="p-2.5 -mr-1.5 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                                aria-label="ปิดหน้าต่าง"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>

                        {/* 2. Scrollable Body */}
                        {(() => {
                            const { user, rank, score, missions, penalties } = entry;
                            const rpgClass = getRPGClass(entry);
                            const RpgClassIcon = rpgClass.ClassIcon;
                            const levelProgress = (user.xp % 1000) / 10;
                            const hpColor =
                                user.hp > 80
                                    ? 'bg-emerald-500'
                                    : user.hp > 40
                                        ? 'bg-amber-400'
                                        : 'bg-red-500';

                            return (
                                <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-6 py-5 space-y-5 relative z-10">
                                    {/* Profile Identity */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative group mb-3.5">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                                                className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 via-indigo-500 to-amber-400 rounded-full blur-[2px] opacity-75 group-hover:opacity-100 transition-opacity"
                                            />
                                            <div className="relative bg-white p-1.5 rounded-full">
                                                <UserAvatarWithHP
                                                    user={user}
                                                    size="2xl"
                                                    showLevel={false}
                                                    showStatus={false}
                                                    showAdminBadge={false}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
                                                <span>{user.name}</span>
                                                {rank <= 3 && (
                                                    <Trophy
                                                        className={`w-5 h-5 shrink-0 ${
                                                            rank === 1
                                                                ? 'text-yellow-500 fill-yellow-300'
                                                                : rank === 2
                                                                    ? 'text-slate-400 fill-slate-200'
                                                                    : 'text-orange-500 fill-orange-200'
                                                        }`}
                                                    />
                                                )}
                                            </h3>
                                            <p className="text-xs font-bold text-indigo-500 tracking-wide uppercase">
                                                {user.position || 'เจ้าหน้าที่ผู้ปฏิบัติงาน'}
                                            </p>

                                            {/* Feeling Speech Bubble */}
                                            {user.feeling && (
                                                <div className="mt-3 bg-indigo-50/60 border border-indigo-100 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 italic tracking-wide max-w-[280px] leading-relaxed relative shadow-inner mx-auto">
                                                    <MessageCircle className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 -top-2 bg-white rounded-full p-0.5 border border-indigo-100" />
                                                    "{user.feeling}"
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-full h-px bg-slate-100" />

                                    {/* Character RPG Class & Attributes */}
                                    <div className="space-y-4">
                                        <div
                                            className={`p-4 rounded-3xl border ${rpgClass.color} flex flex-col gap-1 text-center shadow-inner`}
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 text-indigo-500 mb-0.5">
                                                <Award className="w-3.5 h-3.5" /> Character RPG Class
                                            </span>
                                            <span className="text-sm font-bold tracking-tight flex items-center justify-center gap-1.5">
                                                <span>{rpgClass.title}</span>
                                                <RpgClassIcon className={`w-4 h-4 shrink-0 ${rpgClass.iconClass}`} />
                                            </span>
                                            <p className="text-xs font-semibold opacity-85 leading-relaxed mt-1">
                                                {rpgClass.description}
                                            </p>
                                        </div>

                                        {/* Attribute Levels */}
                                        <div className="space-y-3">
                                            {/* Level with smooth progress */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider tabular-nums">
                                                    <span>Level {user.level || 1}</span>
                                                    <span>{score.toLocaleString()} XP</span>
                                                </div>
                                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-[2px] border border-slate-200/80 shadow-inner">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.max(levelProgress, 8)}%` }}
                                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* HP Level indicator */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider tabular-nums">
                                                    <span>Energy (พลังงาน)</span>
                                                    <span>{user.hp ?? 100}% HP</span>
                                                </div>
                                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-[2px] border border-slate-200/80 shadow-inner">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${user.hp ?? 100}%` }}
                                                        className={`h-full ${hpColor} rounded-full`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Interactive Stat Grid */}
                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                                    <Swords className="w-3.5 h-3.5 text-emerald-500" /> Missions
                                                </span>
                                                <span className="text-lg font-bold text-emerald-600 tabular-nums">
                                                    +{missions}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                                                    สำเร็จในรอบนี้
                                                </span>
                                            </div>
                                            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                                    <Shield className="w-3.5 h-3.5 text-red-500" /> Penalties
                                                </span>
                                                <span className="text-lg font-bold text-red-500 tabular-nums">
                                                    -{penalties}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                                                    ค่าปรับ / แอบอู้
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 3. Rigid Sticky Cheer Footer */}
                        {onQuickCheer && resolvedCheers && (
                            <div className="flex-shrink-0 px-6 py-4 bg-slate-50/80 border-t border-slate-100 relative z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest mb-2.5 flex items-center justify-center gap-1.5">
                                    <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-400/30" /> ส่งกำลังใจให้เพื่อนร่วมงาน
                                </p>
                                <div className="grid grid-cols-5 gap-2">
                                    {CHEER_REACTIONS.map(({ key, label, Icon, iconClass, buttonBgClass }) => {
                                        const count = resolvedCheers[key] || 0;
                                        return (
                                            <motion.button
                                                key={key}
                                                whileHover={{ scale: 1.08, y: -3 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => handleLocalReaction(e, key)}
                                                title={label}
                                                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 border rounded-2xl shadow-sm transition-colors select-none cursor-pointer ${buttonBgClass}`}
                                            >
                                                <Icon className={`w-5 h-5 ${iconClass}`} />
                                                <span className="text-[10px] font-bold tabular-nums leading-none">
                                                    {count}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default LeaderboardProfileCardModal;
