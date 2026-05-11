
import React, { useMemo } from 'react';
import { Trophy, Sparkles, Star, ShieldCheck, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, WorkStatus } from '../../../../types';
import ProfileSection from './ProfileSection';
import StatsSection from './StatsSection';
import ActionButtons from './ActionButtons';
import { getTierConfig } from '../../../../config/tierSystem';

interface GodlyTierViewProps {
    user: User;
    hpPercent: number;
    progressPercent: number;
    nextLevelXP: number;
    randomGreeting: string;
    unreadNotifications: number;
    onUpdateStatus: (status: WorkStatus) => void;
    onOpenShop: () => void;
    onOpenNotifications: () => void;
    onEditProfile: () => void;
    onOpenWorkload: () => void;
    onOpenReport: () => void;
    onOpenRules: () => void;
    onOpenDeathHistory: () => void;
}

const GodlyTierView: React.FC<GodlyTierViewProps> = ({
    user,
    hpPercent,
    progressPercent,
    nextLevelXP,
    randomGreeting,
    unreadNotifications,
    onUpdateStatus,
    onOpenShop,
    onOpenNotifications,
    onEditProfile,
    onOpenWorkload,
    onOpenReport,
    onOpenRules,
    onOpenDeathHistory
}) => {
    const tierConfig = useMemo(() => getTierConfig(100), []);

    // 1. RAINBOW STYLES
    const rainbowStyles = useMemo(() => {
        return {
            css: `
                @keyframes rainbow-rays {
                    0% { transform: rotate(0deg) scale(1); opacity: 0.15; filter: hue-rotate(0deg); }
                    50% { transform: rotate(180deg) scale(1.2); opacity: 0.25; filter: hue-rotate(180deg); }
                    100% { transform: rotate(360deg) scale(1); opacity: 0.15; filter: hue-rotate(360deg); }
                }
                @keyframes rainbow-border {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes rainbow-shine {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes rainbow-float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-10px) translateX(5px); }
                }
                @keyframes rainbow-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(255, 100, 255, 0.4); }
                    70% { box-shadow: 0 0 0 25px rgba(100, 255, 255, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 100, 255, 0); }
                }
                .rainbow-glass {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(32px) saturate(250%);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .rainbow-border-3d {
                    position: relative;
                    box-shadow: 
                        0 12px 40px -4px rgba(255, 100, 255, 0.3),
                        0 20px 60px -8px rgba(100, 255, 255, 0.2),
                        inset 0 1px 1px 0 rgba(255, 255, 255, 0.8);
                    animation: rainbow-pulse 4s ease-in-out infinite;
                }
                .rainbow-border-3d::before {
                    content: '';
                    position: absolute;
                    inset: -3px;
                    background: linear-gradient(135deg, 
                        #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff,
                        #ff0000, #ff7f00
                    );
                    background-size: 400% 400%;
                    border-radius: 2.2rem;
                    padding: 3px;
                    z-index: -1;
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask-composite: exclude;
                    -webkit-mask-composite: destination-out;
                    animation: rainbow-border 10s linear infinite;
                    opacity: 0.9;
                }
                .rainbow-text {
                    background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: rainbow-shine 4s linear infinite;
                }
                .rainbow-bg-animated {
                    background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff);
                    background-size: 200% auto;
                    animation: rainbow-shine 4s linear infinite;
                }
            `
        };
    }, []);

    return (
        <>
            <style>{rainbowStyles.css}</style>
            
            <div className="rainbow-border-3d rainbow-glass rounded-[2rem] p-4 sm:p-8 relative overflow-visible animate-in fade-in zoom-in-95 duration-1000">
                
                {/* 1. RAINBOW AURA (Background) */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0">
                    <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] animate-[rainbow-rays_30s_linear_infinite]" 
                        style={{ 
                            background: `radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(200,200,255,0.1) 30%, transparent 60%)` 
                        }}
                    />
                    {/* Hue Rotating Layer */}
                    <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
                </div>

                {/* Floating Particles */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <motion.div animate={{ y: [-15, 15], x: [-10, 10] }} transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }} className="absolute top-10 left-[10%] text-rose-400 opacity-60"><Sparkles className="w-6 h-6" /></motion.div>
                    <motion.div animate={{ y: [15, -15], x: [10, -10] }} transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }} className="absolute bottom-10 right-[15%] text-sky-400 opacity-60"><Star className="w-5 h-5 fill-current" /></motion.div>
                    <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} className="absolute top-1/4 right-[5%] text-indigo-400 opacity-30"><Crown className="w-16 h-16" /></motion.div>
                </div>

                <div className="relative z-10">
                    {/* Header Area */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3 rainbow-bg-animated px-6 py-2.5 rounded-full shadow-2xl border border-white/40 group cursor-default">
                                <ShieldCheck className="w-5 h-5 text-white drop-shadow-md animate-pulse" />
                                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
                                    Absolute Rainbow Divinity
                                </span>
                            </div>
                            
                            {/* Cheering Text */}
                            <div className="hidden lg:flex items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/50 shadow-xl animate-[rainbow-float_6s_ease-in-out_infinite]">
                                <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
                                <span className="text-[11px] font-black rainbow-text italic">
                                    "เจ้าแห่งสายรุ้ง! พลังจุติเต็มพิกัด ไร้ผู้ต่อต้าน!"
                                </span>
                            </div>
                        </div>

                        {/* HP Status Summary */}
                        <div className="bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-3xl flex items-center gap-5 border border-white shadow-lg overflow-hidden relative">
                             <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-purple-50 opacity-50" />
                             <div className="relative flex items-center gap-3 pr-5 border-r border-slate-200">
                                 <Zap className="w-4 h-4 text-orange-500 fill-current" />
                                 <span className="text-xs font-black text-slate-700">HP: <span className="rainbow-text">100/100</span></span>
                             </div>
                             <div className="relative flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full rainbow-bg-animated" />
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rainbow Aura</span>
                             </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 lg:gap-12">
                        
                        {/* 1. Profile Section with Rainbow Halo */}
                        <div className="relative">
                            <div className="absolute -inset-8 bg-gradient-to-br from-red-400/10 via-green-400/10 to-purple-400/10 blur-[40px] rounded-full animate-pulse" />
                            <ProfileSection 
                                user={user}
                                randomGreeting={randomGreeting}
                                isHpLow={false}
                                onEditProfile={onEditProfile}
                                onUpdateStatus={onUpdateStatus}
                            />
                        </div>

                        {/* 2. Stats & Actions Wrapper */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto">
                            <div className="relative w-full lg:w-auto group">
                                {/* Intense Glow */}
                                <div className="absolute -inset-2 rainbow-bg-animated rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-1000" />
                                <div className="relative bg-white/40 p-1 rounded-[2.2rem] border border-white/60">
                                    <StatsSection 
                                        user={user}
                                        hpPercent={hpPercent}
                                        progressPercent={progressPercent}
                                        nextLevelXP={nextLevelXP}
                                        isHpLow={false}
                                        onOpenRules={onOpenRules}
                                        onOpenDeathHistory={onOpenDeathHistory}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center sm:justify-start">
                                <ActionButtons 
                                    user={user}
                                    unreadNotifications={unreadNotifications}
                                    onOpenReport={onOpenReport}
                                    onOpenWorkload={onOpenWorkload}
                                    onOpenShop={onOpenShop}
                                    onOpenNotifications={onOpenNotifications}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Progress Bar Decoration */}
                    <div className="mt-8 pt-6 border-t border-slate-200/40 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full rainbow-bg-animated w-full" />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Divine Mastery</span>
                         </div>
                         <div className="flex gap-1.5">
                             {[1,2,3,4,5,6,7].map(i => (
                                 <div key={i} className="w-1.5 h-1.5 rounded-full rainbow-bg-animated animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                             ))}
                         </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GodlyTierView;
