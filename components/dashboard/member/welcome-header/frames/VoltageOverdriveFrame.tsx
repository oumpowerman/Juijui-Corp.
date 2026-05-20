
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Heart, Cloud } from 'lucide-react';

interface FrameProps {
    children: React.ReactNode;
}

const VoltageOverdriveFrame: React.FC<FrameProps> = ({ children }) => {
    return (
        <div className="relative p-7 flex items-center justify-center select-none">
            {/* Embedded Ultra-Fluid Animation Engine */}
            <style>{`
                @keyframes volt-heart-pulse {
                    0% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.65)) drop-shadow(0 0 2px rgba(236, 72, 153, 0.4)); }
                    14% { transform: scale(1.16); filter: drop-shadow(0 0 26px rgba(168, 85, 247, 0.95)) drop-shadow(0 0 8px rgba(236, 72, 153, 0.8)); }
                    28% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.75)) drop-shadow(0 0 4px rgba(236, 72, 153, 0.5)); }
                    42% { transform: scale(1.22); filter: drop-shadow(0 0 32px rgba(168, 85, 247, 1)) drop-shadow(0 0 12px rgba(236, 72, 153, 0.9)); }
                    70% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.65)) drop-shadow(0 0 2px rgba(236, 72, 153, 0.4)); }
                    100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.65)) drop-shadow(0 0 2px rgba(236, 72, 153, 0.4)); }
                }
                @keyframes volt-neon-flicker {
                    0%, 100% { opacity: 0.95; filter: drop-shadow(0 0 12px #a855f7); }
                    33% { opacity: 0.80; }
                    35% { opacity: 1; filter: drop-shadow(0 0 20px #d946ef); }
                    48% { opacity: 0.40; }
                    50% { opacity: 0.95; }
                    88% { opacity: 0.85; }
                    90% { opacity: 1; filter: drop-shadow(0 0 16px #ec4899); }
                }
                @keyframes pikachu-zap-1 {
                    0%, 100% { transform: translate(0, 0) scale(0.9) rotate(0deg); opacity: 0.2; }
                    12% { transform: translate(-3px, -3px) scale(1.2) rotate(-8deg); opacity: 1; }
                    24% { transform: translate(1px, -1px) scale(1) rotate(5deg); opacity: 0.4; }
                    36% { transform: translate(4px, 4px) scale(1.3) rotate(15deg); opacity: 1; }
                    48% { transform: translate(-2px, 2px) scale(0.85) rotate(-10deg); opacity: 0.3; }
                }
                @keyframes pikachu-zap-2 {
                    0%, 100% { transform: translate(0, 0) scale(0.9) rotate(0deg); opacity: 0.3; }
                    20% { transform: translate(4px, -3px) scale(1.25) rotate(12deg); opacity: 1; }
                    40% { transform: translate(-2px, 2px) scale(0.9) rotate(-5deg); opacity: 0.2; }
                    60% { transform: translate(-4px, -4px) scale(1.3) rotate(-15deg); opacity: 1; }
                    80% { transform: translate(3px, 1px) scale(1.1) rotate(8deg); opacity: 0.5; }
                }
                @keyframes cloud-puff-drift-left {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-6px, -4px) scale(1.1); }
                }
                @keyframes cloud-puff-drift-right {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(6px, -3px) scale(1.08); }
                }
                @keyframes bolt-shoot {
                    0% { transform: scaleY(0); opacity: 0; }
                    10%, 14% { transform: scaleY(1); opacity: 1; filter: brightness(1.5); }
                    18% { transform: scaleY(0.7); opacity: 0.3; }
                    23% { transform: scaleY(1); opacity: 1; }
                    30%, 100% { transform: scaleY(0); opacity: 0; }
                }
                .animate-heart-pulse {
                    animation: volt-heart-pulse 2.2s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
                }
                .animate-volt-neon {
                    animation: volt-neon-flicker 3s linear infinite;
                }
                .animate-pikachu-1 {
                    animation: pikachu-zap-1 2.5s ease-in-out infinite;
                }
                .animate-pikachu-2 {
                    animation: pikachu-zap-2 3.2s ease-in-out infinite;
                }
                .animate-cloud-left {
                    animation: cloud-puff-drift-left 6s ease-in-out infinite;
                }
                .animate-cloud-right {
                    animation: cloud-puff-drift-right 7s ease-in-out infinite;
                }
                .animate-bolt-strike {
                    animation: bolt-shoot 4s ease-in-out infinite;
                    transform-origin: top;
                }
            `}</style>

            {/* Hidden SVG Definition for Heart Shape Clip Path */}
            <svg className="absolute w-0 h-0" width="0" height="0">
                <defs>
                    {/* Normalized coordinates 0 to 1 for perfect clipping mask responsive sizing */}
                    <clipPath id="avatar-heart-clip" clipPathUnits="objectBoundingBox">
                        <path d="M0.5, 0.20 C0.36, 0.05, 0.08, 0.05, 0.05, 0.40 C0.01, 0.70, 0.36, 0.88, 0.5, 0.96 C0.64, 0.88, 0.99, 0.70, 0.95, 0.40 C0.92, 0.05, 0.64, 0.05, 0.5, 0.20 Z" />
                    </clipPath>
                </defs>
            </svg>

            {/* Glowing Aura Background (Large diffuse neon light) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/40 via-pink-500/10 to-yellow-500/20 rounded-full blur-2xl scale-125 pointer-events-none" />

            {/* The Main Heartbeat Pulsing Unit */}
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 animate-heart-pulse flex items-center justify-center">

                {/* SVG Glowing Double Neon Heart Border */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <svg className="w-full h-full text-violet-500 fill-none filter drop-shadow-[0_0_12px_#a855f7] animate-volt-neon" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path 
                            d="M50, 20 C36, 5, 8, 5, 5, 40 C1, 70, 36, 88, 50, 96 C64, 88, 99, 70, 95, 40 C92, 5, 64, 5, 50, 20 Z" 
                            stroke="currentColor" 
                            strokeWidth="3.5" 
                            fill="rgba(11, 8, 22, 0.8)"
                        />
                    </svg>
                </div>

                {/* Inner Glowing Pink Accent Heart Line */}
                <div className="absolute inset-1 w-full h-full pointer-events-none opacity-80 scale-[0.93]">
                    <svg className="w-full h-full text-pink-400 fill-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path 
                            d="M50, 20 C36, 5, 8, 5, 5, 40 C1, 70, 36, 88, 50, 96 C64, 88, 99, 70, 95, 40 C92, 5, 64, 5, 50, 20 Z" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            strokeDasharray="6 4"
                        />
                    </svg>
                </div>

                {/* Real Heart-Clipped Avatar Shield Container */}
                <div 
                    className="relative z-10 w-[84%] h-[84%] overflow-hidden flex items-center justify-center transition-transform duration-500"
                    style={{ 
                        clipPath: 'url(#avatar-heart-clip)', 
                        WebkitClipPath: 'url(#avatar-heart-clip)'
                    }}
                >
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center relative">
                        {/* Golden electrical charging scanline */}
                        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-yellow-300 to-transparent shadow-[0_0_8px_#facc15] animate-bounce z-10" />

                        {React.Children.map(children, child => {
                            if (React.isValidElement(child)) {
                                if (child.type === 'img' || (child.props && child.props.src)) {
                                    return React.cloneElement(child as React.ReactElement<any>, {
                                        // Omit rounded-full because parent clips it to heart anyway!
                                        className: "w-full h-full object-cover min-w-full min-h-full transition-all duration-[1000ms] hover:scale-130 hover:rotate-3 saturate-[1.15] brightness-105",
                                        style: { ...(child.props.style || {}), objectFit: 'cover' }
                                    });
                                }
                            }
                            return child;
                        })}
                    </div>
                </div>

                {/* Left Cute Spark Cloud */}
                <div className="absolute -left-9 top-3 z-20 pointer-events-none select-none animate-cloud-left flex flex-col items-center">
                    <div className="relative">
                        <Cloud className="w-8 h-6 text-purple-900 fill-purple-900/60 filter drop-shadow-[0_2px_4px_#d946ef] opacity-90" />
                        {/* Shooting spark under cloud */}
                        <div className="absolute top-[18px] left-[10px] w-4 h-6 text-yellow-300 animate-bolt-strike">
                            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" className="w-full h-full">
                                <path d="M11 2L2 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Right Cute Spark Cloud */}
                <div className="absolute -right-9 bottom-3 z-20 pointer-events-none select-none animate-cloud-right flex flex-col items-center">
                    <div className="relative">
                        <Cloud className="w-7 h-5 text-indigo-900 fill-indigo-900/50 filter drop-shadow-[0_2px_4px_#3b82f6] opacity-85" />
                        {/* Shooting spark under cloud */}
                        <div className="absolute top-[14px] right-[4px] w-3 h-5 text-yellow-400 animate-bolt-strike" style={{ animationDelay: '1.8s' }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" className="w-full h-full">
                                <path d="M11 2L2 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Pikachu Yellow Lightning Bolts striking down around the heart */}
                <div className="absolute -top-4 -right-3 z-30 pointer-events-none select-none animate-pikachu-1">
                    <Zap className="w-6 h-6 text-yellow-300 fill-yellow-200 drop-shadow-[0_0_8px_#facc15]" />
                </div>

                <div className="absolute -bottom-3 -left-4 z-30 pointer-events-none select-none animate-pikachu-2">
                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-300 drop-shadow-[0_0_6px_#fbbf24]" />
                </div>

                {/* Radiant Floating Sparks */}
                <div className="absolute top-1/2 left-[105%] z-30 pointer-events-none select-none -translate-y-1/2 animate-ping">
                    <Heart className="w-2.5 h-2.5 text-pink-500 fill-pink-500 drop-shadow-[0_0_4px_#ec4899]" />
                </div>
            </div>

            {/* Premium Indicator Badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <span className="px-2 py-0.5 bg-violet-600/90 text-[7px] font-black text-yellow-300 rounded-[3px] border border-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.7)] tracking-widest uppercase whitespace-nowrap animate-pulse">
                    VOLT // LNK
                </span>
            </div>
        </div>
    );
};

export default VoltageOverdriveFrame;
