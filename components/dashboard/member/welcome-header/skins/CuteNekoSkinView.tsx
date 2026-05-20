import React, { useState, useEffect } from 'react';
import { User, WorkStatus } from '../../../../../types';
import ProfileSection from '../ProfileSection';
import StatsSection from '../StatsSection';
import ActionButtons from '../ActionButtons';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Gift, Award, Coffee, Star } from 'lucide-react';

interface SkinViewProps {
    user: User;
    onUpdateStatus: (status: WorkStatus) => void;
    onOpenShop: () => void;
    onEditProfile: () => void;
    onOpenRules: () => void;
    onOpenDeathHistory: () => void;
    hpPercent: number;
    progressPercent: number;
    randomGreeting: string;
    unreadNotifications: number;
    onOpenNotifications: () => void;
    onOpenWorkload: () => void;
    onOpenReport: () => void;
}

const CuteNekoSkinView: React.FC<SkinViewProps> = ({ 
    user, 
    onUpdateStatus, 
    onOpenShop, 
    onEditProfile, 
    onOpenRules, 
    onOpenDeathHistory, 
    hpPercent, 
    progressPercent,
    randomGreeting,
    unreadNotifications,
    onOpenNotifications,
    onOpenWorkload,
    onOpenReport
}) => {
    // Interactive Petting mechanics
    const [petCount, setPetCount] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(`neko_pets_${user.id}`);
            return saved ? parseInt(saved, 10) : 0;
        } catch {
            return 0;
        }
    });
    const [purrMessage, setPurrMessage] = useState<string>("ง่วงจัง... ขอลูบหัวหน่อยจิมนุษย์ 🥺");
    const [showHearts, setShowHearts] = useState<{ id: number; x: number; y: number }[]>([]);
    const [activeNekoMood, setActiveNekoMood] = useState<string>("กำลังเคลิ้ม 🐾");
    const [toyRotation, setToyRotation] = useState<number>(0);

    const checkMood = (count: number) => {
        if (count === 0) return "เหงาหงอย 😿";
        if (count < 5) return "มีความหวัง 🥺";
        if (count < 15) return "ฟินสุดๆ 😸";
        if (count < 30) return "รักเจ้านายที่สุด 💖";
        return "นิพพานแมว 🌌🐾";
    };

    const handlePetNeko = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newCount = petCount + 1;
        setPetCount(newCount);
        try {
            localStorage.setItem(`neko_pets_${user.id}`, newCount.toString());
        } catch (err) {
            console.error(err);
        }

        // Generate randomized heart animations from clicking spot
        const newHeart = {
            id: Date.now() + Math.random(),
            x: x,
            y: y - 20
        };
        setShowHearts((prev) => [...prev, newHeart].slice(-15)); // Keep max 15 hearts

        const catVoices = [
            "เหมียววว~ นวดขมับให้มนุษย์นะ 🧡",
            "งืิ้มมมม... (ครางฟืดๆ ในลำคอ) 💕",
            "นุ่มนิ่มที่สุดเลยเจ้าทาส! 😻",
            "มาลูบหัวอีกสิ เค้าชอบจัง! ✨",
            "อุ้งเท้าปึ้กๆ นวดแผ่นหลังให้ ปิ๊บๆ 🐾",
            "วันนี้แกเก่งมากนะมนุษย์ น้อนภูมิใจ! 🎀",
            "ลูบตัวยาวๆ เลยย สบายฝุดๆ~ 🛌",
            "ฟู่ฟ่าม้าววว แข็งแกร่งขึ้น 100%! 💪",
            "ขนมแมวเลียกลิ่นทูน่าต้องเข้าแล้วล่ะเจ้านาย! 🐟"
        ];
        const randomVoice = catVoices[Math.floor(Math.random() * catVoices.length)];
        setPurrMessage(randomVoice);
        setActiveNekoMood(checkMood(newCount));
        setToyRotation((prev) => prev + 45);
    };

    // Clean up older hearts
    useEffect(() => {
        if (showHearts.length > 0) {
            const timer = setTimeout(() => {
                setShowHearts((prev) => prev.slice(1));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [showHearts]);

    return (
        <div className="relative group overflow-hidden rounded-[2.5rem] p-0.5 shadow-[0_24px_55px_rgba(251,146,60,0.22)] transition-all duration-1000 select-none">
            {/* Embedded Custom Luxury Neko Stylesheet */}
            <style>{`
                @keyframes neko-walk-right-edge {
                    0% { left: -60px; transform: scaleX(1); }
                    47% { left: calc(100% - 20px); transform: scaleX(1); }
                    50% { left: calc(100% - 20px); transform: scaleX(-1); }
                    97% { left: -60px; transform: scaleX(-1); }
                    100% { left: -60px; transform: scaleX(1); }
                }
                @keyframes neko-walk-left-edge {
                    0% { right: -60px; transform: scaleX(1); }
                    47% { right: calc(100% - 20px); transform: scaleX(1); }
                    50% { right: calc(100% - 20px); transform: scaleX(-1); }
                    97% { right: -60px; transform: scaleX(-1); }
                    100% { right: -60px; transform: scaleX(1); }
                }
                @keyframes neko-peek-updown {
                    0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
                    25% { transform: translateY(-16px) rotate(-6deg) scale(1.05); }
                    50% { transform: translateY(0px) rotate(0deg) scale(1); }
                    75% { transform: translateY(-12px) rotate(6deg) scale(1.05); }
                }
                @keyframes neko-paw-drift {
                    0% { transform: translateY(80px) translateX(0) scale(0.6) rotate(0deg); opacity: 0; }
                    15% { opacity: 0.7; }
                    85% { opacity: 0.7; }
                    100% { transform: translateY(-150px) translateX(var(--paw-x, 25px)) scale(1.2) rotate(15deg); opacity: 0; }
                }
                @keyframes neko-light-glow {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
                @keyframes neko-bell-swing {
                    0%, 100% { transform: rotate(-12deg); }
                    50% { transform: rotate(12deg); }
                }
                @keyframes neko-scratch-pulse {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(251,146,60,0.2)); }
                    50% { transform: scale(1.05); filter: drop-shadow(0 0 10px rgba(244,63,94,0.5)); }
                }
                @keyframes heart-particle {
                    0% { transform: scale(0.5) translate(0, 0); opacity: 1; }
                    100% { transform: scale(1.4) translate(var(--dx, 20px), var(--dy, -60px)); opacity: 0; }
                }
                .animate-neko-walk-1 {
                    animation: neko-walk-right-edge 24s linear infinite;
                }
                .animate-neko-walk-2 {
                    animation: neko-walk-left-edge 30s linear infinite;
                    animation-delay: 5s;
                }
                .animate-neko-peek {
                    animation: neko-peek-updown 7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .animate-neko-paw-drift-1 {
                    --paw-x: 35px;
                    animation: neko-paw-drift 8s ease infinite;
                }
                .animate-neko-paw-drift-2 {
                    --paw-x: -40px;
                    animation: neko-paw-drift 11s ease infinite;
                    animation-delay: 2s;
                }
                .animate-neko-paw-drift-3 {
                    --paw-x: 25px;
                    animation: neko-paw-drift 9s ease infinite;
                    animation-delay: 4.5s;
                }
                .animate-neko-bell {
                    animation: neko-bell-swing 3.5s ease-in-out infinite;
                    transform-origin: top center;
                }
                .animate-neko-scratch {
                    animation: neko-scratch-pulse 2s ease-in-out infinite;
                }
                .neko-special-luxury-cards {
                    background: rgba(255, 255, 255, 0.77);
                    backdrop-filter: blur(24px);
                    border: 1.5px solid rgba(251, 146, 60, 0.3);
                    box-shadow: 
                        0 12px 35px -10px rgba(251, 146, 60, 0.14),
                        inset 0 1px 1.5px rgba(255, 255, 255, 0.82);
                }
                .neko-special-luxury-cards:hover {
                    background: rgba(255, 255, 255, 0.88);
                    border-color: rgba(244, 63, 94, 0.5);
                    box-shadow: 
                        0 18px 45px -5px rgba(244, 63, 94, 0.18),
                        inset 0 1px 3px rgba(255, 255, 255, 0.95);
                }
                .neko-shine-streak::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(to right, transparent, rgba(255,255,255,0.5) 50%, transparent);
                    transform: skewX(-20deg);
                    animation: neko-light-glow 12s ease-in-out infinite;
                    pointer-events: none;
                }
            `}</style>

            {/* Glowing Golden-Peach-Cotton Candy Border Frame Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 via-orange-300 via-rose-300 via-pink-300 to-amber-200 opacity-75 rounded-[2.5rem]" />

            {/* Inner Sanctuary Canvas */}
            <div className="relative m-[2px] bg-gradient-to-b from-[#fffaf0] via-[#fdf2df] to-[#f8e5ca] rounded-[2.45rem] overflow-hidden min-h-[180px] transition-all duration-500">
                
                {/* Textures with rich organic warmth */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-25 pointer-events-none z-0" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-15 pointer-events-none z-0" />
                
                {/* Dreamy Warm Radial Glows */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_15%,rgba(255,248,220,0.85)_0%,transparent_60%)] pointer-events-none z-0" />
                <div className="absolute -top-32 -left-32 w-[420px] h-[320px] bg-gradient-to-br from-amber-200/50 via-orange-100/40 to-transparent rounded-full blur-[65px] pointer-events-none z-0" />
                <div className="absolute bottom-[-80px] right-[-60px] w-[450px] h-[350px] bg-gradient-to-tl from-rose-200/60 via-amber-100/40 to-transparent rounded-full blur-[70px] pointer-events-none z-0" />

                {/* Floating Hearts particle outputs when pet */}
                <div className="absolute inset-0 pointer-events-none z-40">
                    <AnimatePresence>
                        {showHearts.map((heart) => (
                            <motion.div
                                key={heart.id}
                                initial={{ opacity: 1, scale: 0.4, x: heart.x, y: heart.y }}
                                animate={{ 
                                    opacity: 0, 
                                    scale: 1.5, 
                                    x: heart.x + (Math.random() * 80 - 40), 
                                    y: heart.y - (Math.random() * 100 + 50),
                                    rotate: Math.random() * 40 - 20
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="absolute text-xl font-bold text-rose-500 drop-shadow-sm select-none"
                            >
                                {['💖', '🐾', '😻', '✨', '🐾', '🎀'][Math.floor(Math.random() * 6)]}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Micro-sparkle floating pawprints */}
                <div className="absolute left-[14%] top-[38%] z-10 pointer-events-none animate-neko-paw-drift-1 text-sm opacity-35 select-none">🐾</div>
                <div className="absolute right-[18%] top-[28%] z-10 pointer-events-none animate-neko-paw-drift-2 text-xs opacity-30 select-none">🐾</div>
                <div className="absolute left-[45%] bottom-[25%] z-10 pointer-events-none animate-neko-paw-drift-3 text-sm opacity-40 select-none">🐾</div>

                {/* Hanging Toys & Bells Decor (Pendulum motion specs in top edges) */}
                <div className="absolute top-0 left-[18%] z-30 pointer-events-none animate-neko-bell w-4 h-16 flex flex-col items-center">
                    <div className="w-[1px] h-10 bg-orange-400/60" />
                    <div className="text-base select-none mt-[-2px]">🔔</div>
                </div>
                <div className="absolute top-0 left-[48%] z-30 pointer-events-none animate-neko-bell w-4 h-[75px] flex flex-col items-center" style={{ animationDelay: '1.2s' }}>
                    <div className="w-[1px] h-12 bg-rose-400/50" />
                    <div className="text-base select-none mt-[-2px]">🐟</div>
                </div>
                <div className="absolute top-0 right-[22%] z-30 pointer-events-none animate-neko-bell w-4 h-20 flex flex-col items-center" style={{ animationDelay: '0.6s' }}>
                    <div className="w-[1px] h-14 bg-amber-400/60" />
                    <div className="text-sm select-none mt-[-2px]">🧁</div>
                </div>

                {/* Cute visual additions: Suspended ribbon bows, milk bottles and treat box */}
                <div className="absolute top-11 right-[11%] z-10 pointer-events-none text-base select-none opacity-35 animate-[bounce_4.5s_ease-in-out_infinite]">🍼</div>
                <div className="absolute top-12 left-[12%] z-10 pointer-events-none text-base select-none opacity-30 animate-[bounce_6s_ease-in-out_infinite]">🥫</div>

                {/* ================= WALKING AND PLAYING CATS LAYER ================= */}
                {/* Cat 1: Cute Calico walking on bottom inside edge */}
                <div className="absolute bottom-1 left-0 z-30 pointer-events-none select-none text-3xl h-8 flex items-end animate-neko-walk-1">
                    🐈
                </div>

                {/* Cat 2: Sweet Black Cat walking on top banner border line */}
                <div className="absolute top-1.5 right-0 z-30 pointer-events-none select-none text-[22px] h-6 flex items-start animate-neko-walk-2">
                    🐇
                </div>

                {/* Cat 3: Chonky Sleeping Gray Tabby on a cloud bed */}
                <div className="absolute bottom-1 right-[18%] z-20 pointer-events-none select-none text-xl animate-neko-peek">
                    🐻
                </div>

                {/* Cat 4: Twin friendly kittens peeking up from the center bottom */}
                <div className="absolute bottom-[-3px] left-[26%] z-10 pointer-events-none select-none text-2xl animate-neko-peek">
                    🐱
                </div>
                <div className="absolute bottom-[-3px] left-[29.5%] z-10 pointer-events-none select-none text-xl animate-neko-peek" style={{ animationDelay: '3.5s' }}>
                    😸
                </div>

                {/* Cozy scratch post visual ornament in bottom-left */}
                <div className="absolute bottom-2 left-[10%] z-10 pointer-events-none text-3xl select-none opacity-[0.25] animate-pulse">🐶</div>

                {/* ================= CORE WIDGETS LAYOUT ================= */}
                <div className="relative z-20 p-4 sm:p-8 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 lg:gap-10">
                    
                    {/* Header Label / Edition Banner */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-3.5 w-full justify-center px-4 pointer-events-none select-none">
                        <div className="h-[2px] flex-1 max-w-[80px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-pink-500/10 px-4 py-1.5 rounded-full border border-orange-400/30 backdrop-blur-md shadow-sm">
                            <span className="text-rose-400 animate-pulse text-xs">💖</span>
                            <span className="text-[10px] font-black tracking-[0.35em] text-orange-850 drop-shadow-sm uppercase">
                                🐾 NEKO COZY PARADISE SANCTUARY 🐾
                            </span>
                            <span className="text-pink-400 animate-pulse text-xs">💖</span>
                        </div>
                        <div className="h-[2px] flex-1 max-w-[80px] bg-gradient-to-l from-transparent via-amber-400 to-transparent" />
                    </div>

                    {/* PROFILE CONTAINER - Soft cloud rounded luxurious card */}
                    <div className="relative z-30 lg:z-40 mt-3 lg:mt-0">
                        <div className="neko-special-luxury-cards rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden group/profile neko-shine-streak">
                            {/* Cute Miniature Bows and Whiskers ornaments */}
                            <div className="absolute top-3.5 left-3.5 pointer-events-none text-xs opacity-80 select-none">🎀</div>
                            <div className="absolute top-3.5 right-3.5 pointer-events-none text-xs opacity-80 select-none font-bold text-amber-500">🐾</div>
                            <div className="absolute bottom-3.5 left-3.5 pointer-events-none text-xs opacity-70 select-none">🧁</div>
                            <div className="absolute bottom-3.5 right-3.5 pointer-events-none text-xs opacity-80 select-none">🐟</div>

                            <ProfileSection 
                                user={user} 
                                onEditProfile={onEditProfile} 
                                randomGreeting={randomGreeting}
                                isHpLow={hpPercent < 30}
                                onUpdateStatus={onUpdateStatus}
                            />
                        </div>
                    </div>

                    {/* STATS, CONTROL & INTERACTIVE PETTING BOXES */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto z-20 mt-2 lg:mt-0">
                        
                        {/* MAIN STATS CONTAINER - Rose Gold/Amber framed panel */}
                        <div className="relative w-full lg:w-[360px] xl:w-[410px] group/stats">
                            <div className="neko-special-luxury-cards rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden">
                                {/* Cozy Paw Print ornaments on corners */}
                                <div className="absolute top-3.5 left-3.5 pointer-events-none text-[10px] opacity-65 select-none">😸</div>
                                <div className="absolute top-3.5 right-3.5 pointer-events-none text-[10px] opacity-65 select-none">🧁</div>
                                <div className="absolute bottom-3.5 left-3.5 pointer-events-none text-[10px] opacity-65 select-none">🥛</div>
                                <div className="absolute bottom-3.5 right-3.5 pointer-events-none text-[10px] opacity-65 select-none font-black text-rose-400 animate-pulse">💕</div>

                                <StatsSection 
                                    user={user} 
                                    hpPercent={hpPercent} 
                                    progressPercent={progressPercent}
                                    nextLevelXP={user.level * 1000}
                                    isHpLow={hpPercent < 30}
                                    onOpenRules={onOpenRules}
                                    onOpenDeathHistory={onOpenDeathHistory}
                                />
                            </div>
                        </div>

                        {/* INTERACTIVE PET-ME NEKO WIDGET (Exclusive features for Pet Lovers) */}
                        <div className="shrink-0 flex flex-col items-center justify-center p-4 rounded-[2.2rem] bg-gradient-to-tr from-orange-100/60 via-pink-100/40 to-white/70 border border-orange-300/40 shadow-inner w-full sm:w-[190px] text-center relative group/toy">
                            
                            {/* Interactive click zone area */}
                            <div 
                                onClick={handlePetNeko}
                                className="w-16 h-16 rounded-full bg-white/90 border-2 border-orange-300 flex items-center justify-center cursor-pointer shadow-md transition-all duration-350 hover:shadow-lg hover:scale-110 active:scale-95 relative overflow-visible"
                            >
                                {/* Sleeping, breathing kitty on center */}
                                <span className="text-3xl select-none select-none z-10 transition-transform duration-300 hover:rotate-12">🐱</span>
                                
                                {/* Orbiting dotted rings */}
                                <motion.div 
                                    className="absolute inset-[-4px] border border-dashed border-rose-400 rounded-full"
                                    animate={{ rotate: toyRotation }}
                                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                                />
                                
                                <span className="absolute bottom-[-5px] right-[-5px] bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full animate-bounce">
                                    ลูบๆ🐾
                                </span>
                            </div>

                            {/* Cute Speech bubble for interactive feedback */}
                            <div className="mt-2.5 max-w-[170px] bg-white border border-orange-200 shadow-sm rounded-xl py-1 px-2 relative">
                                <p className="text-[10px] font-semibold text-orange-950 leading-tight">
                                    {purrMessage}
                                </p>
                                <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-t border-l border-orange-200 rotate-45" />
                            </div>

                            {/* Pet Metics Display */}
                            <div className="mt-2 flex flex-col gap-0.5 select-none w-full">
                                <div className="flex items-center justify-between text-[9px] text-orange-850 px-1 font-bold">
                                    <span className="flex items-center gap-0.5">💘 ความฟิน:</span>
                                    <span className="text-rose-500 font-extrabold">{activeNekoMood}</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-orange-800 px-1 font-bold bg-white/55 rounded-md py-0.5 border border-orange-100/40">
                                    <span>🐾 ลูบหัวไปแล้ว:</span>
                                    <span className="text-orange-950 font-black">{petCount.toLocaleString()} ครั้ง</span>
                                </div>
                            </div>
                        </div>

                        {/* UTILITIES CONTROLS TRAY */}
                        <div className="shrink-0 flex justify-center sm:justify-start">
                            <div className="p-1 rounded-[2rem] bg-orange-100/50 border border-orange-200/50 shadow-inner">
                                <ActionButtons 
                                    user={user}
                                    unreadNotifications={unreadNotifications}
                                    onOpenShop={onOpenShop}
                                    onOpenNotifications={onOpenNotifications}
                                    onOpenReport={onOpenReport}
                                    onOpenWorkload={onOpenWorkload}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Highly-sweet sparkly badges in top right and corner bottom */}
                <div className="absolute top-5 right-10 flex items-center gap-1.5 pointer-events-none select-none z-10">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-[spin_6s_linear_infinite]" />
                    <span className="text-[9px] font-black tracking-[0.2em] text-orange-800/80 uppercase bg-white/70 px-2 py-0.5 rounded-full border border-orange-100 shadow-xs">
                        🐾 Neko.os
                    </span>
                </div>
                
                {/* Cute sub-badge on the left corner */}
                <div className="absolute bottom-3 left-8 flex items-center gap-1 text-[9px] font-black tracking-wider text-orange-700/60 pointer-events-none z-10">
                    <span>🐱 MEOW MEOW PARADISE V2.0</span>
                    <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-300 animate-pulse" />
                </div>
            </div>
        </div>
    );
};

export default CuteNekoSkinView;
