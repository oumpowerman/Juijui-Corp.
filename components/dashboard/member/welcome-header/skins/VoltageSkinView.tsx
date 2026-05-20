import React from 'react';
import { User, WorkStatus } from '../../../../../types';
import ProfileSection from '../ProfileSection';
import StatsSection from '../StatsSection';
import ActionButtons from '../ActionButtons';
import { motion } from 'framer-motion';
import { Zap, Cloud, Sparkles, Power, Server } from 'lucide-react';

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

const VoltageSkinView: React.FC<SkinViewProps> = ({ 
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
    // Interactive Overcharge state defaults to TRUE for maximum screen grandeur!
    const [isOverdrive, setIsOverdrive] = React.useState<boolean>(true);

    return (
        <div className="relative group overflow-hidden rounded-[2.5rem] p-0.5 shadow-[0_25px_60px_rgba(139,92,246,0.25)] border border-violet-500/30 transition-all duration-1000 select-none">
            {/* Embedded Custom High-Voltage Overdrive Animations */}
            <style>{`
                @keyframes volt-skin-border-rotate {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes volt-strike-thunder {
                    0%, 94%, 98%, 100% { opacity: 0; transform: scaleY(0) skewX(-15deg); filter: brightness(1); }
                    95% { opacity: 1; transform: scaleY(1.1) skewX(-15deg); filter: brightness(2); }
                    96% { opacity: 0.3; transform: scaleY(0.9) skewX(-15deg); }
                    97% { opacity: 1; transform: scaleY(1) skewX(-15deg); filter: brightness(2.5); }
                }
                @keyframes volt-strike-thunder-alt {
                    0%, 48%, 52%, 100% { opacity: 0; transform: scaleY(0) skewX(20deg); }
                    49% { opacity: 1; transform: scaleY(1.1) skewX(20deg); filter: brightness(2); }
                    50% { opacity: 0.3; transform: scaleY(0.8) skewX(20deg); }
                    51% { opacity: 1; transform: scaleY(1) skewX(20deg); filter: brightness(2.5); }
                }
                @keyframes volt-cloud-float-1 {
                    0%, 100% { transform: translateY(0) translateX(0) scale(1); }
                    50% { transform: translateY(-8px) translateX(15px) scale(1.08); }
                }
                @keyframes volt-cloud-float-2 {
                    0%, 100% { transform: translateY(0) translateX(0) scale(1.1); }
                    50% { transform: translateY(8px) translateX(-15px) scale(0.95); }
                }
                @keyframes volt-cloud-internal-lightning {
                    0%, 92%, 96%, 100% { background: rgba(147, 51, 234, 0.45); }
                    93%, 95% { background: rgba(253, 224, 71, 0.85); box-shadow: 0 0 25px #fde047; }
                }
                @keyframes volt-power-vibrate {
                    0%, 100% { transform: translate(0, 0); }
                    20% { transform: translate(-1px, 1px); }
                    40% { transform: translate(1px, -1px); }
                    60% { transform: translate(-1px, -1px); }
                    80% { transform: translate(1px, 1px); }
                }
                .animate-volt-skin-border {
                    background-size: 300% 300%;
                    animation: volt-skin-border-rotate 8s ease infinite;
                }
                .animate-volt-strike-1 {
                    animation: volt-strike-thunder 7s infinite;
                }
                .animate-volt-strike-2 {
                    animation: volt-strike-thunder-alt 8.5s infinite;
                    animation-delay: 2.5s;
                }
                .animate-volt-float-1 {
                    animation: volt-cloud-float-1 12s ease-in-out infinite;
                }
                .animate-volt-float-2 {
                    animation: volt-cloud-float-2 15s ease-in-out infinite;
                }
                .animate-volt-cloud-flash {
                    animation: volt-cloud-internal-lightning 5s ease-in-out infinite;
                }
                .animate-volt-vibrate {
                    animation: volt-power-vibrate 0.15s linear infinite;
                }
                .volt-panel-glass {
                    background: rgba(15, 12, 30, 0.78);
                    backdrop-filter: blur(24px) saturate(1.4);
                    border: 1.5px solid rgba(139, 92, 246, 0.3);
                    box-shadow: 
                        inset 0 1px 3px rgba(168, 85, 247, 0.2),
                        0 15px 35px rgba(0, 0, 0, 0.8);
                }
                .volt-panel-glass:hover {
                    background: rgba(22, 17, 45, 0.88);
                    border-color: rgba(253, 224, 71, 0.5);
                    box-shadow: 
                        inset 0 1px 3px rgba(253, 224, 71, 0.2),
                        0 20px 45px rgba(139, 92, 246, 0.15);
                }
            `}</style>

            {/* Glowing, Rotating Border Gradient Frame */}
            <div className={`absolute inset-0 bg-gradient-to-r from-violet-600 via-amber-400 via-purple-900 via-stone-900 via-yellow-300 to-violet-600 rounded-[2.5rem] animate-volt-skin-border ${isOverdrive ? 'opacity-100' : 'opacity-45'}`} />

            {/* Solid Obsidian Inner Core Canvas */}
            <div className="relative m-[1.5px] bg-gradient-to-b from-[#0a0715] via-[#040209] to-[#070512] rounded-[2.45rem] overflow-hidden min-h-[180px] transition-all duration-500">
                
                {/* Tech Matrix Grid backdrop */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.06)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none z-0" />

                {/* OVERDRIVE VISUAL LAYERS (Active only when switch is checked) */}
                {isOverdrive && (
                    <>
                        {/* Massive Ambient Violet Pulsing Glow behind avatar */}
                        <div className="absolute -top-24 -left-20 w-[450px] h-[300px] bg-violet-600/25 rounded-full blur-[110px] pointer-events-none z-0 animate-pulse" />
                        <div className="absolute -bottom-36 -right-32 w-[500px] h-[350px] bg-yellow-500/15 rounded-full blur-[130px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '6s' }} />

                        {/* PIKACHU LIGHTNING STRIKES (Glowing diagonal branches blasting down) */}
                        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden select-none">
                            {/* Lightning Bolt 1 */}
                            <svg className="absolute top-0 left-[22%] w-24 h-[180px] text-yellow-300 filter drop-shadow-[0_0_12px_#fbbf24] animate-volt-strike-1" viewBox="0 0 100 200" fill="none">
                                <path d="M70 0 L40 80 L65 80 L20 150 L45 150 L10 200" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {/* Lightning Bolt 2 */}
                            <svg className="absolute top-0 right-[28%] w-20 h-[190px] text-yellow-200 filter drop-shadow-[0_0_15px_#fde047] animate-volt-strike-2" viewBox="0 0 100 200" fill="none">
                                <path d="M30 0 L55 70 L35 70 L75 140 L50 140 L85 200" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        {/* FLOATING THUNDER CLOUDS (Dark violet fluffy vectors drifting & flashing internal voltage) */}
                        <div className="absolute top-4 left-[10%] pointer-events-none z-10 animate-volt-float-1 select-none flex items-center gap-1 opacity-75">
                            <div className="relative">
                                <Cloud className="w-10 h-7 text-purple-950 fill-purple-950/70 filter drop-shadow-[0_4px_8px_rgba(139,92,246,0.3)]" />
                                <div className="absolute inset-2 rounded-full blur-md opacity-70 animate-volt-cloud-flash" />
                            </div>
                            <span className="text-[6.5px] font-mono text-purple-400 font-bold uppercase tracking-widest hidden sm:inline">CHG_A4</span>
                        </div>

                        <div className="absolute bottom-6 right-[35%] pointer-events-none z-10 animate-volt-float-2 select-none flex items-center gap-1 opacity-70">
                            <span className="text-[6.5px] font-mono text-yellow-400 font-bold uppercase tracking-widest hidden sm:inline">BAT_OK</span>
                            <div className="relative">
                                <Cloud className="w-9 h-6 text-indigo-950 fill-indigo-950/80 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]" />
                                <div className="absolute inset-1.5 rounded-full blur-md opacity-60 animate-volt-cloud-flash" />
                            </div>
                        </div>

                        {/* Interactive Sparkles floating out */}
                        <div className="absolute top-12 right-1/4 opacity-40 animate-pulse pointer-events-none">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                        </div>
                    </>
                )}

                {/* Core application structure */}
                <div className={`relative z-20 p-4 sm:p-8 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 lg:gap-10 ${isOverdrive ? 'animate-volt-vibrate' : ''}`} style={{ animationDuration: '0.4s' }}>
                    
                    {/* Header Label Premium text tag + INTERACTIVE OVERDRIVE CONTROLLER */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-between w-full max-w-[92%] px-4 z-40">
                        {/* Title label */}
                        <div className="flex items-center gap-2 pointer-events-none select-none">
                            <Zap className={`w-3.5 h-3.5 text-yellow-400 shrink-0 ${isOverdrive ? 'animate-bounce' : ''}`} />
                            <span className="text-[9.5px] font-black tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-yellow-200 to-pink-200 uppercase drop-shadow">
                                Voltage Overdrive Master Edition
                            </span>
                        </div>

                        {/* COOP OVERDRIVE TOGGLE CONTROLLER SWITCH */}
                        <div className="flex items-center gap-2 bg-black/80 p-1 px-2.5 rounded-full border border-violet-500/40">
                            <span className={`text-[8px] font-black tracking-widest ${isOverdrive ? 'text-yellow-300 shadow-yellow-500/50' : 'text-stone-500'}`}>
                                {isOverdrive ? 'MAX OVERVOLT' : 'STABLE MODE'}
                            </span>
                            <button 
                                id="overdrive-boost-switch"
                                onClick={() => setIsOverdrive(!isOverdrive)}
                                className={`relative w-9 h-5 rounded-full transition-colors duration-300 focus:outline-none flex items-center p-0.5 ${isOverdrive ? 'bg-yellow-400' : 'bg-stone-800'}`}
                            >
                                <motion.div 
                                    className="w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center border border-violet-400/50"
                                    animate={{ x: isOverdrive ? 16 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                >
                                    <Power className={`w-2.5 h-2.5 ${isOverdrive ? 'text-yellow-400 animate-pulse' : 'text-stone-500'}`} />
                                </motion.div>
                            </button>
                        </div>
                    </div>

                    {/* PROFILE CONTAINER (Luxury Cyber-punk Voltage Shield) */}
                    <div className="relative z-30 lg:z-40 mt-3 lg:mt-0">
                        <div className="volt-panel-glass rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden group">
                            {/* Circuit nodes decoration */}
                            <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-violet-400/60 pointer-events-none" />
                            <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-violet-400/60 pointer-events-none" />
                            <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-violet-400/60 pointer-events-none" />
                            <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-violet-400/60 pointer-events-none" />

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
                            <div className="volt-panel-glass rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden">
                                {/* Yellow electrical node marks */}
                                <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t-2 border-l-2 border-yellow-400/40 pointer-events-none" />
                                <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t-2 border-r-2 border-yellow-400/40 pointer-events-none" />
                                <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b-2 border-l-2 border-yellow-400/40 pointer-events-none" />
                                <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b-2 border-r-2 border-yellow-400/40 pointer-events-none" />

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

                        {/* UTILITIES CONTROLS (Pulsing Shield console) */}
                        <div className="shrink-0 flex justify-center sm:justify-start">
                            <div className="p-1 rounded-[2rem] bg-stone-950/90 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)] relative">
                                <div className="absolute -top-1 -left-1">
                                    <Server className="w-3 H-3 text-violet-400 animate-pulse" />
                                </div>
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

                {/* Warning Hazard Stripe Bottom Label */}
                <div className={`absolute bottom-3 right-12 px-5 py-0.5 text-[8.5px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all duration-500 ${isOverdrive ? 'bg-yellow-400 text-black shadow-[0_0_10px_#facc15]' : 'bg-stone-800 text-stone-400'}`}>
                    <Zap className="w-2.5 h-2.5 animate-flash shrink-0" />
                    <span>OVERDRIVE PEAK CHG // ACTIVE</span>
                </div>
            </div>
        </div>
    );
};

export default VoltageSkinView;

