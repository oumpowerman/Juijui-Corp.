import React from 'react';
import { motion } from 'framer-motion';

interface FrameProps {
    children: React.ReactNode;
}

const NekoParadiseFrame: React.FC<FrameProps> = ({ children }) => {
    return (
        <div className="relative p-3.5 flex items-center justify-center">
            {/* Custom Neko Animation Engine */}
            <style>{`
                @keyframes neko-paw-step {
                    0% { transform: scale(0.6) rotate(-10deg); opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { transform: scale(1.1) rotate(15deg) translate(20px, -20px); opacity: 0; }
                }
                @keyframes neko-pulse-glow {
                    0%, 100% { fill: #f59e0b; filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.4)); }
                    50% { fill: #f43f5e; filter: drop-shadow(0 0 8px rgba(244, 63, 94, 0.7)); }
                }
                @keyframes neko-fish-swim {
                    0% { transform: scaleX(1) translateX(-15px) translateY(0px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.8; }
                    50% { transform: scaleX(1) translateX(15px) translateY(-5px) rotate(10deg); }
                    90% { opacity: 0.8; }
                    100% { transform: scaleX(-1) translateX(-15px) translateY(0px) rotate(0deg); opacity: 0; }
                }
                @keyframes neko-ears-wriggle {
                    0%, 100% { transform: rotate(0deg); }
                    41% { transform: rotate(0deg); }
                    45% { transform: rotate(-8deg); }
                    50% { transform: rotate(4deg); }
                    55% { transform: rotate(-5deg); }
                    60% { transform: rotate(0deg); }
                }
                .animate-neko-paw-1 {
                    animation: neko-paw-step 4s ease-in-out infinite;
                }
                .animate-neko-paw-2 {
                    animation: neko-paw-step 4s ease-in-out infinite;
                    animation-delay: 2s;
                }
                .animate-neko-ear-left {
                    animation: neko-ears-wriggle 6s ease-in-out infinite;
                    transform-origin: bottom right;
                }
                .animate-neko-ear-right {
                    animation: neko-ears-wriggle 6s ease-in-out infinite;
                    animation-delay: 0.5s;
                    transform-origin: bottom left;
                }
                .animate-neko-fish {
                    animation: neko-fish-swim 8s ease-in-out infinite;
                }
                .neko-badge-premium {
                    background: linear-gradient(135deg, #fcd34d 0%, #f97316 100%);
                    box-shadow: 
                        0 4px 10px rgba(249, 115, 22, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.5);
                }
            `}</style>

            {/* Cozy Warm Amber Neko Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-300/30 via-orange-100/30 to-rose-200/35 rounded-full blur-2xl z-0 scale-125 animate-pulse" />

            {/* Cute Cat Ears perched on top of the avatar frame */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 -translate-y-2.5 w-16 h-8 flex justify-between px-1 pointer-events-none z-30">
                {/* Left Ear */}
                <div className="w-5 h-5 bg-amber-500 rounded-tr-[1.5rem] rounded-bl-sm border-[3px] border-white relative animate-neko-ear-left overflow-hidden shadow-md">
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-rose-200 rounded-tr-[1rem] rounded-bl-sm" />
                </div>
                {/* Right Ear */}
                <div className="w-5 h-5 bg-amber-500 rounded-tl-[1.5rem] rounded-br-sm border-[3px] border-white relative animate-neko-ear-right overflow-hidden shadow-md">
                    <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-rose-200 rounded-tl-[1rem] rounded-br-sm" />
                </div>
            </div>

            {/* Concentrated Paw step markers floating out of core */}
            <div className="absolute left-[8%] top-[15%] z-30 pointer-events-none animate-neko-paw-1 text-sm select-none">🐾</div>
            <div className="absolute right-[8%] bottom-[15%] z-30 pointer-events-none animate-neko-paw-2 text-sm select-none">🐾</div>

            {/* Playful Swimming Little Fish */}
            <div className="absolute -left-3 bottom-4 z-40 pointer-events-none animate-neko-fish text-xs select-none">🐟</div>

            {/* Rotating Cozy Dotted ring border */}
            <motion.div 
                className="absolute inset-[1px] border-[3px] border-dashed border-amber-400/50 rounded-full pointer-events-none z-10"
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
                className="absolute inset-[3.5px] border-2 border-dotted border-rose-400/45 rounded-full pointer-events-none z-10"
                animate={{ rotate: -360 }}
                transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            />

            {/* Whiskers drawing overlays on avatar border sides */}
            <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-20 pointer-events-none">
                <div className="w-2.5 h-[1.5px] bg-amber-400/80 rounded-full transform rotate-[10deg]" />
                <div className="w-3.5 h-[1.5px] bg-amber-400/80 rounded-full" />
                <div className="w-2.5 h-[1.5px] bg-amber-400/80 rounded-full transform -rotate-[10deg]" />
            </div>
            <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-20 pointer-events-none">
                <div className="w-2.5 h-[1.5px] bg-amber-400/80 rounded-full transform -rotate-[10deg] self-end" />
                <div className="w-3.5 h-[1.5px] bg-amber-400/80 rounded-full self-end" />
                <div className="w-2.5 h-[1.5px] bg-amber-400/80 rounded-full transform rotate-[10deg] self-end" />
            </div>

            {/* Main Avatar Container */}
            <div className="relative z-20 w-16 h-16 lg:w-20 lg:h-20 rounded-full p-0.5 bg-white shadow-[0_4px_20px_rgba(245,158,11,0.35)] overflow-hidden flex items-center justify-center">
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-amber-100 via-rose-50 to-orange-100">
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

            {/* Cute bottom Neko label */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none scale-105">
                <div className="neko-badge-premium px-2 py-0.5 text-[8.5px] font-black text-white rounded-[5px] border border-white/60 flex items-center gap-0.5 select-none whitespace-nowrap tracking-wider">
                    🐱 NYAN
                </div>
            </div>
        </div>
    );
};

export default NekoParadiseFrame;
