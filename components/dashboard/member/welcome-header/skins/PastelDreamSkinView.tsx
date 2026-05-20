import React from 'react';
import { User, WorkStatus } from '../../../../../types';
import ProfileSection from '../ProfileSection';
import StatsSection from '../StatsSection';
import ActionButtons from '../ActionButtons';
import { motion } from 'framer-motion';
import { Heart, Cloud, Sparkles } from 'lucide-react';

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

const PastelDreamSkinView: React.FC<SkinViewProps> = ({ 
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
        <div className="relative group overflow-hidden rounded-[2.5rem] p-0.5 shadow-[0_20px_50px_rgba(244,114,182,0.18)] transition-all duration-1000">
            {/* Embedded Custom Pastel Styles and Animations */}
            <style>{`
                @keyframes pastel-sakura-fall {
                    0% { transform: translateY(-20px) translateX(0) rotate(0deg) scale(0.6); opacity: 0; }
                    15% { opacity: 0.9; }
                    85% { opacity: 0.9; }
                    100% { transform: translateY(220px) translateX(var(--fall-x, 50px)) rotate(360deg) scale(1.2); opacity: 0; }
                }
                @keyframes pastel-cloud-slow-1 {
                    0%, 100% { transform: translateX(0) translateY(0) scale(1); opacity: 0.65; }
                    50% { transform: translateX(30px) translateY(-10px) scale(1.1); opacity: 0.9; }
                }
                @keyframes pastel-cloud-slow-2 {
                    0%, 100% { transform: translateX(0) translateY(0) scale(1.15); opacity: 0.5; }
                    50% { transform: translateX(-35px) translateY(12px) scale(0.95); opacity: 0.8; }
                }
                @keyframes pastel-cloud-slow-3 {
                    0%, 100% { transform: scale(1) translateY(0); opacity: 0.6; }
                    50% { transform: scale(1.25) translateY(-15px); opacity: 0.85; }
                }
                @keyframes pastel-shine-sweep {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
                .animate-pastel-sakura-1 {
                    --fall-x: 35px;
                    animation: pastel-sakura-fall 10s linear infinite;
                }
                .animate-pastel-sakura-2 {
                    --fall-x: -45px;
                    animation: pastel-sakura-fall 13s linear infinite;
                    animation-delay: 2.5s;
                }
                .animate-pastel-sakura-3 {
                    --fall-x: 25px;
                    animation: pastel-sakura-fall 11s linear infinite;
                    animation-delay: 4s;
                }
                .animate-pastel-sakura-4 {
                    --fall-x: -28px;
                    animation: pastel-sakura-fall 14s linear infinite;
                    animation-delay: 6s;
                }
                .animate-pastel-sakura-5 {
                    --fall-x: 40px;
                    animation: pastel-sakura-fall 9s linear infinite;
                    animation-delay: 7.5s;
                }
                .animate-pastel-cloud-1 {
                    animation: pastel-cloud-slow-1 16s ease-in-out infinite;
                }
                .animate-pastel-cloud-2 {
                    animation: pastel-cloud-slow-2 20s ease-in-out infinite;
                }
                .animate-pastel-cloud-3 {
                    animation: pastel-cloud-slow-3 24s ease-in-out infinite;
                }
                .pastel-cotton-glass {
                    background: rgba(255, 255, 255, 0.76);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(244, 114, 182, 0.25);
                    box-shadow: 
                        0 10px 30px -5px rgba(244, 114, 182, 0.1),
                        inset 0 1px 1px rgba(255, 255, 255, 0.6);
                }
                .pastel-cotton-glass:hover {
                    background: rgba(255, 255, 255, 0.9);
                    border-color: rgba(244, 114, 182, 0.45);
                    box-shadow: 
                        0 15px 35px -2px rgba(244, 114, 182, 0.18),
                        inset 0 1px 2px rgba(255, 255, 255, 0.8);
                }
                .pastel-shine-sweep::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(to right, transparent, rgba(255,255,255,0.5) 50%, transparent);
                    transform: skewX(-20deg);
                    animation: pastel-shine-sweep 12s ease-in-out infinite;
                    pointer-events: none;
                }
            `}</style>

            {/* Glowing Rose, Peach, and Lavender Border Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-300 via-rose-200 via-purple-200 to-cyan-200 opacity-70 rounded-[2.5rem]" />

            {/* Core Pastel Inner Canvas */}
            <div className="relative m-[2px] bg-gradient-to-b from-[#fdfbfb] via-[#fef0f4] to-[#f3e7f7] rounded-[2.45rem] overflow-hidden min-h-[180px] transition-all duration-500">
                
                {/* Natural Paper and Cute Diamond Textures overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-30 pointer-events-none z-0" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-20 pointer-events-none z-0" />

                {/* ADVANCED CLOUD EFFECT LAYER (Fluffy cartoon vectors floating and scaling over background) */}
                <div className="absolute -top-16 -left-12 w-[300px] h-[160px] bg-gradient-to-b from-white/80 to-pink-50/40 rounded-full blur-[40px] pointer-events-none z-0 animate-pastel-cloud-1" />
                <div className="absolute bottom-[-60px] right-[-40px] w-[350px] h-[180px] bg-gradient-to-t from-white/90 to-purple-50/40 rounded-full blur-[45px] pointer-events-none z-0 animate-pastel-cloud-2" />
                <div className="absolute top-[30%] left-[25%] w-[250px] h-[120px] bg-gradient-to-r from-pink-50/70 to-rose-100/30 rounded-full blur-[35px] pointer-events-none z-0 animate-pastel-cloud-3" />

                {/* Vectors of Clout Clutter/Hearts */}
                <div className="absolute top-12 left-1/4 opacity-[0.22] pointer-events-none z-0 animate-bounce" style={{ animationDuration: '8s' }}>
                    <Cloud className="w-8 h-8 text-pink-300" />
                </div>
                <div className="absolute bottom-10 right-1/3 opacity-[0.18] pointer-events-none z-0 animate-bounce" style={{ animationDuration: '11s' }}>
                    <Cloud className="w-10 h-10 text-purple-300" />
                </div>

                {/* SAKURA CHERRY BLOSSOM RAIN (Continuous drift throughout the board) */}
                <div className="absolute left-[8%] top-[-20px] pointer-events-none z-10 animate-pastel-sakura-1 text-base">🌸</div>
                <div className="absolute left-[38%] top-[-20px] pointer-events-none z-10 animate-pastel-sakura-2 text-sm">🌸</div>
                <div className="absolute left-[65%] top-[-20px] pointer-events-none z-10 animate-pastel-sakura-3 text-xs">🌸</div>
                <div className="absolute right-[15%] top-[-20px] pointer-events-none z-10 animate-pastel-sakura-4 text-sm">🌸</div>
                <div className="absolute right-[42%] top-[-20px] pointer-events-none z-10 animate-pastel-sakura-5 text-base">🌸</div>

                {/* Core application items */}
                <div className="relative z-10 p-4 sm:p-8 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 lg:gap-10">
                    
                    {/* Header Label / Edition Banner */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 w-full justify-center px-4 pointer-events-none">
                        <div className="h-[1px] flex-1 max-w-[50px] bg-gradient-to-r from-transparent to-pink-400" />
                        <div className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-500 animate-pulse" />
                            <span className="text-[10px] font-black tracking-[0.4em] text-pink-600 drop-shadow-sm select-none uppercase">
                                Sakura Fantasy Dream Edition
                            </span>
                        </div>
                        <div className="h-[1px] flex-1 max-w-[50px] bg-gradient-to-l from-transparent to-pink-400" />
                    </div>

                    {/* PROFILE CONTAINER (Premium Fluffy Glass Card with Heart Corners) */}
                    <div className="relative z-30 lg:z-40">
                        <div className="pastel-cotton-glass rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden pastel-shine-sweep">
                            {/* Sweet Pink Heart Corners */}
                            <div className="absolute top-3.5 left-3.5 pointer-events-none">
                                <Heart className="w-2.5 h-2.5 fill-pink-300 text-white" />
                            </div>
                            <div className="absolute top-3.5 right-3.5 pointer-events-none">
                                <Heart className="w-2.5 h-2.5 fill-pink-300 text-white" />
                            </div>
                            <div className="absolute bottom-3.5 left-3.5 pointer-events-none">
                                <Heart className="w-2.5 h-2.5 fill-pink-300 text-white" />
                            </div>
                            <div className="absolute bottom-3.5 right-3.5 pointer-events-none">
                                <Heart className="w-2.5 h-2.5 fill-pink-300 text-white" />
                            </div>

                            <ProfileSection 
                                user={user} 
                                onEditProfile={onEditProfile} 
                                randomGreeting={randomGreeting}
                                isHpLow={hpPercent < 30}
                                onUpdateStatus={onUpdateStatus}
                            />
                        </div>
                    </div>

                    {/* STATS & CONTROL CONTAINERS */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto z-20">
                        <div className="relative w-full lg:w-[410px] xl:w-[510px] group">
                            <div className="pastel-cotton-glass rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden">
                                {/* Sweet Lavender Heart corners */}
                                <div className="absolute top-3.5 left-3.5 pointer-events-none">
                                    <Heart className="w-2.5 h-2.5 fill-purple-300 text-white" />
                                </div>
                                <div className="absolute top-3.5 right-3.5 pointer-events-none">
                                    <Heart className="w-2.5 h-2.5 fill-purple-300 text-white" />
                                </div>
                                <div className="absolute bottom-3.5 left-3.5 pointer-events-none">
                                    <Heart className="w-2.5 h-2.5 fill-purple-300 text-white" />
                                </div>
                                <div className="absolute bottom-3.5 right-3.5 pointer-events-none">
                                    <Heart className="w-2.5 h-2.5 fill-purple-300 text-white" />
                                </div>

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

                        {/* UTILITIES CONTROLS (Pulsing Light Tray border) */}
                        <div className="shrink-0 flex justify-center sm:justify-start">
                            <div className="p-1 rounded-[2rem] bg-pink-100/50 border border-pink-200/50 shadow-inner">
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

                {/* Elegant Heart Sparkle Floating badge in top corner */}
                <div className="absolute top-4 right-10 flex items-center gap-1.5 pointer-events-none select-none">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400 rotate-12 animate-pulse" />
                    <span className="text-[10px] font-black tracking-widest text-pink-400/70 uppercase">Pastel Dream™</span>
                </div>
            </div>
        </div>
    );
};

export default PastelDreamSkinView;
