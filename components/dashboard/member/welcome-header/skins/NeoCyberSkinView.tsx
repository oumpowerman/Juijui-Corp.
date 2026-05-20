import React from 'react';
import { User, WorkStatus } from '../../../../../types';
import ProfileSection from '../ProfileSection';
import StatsSection from '../StatsSection';
import ActionButtons from '../ActionButtons';
import { Cpu, Radio, ShieldCheck, Terminal, Disc } from 'lucide-react';

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

const NeoCyberSkinView: React.FC<SkinViewProps> = ({ 
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
        <div className="relative group overflow-hidden rounded-[2.5rem] p-0.5 shadow-[0_20px_60px_rgba(6,182,212,0.25)] border border-cyan-500/20 transition-all duration-1000 select-none">
            {/* Custom Embedded Scifi Core Stylesheet */}
            <style>{`
                @keyframes cyber-skin-grid-drift {
                    0% { background-position: 0 0; }
                    100% { background-position: 40px 40px; }
                }
                @keyframes cyber-skin-scanline {
                    0% { transform: translateY(-300px); }
                    100% { transform: translateY(400px); }
                }
                @keyframes cyber-circuit-rotate {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes cyber-glitch-flicker {
                    0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 8px rgba(6,182,212,0.4)); }
                    95% { opacity: 0.85; }
                    96% { opacity: 1; filter: drop-shadow(0 0 16px rgba(139,92,246,0.8)); }
                    97% { opacity: 0.3; }
                    98% { opacity: 0.9; }
                    99% { opacity: 0.5; }
                }
                .animate-cyber-grid-drift {
                    animation: cyber-skin-grid-drift 8s linear infinite;
                }
                .animate-cyber-skin-scan {
                    animation: cyber-skin-scanline 7s linear infinite;
                }
                .animate-cyber-circuit {
                    background-size: 300% 300%;
                    animation: cyber-circuit-rotate 12s ease infinite;
                }
                .animate-cyber-glitch-flicker {
                    animation: cyber-glitch-flicker 15s linear infinite;
                }
                .cyber-hud-glass-panel {
                    background: rgba(2, 6, 23, 0.72);
                    backdrop-filter: blur(24px) saturate(1.5);
                    border: 1.5px solid rgba(6, 182, 212, 0.25);
                    box-shadow: 
                        inset 0 1px 3px rgba(6, 182, 212, 0.1),
                        0 10px 30px rgba(0, 0, 0, 0.8);
                }
                .cyber-hud-glass-panel:hover {
                    background: rgba(3, 7, 28, 0.82);
                    border-color: rgba(6, 182, 212, 0.55);
                    box-shadow: 
                        inset 0 1px 3px rgba(139, 92, 246, 0.25),
                        0 15px 40px rgba(6, 182, 212, 0.2);
                }
            `}</style>

            {/* Glowing Neon Cyber Boundary Tracers */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-slate-900 via-purple-500 via-slate-950 via-cyan-400 via-emerald-500 to-cyan-500 animate-cyber-circuit rounded-[2.5rem]" />

            {/* Inner Cyber Sanctum Chamber */}
            <div className="relative m-[1px] bg-gradient-to-b from-[#020512] via-[#050b1a] to-[#01030a] rounded-[2.45rem] overflow-hidden min-h-[180px] transition-all duration-500">
                
                {/* Tactical HUD Holographic Grids */}
                <div 
                    className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.06)_1px,transparent_1px)] bg-[size:20px_20px] animate-cyber-grid-drift pointer-events-none z-0" 
                />
                
                {/* Horizontal Neon Scanning Ray Bar */}
                <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] pointer-events-none z-10 animate-cyber-skin-scan" />

                {/* Cyber SciFi Diagnostics Telemetry Overlays */}
                <div className="absolute top-12 left-10 pointer-events-none select-none opacity-20 text-[6.5px] font-mono text-cyan-400 space-y-0.5 tracking-wider hidden md:block">
                    <div>CPU.LOAD: 42.12Ghz [OK]</div>
                    <div>NET.PING: 0.12ms [STABLE]</div>
                    <div>UUID // 7BA63228-8A03</div>
                </div>
                <div className="absolute bottom-12 right-10 pointer-events-none select-none opacity-25 text-[6.5px] font-mono text-cyan-400 space-y-0.5 tracking-wider hidden md:block text-right">
                    <div>MEM.ALLOC // SWAP_01_ON</div>
                    <div>LOGS_RECV // 100%_SECURE</div>
                    <div>SECURE_CORE // KERNEL_OK</div>
                </div>

                {/* Vector HUD Circles */}
                <div className="absolute -left-16 -top-16 w-36 h-36 rounded-full border-2 border-cyan-500/10 pointer-events-none select-none animate-spin" style={{ animationDuration: '60s' }} />
                <div className="absolute -right-20 -bottom-20 w-44 h-44 rounded-full border border-dashed border-cyan-500/5 pointer-events-none select-none animate-spin" style={{ animationDuration: '80s' }} />

                {/* Core HUD Structure */}
                <div className="relative z-10 p-4 sm:p-8 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 lg:gap-10">
                    
                    {/* Holographic Header Banner */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 w-full justify-center px-4 pointer-events-none select-none">
                        <div className="h-[1px] flex-1 max-w-[50px] bg-gradient-to-r from-transparent to-cyan-500/80" />
                        <div className="flex items-center gap-1.5 animate-cyber-glitch-flicker">
                            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                            <span className="text-[10px] font-black tracking-[0.45em] text-cyan-300 drop-shadow-[0_0_4px_#06b6d4] uppercase">
                                Neo-Cyber Overlord Protocol
                            </span>
                        </div>
                        <div className="h-[1px] flex-1 max-w-[50px] bg-gradient-to-l from-transparent to-cyan-500/80" />
                    </div>

                    {/* PROFILE CHAMBER (Glass HUD with neon telemetry points) */}
                    <div className="relative z-30 lg:z-40">
                        <div className="cyber-hud-glass-panel rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden group">
                            {/* Neon Crosshair Ticks around the inner box */}
                            <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none" />
                            <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none" />
                            <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none" />
                            <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none" />

                            <ProfileSection 
                                user={user} 
                                onEditProfile={onEditProfile} 
                                randomGreeting={randomGreeting}
                                isHpLow={hpPercent < 30}
                                onUpdateStatus={onUpdateStatus}
                            />
                        </div>
                    </div>

                    {/* STATS & QUICK CONTROLS AREA */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto z-20">
                        <div className="relative w-full lg:w-[410px] xl:w-[510px] group">
                            <div className="cyber-hud-glass-panel rounded-[2.5rem] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden">
                                {/* Neon Emerald Crosshair corners */}
                                <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-emerald-400/40 pointer-events-none" />
                                <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-emerald-400/40 pointer-events-none" />
                                <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-emerald-400/40 pointer-events-none" />
                                <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-emerald-400/40 pointer-events-none" />

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

                        {/* UTILITIES CONTROLLER TRAY (Pulsing Dark Grid Bracket) */}
                        <div className="shrink-0 flex justify-center sm:justify-start">
                            <div className="p-1 rounded-[2rem] bg-slate-950/90 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative">
                                <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-400" />
                                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-cyan-400" />
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

                {/* Futuristic Holographic Bottom Link Stamp */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-cyan-500 text-[10px] font-black text-slate-900 px-3.5 py-0.5 rounded-t-lg z-20 flex items-center gap-1.5 shadow-[0_-2px_10px_#06b6d4]">
                    <Disc className="w-3 h-3 bg-slate-950 rounded-full text-cyan-400 animate-spin" />
                    <span className="tracking-widest uppercase">Neo-Cyber Link Live</span>
                </div>
            </div>
        </div>
    );
};

export default NeoCyberSkinView;
