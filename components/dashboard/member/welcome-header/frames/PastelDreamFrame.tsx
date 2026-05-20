
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

interface FrameProps {
    children: React.ReactNode;
}

const PastelDreamFrame: React.FC<FrameProps> = ({ children }) => {
    return (
        <div className="relative p-3.5 flex items-center justify-center">
            {/* Custom Premium Pastel Animation Engine (To ensure pure FPS performance) */}
            <style>{`
                @keyframes pastel-ripple-pulse {
                    0% { transform: scale(0.92); opacity: 1; border-color: rgba(244, 114, 182, 0.7); }
                    100% { transform: scale(1.65); opacity: 0; border-color: rgba(251, 207, 232, 0); }
                }
                @keyframes pastel-sparkle-drift {
                    0% { transform: translate(0, 0) scale(0.4) rotate(0deg); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 0.85; }
                    100% { transform: translate(var(--sp-x, 20px), var(--sp-y, -20px)) scale(1.3) rotate(360deg); opacity: 0; }
                }
                @keyframes pastel-petal-float {
                    0% { transform: translateY(40px) translateX(0) rotate(0deg) scale(0.5); opacity: 0; }
                    15% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(-55px) translateX(var(--pt-x, -18px)) rotate(270deg) scale(1.1); opacity: 0; }
                }
                @keyframes pastel-avatar-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(244, 114, 182, 0.35); }
                    50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(244, 114, 182, 0.65); }
                }
                .animate-pastel-ripple-1 {
                    animation: pastel-ripple-pulse 4s cubic-bezier(0.1, 0.82, 0.3, 1) infinite;
                }
                .animate-pastel-ripple-2 {
                    animation: pastel-ripple-pulse 4s cubic-bezier(0.1, 0.82, 0.3, 1) infinite;
                    animation-delay: 2s;
                }
                .animate-pastel-sparkle-1 {
                    --sp-x: -32px;
                    --sp-y: -35px;
                    animation: pastel-sparkle-drift 5s ease infinite;
                }
                .animate-pastel-sparkle-2 {
                    --sp-x: 35px;
                    --sp-y: -28px;
                    animation: pastel-sparkle-drift 6s ease infinite;
                    animation-delay: 1.5s;
                }
                .animate-pastel-sparkle-3 {
                    --sp-x: -25px;
                    --sp-y: 32px;
                    animation: pastel-sparkle-drift 5.5s ease infinite;
                    animation-delay: 3s;
                }
                .animate-pastel-sparkle-4 {
                    --sp-x: 30px;
                    --sp-y: 35px;
                    animation: pastel-sparkle-drift 7s ease infinite;
                    animation-delay: 4.2s;
                }
                .animate-pastel-petal-1 {
                    --pt-x: -22px;
                    animation: pastel-petal-float 8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
                }
                .animate-pastel-petal-2 {
                    --pt-x: 25px;
                    animation: pastel-petal-float 9.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
                    animation-delay: 3s;
                }
                .pastel-luxe-badge {
                    background: linear-gradient(135deg, #fecdd3 0%, #fda4af 50%, #f43f5e 100%);
                    box-shadow: 
                        0 4px 10px rgba(244, 114, 182, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.5),
                        inset 0 -1px 2px rgba(0, 0, 0, 0.1);
                }
            `}</style>

            {/* Cotton Candy Magic Balloon Glow (High visibility underlayer) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-200/50 via-purple-100/50 to-rose-200/50 rounded-full blur-2xl z-0 scale-125 animate-pulse" />

            {/* Concentrated Water Ripple rings emanating outwards */}
            <div className="absolute inset-2.5 rounded-full border-2 border-pink-300 pointer-events-none z-10 animate-pastel-ripple-1" />
            <div className="absolute inset-2.5 rounded-full border-2 border-rose-200 pointer-events-none z-10 animate-pastel-ripple-2" />

            {/* Rotating Soft Peach/Dainty Violet Ribbon Dashed border */}
            <motion.div 
                className="absolute inset-[1px] border-[3px] border-dashed border-pink-400/40 rounded-full pointer-events-none z-10"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
                className="absolute inset-[3.5px] border-2 border-dotted border-purple-300/50 rounded-full pointer-events-none z-10"
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />

            {/* Glowing Flowing Dust/Sparkles Fountain emitted out of the core */}
            <div className="absolute left-1/2 top-1/2 pointer-events-none z-30 animate-pastel-sparkle-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 drop-shadow-[0_0_5px_#fbcfe8]" />
            </div>
            <div className="absolute left-1/2 top-1/2 pointer-events-none z-30 animate-pastel-sparkle-2">
                <Sparkles className="w-3 h-3 text-pink-300 drop-shadow-[0_0_4px_#fbcfe8]" />
            </div>
            <div className="absolute left-1/2 top-1/2 pointer-events-none z-30 animate-pastel-sparkle-3">
                <Sparkles className="w-2.5 h-2.5 text-rose-300 drop-shadow-[0_0_4px_#fbcfe8]" />
            </div>
            <div className="absolute left-1/2 top-1/2 pointer-events-none z-30 animate-pastel-sparkle-4">
                <Sparkles className="w-3 h-3 text-purple-300 drop-shadow-[0_0_5px_#f3e8ff]" />
            </div>

            {/* Floating Soft Cherry Blossoms (Sakura Petals drifting upward) */}
            <div className="absolute left-[20%] bottom-0 z-30 pointer-events-none animate-pastel-petal-1">
                <span className="text-sm select-none drop-shadow-[0_2px_4px_rgba(244,114,182,0.4)]">🌸</span>
            </div>
            <div className="absolute right-[20%] bottom-1 z-30 pointer-events-none animate-pastel-petal-2">
                <span className="text-xs select-none drop-shadow-[0_2px_4px_rgba(244,114,182,0.4)]">🌸</span>
            </div>

            {/* Four Soft Miniature Hearts anchored perfectly on edges */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-500 drop-shadow-[0_2px_4px_rgba(244,114,182,0.5)] animate-bounce" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-40">
                <Heart className="w-3 h-3 fill-rose-300 text-rose-400" />
            </div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
                <Heart className="w-3 h-3 fill-rose-400 text-rose-500 animate-pulse" />
            </div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
                <Heart className="w-3 h-3 fill-pink-400 text-pink-500 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Main Avatar Container - Raised structure */}
            <div className="relative z-20 w-16 h-16 lg:w-20 lg:h-20 rounded-full p-0.5 bg-white shadow-[0_4px_20px_rgba(244,114,182,0.4)] overflow-hidden flex items-center justify-center animate-pastel-avatar-pulse">
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-pink-100 via-rose-50 to-purple-100">
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

            {/* Cute Ribbon Sweet Dream Tag */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none scale-105">
                <div className="pastel-luxe-badge px-2 py-0.5 text-[8.5px] font-black text-white rounded-[5px] border border-white/60 flex items-center gap-0.5 select-none whitespace-nowrap tracking-wider">
                    🌸 DREAM
                </div>
            </div>
        </div>
    );
};

export default PastelDreamFrame;
