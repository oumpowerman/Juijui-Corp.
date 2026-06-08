import React from 'react';

// Generate static array of falling leaves outside component to prevent re-creation
const leaves = Array.from({ length: 35 }).map((_, i) => ({
    id: `leaf-${i}`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 15 + 10,
    delay: Math.random() * -20,
    duration: Math.random() * 10 + 12,
    opacity: Math.random() * 0.6 + 0.4,
    color: ['bg-orange-500', 'bg-red-500', 'bg-amber-500', 'bg-yellow-600', 'bg-rose-600'][Math.floor(Math.random() * 5)],
    swayAmount: Math.random() * 100 - 50,
    spinStart: Math.random() * 360,
    spinEnd: Math.random() * 360 + 360
}));

const SeasonAutumn: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-amber-900/10 via-orange-50/50 to-orange-100/90">
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

            {/* Ambient Ambient Glows */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-800/10 blur-[150px] rounded-full -translate-y-1/4 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full translate-y-1/4 -translate-x-1/4" />
            
            {/* Soft Sun/Light */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-400/20 blur-[100px] rounded-full" />

            {/* Background Hills (Autumn colors) */}
            <svg className="absolute bottom-0 w-full h-[30%] opacity-80" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <path d="M 0 200 L 0 120 Q 150 80 300 130 T 600 110 T 1000 80 L 1000 200 Z" fill="#9a3412" opacity="0.4"/>
                <path d="M 0 200 L 0 140 Q 250 90 500 150 T 1000 120 L 1000 200 Z" fill="#c2410c" opacity="0.3"/>
            </svg>

            {/* Foreground elements - Tree silhouette right */}
            <div className="absolute top-0 right-0 transform origin-top-right text-orange-950/80 drop-shadow-2xl opacity-90">
                <svg width="400" height="300" viewBox="0 0 400 300" className="transform translate-x-1/4 -translate-y-1/4 lg:translate-x-0 lg:translate-y-0">
                    <path d="M 400 0 L 350 0 Q 300 150 150 250 Q 80 290 0 300 L 20 280 Q 150 220 300 100 Q 350 50 400 30 Z" fill="currentColor" />
                    <path d="M 330 80 Q 250 150 150 200 Q 100 220 40 230 L 60 210 Q 180 180 280 100 Z" fill="currentColor" />
                    <path d="M 230 160 Q 150 220 50 240 L 70 220 Q 180 180 210 140 Z" fill="currentColor" />
                </svg>
            </div>

            {/* Foreground elements - Tree silhouette left */}
            <div className="absolute top-0 left-0 transform origin-top-left text-orange-900/90 drop-shadow-2xl opacity-70">
                <svg width="300" height="250" viewBox="0 0 300 250" className="transform -translate-x-1/4 -translate-y-1/4 scale-x-[-1] lg:translate-x-0 lg:translate-y-0">
                    <path d="M 300 0 L 250 0 Q 200 120 100 200 Q 50 240 0 250 L 15 230 Q 100 180 200 80 Q 250 40 300 20 Z" fill="currentColor" />
                    <path d="M 250 60 Q 180 120 100 160 Q 50 180 20 190 L 35 175 Q 120 140 200 80 Z" fill="currentColor" />
                </svg>
            </div>

            {/* Falling Leaves */}
            {leaves.map((leaf) => (
                <div
                    key={leaf.id}
                    className={`absolute ${leaf.color} leaf-shape shadow-sm z-10 opacity-90`}
                    style={{
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
                        `
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
};

export default SeasonAutumn;

