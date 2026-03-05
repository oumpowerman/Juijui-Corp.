
import React, { useMemo } from 'react';
import { Trophy, Sparkles, Star } from 'lucide-react';
import { User, WorkStatus } from '../../../../types';
import ProfileSection from './ProfileSection';
import StatsSection from './StatsSection';
import ActionButtons from './ActionButtons';
import { getTierConfig } from '../../../../config/tierSystem';

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
    
    // 1. Reactive HP Check
    const isHpLow = hpPercent < 40;
    const isMaxHp = hpPercent === 100;

    // 2. Tier Config with useMemo
    const tierConfig = useMemo(() => getTierConfig(hpPercent), [hpPercent]);

    // 3. Dynamic Styles with useMemo for Performance
    const dynamicStyles = useMemo(() => {
        const glowStrong = `rgba(${tierConfig.glowRgb}, 0.3)`;
        const glowSoft = `rgba(${tierConfig.glowRgb}, 0.1)`;
        const rayColor = `rgba(${tierConfig.rayRgb}, 0.12)`;

        return {
            glowStrong,
            glowSoft,
            rayColor,
            css: `
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
                @keyframes divine-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(${tierConfig.glowRgb}, 0.4); }
                    70% { box-shadow: 0 0 0 20px rgba(${tierConfig.glowRgb}, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(${tierConfig.glowRgb}, 0); }
                }
                .tiered-glass {
                    background: ${tierConfig.glassBg};
                    backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    transition: background 0.5s ease, backdrop-filter 0.5s ease;
                }
                .tiered-border-3d {
                    position: relative;
                    box-shadow: 
                        0 10px 30px -5px ${glowStrong},
                        0 20px 60px -10px ${glowSoft},
                        inset 0 0 0 2px rgba(255, 255, 255, 0.2);
                    transition: box-shadow 0.5s ease;
                    ${isMaxHp ? 'animation: divine-pulse 3s infinite;' : ''}
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
                    transition: background 0.5s ease;
                }
                .animate-tiered-float {
                    animation: float-tiered 5s ease-in-out infinite;
                }
            `
        };
    }, [tierConfig, isMaxHp]);

    return (
        <>
            <style>{dynamicStyles.css}</style>

            <div className="tiered-border-3d tiered-glass rounded-[2rem] p-4 sm:p-6 relative overflow-visible animate-in fade-in zoom-in-95 duration-700">
                
                {/* Background Decor - Dynamic Rays */}
                
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0">
                    <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[250%] animate-[rays-tiered_40s_linear_infinite]" 
                        style={{ 
                            background: `radial-gradient(circle at center, ${dynamicStyles.rayColor} 0%, ${dynamicStyles.rayColor.replace('0.12', '0.05')} 40%, transparent 70%)` 
                        }}
                    />
                </div>

                {/* Floating Particles */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <Sparkles className={`absolute top-10 left-1/4 w-4 h-4 ${hpPercent >= 90 ? 'text-yellow-400' : hpPercent >= 80 ? 'text-slate-400' : 'text-sky-400'} animate-pulse`} />
                    <Star className={`absolute bottom-12 right-1/3 w-3 h-3 ${hpPercent >= 90 ? 'text-yellow-300' : hpPercent >= 80 ? 'text-slate-300' : 'text-sky-300'} animate-bounce`} />
                </div>

                <div className="relative z-10">
                    {/* Header Area with Banner and Cheering Message */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`flex items-center gap-2 bg-gradient-to-r ${tierConfig.bannerGradient} bg-[length:200%_auto] animate-[shine-tiered_3s_linear_infinite] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg border border-white/20`}>
                                {tierConfig.icon}
                                <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest drop-shadow-sm">{tierConfig.label}</span>
                            </div>
                            
                            {/* Cheering Text */}
                            <div className="hidden lg:flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30 shadow-sm animate-tiered-float">
                                <Trophy className={`w-3.5 h-3.5 ${hpPercent >= 90 ? 'text-yellow-500' : hpPercent >= 80 ? 'text-slate-500' : 'text-sky-500'}`} />
                                <span className={`text-[10px] font-bold ${tierConfig.textColor} italic`}>{tierConfig.message}</span>
                            </div>
                        </div>

                        {/* Mobile/Small Screen Cheering Text */}
                        <div className="lg:hidden flex items-center gap-2 bg-white/40 px-3 py-1 rounded-lg border border-white/20 w-full sm:w-auto">
                            <Sparkles className={`w-3 h-3 shrink-0 ${hpPercent >= 90 ? 'text-yellow-500' : hpPercent >= 80 ? 'text-slate-500' : 'text-sky-500'}`} />
                            <span className={`text-[9px] font-bold ${tierConfig.textColor} italic truncate`}>{tierConfig.message}</span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 lg:gap-8">
                        
                        {/* 1. User Profile & Status */}
                        <div className="relative">
                            <ProfileSection 
                                user={user}
                                randomGreeting={randomGreeting}
                                isHpLow={isHpLow}
                                onEditProfile={onEditProfile}
                                onUpdateStatus={onUpdateStatus}
                            />
                        </div>

                        {/* 2. Stats & Gamification */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                            <div className="relative w-full lg:w-auto">
                                {/* Glow effect for stats - Reduced blur for performance */}
                                <div className="absolute inset-0 blur-xl rounded-3xl" style={{ backgroundColor: dynamicStyles.glowStrong }} />
                                <StatsSection 
                                    user={user}
                                    hpPercent={hpPercent}
                                    progressPercent={progressPercent}
                                    nextLevelXP={nextLevelXP}
                                    isHpLow={isHpLow}
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
