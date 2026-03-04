
import React, { useMemo } from 'react';
import { Trophy, Sparkles, Star, ShieldCheck, Zap, Award } from 'lucide-react';
import { User, WorkStatus } from '../../../../types';
import ProfileSection from './ProfileSection';
import StatsSection from './StatsSection';
import ActionButtons from './ActionButtons';

interface TieredStateViewProps {
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

const TieredStateView: React.FC<TieredStateViewProps> = ({
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
    
    const tierConfig = useMemo(() => {
        if (hpPercent >= 90) {
            return {
                name: "DIVINE",
                label: "Divine Blessing Active",
                message: hpPercent === 100 ? "จุติเทพ! พลังชีวิตเต็มแม็กซ์ ไร้เทียมทาน! ✨" : "ออร่าเทพเจ้าแผ่กระจาย! รักษาสุขภาพระดับนี้ไว้ให้ได้นะ! 🌟",
                icon: <ShieldCheck className="w-4 h-4 text-white drop-shadow-sm" />,
                borderGradient: "linear-gradient(135deg, #ffb867 0%, #fef3c7 25%, #fffdf7 50%, #fef3c7 75%, #ffb867 100%)",
                bannerGradient: "from-amber-500 via-yellow-400 to-amber-500",
                glowColor: "rgba(251, 191, 36, 0.3)",
                rayColor: "rgba(250, 204, 21, 0.12)",
                textColor: "text-amber-700",
                glassBg: "rgba(255, 255, 255, 0.75)"
            };
        } else if (hpPercent >= 80) {
            return {
                name: "ELITE",
                label: "Elite Status Active",
                message: "ระดับอีลิท! สุขุม นุ่มลึก พร้อมลุยทุกสถานการณ์! 🥈",
                icon: <Award className="w-4 h-4 text-white drop-shadow-sm" />,
                borderGradient: "linear-gradient(135deg, #94a3b8 0%, #f8fafc 25%, #cbd5e1 50%, #f8fafc 75%, #94a3b8 100%)",
                bannerGradient: "from-slate-500 via-gray-300 to-slate-500",
                glowColor: "rgba(148, 163, 184, 0.3)",
                rayColor: "rgba(148, 163, 184, 0.1)",
                textColor: "text-slate-700",
                glassBg: "rgba(255, 255, 255, 0.8)"
            };
        } else {
            return {
                name: "STEADY",
                label: "Steady Energy Active",
                message: "พลังกายคงที่! รักษาสมดุลนี้ไว้ งานไหนก็ไม่หวั่น! 🌊",
                icon: <Zap className="w-4 h-4 text-white drop-shadow-sm" />,
                borderGradient: "linear-gradient(135deg, #0ea5e9 0%, #e0f2fe 25%, #7dd3fc 50%, #e0f2fe 75%, #0ea5e9 100%)",
                bannerGradient: "from-sky-500 via-cyan-300 to-sky-500",
                glowColor: "rgba(14, 165, 233, 0.2)",
                rayColor: "rgba(14, 165, 233, 0.08)",
                textColor: "text-sky-700",
                glassBg: "rgba(255, 255, 255, 0.85)"
            };
        }
    }, [hpPercent]);

    return (
        <>
            <style>{`
                @keyframes rays-tiered {
                    0% { transform: rotate(0deg) scale(1); opacity: 0.15; }
                    50% { transform: rotate(180deg) scale(1.1); opacity: 0.25; }
                    100% { transform: rotate(360deg) scale(1); opacity: 0.15; }
                }
                @keyframes float-tiered {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-8px) translateX(4px); }
                }
                @keyframes shine-tiered {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .tiered-glass {
                    background: ${tierConfig.glassBg};
                    backdrop-filter: blur(25px) saturate(200%);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }
                .tiered-border-3d {
                    position: relative;
                    box-shadow: 
                        0 10px 30px -5px ${tierConfig.glowColor},
                        0 20px 60px -10px ${tierConfig.glowColor.replace('0.3', '0.1').replace('0.2', '0.05')},
                        inset 0 0 0 2px rgba(255, 255, 255, 0.2);
                }
                .tiered-border-3d::before {
                    content: '';
                    position: absolute;
                    inset: -4px;
                    background: ${tierConfig.borderGradient};
                    background-size: 200% auto;
                    border-radius: 2.2rem;
                    z-index: -1;
                    animation: shine-tiered 6s linear infinite;
                }
                .animate-tiered-float {
                    animation: float-tiered 5s ease-in-out infinite;
                }
            `}</style>

            <div className="tiered-border-3d tiered-glass rounded-[2rem] p-6 relative overflow-visible animate-in fade-in zoom-in-95 duration-700">
                
                {/* Background Decor - Dynamic Rays */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0">
                    <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] animate-[rays-tiered_30s_linear_infinite]" 
                        style={{ background: `radial-gradient(circle, ${tierConfig.rayColor} 0%, transparent 60%)` }}
                    />
                </div>

                {/* Floating Particles */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <Sparkles className={`absolute top-10 left-1/4 w-4 h-4 ${hpPercent >= 90 ? 'text-yellow-400' : hpPercent >= 80 ? 'text-slate-400' : 'text-sky-400'} animate-pulse`} />
                    <Star className={`absolute bottom-12 right-1/3 w-3 h-3 ${hpPercent >= 90 ? 'text-yellow-300' : hpPercent >= 80 ? 'text-slate-300' : 'text-sky-300'} animate-bounce`} />
                </div>

                <div className="relative z-10">
                    {/* Header Area with Banner and Cheering Message */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 bg-gradient-to-r ${tierConfig.bannerGradient} bg-[length:200%_auto] animate-[shine-tiered_3s_linear_infinite] px-4 py-1.5 rounded-full shadow-lg border border-white/20`}>
                                {tierConfig.icon}
                                <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-sm">{tierConfig.label}</span>
                            </div>
                            
                            {/* Cheering Text */}
                            <div className="hidden lg:flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30 shadow-sm animate-tiered-float">
                                <Trophy className={`w-3.5 h-3.5 ${hpPercent >= 90 ? 'text-yellow-500' : hpPercent >= 80 ? 'text-slate-500' : 'text-sky-500'}`} />
                                <span className={`text-[10px] font-bold ${tierConfig.textColor} italic`}>{tierConfig.message}</span>
                            </div>
                        </div>

                        {/* Mobile/Small Screen Cheering Text */}
                        <div className="lg:hidden flex items-center gap-2 bg-white/40 px-3 py-1 rounded-lg border border-white/20">
                            <Sparkles className={`w-3 h-3 ${hpPercent >= 90 ? 'text-yellow-500' : hpPercent >= 80 ? 'text-slate-500' : 'text-sky-500'}`} />
                            <span className={`text-[9px] font-bold ${tierConfig.textColor} italic`}>{tierConfig.message}</span>
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
                                {/* Glow effect for stats */}
                                <div className="absolute inset-0 blur-2xl rounded-3xl" style={{ backgroundColor: tierConfig.glowColor }} />
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

export default TieredStateView;
