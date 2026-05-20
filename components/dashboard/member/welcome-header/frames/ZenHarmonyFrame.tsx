
import React from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

interface FrameProps {
    children: React.ReactNode;
}

const ZenHarmonyFrame: React.FC<FrameProps> = ({ children }) => {
    return (
        <div className="relative p-3 flex items-center justify-center">
            {/* Custom Animation Engine for Ultimate Serenity */}
            <style>{`
                @keyframes zen-spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes zen-spin-reverse-slow {
                    0% { transform: rotate(360deg); }
                    100% { transform: rotate(0deg); }
                }
                @keyframes zen-pulsate {
                    0%, 100% { transform: scale(1); opacity: 0.75; box-shadow: 0 0 15px rgba(16, 185, 129, 0.2); }
                    50% { transform: scale(1.08); opacity: 1; box-shadow: 0 0 30px rgba(52, 211, 153, 0.6); }
                }
                @keyframes zen-ripple-pond {
                    0% { transform: scale(0.95); opacity: 1; border-color: rgba(52, 211, 153, 0.7); }
                    100% { transform: scale(1.75); opacity: 0; border-color: rgba(153, 246, 228, 0); }
                }
                @keyframes zen-leaf-drift-up {
                    0% { transform: translate(0, 30px) rotate(0deg) scale(0.6); opacity: 0; }
                    20% { opacity: 0.9; }
                    80% { opacity: 0.9; }
                    100% { transform: translate(var(--leaf-x, 15px), -50px) rotate(360deg) scale(1); opacity: 0; }
                }
                @keyframes zen-gold-orb-rise {
                    0% { transform: translate(0, 20px) scale(0.4); opacity: 0; filter: blur(0px); }
                    30% { opacity: 1; filter: blur(0.5px); }
                    100% { transform: translate(var(--orb-x, -20px), -60px) scale(1.2); opacity: 0; filter: blur(1.5px); }
                }
                .animate-zen-spin {
                    animation: zen-spin-slow 22s linear infinite;
                }
                .animate-zen-spin-reverse {
                    animation: zen-spin-reverse-slow 28s linear infinite;
                }
                .animate-zen-pulsate {
                    animation: zen-pulsate 4s ease-in-out infinite;
                }
                .animate-zen-ripple-1 {
                    animation: zen-ripple-pond 3.5s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
                }
                .animate-zen-ripple-2 {
                    animation: zen-ripple-pond 3.5s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
                    animation-delay: 1.75s;
                }
                .animate-zen-leaf-1 {
                    --leaf-x: -25px;
                    animation: zen-leaf-drift-up 7s cubic-bezier(0.25, 1, 0.5, 1) infinite;
                }
                .animate-zen-leaf-2 {
                    --leaf-x: 22px;
                    animation: zen-leaf-drift-up 9s cubic-bezier(0.25, 1, 0.5, 1) infinite;
                    animation-delay: 2.5s;
                }
                .animate-zen-leaf-3 {
                    --leaf-x: -12px;
                    animation: zen-leaf-drift-up 8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
                    animation-delay: 4s;
                }
                .animate-zen-orb-1 {
                    --orb-x: -15px;
                    animation: zen-gold-orb-rise 5s ease-out infinite;
                }
                .animate-zen-orb-2 {
                    --orb-x: 18px;
                    animation: zen-gold-orb-rise 6s ease-out infinite;
                    animation-delay: 1.8s;
                }
                .animate-zen-orb-3 {
                    --orb-x: -5px;
                    animation: zen-gold-orb-rise 4s ease-out infinite;
                    animation-delay: 3.2s;
                }
            `}</style>

            {/* Aura Bloom Background (High Visibility glow) */}
            <div className="absolute inset-0 bg-emerald-100/40 rounded-full blur-2xl z-0 scale-125" />

            {/* Zen Water Pond Ripple Effects (Always floating out on top layers but behind avatar) */}
            <div className="absolute inset-2 rounded-full border-2 border-emerald-400/40 pointer-events-none z-10 animate-zen-ripple-1" />
            <div className="absolute inset-2 rounded-full border-2 border-teal-300/40 pointer-events-none z-10 animate-zen-ripple-2" />

            {/* Double Sacred Rings (Outer Glow Circles rotating in opposite directions) */}
            <div className="absolute inset-0.5 rounded-full border border-emerald-200/50 pointer-events-none z-10 animate-zen-spin flex items-center justify-center">
                <div className="w-[95%] h-[95%] rounded-full border border-dashed border-emerald-300/60" />
            </div>
            <div className="absolute inset-1.5 rounded-full border border-teal-200/40 pointer-events-none z-10 animate-zen-spin-reverse flex items-center justify-center">
                <div className="w-[92%] h-[92%] rounded-full border border-dotted border-teal-400/40" />
            </div>

            {/* Rising Golden Dust Orbs */}
            <div className="absolute left-1/4 bottom-0 z-30 pointer-events-none animate-zen-orb-1 w-2 h-2 bg-gradient-to-tr from-yellow-300 to-amber-200 rounded-full shadow-[0_0_8px_#f59e0b]" />
            <div className="absolute right-1/4 bottom-0 z-30 pointer-events-none animate-zen-orb-2 w-1.5 h-1.5 bg-gradient-to-tr from-yellow-300 to-emerald-200 rounded-full shadow-[0_0_6px_#34d399]" />
            <div className="absolute left-1/2 bottom-2 z-30 pointer-events-none animate-zen-orb-3 w-2.5 h-2.5 bg-gradient-to-tr from-yellow-200 to-teal-100 rounded-full shadow-[0_0_10px_#fef08a]" />

            {/* Cascading Sacred Leaves (Floating upwards smoothly) */}
            <div className="absolute left-1/3 bottom-0 z-30 pointer-events-none animate-zen-leaf-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)] animate-pulse" />
            </div>
            <div className="absolute right-1/3 bottom-1 z-30 pointer-events-none animate-zen-leaf-2">
                <Leaf className="w-3 h-3 text-teal-500 fill-teal-100 drop-shadow-[0_2px_4px_rgba(20,184,166,0.3)] rotate-45" />
            </div>
            <div className="absolute left-1/2 bottom-0 z-30 pointer-events-none animate-zen-leaf-3">
                <Leaf className="w-2.5 h-2.5 text-emerald-400 fill-emerald-50 drop-shadow-[0_2px_4px_rgba(52,211,153,0.3)] -rotate-12" />
            </div>

            {/* Static Zen Floral Accents (Ornamental boundaries anchored perfectly on the frame) */}
            <div className="absolute -top-1 -right-1 z-40 pointer-events-none drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]">
                <Leaf className="w-4 h-4 text-emerald-600 fill-white rotate-45" />
            </div>
            <div className="absolute -bottom-1 -left-1 z-40 pointer-events-none drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]">
                <Leaf className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 -rotate-45" />
            </div>

            {/* Main Avatar Container - Raised to high z-index and beautifully boxed */}
            <div className="relative z-20 w-16 h-16 lg:w-20 lg:h-20 rounded-full p-0 bg-white border-[3px] border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] overflow-hidden flex items-center justify-center animate-zen-pulsate">
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child)) {
                            if (child.type === 'img' || (child.props && child.props.src)) {
                                return React.cloneElement(child as React.ReactElement<any>, {
                                    className: "w-full h-full object-cover rounded-full min-w-full min-h-full transition-transform duration-[1200ms] ease-out hover:scale-115 hover:rotate-6",
                                    style: { ...(child.props.style || {}), objectFit: 'cover' }
                                });
                            }
                        }
                        return child;
                    })}
                </div>
            </div>
            
            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-8 pointer-events-none rounded-full" />
        </div>
    );
};

export default ZenHarmonyFrame;
