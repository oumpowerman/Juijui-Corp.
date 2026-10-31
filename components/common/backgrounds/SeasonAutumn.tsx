import React from 'react';

// Generate static array of falling leaves outside component to prevent re-creation
const leaves = Array.from({ length: 35 }).map((_, i) => ({
    id: `leaf-${i}`,
    left: `${(i * 2.9 + 2) % 100}%`,
    size: (i % 4) * 3.5 + 10,
    delay: -((i * 1.1) % 20),
    duration: 12 + (i % 5) * 2,
    opacity: 0.55 + (i % 4) * 0.1,
    color: ['bg-orange-500', 'bg-red-500', 'bg-amber-500', 'bg-yellow-500', 'bg-rose-500'][i % 5],
    swayAmount: (i % 2 === 0 ? 1 : -1) * (25 + (i % 4) * 12),
    spinStart: (i * 45) % 360,
    spinEnd: ((i * 45) % 360) + 360,
}));

const SeasonAutumn: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-amber-200/45 via-orange-50/70 to-amber-100/90">
            <style>{`
                @keyframes autumn-fall {
                    0% { top: -10%; }
                    100% { top: 110%; }
                }
                @keyframes autumn-sway {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(var(--sway)); }
                }
                @keyframes autumn-spin {
                    0% { transform: rotate(var(--spin-start)); }
                    100% { transform: rotate(var(--spin-end)); }
                }
                .leaf-shape {
                    border-radius: 100% 0% 100% 0% / 100% 0% 100% 0%;
                }
            `}</style>

            {/* Ambient Warm Autumn Glows */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-300/20 blur-[150px] rounded-full -translate-y-1/4 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-400/15 blur-[150px] rounded-full translate-y-1/4 -translate-x-1/4" />

            {/* Soft Golden Autumn Sun */}
            <div className="absolute top-12 right-24 w-36 h-36 bg-amber-200/80 rounded-full blur-[6px] shadow-[0_0_80px_rgba(251,191,36,0.65)]" />

            {/* Connected Horizon Autumn Hills (Aligned with SeasonRain, SeasonSnow & SeasonSummer) */}
            <svg
                className="absolute bottom-0 left-0 w-[140%] h-[32%] -translate-x-[10%]"
                preserveAspectRatio="none"
                viewBox="0 0 1200 140"
            >
                <defs>
                    <linearGradient id="autumn-hill-back" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FDBA74" />
                        <stop offset="100%" stopColor="#EA580C" />
                    </linearGradient>
                    <linearGradient id="autumn-hill-front" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FB923C" />
                        <stop offset="100%" stopColor="#C2410C" />
                    </linearGradient>
                </defs>
                <path
                    d="M 0 140 L 0 55 Q 300 18 600 55 T 1200 42 L 1200 140 Z"
                    fill="url(#autumn-hill-back)"
                    opacity="0.65"
                />
                <path
                    d="M 0 140 L 0 78 Q 260 46 540 78 T 1020 58 T 1200 72 L 1200 140 Z"
                    fill="url(#autumn-hill-front)"
                    opacity="0.78"
                />
            </svg>

            {/* Foreground elements - Tree branch right */}
            <div className="absolute top-0 right-0 transform origin-top-right text-amber-900/75 drop-shadow-xl opacity-85">
                <svg
                    width="400"
                    height="300"
                    viewBox="0 0 400 300"
                    className="transform translate-x-1/4 -translate-y-1/4 lg:translate-x-0 lg:translate-y-0"
                >
                    <path
                        d="M 400 0 L 350 0 Q 300 150 150 250 Q 80 290 0 300 L 20 280 Q 150 220 300 100 Q 350 50 400 30 Z"
                        fill="currentColor"
                    />
                    <path
                        d="M 330 80 Q 250 150 150 200 Q 100 220 40 230 L 60 210 Q 180 180 280 100 Z"
                        fill="currentColor"
                    />
                    <path
                        d="M 230 160 Q 150 220 50 240 L 70 220 Q 180 180 210 140 Z"
                        fill="currentColor"
                    />
                </svg>
            </div>

            {/* Foreground elements - Tree branch left */}
            <div className="absolute top-0 left-0 transform origin-top-left text-amber-800/75 drop-shadow-xl opacity-70">
                <svg
                    width="300"
                    height="250"
                    viewBox="0 0 300 250"
                    className="transform -translate-x-1/4 -translate-y-1/4 scale-x-[-1] lg:translate-x-0 lg:translate-y-0"
                >
                    <path
                        d="M 300 0 L 250 0 Q 200 120 100 200 Q 50 240 0 250 L 15 230 Q 100 180 200 80 Q 250 40 300 20 Z"
                        fill="currentColor"
                    />
                    <path
                        d="M 250 60 Q 180 120 100 160 Q 50 180 20 190 L 35 175 Q 120 140 200 80 Z"
                        fill="currentColor"
                    />
                </svg>
            </div>

            {/* Falling Leaves */}
            {leaves.map((leaf) => (
                <div
                    key={leaf.id}
                    className={`absolute ${leaf.color} leaf-shape shadow-sm z-10 opacity-90`}
                    style={
                        {
                            left: leaf.left,
                            top: '-10%',
                            width: leaf.size,
                            height: leaf.size,
                            '--sway': `${leaf.swayAmount}px`,
                            '--spin-start': `${leaf.spinStart}deg`,
                            '--spin-end': `${leaf.spinEnd}deg`,
                            animation: `
                            autumn-fall ${leaf.duration}s linear infinite ${leaf.delay}s, 
                            autumn-sway ${leaf.duration * 0.8}s ease-in-out infinite ${leaf.delay}s alternate,
                            autumn-spin ${leaf.duration * 1.5}s linear infinite ${leaf.delay}s
                        `,
                        } as React.CSSProperties
                    }
                />
            ))}
        </div>
    );
};

export default SeasonAutumn;
