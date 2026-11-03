import React, { useState, useCallback } from 'react';
import { Crown, Swords, Sparkles, Zap, Trophy } from 'lucide-react';
import { LeaderboardEntry } from '../../hooks/useLeaderboard';
import UserAvatarWithHP from '../common/UserAvatarWithHP';
import { motion, AnimatePresence } from 'framer-motion';

interface PodiumSectionProps {
    topThree: LeaderboardEntry[];
    onSelectUser?: (entry: LeaderboardEntry) => void;
}

interface PodiumItemProps {
    entry?: LeaderboardEntry;
    place: 1 | 2 | 3;
    onAvatarClick: (e: React.MouseEvent, entry: LeaderboardEntry) => void;
    onSelectUser?: (entry: LeaderboardEntry) => void;
}

const PodiumItem: React.FC<PodiumItemProps> = React.memo(({ entry, place, onAvatarClick, onSelectUser }) => {
    if (!entry) return <div className="w-full flex-1" />;

    const isGold = place === 1;
    const isSilver = place === 2;
    const isBronze = place === 3;

    // Glassy & Dimensional Styles based on rank
    const height = isGold ? 'h-80' : isSilver ? 'h-64' : 'h-52';

    // Colors & Gradients
    const podiumGradient = isGold
        ? 'from-yellow-300/80 via-amber-200/60 to-yellow-100/40 border-yellow-200/60 shadow-yellow-200/40'
        : isSilver
            ? 'from-slate-300/80 via-slate-200/60 to-slate-100/40 border-slate-200/60 shadow-slate-200/40'
            : 'from-orange-300/80 via-orange-200/60 to-orange-100/40 border-orange-200/60 shadow-orange-200/40';

    const textColor = isGold ? 'text-yellow-700' : isSilver ? 'text-slate-700' : 'text-orange-800';
    const levelBadgeColor = isGold
        ? 'bg-amber-500/15 text-amber-800 border-amber-300/60'
        : isSilver
            ? 'bg-slate-500/15 text-slate-700 border-slate-300/60'
            : 'bg-orange-500/15 text-orange-800 border-orange-300/60';

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.8,
                delay: isGold ? 0.2 : isSilver ? 0.1 : 0.3,
                type: 'spring',
                stiffness: 100,
            }}
            className="flex flex-col items-center justify-end w-1/3 relative z-10"
        >
            {/* --- FEELING BUBBLE (FLOATING) --- */}
            {entry.user.feeling && (
                <div
                    className={`
                        absolute ${isGold ? '-top-36' : '-top-32'} inset-x-0 flex justify-center z-30 pointer-events-none
                    `}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 1, type: 'spring' }}
                        className="w-max max-w-[160px]"
                    >
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="bg-white/90 backdrop-blur-md border-2 border-white/50 text-slate-700 px-4 py-2 rounded-2xl rounded-bl-none shadow-xl text-xs font-bold relative text-center leading-snug"
                        >
                            "{entry.user.feeling}"
                            <div className="absolute -bottom-2 left-0 w-4 h-4 bg-white/90 border-b-2 border-l-2 border-white/50 transform -skew-x-12" />
                        </motion.div>
                    </motion.div>
                </div>
            )}

            {/* Avatar & Crown Container with Perfectly Centered Rotative Aura Effects */}
            <div
                onClick={(e) => onAvatarClick(e, entry)}
                className="relative mb-7 group cursor-pointer perspective-1000 select-none flex items-center justify-center"
            >
                {/* 1st Place (Gold) Special Aura Effects */}
                {isGold && (
                    <>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                            {/* Inner rotating gradient backing glow */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                                className="absolute w-[170%] h-[170%] shrink-0 bg-gradient-to-tr from-yellow-300 via-amber-400 to-amber-200 opacity-30 rounded-full blur-3xl"
                            />
                            {/* Spinning outer concentric dotted gold border */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                className="absolute w-[138%] h-[138%] shrink-0 border-2 border-dashed border-yellow-400/85 rounded-full filter drop-shadow-[0_0_10px_rgba(234,179,8,0.65)]"
                            />
                            {/* Breathing concentric aura ring */}
                            <motion.div
                                animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.65, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute w-[120%] h-[120%] shrink-0 bg-yellow-400/25 rounded-full blur-md"
                            />
                        </div>

                        {/* Shiny crown centered cleanly above the HP ring */}
                        <div className="absolute -top-[4.5rem] inset-x-0 flex justify-center z-20 pointer-events-none">
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                className="relative drop-shadow-[0_10px_10px_rgba(234,179,8,0.45)]"
                            >
                                <Crown className="w-14 h-14 text-yellow-500 fill-yellow-300 stroke-[2.25px]" />
                                <motion.div
                                    animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-1.5 -right-2"
                                >
                                    <Sparkles className="w-5 h-5 text-yellow-300 fill-white" />
                                </motion.div>
                            </motion.div>
                        </div>
                    </>
                )}

                {/* 2nd Place (Silver) Special Aura Effects */}
                {isSilver && (
                    <>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                            {/* Inner rotating gradient backing glow */}
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                                className="absolute w-[155%] h-[155%] shrink-0 bg-gradient-to-tr from-slate-200 via-sky-300 to-indigo-100 opacity-25 rounded-full blur-2xl"
                            />
                            {/* Silver spinning ring */}
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                                className="absolute w-[136%] h-[136%] shrink-0 border-2 border-dashed border-slate-300/90 rounded-full filter drop-shadow-[0_0_6px_rgba(148,163,184,0.45)]"
                            />
                            {/* Inner soft breath */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute w-[118%] h-[118%] shrink-0 bg-slate-200/35 rounded-full blur-md"
                            />
                        </div>

                        <div className="absolute -top-11 inset-x-0 flex justify-center z-20 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <Trophy className="w-8 h-8 text-slate-400 fill-slate-200 drop-shadow-sm" />
                            </motion.div>
                        </div>
                    </>
                )}

                {/* 3rd Place (Bronze) Special Aura Effects */}
                {isBronze && (
                    <>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                            {/* Inner rotating gradient backing glow */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                className="absolute w-[150%] h-[150%] shrink-0 bg-gradient-to-tr from-amber-200 via-orange-300 to-orange-100 opacity-25 rounded-full blur-2xl"
                            />
                            {/* Bronze spinning ring */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                                className="absolute w-[136%] h-[136%] shrink-0 border-2 border-dashed border-orange-300/85 rounded-full filter drop-shadow-[0_0_5px_rgba(251,146,60,0.4)]"
                            />
                            {/* Bronze breathing soft aura */}
                            <motion.div
                                animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.4, 0.15] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute w-[116%] h-[116%] shrink-0 bg-orange-300/25 rounded-full blur-sm"
                            />
                        </div>

                        <div className="absolute -top-11 inset-x-0 flex justify-center z-20 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <Trophy className="w-8 h-8 text-orange-400 fill-orange-200 drop-shadow-sm" />
                            </motion.div>
                        </div>
                    </>
                )}

                <motion.div
                    whileHover={{ scale: 1.1, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="relative z-10"
                >
                    <UserAvatarWithHP
                        user={entry.user}
                        size={isGold ? '2xl' : 'xl'}
                        showLevel={false}
                        showStatus={true}
                        showAdminBadge={true}
                    />

                    {/* Centered Rank Medal Crest at Bottom of Avatar */}
                    <div className="absolute -bottom-3.5 inset-x-0 flex justify-center z-30 pointer-events-none">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg font-bold text-sm select-none tabular-nums ${
                                isGold
                                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-950'
                                    : isSilver
                                        ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800'
                                        : 'bg-gradient-to-br from-orange-400 to-amber-600 text-white'
                            }`}
                        >
                            {place}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Name, Level & Score Info */}
            <div
                onClick={() => onSelectUser && onSelectUser(entry)}
                className="text-center mb-4 z-10 relative cursor-pointer group/name select-none"
            >
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`font-bold text-slate-800 truncate max-w-[120px] md:max-w-full group-hover/name:text-indigo-600 transition-colors ${
                        isGold ? 'text-2xl drop-shadow-sm' : 'text-lg'
                    }`}
                >
                    {entry.user.name.split(' ')[0]}
                </motion.p>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="inline-flex items-center justify-center gap-1.5 bg-white/75 backdrop-blur-sm pl-2 pr-3 py-1 rounded-full shadow-sm border border-white/60 mt-1.5 hover:bg-white transition-all"
                >
                    <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums ${levelBadgeColor}`}
                    >
                        Lv.{entry.user.level || 1}
                    </span>
                    <span className={`font-bold tabular-nums ${textColor}`}>{entry.score.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">XP</span>
                </motion.div>
            </div>

            {/* Glassy Podium Block */}
            <div
                onClick={() => onSelectUser && onSelectUser(entry)}
                className={`
                    w-full ${height} rounded-t-[3rem] relative overflow-hidden shadow-2xl flex flex-col items-center pt-4
                    bg-gradient-to-b backdrop-blur-xl border-t border-x border-white/60
                    ${podiumGradient}
                    group hover:brightness-105 transition-all duration-500 cursor-pointer
                `}
            >
                {/* Inner Shine/Reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-50 pointer-events-none" />

                {/* Rank Number (Big & Glassy) */}
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.2, scale: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-8xl md:text-9xl font-black select-none relative z-0 mix-blend-overlay translate-y-4 tabular-nums"
                >
                    {place}
                </motion.span>

                {/* Stats Badge in Podium */}
                <div className="mt-auto mb-8 flex flex-col items-center gap-2 relative z-10 w-full px-4">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center justify-center gap-2 border border-white/40 shadow-sm w-full max-w-[140px]"
                    >
                        <Swords className={`w-4 h-4 ${isGold ? 'text-yellow-600' : 'text-slate-600'}`} />
                        <span className={`text-xs font-bold tabular-nums ${isGold ? 'text-yellow-900' : 'text-slate-700'}`}>
                            {entry.missions} ภารกิจ
                        </span>
                    </motion.div>

                    {isGold && (
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex items-center gap-1 text-[10px] font-bold text-yellow-700 uppercase tracking-widest"
                        >
                            <Zap className="w-3 h-3 fill-yellow-500 text-yellow-600" />
                            Top Performer
                        </motion.div>
                    )}
                </div>

                {/* Bottom Glow */}
                <div
                    className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t ${
                        isGold ? 'from-yellow-500/30' : isSilver ? 'from-slate-500/30' : 'from-orange-500/30'
                    } to-transparent`}
                />
            </div>
        </motion.div>
    );
});

PodiumItem.displayName = 'PodiumItem';

const PodiumSection: React.FC<PodiumSectionProps> = ({ topThree, onSelectUser }) => {
    // Dynamic flying sparkles state for satisfying interactive click response
    const [clickBursts, setClickBursts] = useState<
        { id: number; x: number; y: number; tx: number; ty: number; color: string; size: number }[]
    >([]);

    const triggerSparkles = useCallback(
        (e: React.MouseEvent, entry: LeaderboardEntry) => {
            const clientX = e.clientX;
            const clientY = e.clientY;

            const newSparkles = Array.from({ length: 22 }).map((_, i) => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 110 + 60;
                const size = Math.random() * 14 + 6;
                const colors = ['#facc15', '#fb923c', '#e879f9', '#22d3ee', '#38bdf8', '#fb7185', '#ffffff'];
                return {
                    id: Date.now() + i + Math.random(),
                    x: clientX,
                    y: clientY,
                    tx: Math.cos(angle) * distance,
                    ty: Math.sin(angle) * distance - 50,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size,
                };
            });

            setClickBursts((prev) => [...prev, ...newSparkles]);

            if (onSelectUser) {
                onSelectUser(entry);
            }

            setTimeout(() => {
                setClickBursts((prev) => prev.filter((p) => !newSparkles.some((n) => n.id === p.id)));
            }, 1200);
        },
        [onSelectUser]
    );

    return (
        <div className="relative pt-24 px-2 pb-12">
            {/* Portals layer for rendering Flying Click Sparkles */}
            <div className="fixed inset-0 pointer-events-none z-[99] overflow-hidden">
                <AnimatePresence>
                    {clickBursts.map((sparkle) => (
                        <motion.div
                            key={sparkle.id}
                            initial={{ x: sparkle.x, y: sparkle.y, scale: 0, opacity: 1 }}
                            animate={{
                                x: sparkle.x + sparkle.tx,
                                y: sparkle.y + sparkle.ty,
                                scale: [0, 1.3, 0],
                                opacity: [1, 0.9, 0],
                                rotate: [0, 180, 360],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                            className="absolute"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill={sparkle.color}
                                style={{ width: sparkle.size, height: sparkle.size }}
                                className="drop-shadow-[0_0_6px_currentColor] text-white"
                            >
                                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
                            </svg>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl mix-blend-multiply animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl mix-blend-multiply animate-pulse delay-1000" />
            </div>

            <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-8 max-w-5xl mx-auto h-[520px] perspective-1000">
                <PodiumItem entry={topThree[1]} place={2} onAvatarClick={triggerSparkles} onSelectUser={onSelectUser} />
                <PodiumItem entry={topThree[0]} place={1} onAvatarClick={triggerSparkles} onSelectUser={onSelectUser} />
                <PodiumItem entry={topThree[2]} place={3} onAvatarClick={triggerSparkles} onSelectUser={onSelectUser} />
            </div>
        </div>
    );
};

export default PodiumSection;
