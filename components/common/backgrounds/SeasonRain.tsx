import React from 'react';
import { motion } from 'framer-motion';

// Generate static array of raindrops outside component to prevent re-creation on renders
const raindrops = Array.from({ length: 150 }).map((_, i) => ({
    id: `rain-${i}`,
    left: `${Math.random() * 100}%`,
    height: Math.random() * 30 + 20, // slightly longer rain streak
    delay: Math.random() * 2,
    duration: Math.random() * 0.5 + 0.5, // slightly slower for visibility
    opacity: Math.random() * 0.5 + 0.3, // more opaque
    width: Math.random() > 0.8 ? '3px' : '2px' // thicker lines
}));

// Cloud generation
const clouds = Array.from({ length: 4 }).map((_, i) => ({
    id: `cloud-${i}`,
    top: `${Math.random() * 15}%`,
    delay: Math.random() * 20,
    duration: Math.random() * 60 + 60,
    opacity: Math.random() * 0.5 + 0.4,
    scale: Math.random() * 0.5 + 1
}));

const SeasonRain: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500">
            {/* Ambient overcast Glows / Clouds */}
            <div className="absolute top-0 right-1/4 w-[1000px] h-[500px] bg-slate-200/50 blur-[150px] rounded-full -translate-y-1/2" />
            <div className="absolute top-10 left-1/4 w-[600px] h-[300px] bg-slate-300/40 blur-[120px] rounded-full" />
            
            {/* Moving clouds */}
            {clouds.map(cloud => (
                <motion.div
                    key={cloud.id}
                    className="absolute"
                    style={{ top: cloud.top, opacity: cloud.opacity, scale: cloud.scale }}
                    initial={{ left: '-50%' }}
                    animate={{ left: '150%' }}
                    transition={{
                        duration: cloud.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: cloud.delay
                    }}
                >
                    <svg width="300" height="100" viewBox="0 0 300 100" fill="#94a3b8" opacity="0.6" className="blur-[4px]">
                        <path d="M 50 70 Q 30 70 30 50 Q 30 30 60 30 Q 80 10 120 15 Q 160 5 200 25 Q 230 10 260 35 Q 280 40 280 60 Q 280 80 250 80 Z" />
                    </svg>
                </motion.div>
            ))}

            {/* Distant City Skyline / Buildings */}
            <svg className="absolute bottom-[10%] w-[120%] h-[30%] -translate-x-[10%]" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <rect x="100" y="80" width="40" height="120" fill="#64748b" opacity="0.8"/>
                <rect x="150" y="40" width="60" height="160" fill="#475569" opacity="0.9"/>
                <rect x="220" y="100" width="70" height="100" fill="#64748b" opacity="0.8"/>
                <rect x="300" y="60" width="50" height="140" fill="#475569" opacity="0.9"/>
                <rect x="700" y="50" width="80" height="150" fill="#64748b" opacity="0.8"/>
                <rect x="800" y="90" width="40" height="110" fill="#475569" opacity="0.9"/>
                <rect x="850" y="30" width="70" height="170" fill="#64748b" opacity="0.8"/>
            </svg>

            {/* Street / Ground */}
            <svg className="absolute bottom-0 left-0 w-[150%] h-[20%] -translate-x-[10%]" preserveAspectRatio="none" viewBox="0 0 1000 100">
                <path d="M 0 50 L 0 30 Q 500 20 1000 30 L 1000 50 Z" fill="#94a3b8" opacity="0.5" />
                <path d="M 0 100 L 0 50 Q 500 40 1000 50 L 1000 100 Z" fill="#64748b" />
            </svg>

            {/* Street Lamp (Daytime, off) */}
            <div className="absolute bottom-[5%] left-[20%] transform scale-125 z-10 origin-bottom">
                <svg width="60" height="200" viewBox="0 0 60 200">
                    <rect x="25" y="40" width="10" height="160" fill="#334155" />
                    <path d="M 20 40 L 40 40 L 45 30 L 15 30 Z" fill="#475569" />
                    <path d="M 30 10 L 10 30 L 50 30 Z" fill="#334155" />
                    {/* Glass bulb off */}
                    <circle cx="30" cy="35" r="5" fill="#cbd5e1" opacity="0.5" />
                </svg>
            </div>

            {/* Cozy Cafe / Storefront (Daytime) */}
            <div className="absolute bottom-[10%] right-[15%] transform scale-110 z-10 origin-bottom hidden sm:block">
                <svg width="250" height="160" viewBox="0 0 250 160" className="drop-shadow-xl">
                    {/* Building structure */}
                    <rect x="10" y="40" width="230" height="120" fill="#94a3b8" />
                    
                    {/* Roof / Awning */}
                    <path d="M 0 40 L 250 40 L 230 10 L 20 10 Z" fill="#475569" />
                    <path d="M 0 40 L 250 40 L 250 50 Q 235 60 220 50 Q 205 60 190 50 Q 175 60 160 50 Q 145 60 130 50 Q 115 60 100 50 Q 85 60 70 50 Q 55 60 40 50 Q 25 60 10 50 Q -5 60 0 40 Z" fill="#dc2626" />

                    {/* Window 1 */}
                    <rect x="30" y="70" width="70" height="60" fill="#cbd5e1" opacity="0.9" />
                    <path d="M 65 70 L 65 130 M 30 100 L 100 100" stroke="#334155" strokeWidth="4" />
                    <rect x="30" y="70" width="70" height="60" fill="none" stroke="#334155" strokeWidth="6" />

                    {/* Door */}
                    <rect x="120" y="70" width="40" height="90" fill="#334155" />
                    <rect x="125" y="75" width="30" height="40" fill="#cbd5e1" opacity="0.8" />
                    <circle cx="155" cy="120" r="2" fill="#94a3b8" />

                    {/* Window 2 */}
                    <rect x="180" y="70" width="40" height="60" fill="#cbd5e1" opacity="0.9" />
                    <path d="M 200 70 L 200 130 M 180 100 L 220 100" stroke="#334155" strokeWidth="4" />
                    <rect x="180" y="70" width="40" height="60" fill="none" stroke="#334155" strokeWidth="6" />

                    {/* Open sign */}
                    <rect x="40" y="80" width="20" height="10" fill="#ef4444" />
                    <text x="42" y="88" fontSize="8" fill="white" fontWeight="bold">OPEN</text>
                </svg>
            </div>

            {/* Person walking with umbrella */}
            <motion.div
                className="absolute bottom-[8%] left-[-10%] z-20 origin-bottom"
                initial={{ x: '-10vw' }}
                animate={{ x: '110vw' }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            >
                <div className="relative">
                    {/* Bouncing animation wrapper for walking motion */}
                    <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg width="80" height="120" viewBox="0 0 80 120" className="drop-shadow-lg">
                            {/* Legs */}
                            <path d="M 40 80 L 35 110" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                            <path d="M 40 80 L 45 110" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                            {/* Body */}
                            <path d="M 40 50 L 40 80" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                            {/* Arm holding umbrella */}
                            <path d="M 40 55 L 50 65 L 55 45" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
                            
                            {/* Head */}
                            <circle cx="40" cy="45" r="8" fill="#cbd5e1" />

                            {/* Umbrella Handle */}
                            <path d="M 55 45 L 35 10" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                            {/* Umbrella Canopy */}
                            <path d="M 10 30 Q 35 -10 60 30 Q 50 25 35 30 Q 20 25 10 30 Z" fill="#2563eb" />
                        </svg>
                    </motion.div>
                </div>
            </motion.div>

            <style>{`
                @keyframes rainfall {
                    0% { transform: translateY(-20vh) rotate(15deg); }
                    100% { transform: translateY(120vh) rotate(15deg); }
                }
            `}</style>

            {/* Raindrops (Front Layer) */}
            {raindrops.map((drop) => (
                <div
                    key={drop.id}
                    className="absolute bg-blue-300 rounded-full z-[60]"
                    style={{
                        left: drop.left,
                        top: '-10%',
                        width: drop.width,
                        height: drop.height,
                        opacity: drop.opacity + 0.2, // Make sure it's visible
                        animation: `rainfall ${drop.duration}s linear infinite ${drop.delay}s`
                    }}
                />
            ))}
            
            {/* Overlay to give a slightly hazy, rainy look */}
            <div className="absolute inset-0 bg-slate-300/10 mix-blend-overlay pointer-events-none z-50" />
        </div>
    );
};

export default SeasonRain;

