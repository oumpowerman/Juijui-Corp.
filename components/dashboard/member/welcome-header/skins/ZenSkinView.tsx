import React from 'react';
import { User, WorkStatus } from '../../../../../types';
import ProfileSection from '../ProfileSection';
import StatsSection from '../StatsSection';
import ActionButtons from '../ActionButtons';
import { motion } from 'framer-motion';
import { Flower, Compass } from 'lucide-react';

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

const ZenSkinView: React.FC<SkinViewProps> = ({ 
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
    return (
        <div className="relative group overflow-hidden rounded-[2.5rem] p-0.5 shadow-[0_20px_50px_rgba(16,185,129,0.15)] transition-all duration-1000">
            {/* Embedded Golden Zen Stylesheet */}
            <style>{`
                @keyframes zen-giant-mandala-spin {
                    0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
                    50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.1); }
                    100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
                }
                @keyframes zen-mist-breathe {
                    0%, 100% { opacity: 0.55; transform: scale(1); }
                    50% { opacity: 0.85; transform: scale(1.15); }
                }
                @keyframes zen-firefly-drift {
                    0% { transform: translateY(110px) translateX(0px) scale(0.5); opacity: 0; }
                    20% { opacity: 0.85; }
                    80% { opacity: 0.85; }
                    100% { transform: translateY(-160px) translateX(var(--fly-x, 20px)) scale(1.5); opacity: 0; }
                }
                @keyframes zen-light-sweep {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
                .animate-zen-mandala-bg {
                    animation: zen-giant-mandala-spin 90s linear infinite;
                }
                .animate-zen-firefly-1 {
                    --fly-x: -30px;
                    animation: zen-firefly-drift 12s linear infinite;
                }
                .animate-zen-firefly-2 {
                    --fly-x: 25px;
                    animation: zen-firefly-drift 15s linear infinite;
                    animation-delay: 3s;
                }
                .animate-zen-firefly-3 {
                    --fly-x: -15px;
                    animation: zen-firefly-drift 10s linear infinite;
                    animation-delay: 6s;
                }
                .animate-zen-firefly-4 {
                    --fly-x: 40px;
                    animation: zen-firefly-drift 18s linear infinite;
                    animation-delay: 9s;
                }
                .zen-glass-premium {
                    background: rgba(255, 255, 255, 0.72);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    box-shadow: 0 10px 40px -10px rgba(16, 185, 129, 0.08);
                }
                .zen-glass-premium:hover {
                    background: rgba(255, 255, 255, 0.85);
                    border-color: rgba(52, 211, 153, 0.55);
                    box-shadow: 0 15px 45px -5px rgba(16, 185, 129, 0.15);
                }
                .zen-shine-sweep::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(to right, transparent, rgba(255,255,255,0.45) 50%, transparent);
                    transform: skewX(-25deg);
                    animation: zen-light-sweep 15s ease-in-out infinite;
                    pointer-events: none;
                }
            `}</style>

            {/* Luxurious Golden/Teal Border Frame Accent */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-200 opacity-60 rounded-[2.5rem]" />

            {/* Inner Canvas sanctuary */}
            <div className="relative m-[2px] bg-gradient-to-b from-[#f9fbf9] via-[#edf7f3] to-[#e4f2eb] rounded-[2.45rem] overflow-hidden min-h-[180px] transition-all duration-500">
                
                {/* Paper Texture and Grid overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-30 pointer-events-none z-0" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')] opacity-10 pointer-events-none z-0" />
                
                {/* Pure White Ray Beams */}
                <div className="absolute inset-0 bg-radial-gradient(circle at top left, rgba(255,255,255,0.7) 0%, transparent 60%) pointer-events-none z-10" />

                {/* Spinning Galactic Enso / Sacred Zen Mandala (Center Background) */}
                <div className="absolute left-1/2 top-1/2 w-[380px] h-[380px] md:w-[650px] md:h-[650px] pointer-events-none opacity-[0.25] z-0">
                    <svg className="w-full h-full text-emerald-300 animate-zen-mandala-bg absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.15">
                        {/* Circular Mandala Spokes */}
                        <circle cx="50" cy="50" r="45" strokeDasharray="1 3" />
                        <circle cx="50" cy="50" r="38" />
                        <circle cx="50" cy="50" r="30" strokeDasharray="3 3"/>
                        <circle cx="50" cy="50" r="22" />
                        <circle cx="50" cy="50" r="14" strokeDasharray="1 1"/>
                        {/* Star patterns */}
                        <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" strokeWidth="0.08" strokeDasharray="2 1"/>
                        <circle cx="50" cy="50" r="5" fill="currentColor" className="opacity-10" />
                    </svg>
                </div>

                {/* Breathing Aurora Glow Mists */}
                <div className="absolute -top-32 -left-32 w-[350px] h-[350px] bg-emerald-200/50 rounded-full blur-[100px] z-0 pointer-events-none animate-pulse" />
                <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[120px] z-0 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] bg-amber-100/35 rounded-full blur-[80px] z-0 pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

                {/* Drifting Golden Firefly Sparkles (Across the entire card space) */}
                <div className="absolute left-[10%] bottom-[10%] z-20 pointer-events-none animate-zen-firefly-1 w-2.5 h-2.5 bg-gradient-to-tr from-yellow-300 to-amber-200 rounded-full shadow-[0_0_8px_#f59e0b]" />
                <div className="absolute left-[40%] bottom-[15%] z-20 pointer-events-none animate-zen-firefly-2 w-2 h-2 bg-gradient-to-tr from-emerald-300 to-teal-200 rounded-full shadow-[0_0_6px_#34d399]" />
                <div className="absolute right-[30%] bottom-[8%] z-20 pointer-events-none animate-zen-firefly-3 w-3 h-3 bg-gradient-to-tr from-yellow-200 to-teal-100 rounded-full shadow-[0_0_10px_#fef08a]" />
                <div className="absolute right-[8%] bottom-[20%] z-20 pointer-events-none animate-zen-firefly-4 w-1.5 h-1.5 bg-gradient-to-tr from-emerald-400 to-yellow-100 rounded-full shadow-[0_0_5px_#34d399]" />

                {/* Zen Floating Flowers / Botanical Icons floating in card margins */}
                <div className="absolute bottom-4 left-6 opacity-20 pointer-events-none select-none z-10 animate-bounce" style={{ animationDuration: '6s' }}>
                    <Flower className="w-5 h-5 text-emerald-800" />
                </div>
                <div className="absolute top-4 left-1/3 opacity-15 pointer-events-none select-none z-10 animate-bounce" style={{ animationDuration: '9s' }}>
                    <Flower className="w-4 h-4 text-emerald-700" />
                </div>

                {/* The main workspace layer */}
                <div className="relative z-20 p-4 sm:p-8 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 lg:gap-10">
                    
                    {/* PROFILE CONTAINER (Premium Luxury Jade Glass card with golden brackets design) */}
                    <div className="relative z-30 lg:z-40">
                        <div className="zen-glass-premium rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative group overflow-hidden zen-shine-sweep">
                            {/* Jade Corner Accents */}
                            <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-emerald-400/60 rounded-tl-sm pointer-events-none" />
                            <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-emerald-400/60 rounded-tr-sm pointer-events-none" />
                            <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-emerald-400/60 rounded-bl-sm pointer-events-none" />
                            <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-emerald-400/60 rounded-br-sm pointer-events-none" />

                            <ProfileSection 
                                user={user} 
                                onEditProfile={onEditProfile} 
                                randomGreeting={randomGreeting}
                                isHpLow={hpPercent < 30}
                                onUpdateStatus={onUpdateStatus}
                            />
                        </div>
                    </div>

                    {/* STATS & QUICK CONTROL CONTAINERS */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto z-20">
                        <div className="relative w-full lg:w-[410px] xl:w-[510px] group">
                            <div className="zen-glass-premium rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden">
                                {/* Golden Corner Accents */}
                                <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-400/50 rounded-tl-sm pointer-events-none" />
                                <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-400/50 rounded-tr-sm pointer-events-none" />
                                <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-400/50 rounded-bl-sm pointer-events-none" />
                                <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-400/50 rounded-br-sm pointer-events-none" />

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

                        {/* UTILITY BUTTONS WITH SOFT PULSING GLOWS */}
                        <div className="shrink-0 flex justify-center sm:justify-start">
                            <div className="p-1 rounded-[2rem] bg-emerald-100/45 border border-emerald-200/50 shadow-inner">
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

                {/* Highly-Polished Aesthetic Zen Label */}
                <div className="absolute top-4 right-10 flex items-center gap-2 pointer-events-none">
                    <Compass className="w-3.5 h-3.5 text-emerald-800/40 animate-[spin_12s_linear_infinite]" />
                    <span className="text-[10px] font-black text-emerald-800/45 uppercase tracking-[0.5em] drop-shadow-sm select-none">
                        🕉️ Nirvana Sanctuary Protocol
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ZenSkinView;
