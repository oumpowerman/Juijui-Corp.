
import React, { useMemo } from 'react';
import { Trophy, Sparkles, Star, Heart, ShieldCheck } from 'lucide-react';
import { User, WorkStatus } from '../../../../types';
import ProfileSection from './ProfileSection';
import StatsSection from './StatsSection';
import ActionButtons from './ActionButtons';

interface DivineStateViewProps {
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

const DivineStateView: React.FC<DivineStateViewProps> = ({
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
    
    const divineMessage = useMemo(() => {
        if (hpPercent === 100) return "สถานะ: จุติเทพ! พลังชีวิตเต็มแม็กซ์ ไร้เทียมทาน! ✨";
        if (hpPercent >= 95) return "สุดยอดไปเลย! พลังกายเต็มเปี่ยม รักษาความฟิตนี้ไว้เพื่อชัยชนะ! 🏆";
        return "ออร่าเทพเจ้าแผ่กระจาย! รักษาสุขภาพระดับนี้ไว้ให้ได้นะ! 🌟";
    }, [hpPercent]);

    return (
        <>
            <style>{`
                @keyframes divine-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(250, 204, 21, 0.4), 0 0 40px rgba(250, 204, 21, 0.2); }
                    50% { box-shadow: 0 0 35px rgba(250, 204, 21, 0.6), 0 0 70px rgba(250, 204, 21, 0.3); }
                }
                @keyframes rays {
                    0% { transform: rotate(0deg) scale(1); opacity: 0.15; }
                    50% { transform: rotate(180deg) scale(1.1); opacity: 0.25; }
                    100% { transform: rotate(360deg) scale(1); opacity: 0.15; }
                }
                @keyframes float-divine {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-8px) translateX(4px); }
                }
                @keyframes shine-gold {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .divine-glass {
                    background: rgba(255, 255, 255, 0.75);
                    backdrop-filter: blur(25px) saturate(200%);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }
                .divine-border-3d {
                    position: relative;
                    box-shadow: 
                        0 10px 30px -5px rgba(217, 119, 6, 0.3),
                        0 20px 60px -10px rgba(251, 191, 36, 0.2),
                        inset 0 0 0 2px rgba(251, 191, 36, 0.5),
                        inset 0 0 20px rgba(251, 191, 36, 0.2);
                }
                .divine-border-3d::before {
                    content: '';
                    position: absolute;
                    inset: -4px;
                    background: linear-gradient(
                        135deg, 
                        #ffb867 0%, 
                        #fef3c7 25%, 
                        #fffdf7 50%, 
                        #fef3c7 75%, 
                        #ffb867 100%
                    );
                    background-size: 200% auto;
                    border-radius: 2.2rem;
                    z-index: -1;
                    animation: shine-gold 6s linear infinite;
                }
                .animate-divine-float {
                    animation: float-divine 5s ease-in-out infinite;
                }
            `}</style>

            <div className="divine-border-3d divine-glass rounded-[2rem] p-6 relative overflow-visible animate-in fade-in zoom-in-95 duration-700">
                
                {/* Heavenly Rays Background - More subtle and pushed back */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(250,204,21,0.12)_0%,transparent_60%)] animate-[rays_30s_linear_infinite]" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-yellow-200/30 to-white/0 rounded-bl-full" />
                </div>

                {/* Floating Particles */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <Sparkles className="absolute top-10 left-1/4 w-4 h-4 text-yellow-400 animate-pulse" />
                    <Star className="absolute bottom-12 right-1/3 w-3 h-3 text-yellow-300 animate-bounce" />
                    <Sparkles className="absolute top-1/3 right-20 w-5 h-5 text-yellow-500 animate-pulse opacity-40" />
                </div>

                <div className="relative z-10">
                    {/* Header Area with Banner and Cheering Message - Planned Layout */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_auto] animate-[shine-gold_3s_linear_infinite] px-4 py-1.5 rounded-full shadow-lg shadow-yellow-200/50 border border-yellow-200/50">
                                <ShieldCheck className="w-4 h-4 text-white drop-shadow-sm" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-sm">Divine Blessing Active</span>
                            </div>
                            
                            {/* Cheering Text - Now integrated into the header to avoid overlap */}
                            <div className="hidden lg:flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-yellow-200/50 shadow-sm animate-divine-float">
                                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                                <span className="text-[10px] font-bold text-amber-700 italic">{divineMessage}</span>
                            </div>
                        </div>

                        {/* Mobile/Small Screen Cheering Text */}
                        <div className="lg:hidden flex items-center gap-2 bg-white/40 px-3 py-1 rounded-lg border border-yellow-100/50">
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                            <span className="text-[9px] font-bold text-amber-800 italic">{divineMessage}</span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        
                        {/* 1. User Profile & Status */}
                        <div className="relative">
                            <ProfileSection 
                                user={user}
                                randomGreeting={randomGreeting}
                                isHpLow={false}
                                onEditProfile={onEditProfile}
                                onUpdateStatus={onUpdateStatus}
                            />
                        </div>

                        {/* 2. Stats & Gamification */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                            <div className="relative">
                                {/* Glow effect for stats in divine state */}
                                <div className="absolute inset-0 bg-yellow-400/5 blur-2xl rounded-3xl" />
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
            </div>
        </>
    );
};

export default DivineStateView;
