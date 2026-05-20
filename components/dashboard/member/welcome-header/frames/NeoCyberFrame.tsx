
import React from 'react';
import { Cpu, Terminal } from 'lucide-react';

interface FrameProps {
    children: React.ReactNode;
}

const NeoCyberFrame: React.FC<FrameProps> = ({ children }) => {
    return (
        <div className="relative p-3.5 flex items-center justify-center">
            {/* Custom Neon Cyber Engine */}
            <style>{`
                @keyframes cyber-hud-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes cyber-hud-spin-reverse {
                    0% { transform: rotate(360deg); }
                    100% { transform: rotate(0deg); }
                }
                @keyframes cyber-laser-sweep {
                    0% { top: -10%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
                @keyframes cyber-glow-pulse {
                    0%, 100% { filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.4)) drop-shadow(0 0 2px rgba(139, 92, 246, 0.2)); opacity: 0.8; }
                    50% { filter: drop-shadow(0 0 25px rgba(6, 182, 212, 0.95)) drop-shadow(0 0 8px rgba(139, 92, 246, 0.6)); opacity: 1; }
                }
                @keyframes cyber-matrix-drop {
                    0% { transform: translateY(-80px); opacity: 0; }
                    10% { opacity: 0.95; }
                    90% { opacity: 0.95; }
                    100% { transform: translateY(80px); opacity: 0; }
                }
                @keyframes cyber-hologram-flicker {
                    0%, 19.999%, 22%, 62.999%, 64%, 100% { opacity: 0.99; filter: hue-rotate(0deg) saturate(1); }
                    20%, 21.999%, 63%, 63.999% { opacity: 0.4; filter: hue-rotate(90deg) saturate(1.8) contrast(1.5); }
                }
                .animate-cyber-hud {
                    animation: cyber-hud-spin 14s linear infinite;
                }
                .animate-cyber-hud-reverse {
                    animation: cyber-hud-spin-reverse 18s linear infinite;
                }
                .animate-cyber-laser {
                    animation: cyber-laser-sweep 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .animate-cyber-glow {
                    animation: cyber-glow-pulse 3s ease-in-out infinite;
                }
                .animate-cyber-matrix-1 {
                    animation: cyber-matrix-drop 4.5s linear infinite;
                }
                .animate-cyber-matrix-2 {
                    animation: cyber-matrix-drop 6s linear infinite;
                    animation-delay: 1.5s;
                }
                .animate-cyber-matrix-3 {
                    animation: cyber-matrix-drop 5s linear infinite;
                    animation-delay: 2.8s;
                }
                .animate-cyber-flicker {
                    animation: cyber-hologram-flicker 10s linear infinite;
                }
                .cyber-3d-hud-badge {
                    background: linear-gradient(135deg, #020617 0%, #030712 50%, #0c0a09 100%);
                    box-shadow: 
                        0 0 12px rgba(6, 182, 212, 0.4),
                        inset 0 1px 0 rgba(6, 182, 212, 0.3);
                }
            `}</style>

            {/* Glowing Neon Cyberpunk Portal Aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 via-purple-500/10 to-emerald-500/20 rounded-full blur-2xl z-0 scale-125 animate-cyber-glow" />

            {/* Target Crosshairs and Angular Reticle Rings */}
            <div className="absolute inset-1 rounded-full border-2 border-cyan-500/40 pointer-events-none z-10 animate-cyber-hud flex items-center justify-center">
                {/* Crosshair ticks */}
                <div className="absolute top-0 w-0.5 h-2 bg-cyan-400 font-bold" />
                <div className="absolute bottom-0 w-0.5 h-2 bg-cyan-400 font-bold" />
                <div className="absolute left-0 h-0.5 w-2 bg-cyan-400 font-bold" />
                <div className="absolute right-0 h-0.5 w-2 bg-cyan-400 font-bold" />
                
                <div className="w-[94%] h-[94%] rounded-full border border-dashed border-purple-500/50" />
            </div>

            <div className="absolute inset-2.5 rounded-full border-2 border-dashed border-emerald-400/30 pointer-events-none z-10 animate-cyber-hud-reverse flex items-center justify-center">
                <div className="w-[92%] h-[92%] rounded-full border-[0.5px] border-cyan-300/30 border-dashed" />
            </div>

            {/* Cyber Brackets (Corner protection bounds) */}
            <div className="absolute inset-0.5 flex justify-between items-center pointer-events-none z-20">
                <div className="h-9 w-1.5 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full shadow-[0_0_10px_#06b6d4] scale-y-110" />
                <div className="h-9 w-1.5 bg-gradient-to-b from-purple-500 to-cyan-400 rounded-full shadow-[0_0_10px_#06b6d4] scale-y-110" />
            </div>

            {/* Digital Code Binary Stream Falls (Vertical scanning data matrix) */}
            <div className="absolute inset-[3px] overflow-hidden rounded-full opacity-[0.25] pointer-events-none z-10">
                <div className="absolute left-3 text-[5.5px] font-mono text-cyan-300/90 whitespace-nowrap animate-cyber-matrix-1 leading-none select-none">
                    011010101011100
                </div>
                <div className="absolute right-3 text-[5.5px] font-mono text-emerald-400/90 whitespace-nowrap animate-cyber-matrix-2 leading-none select-none">
                    010101100110110
                </div>
                <div className="absolute left-7 text-[5px] font-mono text-purple-400/90 whitespace-nowrap animate-cyber-matrix-3 leading-none select-none">
                    100111010101001
                </div>
            </div>

            {/* Corner Ornamental Micro-Chips */}
            <div className="absolute -top-1 -right-1 z-30 pointer-events-none drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]">
                <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="absolute -bottom-1 -left-1 z-30 pointer-events-none drop-shadow-[0_0_6px_rgba(139,92,246,0.6)]">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
            </div>

            {/* Raised Cyber Avatar Chamber Capsule */}
            <div className="relative z-20 w-16 h-16 lg:w-20 lg:h-20 rounded-full p-0.5 bg-black overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.65)] flex items-center justify-center animate-cyber-flicker">
                <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-cyan-950/40">
                    
                    {/* Glowing Super High-Tech Laser Beam scan line sweep */}
                    <div className="absolute left-0 right-0 h-[2.5px] bg-cyan-300 z-10 shadow-[0_0_12px_#22d3ee,0_0_5px_#a855f7] animate-cyber-laser" />

                    {React.Children.map(children, child => {
                        if (React.isValidElement(child)) {
                            if (child.type === 'img' || (child.props && child.props.src)) {
                                return React.cloneElement(child as React.ReactElement<any>, {
                                    className: "w-full h-full object-cover rounded-full min-w-full min-h-full transition-transform duration-[1000ms] ease-out hover:scale-120 hover:skew-x-2 saturate-[1.12]",
                                    style: { ...(child.props.style || {}), objectFit: 'cover' }
                                });
                            }
                        }
                        return child;
                    })}
                </div>
            </div>

            {/* Holographic 3D Metallic HUD Display tag */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-40 scale-105 pointer-events-none select-none">
                <div className="cyber-3d-hud-badge px-2 py-0.5 text-[8.5px] font-black text-cyan-300 rounded-[3px] border border-cyan-500/50 flex items-center gap-1 select-none whitespace-nowrap tracking-wider">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping shrink-0" />
                    SYS // ACTIVE
                </div>
            </div>
        </div>
    );
};

export default NeoCyberFrame;
