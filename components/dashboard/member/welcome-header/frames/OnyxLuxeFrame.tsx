
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Crown } from 'lucide-react';

interface FrameProps {
    children: React.ReactNode;
}

const OnyxLuxeFrame: React.FC<FrameProps> = ({ children }) => {
    return (
        <div className="relative p-3 flex items-center justify-center">
            {/* Custom Animation Stylesheet for Onyx Luxe Superiority */}
            <style>{`
                @keyframes onyx-gold-sweep {
                    0% { transform: translate(-150%, -150%) rotate(45deg); opacity: 0; }
                    15% { opacity: 0.82; }
                    30% { transform: translate(150%, 150%) rotate(45deg); opacity: 0; }
                    100% { transform: translate(150%, 150%) rotate(45deg); opacity: 0; }
                }
                @keyframes onyx-border-rotate {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes onyx-pulse-glow {
                    0%, 100% { opacity: 0.25; filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.4)); }
                    50% { opacity: 0.65; filter: drop-shadow(0 0 35px rgba(251, 191, 36, 0.85)); }
                }
                @keyframes onyx-sparkle-rise {
                    0% { transform: translate(0, 25px) scale(0.3); opacity: 0; }
                    15% { opacity: 1; }
                    85% { opacity: 1; }
                    100% { transform: translate(var(--sp-x, 15px), -45px) scale(1.1); opacity: 0; }
                }
                .animate-onyx-sweep {
                    animation: onyx-gold-sweep 5.5s cubic-bezier(0.16, 1, 0.3, 1) infinite;
                }
                .animate-onyx-border {
                    background-size: 300% 300%;
                    animation: onyx-border-rotate 8s ease infinite;
                }
                .animate-onyx-glow {
                    animation: onyx-pulse-glow 3.5s ease-in-out infinite;
                }
                .animate-onyx-sparkle-1 {
                    --sp-x: -25px;
                    animation: onyx-sparkle-rise 6.5s ease infinite;
                }
                .animate-onyx-sparkle-2 {
                    --sp-x: 23px;
                    animation: onyx-sparkle-rise 8.5s ease infinite;
                    animation-delay: 2s;
                }
                .animate-onyx-sparkle-3 {
                    --sp-x: -8px;
                    animation: onyx-sparkle-rise 7.5s ease infinite;
                    animation-delay: 4.2s;
                }
                .onyx-3d-badge {
                    background: linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%);
                    box-shadow: 
                        0 4px 10px rgba(0,0,0,0.5),
                        inset 0 1px 0 rgba(255,255,255,0.4),
                        inset 0 -1px 2px rgba(0,0,0,0.4);
                }
            `}</style>

            {/* Aura Bloom Golden Background Glow */}
            <div className="absolute inset-0 bg-yellow-600/30 rounded-full blur-2xl z-0 scale-125 animate-onyx-glow" />

            {/* Solid Obsidian Matte Outer Ring with Gold Bevel */}
            <div className="absolute inset-0 bg-gradient-to-[#1c1917] via-[#0c0a09] to-[#1c1917] rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.7)] border-2 border-amber-500/20" />

            {/* Liquid Shiny Spinning Metallics Multi-Gradient Border */}
            <div className="absolute inset-[3px] rounded-full p-[2.5px] bg-gradient-to-r from-amber-600 via-yellow-200 via-amber-400 via-stone-900 via-yellow-100 to-amber-600 animate-onyx-border">
                {/* Matte Obsidian Inner core wall line */}
                <div className="w-full h-full bg-[#141212] rounded-full border border-black" />
            </div>

            {/* Rising Luxury Golden Dust / Diamond Sparkles */}
            <div className="absolute left-[15%] bottom-1 z-30 pointer-events-none animate-onyx-sparkle-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 drop-shadow-[0_0_6px_#f59e0b]" />
            </div>
            <div className="absolute right-[15%] bottom-1.5 z-30 pointer-events-none animate-onyx-sparkle-2">
                <Sparkles className="w-3 h-3 text-amber-200 drop-shadow-[0_0_5px_#f59e0b] rotate-12" />
            </div>
            <div className="absolute left-[45%] bottom-2 z-30 pointer-events-none animate-onyx-sparkle-3">
                <Sparkles className="w-2.5 h-2.5 text-yellow-100 drop-shadow-[0_0_4px_#fef08a] -rotate-12" />
            </div>

            {/* Outer Premium Gold Crowns Accent / Corner Guards */}
            <div className="absolute -top-1.5 z-40 pointer-events-none select-none drop-shadow-[0_4px_8px_rgba(217,119,6,0.5)]">
                <Crown className="w-5 h-5 text-yellow-300 fill-amber-500 animate-pulse" />
            </div>

            {/* Main Avatar Container */}
            <div className="relative z-10 w-16 h-16 lg:w-20 lg:h-20 rounded-full p-0 bg-gradient-to-b from-[#161413] to-[#090808] border-2 border-amber-400/80 shadow-[0_0_20px_rgba(217,119,6,0.35),inset_0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center">
                <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                    
                    {/* Golden Luxury Light Sweep moving diagonally through profile */}
                    <div className="absolute top-0 left-0 w-[300%] h-[300%] bg-gradient-to-b from-transparent via-yellow-200/50 via-white/70 via-amber-400/30 to-transparent pointer-events-none z-10 animate-onyx-sweep" />

                    {React.Children.map(children, child => {
                        if (React.isValidElement(child)) {
                            if (child.type === 'img' || (child.props && child.props.src)) {
                                return React.cloneElement(child as React.ReactElement<any>, {
                                    className: "w-full h-full object-cover rounded-full min-w-full min-h-full transition-transform duration-[1200ms] ease-out hover:scale-120 hover:rotate-2",
                                    style: { ...(child.props.style || {}), objectFit: 'cover' }
                                });
                            }
                        }
                        return child;
                    })}
                </div>
            </div>
            
            {/* 3D-crafted Gold Metal Plate Stamp with text */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-40 scale-105 pointer-events-none">
                <div className="onyx-3d-badge px-2.5 py-0.5 text-[8.5px] font-black text-black rounded-[4px] border border-amber-200/50 flex items-center gap-1 select-none whitespace-nowrap tracking-wide leading-none">
                    <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping shrink-0" />
                    ONYX LUXE
                </div>
            </div>
        </div>
    );
};

export default OnyxLuxeFrame;
