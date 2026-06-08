import React from 'react';
import { motion } from 'framer-motion';

// Generate static array of snowflakes outside component to prevent re-creation on renders
const snowflakes = Array.from({ length: 90 }).map((_, i) => ({
    id: `flake-${i}`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 8 + 3,
    delay: Math.random() * 10,
    duration: Math.random() * 8 + 8,
    opacity: Math.random() * 0.7 + 0.1,
    blur: Math.random() > 0.4 ? 'blur-[1px]' : 'blur-[2px]',
    xMovement: [0, Math.random() * 120 - 60, Math.random() * 120 - 60, 0]
}));

// Smoke particles from the chimney
const smokes = Array.from({ length: 6 }).map((_, i) => ({
    id: `smoke-${i}`,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 3,
    xOffset: Math.random() * 20 - 10
}));

const SeasonSnow: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-slate-900 via-sky-900 to-indigo-900">
            <style>{`
                @keyframes snow-fall {
                    0% { top: -10%; }
                    100% { top: 120%; }
                }
                @keyframes snow-sway {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(var(--sway)); }
                }
            `}</style>
            {/* The Moon */}
            <div className="absolute top-16 right-20 w-24 h-24 bg-slate-100 rounded-full blur-[2px] shadow-[0_0_80px_rgba(226,232,240,0.4)]" />
            
            {/* Stars / Night sky background ambient */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 blur-[150px] rounded-full -translate-y-1/4 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sky-400/10 blur-[150px] rounded-full translate-y-1/4 -translate-x-1/4" />

            {/* Distant Mountains */}
            <svg className="absolute bottom-[20%] w-full h-[40%]" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <path d="M 0 200 L 0 80 Q 100 50 200 120 T 400 60 T 700 110 T 1000 40 L 1000 200 Z" fill="#1e293b" opacity="0.4"/>
                {/* Mountain snowcaps - Back layer */}
                <path d="M 398 62 Q 418 72 408 92 L 378 92 Q 368 72 398 62 Z" fill="white" opacity="0.1"/>
                <path d="M 1000 40 Q 980 50 990 80 L 1000 80 Z" fill="white" opacity="0.1"/>
                
                <path d="M 0 200 L 0 130 Q 150 100 300 160 T 600 90 T 900 130 T 1000 100 L 1000 200 Z" fill="#0f172a" opacity="0.6"/>
                {/* Mountain snowcaps - Front layer */}
                <path d="M 298 162 Q 280 140 260 162 Z" fill="white" opacity="0.15"/>
                <path d="M 598 92 Q 620 105 610 125 L 580 125 Q 570 105 598 92 Z" fill="white" opacity="0.2"/>
            </svg>

            {/* Ground Layers */}
            <svg className="absolute bottom-0 left-0 w-[150%] h-[30%] -translate-x-[10%]" preserveAspectRatio="none" viewBox="0 0 1000 100">
                <path d="M 0 100 L 0 50 Q 250 20 500 50 T 1000 40 L 1000 100 Z" fill="#e2e8f0" opacity="0.6" />
                <path d="M 0 100 L 0 70 Q 200 40 400 70 T 800 50 T 1000 60 L 1000 100 Z" fill="#f8fafc" />
            </svg>

            {/* Pine Trees */}
            <div className="absolute bottom-[10%] right-[12%] transform scale-125 origin-bottom">
                <svg width="80" height="120" viewBox="0 0 80 120" className="drop-shadow-2xl">
                    {/* Trunk */}
                    <rect x="35" y="90" width="10" height="30" fill="#451a03" />
                    {/* Leaves */}
                    <path d="M 40 10 L 5 55 L 25 55 L 0 100 L 80 100 L 55 55 L 75 55 Z" fill="#0f766e" />
                    {/* Snow Caps */}
                    <path d="M 40 10 L 25 35 L 35 30 L 40 20 L 45 30 L 55 35 Z" fill="white" opacity="0.9"/>
                    <path d="M 25 55 L 10 80 L 22 75 L 35 60 L 45 60 L 58 75 L 70 80 Z" fill="white" opacity="0.9"/>
                </svg>
            </div>
            
            <div className="absolute bottom-[5%] right-[22%] transform scale-[1.4] origin-bottom z-10">
                <svg width="80" height="120" viewBox="0 0 80 120" className="drop-shadow-2xl">
                    <rect x="35" y="90" width="10" height="30" fill="#451a03" />
                    <path d="M 40 10 L 5 55 L 25 55 L 0 100 L 80 100 L 55 55 L 75 55 Z" fill="#134e4a" />
                    <path d="M 40 10 L 25 35 L 35 30 L 40 20 L 45 30 L 55 35 Z" fill="#e2e8f0" opacity="0.9"/>
                    <path d="M 25 55 L 10 80 L 22 75 L 35 60 L 45 60 L 58 75 L 70 80 Z" fill="#e2e8f0" opacity="0.9"/>
                </svg>
            </div>

            <div className="absolute bottom-[15%] left-[10%] transform scale-90 origin-bottom">
                <svg width="80" height="120" viewBox="0 0 80 120" className="drop-shadow-2xl">
                    <rect x="35" y="90" width="10" height="30" fill="#451a03" />
                    <path d="M 40 10 L 5 55 L 25 55 L 0 100 L 80 100 L 55 55 L 75 55 Z" fill="#0f766e" />
                    <path d="M 40 10 L 25 35 L 35 30 L 40 20 L 45 30 L 55 35 Z" fill="white" opacity="0.9"/>
                </svg>
            </div>

            {/* Cozy House */}
            <div className="absolute bottom-[12%] left-[40%] transform scale-110 origin-bottom z-10 hidden sm:block">
                {/* Smoke Animations */}
                {smokes.map((smoke) => (
                    <motion.div
                        key={smoke.id}
                        className="absolute w-8 h-8 rounded-full bg-slate-200/50 blur-[6px]"
                        initial={{ left: 115, top: 10, scale: 0.5, opacity: 0.8 }}
                        animate={{ 
                            top: -80, 
                            left: [115, 115 + smoke.xOffset, 125 + smoke.xOffset],
                            scale: 2.5, 
                            opacity: 0 
                        }}
                        transition={{ duration: smoke.duration, repeat: Infinity, delay: smoke.delay, ease: "easeOut" }}
                    />
                ))}

                <svg width="160" height="150" viewBox="0 0 160 150" className="drop-shadow-2xl">
                    {/* Chimney */}
                    <rect x="110" y="20" width="20" height="40" fill="#7f1d1d" />
                    <path d="M 105 15 L 135 15 L 135 25 L 105 25 Z" fill="#f1f5f9" />
                    
                    {/* Main house body */}
                    <rect x="30" y="60" width="100" height="70" fill="#b45309" />
                    <rect x="40" y="70" width="80" height="60" fill="#78350f" />
                    
                    {/* Door */}
                    <rect x="70" y="90" width="20" height="40" fill="#451a03" />
                    <circle cx="85" cy="110" r="2" fill="#fbbf24" />
                    
                    {/* Windows */}
                    {/* Left Window */}
                    <rect x="45" y="80" width="15" height="20" fill="#fef08a" opacity="0.9" />
                    {/* Window glow effect */}
                    <rect x="43" y="78" width="19" height="24" fill="#fef08a" opacity="0.3" filter="blur(4px)" />
                    <path d="M 52.5 80 L 52.5 100 M 45 90 L 60 90" stroke="#451a03" strokeWidth="2" />
                    
                    {/* Right Window */}
                    <rect x="100" y="80" width="15" height="20" fill="#fef08a" opacity="0.9" />
                    {/* Window glow effect */}
                    <rect x="98" y="78" width="19" height="24" fill="#fef08a" opacity="0.3" filter="blur(4px)" />
                    <path d="M 107.5 80 L 107.5 100 M 100 90 L 115 90" stroke="#451a03" strokeWidth="2" />
                    
                    {/* Roof */}
                    <path d="M 20 60 L 80 10 L 140 60 Z" fill="#1e293b" />
                    {/* Snow on Roof */}
                    <path d="M 15 65 L 80 5 L 145 65 Q 130 70 120 60 Q 100 70 80 60 Q 60 70 40 60 Q 25 70 15 65 Z" fill="#f8fafc" />
                    {/* Icicles */}
                    <path d="M 25 67 L 30 75 L 35 66 L 50 80 L 55 64 Z" fill="#f1f5f9" opacity="0.8" />
                    <path d="M 120 64 L 125 75 L 130 67 L 135 80 L 140 66 Z" fill="#f1f5f9" opacity="0.8" />
                </svg>
            </div>

            {/* Snowman */}
            <div className="absolute bottom-[8%] left-[10%] sm:left-[20%] z-10 origin-bottom transform scale-90 sm:scale-110">
                <svg width="100" height="150" viewBox="0 0 100 150" className="drop-shadow-xl">
                    {/* Shadows on bottom of snowballs */}
                    <circle cx="50" cy="110" r="35" fill="#cbd5e1" />
                    <circle cx="50" cy="107" r="35" fill="#f8fafc" />
                    
                    <circle cx="50" cy="65" r="28" fill="#cbd5e1" />
                    <circle cx="50" cy="63" r="28" fill="#f8fafc" />
                    
                    <circle cx="50" cy="30" r="22" fill="#cbd5e1" />
                    <circle cx="50" cy="28" r="22" fill="#f8fafc" />
                    
                    {/* Buttons */}
                    <circle cx="50" cy="55" r="3" fill="#1e293b" />
                    <circle cx="50" cy="70" r="3" fill="#1e293b" />
                    <circle cx="50" cy="85" r="3" fill="#1e293b" />
                    <circle cx="50" cy="100" r="3" fill="#1e293b" />
                    
                    {/* Eyes */}
                    <circle cx="43" cy="23" r="2.5" fill="#1e293b" />
                    <circle cx="57" cy="23" r="2.5" fill="#1e293b" />
                    
                    {/* Rosy Cheeks */}
                    <ellipse cx="38" cy="28" rx="3.5" ry="2" fill="#fca5a5" opacity="0.6" />
                    <ellipse cx="62" cy="28" rx="3.5" ry="2" fill="#fca5a5" opacity="0.6" />

                    {/* Carrot nose */}
                    <path d="M 50 28 L 75 30 L 50 33 Z" fill="#ea580c" />
                    
                    {/* Arms (branches) */}
                    <path d="M 22 65 L 5 45 M 12 55 L 3 58" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 78 65 L 95 45 M 88 55 L 97 58" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
                    
                    {/* Scarf */}
                    <path d="M 30 43 Q 50 50 70 43 L 67 48 Q 50 56 33 48 Z" fill="#b91c1c" />
                    <path d="M 58 48 Q 63 60 62 80 L 52 80 Q 53 60 52 48 Z" fill="#b91c1c" />

                    {/* Top Hat */}
                    <rect x="35" y="1" width="30" height="20" fill="#0f172a" />
                    <rect x="25" y="15" width="50" height="5" fill="#0f172a" />
                    <rect x="35" y="13" width="30" height="3" fill="#b91c1c" />
                </svg>
            </div>

            {/* Snowflakes (Front Layer) */}
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className={`absolute bg-white rounded-full ${flake.blur} z-50`}
                    style={{
                        left: flake.left,
                        top: '-10%',
                        width: flake.size,
                        height: flake.size,
                        opacity: flake.opacity + 0.2,
                        '--sway': `${flake.xMovement[1]}px`,
                        animation: `snow-fall ${flake.duration}s linear infinite ${flake.delay}s, snow-sway ${flake.duration * 0.9}s ease-in-out infinite ${flake.delay}s alternate`
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
};

export default SeasonSnow;

