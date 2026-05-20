import React from 'react';
import { User, WorkStatus } from '../../../../../types';
import ProfileSection from '../ProfileSection';
import StatsSection from '../StatsSection';
import ActionButtons from '../ActionButtons';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';

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

const OnyxLuxeSkinView: React.FC<SkinViewProps> = ({ 
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
        <div className="relative group overflow-hidden rounded-[2.5rem] p-0.5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-amber-600/30 transition-all duration-1000 select-none">
            {/* Embedded Custom Stylesheet for Onyx Luxe Superiority */}
            <style>{`
                @keyframes onyx-skin-border-rotate {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes onyx-skin-sweep {
                    0% { left: -150%; }
                    50% { left: 250%; }
                    100% { left: 250%; }
                }
                @keyframes onyx-skin-sparkle {
                    0%, 100% { opacity: 0.15; transform: scale(0.8) translateY(0); }
                    50% { opacity: 0.85; transform: scale(1.4) translateY(-15px); }
                }
                .animate-onyx-skin-border {
                    background-size: 300% 300%;
                    animation: onyx-skin-border-rotate 10s ease infinite;
                }
                .animate-onyx-skin-sweep {
                    animation: onyx-skin-sweep 12s cubic-bezier(0.16, 1, 0.3, 1) infinite;
                }
                .onyx-glass-dark {
                    background: rgba(12, 10, 9, 0.82);
                    backdrop-filter: blur(24px);
                    border: 1px solid rgba(245, 158, 11, 0.22);
                    box-shadow: 
                        inset 0 1px 2px rgba(255,255,255,0.08),
                        0 12px 36px rgba(0,0,0,0.6);
                }
                .onyx-glass-dark:hover {
                    background: rgba(18, 16, 15, 0.9);
                    border-color: rgba(251, 191, 36, 0.5);
                    box-shadow: 
                        inset 0 1px 3px rgba(255,255,255,0.12),
                        0 16px 45px rgba(217, 119, 6, 0.15);
                }
            `}</style>

            {/* Glowing, Rotating Golden Boundary Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-[#1c1917] via-amber-300 via-[#0c0a09] via-yellow-200 via-amber-500 to-amber-600 animate-onyx-skin-border rounded-[2.5rem]" />

            {/* Premium Inner Leather Sanctuary Canvas */}
            <div className="relative m-[1px] bg-gradient-to-b from-[#141211] via-[#090808] to-[#12100f] rounded-[2.45rem] overflow-hidden min-h-[180px] transition-all duration-500">
                
                {/* Genuine Luxury Leather Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-50 mix-blend-overlay pointer-events-none z-0" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] opacity-20 pointer-events-none z-0" />

                {/* Golden Sweeping Ray Beams running across background */}
                <div className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-amber-400/5 to-transparent skew-x-12 animate-onyx-skin-sweep pointer-events-none z-0" />

                {/* Ambient Golden Mists (Pulsing back glow) */}
                <div className="absolute -top-32 -left-32 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[110px] z-0 pointer-events-none animate-pulse" />
                <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[140px] z-0 pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />

                {/* Interactive Star & Diamond Micro sparkles on the skins */}
                <div className="absolute top-4 right-1/4 opacity-30 animate-pulse pointer-events-none">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="absolute bottom-6 left-1/3 opacity-25 animate-bounce pointer-events-none" style={{ animationDuration: '5s' }}>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                </div>

                {/* Core application body */}
                <div className="relative z-10 p-4 sm:p-8 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 lg:gap-10">
                    
                    {/* Header Label Premium text tag */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 w-full justify-center px-4 pointer-events-none">
                        <div className="h-[1px] flex-1 max-w-[50px] bg-gradient-to-r from-transparent to-amber-500/80" />
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span className="text-[10px] font-black tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-100 uppercase select-none drop-shadow">
                                Royal Onyx Sanctuary Edition
                            </span>
                        </div>
                        <div className="h-[1px] flex-1 max-w-[50px] bg-gradient-to-l from-transparent to-amber-500/80" />
                    </div>

                    {/* PROFILE CONTAINER (Luxury Dark Onyx Gold Beveled Glass) */}
                    <div className="relative z-30 lg:z-40">
                        <div className="onyx-glass-dark rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative group overflow-hidden">
                            {/* Gold Corner Lockets */}
                            <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400/50 rounded-tl-[3px] pointer-events-none" />
                            <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400/50 rounded-tr-[3px] pointer-events-none" />
                            <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400/50 rounded-bl-[3px] pointer-events-none" />
                            <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400/50 rounded-br-[3px] pointer-events-none" />

                            <ProfileSection 
                                user={user} 
                                onEditProfile={onEditProfile} 
                                randomGreeting={randomGreeting}
                                isHpLow={hpPercent < 30}
                                onUpdateStatus={onUpdateStatus}
                            />
                        </div>
                    </div>

                    {/* STATS SECTION CONTAINER */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto z-20">
                        <div className="relative w-full lg:w-[410px] xl:w-[510px] group">
                            <div className="onyx-glass-dark rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden">
                                {/* Amber corner brackets */}
                                <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-500/30 rounded-tl-sm pointer-events-none" />
                                <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-500/30 rounded-tr-sm pointer-events-none" />
                                <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-500/30 rounded-bl-sm pointer-events-none" />
                                <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-500/30 rounded-br-sm pointer-events-none" />

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

                        {/* UTILITIES CONTROLS (Pulsing Dark Tray) */}
                        <div className="shrink-0 flex justify-center sm:justify-start">
                            <div className="p-1 rounded-[2rem] bg-stone-950/80 border border-stone-800/60 shadow-2xl">
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

                {/* Elegant Footer Badge Signature */}
                <div className="absolute bottom-3 right-10 flex items-center gap-1.5 pointer-events-none select-none">
                    <span className="text-[10px] uppercase font-black tracking-widest text-amber-500/30">Onyx Selection™</span>
                </div>
            </div>
        </div>
    );
};

export default OnyxLuxeSkinView;
