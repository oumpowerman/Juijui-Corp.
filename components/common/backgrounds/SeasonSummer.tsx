import React from 'react';
import { motion } from 'framer-motion';

// Generate floating heat waves / dust motes
const motes = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 8 + 4,
    delay: Math.random() * -20,
    duration: Math.random() * 10 + 15,
    opacity: Math.random() * 0.4 + 0.1
}));

// Cloud properties
const clouds = Array.from({ length: 5 }).map((_, i) => ({
    id: `cloud-${i}`,
    y: `${Math.random() * 30}%`,
    scale: Math.random() * 0.5 + 0.5,
    duration: Math.random() * 40 + 40,
    delay: Math.random() * -20,
    opacity: Math.random() * 0.3 + 0.4
}));

// Bird properties
const birds = Array.from({ length: 7 }).map((_, i) => ({
    id: `bird-${i}`,
    y: `${Math.random() * 40 + 10}%`,
    scale: Math.random() * 0.4 + 0.3,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * -10,
}));

const SeasonSummer: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-blue-400/80 via-blue-200/50 to-amber-100/30">
            <style>{`
                @keyframes cloud-move {
                    0% { transform: translateX(-50vw); }
                    100% { transform: translateX(120vw); }
                }
                @keyframes bird-move {
                    0% { transform: translateX(-20vw) translateY(0); }
                    25% { transform: translateX(25vw) translateY(-20px); }
                    50% { transform: translateX(60vw) translateY(0); }
                    75% { transform: translateX(95vw) translateY(15px); }
                    100% { transform: translateX(120vw) translateY(0); }
                }
                @keyframes bird-flap {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(-0.5); }
                }
                @keyframes mote-float {
                    0% { top: 110%; }
                    100% { top: -10%; }
                }
                @keyframes mote-sway {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(var(--sway)); }
                }
            `}</style>
            
            {/* The Sun */}
            <motion.div 
                className="absolute top-12 right-24 w-32 h-32 bg-yellow-300 rounded-full blur-[2px] shadow-[0_0_80px_rgba(253,224,71,0.8)]"
                animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Ambient Sunshine Glows */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-400/20 blur-[150px] rounded-full -translate-y-1/4 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-300/10 blur-[150px] rounded-full translate-y-1/4 -translate-x-1/4" />
            
            {/* Sun Rays (diagonal) */}
            <div className="absolute top-[-10%] right-[-10%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200/20 via-transparent to-transparent rotate-12 blur-3xl" />

            {/* Drifting Clouds */}
            {clouds.map((cloud) => (
                <div
                    key={cloud.id}
                    className="absolute"
                    style={{ 
                        top: cloud.y, 
                        transform: `scale(${cloud.scale})`, 
                        opacity: cloud.opacity,
                        animation: `cloud-move ${cloud.duration}s linear infinite`,
                        animationDelay: `${cloud.delay}s`
                    }}
                >
                    <svg width="200" height="60" viewBox="0 0 200 60" fill="white" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg opacity-80">
                        <path d="M50 30 C 50 10, 90 10, 90 30 C 90 0, 150 0, 150 30 C 180 30, 180 60, 150 60 L 50 60 C 20 60, 20 30, 50 30 Z" />
                    </svg>
                </div>
            ))}

            {/* Flying Birds */}
            {birds.map((bird) => (
                <div
                    key={bird.id}
                    className="absolute"
                    style={{ 
                        top: bird.y, 
                        transform: `scale(${bird.scale})`,
                        animation: `bird-move ${bird.duration}s linear infinite`,
                        animationDelay: `${bird.delay}s`
                    }}
                >
                    <svg width="30" height="20" viewBox="0 0 120 80" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                        <path 
                            d="M 10 40 Q 30 10 60 40 Q 90 10 110 40" 
                            style={{ 
                                animation: `bird-flap 0.8s ease-in-out infinite`,
                                transformOrigin: "center"
                            }}
                        />
                    </svg>
                </div>
            ))}

            {/* Floating Dust / Heat motes */}
            {motes.map((mote) => (
                <div
                    key={mote.id}
                    className="absolute bg-amber-100 rounded-full blur-[2px]"
                    style={{
                        left: mote.left,
                        width: mote.size,
                        height: mote.size,
                        opacity: mote.opacity + 0.2, // Boost opacity a bit
                        '--sway': `${Math.random() * 60 - 30}px`,
                        animation: `mote-float ${mote.duration}s linear infinite ${mote.delay}s, mote-sway ${mote.duration * 0.7}s ease-in-out infinite ${mote.delay}s alternate`
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
};

export default SeasonSummer;
