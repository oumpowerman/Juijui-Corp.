import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Coffee, CheckCircle2, Flame, Heart, MessageSquare, PartyPopper, RefreshCw } from 'lucide-react';
import { isSameDay, isWeekend } from 'date-fns';
import { Duty, User } from '../../types';

interface DutyGimmickSceneProps {
    duties: Duty[];
    users: User[];
    currentUser?: User;
}

export const DutyGimmickScene: React.FC<DutyGimmickSceneProps> = ({
    duties,
    users,
    currentUser
}) => {
    // Current date logic
    const today = useMemo(() => new Date(), []);
    
    // Duties for today
    const todayDuties = useMemo(() => {
        return duties.filter(d => isSameDay(new Date(d.date), today));
    }, [duties, today]);

    const hasDuties = todayDuties.length > 0;
    const completedDuties = useMemo(() => todayDuties.filter(d => d.isDone), [todayDuties]);
    const pendingDuties = useMemo(() => todayDuties.filter(d => !d.isDone), [todayDuties]);
    
    // Status identification
    const isWeekendDay = isWeekend(today);
    const isAllDone = hasDuties && pendingDuties.length === 0;
    const isPending = hasDuties && pendingDuties.length > 0;
    const isChillDay = !hasDuties || (isWeekendDay && !hasDuties);

    // People responsible today
    const assignees = useMemo(() => {
        const userMap = new Map<string, { user?: User; duty: Duty }>();
        todayDuties.forEach(d => {
            const u = users.find(user => user.id === d.assigneeId);
            userMap.set(d.id, { user: u, duty: d });
        });
        return Array.from(userMap.values());
    }, [todayDuties, users]);

    // Dialogues pool based on state
    const speechPool = useMemo(() => {
        if (isAllDone) {
            return [
                'ออฟฟิศสะอาดวิบวับ ระดับ 5 ดาว! 🌟✨',
                'กวาดสะอาดกริบ ถูเงาวับ ไร้ฝุ่นละออง! 🏆',
                'ภารกิจวันนี้คอมพลีท! ไปพักผ่อนได้ สบายใจจจ 🎉',
                'ทีมเวิร์กยอดเยี่ยมมากก แอบเห็นความเงาของพื้นแล้วปลื้มใจ 💖',
                'สะอาดขนาดนี้ ยุงยังลื่นล้มเลยบอกเลย! 🛝✨'
            ];
        }
        if (isPending) {
            const pendingNames = assignees
                .filter(a => !a.duty.isDone && a.user)
                .map(a => a.user?.name)
                .filter(Boolean);
            const nameMention = pendingNames.length > 0 ? ` ส่งกำลังใจให้ ${pendingNames.join(', ')}!` : '';

            return [
                `สู้ๆ นะพวกเรา! วันนี้เหลืออีก ${pendingDuties.length} จุดก็เสร็จแล้ว 🧹${nameMention}`,
                'กวาดตรงซอกมุม อย่าลืมเทถังขยะด้วยน้าา 🗑️',
                'เหนื่อยหน่อยแต่คุ้มค่า อย่าลืมถ่ายรูปส่งหลักฐานนะ 📸',
                'กวาดถูสไตล์ครีเอทีฟ ได้ทั้งเบิร์นแคลอรี่และได้แต้ม EXP! 🏃‍♂️💨',
                'ออฟฟิศสะอาด จิตใจแจ่มใส คอนเทนต์ปังแน่นอน! ✨'
            ];
        }
        return [
            'วันนี้วันพักผ่อน ออฟฟิศปลอดเวร นั่งชิลล์สบายใจ ☕🛌',
            'ไม่มีเวรให้กังวล ชาร์จพลังเต็มที่พร้อมลุยงานนะทุกคน! 🔋🎮',
            'แวะจิบกาแฟ ทานขนม พักสายตากันหน่อยมั้ย? 🍵🥐',
            'ออฟฟิศอยู่ในโหมดสงบ พร้อมต้อนรับสัปดาห์ใหม่! 🌿✨'
        ];
    }, [isAllDone, isPending, pendingDuties.length, assignees]);

    // Interactive speech index & click reaction
    const [speechIndex, setSpeechIndex] = useState(0);
    const [clickCount, setClickCount] = useState(0);
    const [cheerParticle, setCheerParticle] = useState<{ id: number; x: number; text: string } | null>(null);

    const handleNextDialogue = () => {
        setSpeechIndex(prev => (prev + 1) % speechPool.length);
        setClickCount(c => c + 1);

        // Fun floating reactions
        const reactions = isAllDone ? ['✨', '🏆', '🎉', '💖', '⭐'] : isPending ? ['🧹', '💦', '💪', '🔥', '🧽'] : ['☕', '💤', '🥐', '✨', '🌿'];
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        setCheerParticle({
            id: Date.now(),
            x: Math.random() * 60 - 30,
            text: randomReaction
        });

        setTimeout(() => setCheerParticle(null), 1200);
    };

    return (
        <div className="relative mt-6 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/70 dark:border-slate-800/70 shadow-lg shadow-indigo-500/5 p-4 sm:p-5 overflow-hidden transition-all duration-300">
            {/* Soft Ambient Background Glow */}
            <div className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
                isAllDone 
                    ? 'bg-emerald-400/15' 
                    : isPending 
                    ? 'bg-amber-400/15' 
                    : 'bg-indigo-400/15'
            }`} />
            <div className={`absolute -left-16 -bottom-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
                isAllDone 
                    ? 'bg-teal-400/15' 
                    : isPending 
                    ? 'bg-orange-400/15' 
                    : 'bg-purple-400/15'
            }`} />

            {/* Header / Live Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800/80 relative z-10">
                <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl transition-colors ${
                        isAllDone 
                            ? 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                            : isPending 
                            ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' 
                            : 'bg-indigo-100/80 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    }`}>
                        {isAllDone ? (
                            <Trophy className="w-4 h-4 animate-bounce" />
                        ) : isPending ? (
                            <Flame className="w-4 h-4 animate-pulse" />
                        ) : (
                            <Coffee className="w-4 h-4" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                Duty Live Scene
                            </span>
                            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                                isAllDone 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' 
                                    : isPending 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' 
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                            }`}>
                                {isAllDone ? '✨ สะอาดเรียบร้อย 100%' : isPending ? `🧹 กำลังทำเวร (ค้าง ${pendingDuties.length} รายการ)` : '☕ วันพักผ่อน ปลอดเวร'}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                            {isAllDone 
                                ? 'สมาชิกประจำวันทำความสะอาดครบทุกจุดแล้ว ขอบคุณทุกคนมากครับ!' 
                                : isPending 
                                ? 'บรรยากาศก๊วนเวรกำลังทำความสะอาดออฟฟิศวันนี้' 
                                : 'ไม่มีรายการเวรในวันนี้ ทุกคนทำงานและพักผ่อนได้อย่างสบายใจ'}
                        </p>
                    </div>
                </div>

                {/* Today's Duty Assignees Mini Badges */}
                {assignees.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mr-1">
                            เวรวันนี้:
                        </span>
                        {assignees.map(({ user, duty }) => {
                            const done = duty.isDone;
                            return (
                                <div 
                                    key={duty.id}
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                        done 
                                            ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                                            : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700'
                                    }`}
                                >
                                    {user?.avatarUrl ? (
                                        <img 
                                            src={user.avatarUrl} 
                                            alt={user.name} 
                                            className="w-4 h-4 rounded-full object-cover border border-white/80" 
                                        />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-[9px] font-bold text-indigo-700 dark:text-indigo-200">
                                            {user?.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <span className="truncate max-w-[85px]">{user?.name || 'ไม่ระบุ'}</span>
                                    {done ? (
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                    ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* The Stage Area */}
            <div className="relative pt-3 pb-1 min-h-[140px] sm:min-h-[160px] flex flex-col justify-end">
                
                {/* Speech Bubble (Interactive on Click) */}
                <div className="flex justify-center sm:justify-start sm:ml-8 mb-3 relative z-20">
                    <motion.button
                        type="button"
                        onClick={handleNextDialogue}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 shadow-md shadow-indigo-500/5 border border-indigo-100 dark:border-slate-700 text-xs font-semibold cursor-pointer transition-all"
                    >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={speechIndex}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-[280px] sm:max-w-md truncate"
                            >
                                {speechPool[speechIndex]}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-[10px] text-gray-400 group-hover:text-indigo-500 flex items-center gap-0.5 ml-1">
                            <RefreshCw className="w-2.5 h-2.5" />
                            คลิกคุย
                        </span>
                    </motion.button>

                    {/* Floating particle on click */}
                    <AnimatePresence>
                        {cheerParticle && (
                            <motion.div
                                key={cheerParticle.id}
                                initial={{ opacity: 1, y: 0, scale: 0.8, x: cheerParticle.x }}
                                animate={{ opacity: 0, y: -40, scale: 1.4 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl pointer-events-none select-none z-30"
                            >
                                {cheerParticle.text}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Animated Diorama Scene */}
                <div className="relative w-full h-24 sm:h-28 flex items-end justify-between px-2 sm:px-12 pointer-events-none select-none">
                    
                    {/* Left Decorative Prop: Office Plant & Recycling Bin */}
                    <div className="hidden sm:flex items-end gap-3 opacity-80">
                        {/* Potted Monstera / Plant */}
                        <div className="flex flex-col items-center">
                            <svg className="w-8 h-10 text-emerald-600 dark:text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8 2 5 6 6 10C7 14 11 15 12 18C13 15 17 14 18 10C19 6 16 2 12 2Z" opacity="0.85" />
                                <path d="M7 8C4 9 3 13 4 15C6 17 9 16 11 15" opacity="0.6" />
                                <path d="M17 8C20 9 21 13 20 15C18 17 15 16 13 15" opacity="0.6" />
                            </svg>
                            <div className="w-6 h-5 bg-amber-700/80 rounded-b-md rounded-t-sm border border-amber-800" />
                        </div>

                        {/* Recycle Bin */}
                        <div className="flex flex-col items-center">
                            <div className="w-7 h-9 rounded-md bg-blue-500/80 border border-blue-600 flex flex-col items-center justify-center text-white text-[8px] font-bold shadow-sm">
                                <span>♻️</span>
                            </div>
                        </div>
                    </div>

                    {/* Characters Row */}
                    <div className="flex-1 flex items-end justify-around sm:justify-center sm:gap-14 z-10">
                        
                        {/* CHARACTER 1: The Sweeper / Cleaner */}
                        <motion.div
                            className="flex flex-col items-center cursor-pointer pointer-events-auto"
                            onClick={handleNextDialogue}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="relative flex flex-col items-center">
                                {/* Sweat bead or sparkle above head */}
                                {isPending ? (
                                    <motion.span 
                                        animate={{ y: [0, -3, 0], opacity: [0.7, 1, 0.7] }} 
                                        transition={{ repeat: Infinity, duration: 1.2 }}
                                        className="text-xs text-blue-400 absolute -top-3.5 right-0"
                                    >
                                        💧
                                    </motion.span>
                                ) : isAllDone ? (
                                    <motion.span 
                                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }} 
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="text-xs text-amber-400 absolute -top-3.5 right-0"
                                    >
                                        ✨
                                    </motion.span>
                                ) : (
                                    <span className="text-xs absolute -top-3.5 right-0">☕</span>
                                )}

                                {/* Chibi Head & Face */}
                                <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-300 dark:bg-amber-200 flex items-center justify-center relative shadow-sm">
                                    {/* Hair */}
                                    <div className="absolute -top-1 w-7 h-3 bg-amber-800 rounded-t-full" />
                                    {/* Eyes & Smile */}
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1 h-1 bg-gray-800 rounded-full" />
                                        <div className="w-1 h-1 bg-gray-800 rounded-full" />
                                    </div>
                                    <div className="absolute bottom-1 w-2 h-0.5 bg-rose-400 rounded-full" />
                                </div>

                                {/* Chibi Body & Tool */}
                                <div className="relative flex items-center justify-center">
                                    {/* Shirt */}
                                    <div className={`w-6 h-6 rounded-b-md ${
                                        isAllDone ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-indigo-500'
                                    } flex items-center justify-center shadow-xs`}>
                                        <span className="text-[8px] text-white font-bold">1</span>
                                    </div>

                                    {/* Tool in hand: Broom */}
                                    {isPending ? (
                                        <motion.div
                                            animate={{ rotate: [-14, 14, -14], x: [-2, 2, -2] }}
                                            transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                                            className="absolute -right-3 bottom-0 origin-bottom"
                                        >
                                            <div className="w-1 h-10 bg-amber-600 rounded-t" />
                                            <div className="w-4 h-3 bg-amber-300 rounded-b-sm border-t border-amber-500 -ml-1.5 flex items-center justify-center">
                                                <div className="w-full h-0.5 bg-amber-400" />
                                            </div>
                                        </motion.div>
                                    ) : isAllDone ? (
                                        <motion.div 
                                            animate={{ y: [0, -2, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="absolute -right-3 bottom-1"
                                        >
                                            <span className="text-sm">✌️</span>
                                        </motion.div>
                                    ) : (
                                        <div className="absolute -right-2 bottom-1 text-xs">🧃</div>
                                    )}
                                </div>

                                {/* Feet */}
                                <div className="flex gap-2 -mt-0.5">
                                    <div className="w-2 h-1.5 bg-gray-700 rounded-b" />
                                    <div className="w-2 h-1.5 bg-gray-700 rounded-b" />
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1">
                                {isPending ? 'กวาดสะอาด' : isAllDone ? 'สดชื่น' : 'ชิลล์ๆ'}
                            </span>
                        </motion.div>

                        {/* CHARACTER 2: The Mopper / Polisher */}
                        <motion.div
                            className="flex flex-col items-center cursor-pointer pointer-events-auto"
                            onClick={handleNextDialogue}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="relative flex flex-col items-center">
                                {/* State icon above head */}
                                {isAllDone ? (
                                    <motion.span 
                                        animate={{ y: [0, -4, 0] }} 
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="text-xs absolute -top-3.5"
                                    >
                                        🏆
                                    </motion.span>
                                ) : isPending ? (
                                    <motion.span 
                                        animate={{ scale: [1, 1.2, 1] }} 
                                        transition={{ repeat: Infinity, duration: 1.4 }}
                                        className="text-xs text-cyan-400 absolute -top-3.5"
                                    >
                                        🫧
                                    </motion.span>
                                ) : (
                                    <motion.span 
                                        animate={{ opacity: [0.4, 1, 0.4] }} 
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="text-xs text-indigo-400 absolute -top-3.5"
                                    >
                                        💤
                                    </motion.span>
                                )}

                                {/* Chibi Head & Face */}
                                <div className="w-8 h-8 rounded-full bg-rose-100 border-2 border-rose-300 dark:bg-rose-200 flex items-center justify-center relative shadow-sm">
                                    {/* Hair (Ponytail style) */}
                                    <div className="absolute -top-1 w-7 h-3 bg-stone-800 rounded-t-full" />
                                    <div className="absolute -right-1 -top-0.5 w-2 h-2.5 bg-stone-800 rounded-full" />
                                    {/* Face */}
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1 h-1 bg-gray-800 rounded-full" />
                                        <div className="w-1 h-1 bg-gray-800 rounded-full" />
                                    </div>
                                    <div className="absolute bottom-1 w-2 h-1 bg-rose-400 rounded-full" />
                                </div>

                                {/* Chibi Body & Mop */}
                                <div className="relative flex items-center justify-center">
                                    <div className={`w-6 h-6 rounded-b-md ${
                                        isAllDone ? 'bg-teal-500' : isPending ? 'bg-sky-500' : 'bg-purple-500'
                                    } flex items-center justify-center shadow-xs`}>
                                        <span className="text-[8px] text-white font-bold">2</span>
                                    </div>

                                    {/* Mop */}
                                    {isPending ? (
                                        <motion.div
                                            animate={{ x: [-3, 3, -3], rotate: [-8, 8, -8] }}
                                            transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                                            className="absolute -left-3 bottom-0 origin-bottom"
                                        >
                                            <div className="w-1 h-11 bg-cyan-600 rounded-t" />
                                            <div className="w-5 h-2.5 bg-cyan-200 rounded-t-sm border border-cyan-400 -ml-2" />
                                        </motion.div>
                                    ) : isAllDone ? (
                                        <div className="absolute -left-2 bottom-1 text-xs">🌟</div>
                                    ) : (
                                        <div className="absolute -left-2 bottom-1 text-xs">🎮</div>
                                    )}
                                </div>

                                {/* Feet */}
                                <div className="flex gap-2 -mt-0.5">
                                    <div className="w-2 h-1.5 bg-gray-700 rounded-b" />
                                    <div className="w-2 h-1.5 bg-gray-700 rounded-b" />
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1">
                                {isPending ? 'ถูเงาวับ' : isAllDone ? 'แชมเปี้ยน' : 'พักสายตา'}
                            </span>
                        </motion.div>

                        {/* CHARACTER 3: The Inspector / Trash Sorter */}
                        <motion.div
                            className="flex flex-col items-center cursor-pointer pointer-events-auto"
                            onClick={handleNextDialogue}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="relative flex flex-col items-center">
                                {/* State indicator */}
                                {isAllDone ? (
                                    <motion.span 
                                        animate={{ scale: [1, 1.25, 1] }} 
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="text-xs text-pink-500 absolute -top-3.5"
                                    >
                                        💖
                                    </motion.span>
                                ) : isPending ? (
                                    <span className="text-xs text-emerald-500 absolute -top-3.5">📋</span>
                                ) : (
                                    <span className="text-xs absolute -top-3.5">🌿</span>
                                )}

                                {/* Chibi Head */}
                                <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-300 dark:bg-emerald-200 flex items-center justify-center relative shadow-sm">
                                    {/* Cap / Hat */}
                                    <div className="absolute -top-1 w-8 h-3 bg-indigo-600 rounded-t-full" />
                                    <div className="absolute top-1 -right-1 w-3 h-1 bg-indigo-700 rounded-r-full" />
                                    {/* Face */}
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-1 h-1 bg-gray-800 rounded-full" />
                                        <div className="w-1 h-1 bg-gray-800 rounded-full" />
                                    </div>
                                    <div className="absolute bottom-1 w-2 h-0.5 bg-emerald-700 rounded-full" />
                                </div>

                                {/* Chibi Body */}
                                <div className="relative flex items-center justify-center">
                                    <div className={`w-6 h-6 rounded-b-md ${
                                        isAllDone ? 'bg-purple-500' : isPending ? 'bg-emerald-600' : 'bg-slate-500'
                                    } flex items-center justify-center shadow-xs`}>
                                        <span className="text-[8px] text-white font-bold">3</span>
                                    </div>

                                    {/* Clipboard or Trash Bag */}
                                    {isPending ? (
                                        <motion.div 
                                            animate={{ y: [0, -1, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.3 }}
                                            className="absolute -right-3 bottom-0"
                                        >
                                            <div className="w-3.5 h-4.5 bg-amber-100 border border-amber-300 rounded-xs flex items-center justify-center text-[7px] text-amber-800 font-bold">
                                                ✓
                                            </div>
                                        </motion.div>
                                    ) : isAllDone ? (
                                        <div className="absolute -right-2 bottom-1 text-xs">🎉</div>
                                    ) : (
                                        <div className="absolute -right-2 bottom-1 text-xs">🪴</div>
                                    )}
                                </div>

                                {/* Feet */}
                                <div className="flex gap-2 -mt-0.5">
                                    <div className="w-2 h-1.5 bg-gray-700 rounded-b" />
                                    <div className="w-2 h-1.5 bg-gray-700 rounded-b" />
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1">
                                {isPending ? 'ตรวจเช็ก' : isAllDone ? 'แฮปปี้' : 'ผ่อนคลาย'}
                            </span>
                        </motion.div>

                    </div>

                    {/* Right Decorative Prop: Mini Smart Robot Vacuum (Roomba Gimmick) */}
                    <div className="flex items-end gap-3 opacity-90">
                        <motion.div
                            animate={{
                                x: isPending ? [-15, 15, -15] : [0, 5, 0],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: isPending ? 4 : 6,
                                ease: 'easeInOut'
                            }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-9 h-4 bg-slate-800 dark:bg-slate-700 rounded-full border-2 border-slate-600 shadow-md flex items-center justify-center relative">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    isAllDone ? 'bg-emerald-400' : isPending ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
                                }`} />
                                <div className="absolute -top-1 w-3 h-1 bg-slate-600 rounded-full" />
                            </div>
                            <span className="text-[9px] font-semibold text-gray-400 mt-0.5">
                                {isPending ? 'Auto Clean' : 'Docked'}
                            </span>
                        </motion.div>
                    </div>

                </div>

                {/* Perspective Baseboard / Floor Edge Line */}
                <div className="relative w-full mt-1">
                    <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent rounded-full" />
                    {/* Floor Reflection Highlights when All Done */}
                    {isAllDone && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent blur-xs animate-pulse" />
                    )}
                </div>

            </div>
        </div>
    );
};

export default DutyGimmickScene;
