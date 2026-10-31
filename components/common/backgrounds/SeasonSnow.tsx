import React from 'react';
import { motion } from 'framer-motion';

// Static array of fluffy round snowflakes outside component to prevent re-creation on renders
const snowflakes = Array.from({ length: 80 }).map((_, i) => ({
    id: `flake-${i}`,
    left: `${(i * 1.27 + (i % 5) * 2.3) % 100}%`,
    size: (i % 4) * 2.5 + 4, // 4px - 11.5px fluffy round flakes
    delay: (i * 0.23) % 10,
    duration: 8 + (i % 6) * 1.4,
    opacity: 0.55 + (i % 4) * 0.12,
    blur: i % 3 === 0 ? 'blur-[0.5px]' : 'blur-[1px]',
    sway: ((i % 2 === 0 ? 1 : -1) * (25 + (i % 5) * 12)),
}));

// Sparkling sunlit Diamond Dust particles in the air
const diamondDust = Array.from({ length: 32 }).map((_, i) => ({
    id: `diamond-${i}`,
    left: `${(i * 3.1 + 4) % 96}%`,
    top: `${(i * 5.7 + 6) % 76}%`,
    size: (i % 3) * 2 + 3,
    delay: (i * 0.29) % 4.5,
    duration: 2.2 + (i % 4) * 0.5,
    isGolden: i % 2 === 0,
}));

// Warm chimney smoke puffs from the Hot Cocoa Chalet
const smokes = Array.from({ length: 5 }).map((_, i) => ({
    id: `smoke-${i}`,
    delay: i * 0.9,
    duration: 3.6,
    xOffset: (i % 2 === 0 ? 1 : -1) * (8 + i * 3),
}));

// Fluffy daytime winter clouds
const clouds = [
    { id: 'wcloud-1', top: '6%', delay: 0, duration: 85, opacity: 0.85, scale: 1.1 },
    { id: 'wcloud-2', top: '14%', delay: -32, duration: 95, opacity: 0.75, scale: 0.85 },
    { id: 'wcloud-3', top: '8%', delay: -60, duration: 90, opacity: 0.8, scale: 1.0 },
];

const SeasonSnow: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-sky-300 via-rose-50/90 to-amber-50">
            <style>{`
                @keyframes snow-fall {
                    0% { top: -10%; }
                    100% { top: 112%; }
                }
                @keyframes snow-sway {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(var(--sway)); }
                }
                @keyframes diamondDustTwinkle {
                    0%, 100% { transform: scale(0.4) rotate(0deg); opacity: 0.15; }
                    50% { transform: scale(1.35) rotate(45deg); opacity: 0.95; }
                }
                @keyframes sunbeamWinterPulse {
                    0%, 100% { opacity: 0.45; }
                    50% { opacity: 0.85; }
                }
                @keyframes santaFlyRoundtrip {
                    0% {
                        transform: translate3d(-25vw, 2vh, 0) scaleX(1);
                    }
                    48% {
                        transform: translate3d(115vw, -3vh, 0) scaleX(1);
                    }
                    49.9% {
                        transform: translate3d(115vw, -3vh, 0) scaleX(-1);
                    }
                    50% {
                        transform: translate3d(115vw, 4vh, 0) scaleX(-1);
                    }
                    98% {
                        transform: translate3d(-25vw, -1vh, 0) scaleX(-1);
                    }
                    100% {
                        transform: translate3d(-25vw, 2vh, 0) scaleX(1);
                    }
                }
                @keyframes santaWaveBob {
                    0%, 100% { transform: translateY(0px) rotate(-1deg); }
                    50% { transform: translateY(-10px) rotate(1.5deg); }
                }
                @keyframes snowballArcRight {
                    0%, 12% {
                        transform: translate(0px, 0px) scale(0.4);
                        opacity: 0;
                    }
                    15% {
                        transform: translate(5px, -5px) scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: translate(115px, -68px) scale(1.05);
                        opacity: 1;
                    }
                    82% {
                        transform: translate(225px, 4px) scale(0.95);
                        opacity: 1;
                    }
                    86%, 100% {
                        transform: translate(230px, 10px) scale(1.6);
                        opacity: 0;
                    }
                }
                @keyframes snowballArcLeft {
                    0%, 52% {
                        transform: translate(230px, 0px) scale(0.4);
                        opacity: 0;
                    }
                    55% {
                        transform: translate(225px, -5px) scale(1);
                        opacity: 1;
                    }
                    75% {
                        transform: translate(115px, -64px) scale(1.05);
                        opacity: 1;
                    }
                    94% {
                        transform: translate(5px, 4px) scale(0.95);
                        opacity: 1;
                    }
                    98%, 100% {
                        transform: translate(0px, 10px) scale(1.6);
                        opacity: 0;
                    }
                }
                @keyframes snowPuffRight {
                    0%, 79% { transform: scale(0.2); opacity: 0; }
                    83% { transform: scale(1.1); opacity: 0.95; }
                    94%, 100% { transform: scale(1.9); opacity: 0; }
                }
                @keyframes snowPuffLeft {
                    0%, 91% { transform: scale(0.2); opacity: 0; }
                    95% { transform: scale(1.1); opacity: 0.95; }
                    100% { transform: scale(1.9); opacity: 0; }
                }
                @keyframes throwerArmLeft {
                    0%, 10%, 30%, 100% { transform: rotate(0deg); }
                    16% { transform: rotate(-45deg); }
                    22% { transform: rotate(35deg); }
                }
                @keyframes throwerArmRight {
                    0%, 50%, 70%, 100% { transform: rotate(0deg); }
                    54% { transform: rotate(45deg); }
                    60% { transform: rotate(-35deg); }
                }
            `}</style>

            {/* Bright Winter Sun & Warm Pastel Ambient Glows */}
            <div className="absolute -top-20 right-[10%] w-[520px] h-[520px] bg-amber-200/50 blur-[120px] rounded-full" />
            <div className="absolute top-12 left-[15%] w-[600px] h-[350px] bg-sky-200/50 blur-[120px] rounded-full" />
            <div className="absolute bottom-[18%] right-[20%] w-[500px] h-[300px] bg-rose-200/40 blur-[110px] rounded-full" />

            {/* Radiant Winter Sun */}
            <div className="absolute top-6 right-14 sm:right-24 w-44 h-44 flex items-center justify-center">
                <motion.div
                    className="w-36 h-36 rounded-full bg-gradient-to-br from-yellow-100 via-amber-200 to-rose-200/70 blur-[14px]"
                    animate={{ scale: [1, 1.08, 1], opacity: [0.85, 0.98, 0.85] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute w-20 h-20 rounded-full bg-white/95 shadow-[0_0_60px_rgba(254,240,138,0.9)] blur-[2px]" />
            </div>

            {/* Soft Winter Sunbeams */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute -top-[18%] right-[6%] w-[800px] h-[130vh] origin-top-right pointer-events-none"
                    style={{ transform: 'rotate(22deg)' }}
                >
                    <div
                        className="absolute top-0 left-[12%] w-28 h-full bg-gradient-to-b from-amber-100/45 via-rose-50/20 to-transparent blur-2xl"
                        style={{ animation: 'sunbeamWinterPulse 7s ease-in-out infinite' }}
                    />
                    <div
                        className="absolute top-0 left-[44%] w-36 h-full bg-gradient-to-b from-white/45 via-amber-50/20 to-transparent blur-2xl"
                        style={{ animation: 'sunbeamWinterPulse 8.5s ease-in-out infinite 1.5s' }}
                    />
                    <div
                        className="absolute top-0 left-[74%] w-24 h-full bg-gradient-to-b from-yellow-100/40 via-sky-50/15 to-transparent blur-xl"
                        style={{ animation: 'sunbeamWinterPulse 6.5s ease-in-out infinite 0.7s' }}
                    />
                </div>
            </div>

            {/* Fluffy Pastel Winter Clouds */}
            {clouds.map((cloud) => (
                <motion.div
                    key={cloud.id}
                    className="absolute"
                    style={{ top: cloud.top, opacity: cloud.opacity, scale: cloud.scale }}
                    initial={{ left: '-30%' }}
                    animate={{ left: '120%' }}
                    transition={{
                        duration: cloud.duration,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: cloud.delay,
                    }}
                >
                    <svg width="280" height="95" viewBox="0 0 280 95" className="drop-shadow-sm">
                        <path
                            d="M 45 72 Q 22 72 22 50 Q 22 30 52 30 Q 70 8 110 14 Q 148 4 185 24 Q 212 12 238 34 Q 258 38 258 56 Q 258 72 232 72 Z"
                            fill="#FFFFFF"
                            opacity="0.92"
                        />
                    </svg>
                </motion.div>
            ))}

            {/* 🎅 Flying Santa Claus & Reindeer Sleigh (Gliding Left <-> Right across the sky) */}
            <div
                className="absolute top-[9%] left-0 z-20 pointer-events-none"
                style={{
                    animation: 'santaFlyRoundtrip 38s linear infinite',
                }}
            >
                <div style={{ animation: 'santaWaveBob 2.8s ease-in-out infinite' }}>
                    <svg width="310" height="105" viewBox="0 0 310 105" className="drop-shadow-lg overflow-visible">
                        {/* Golden Magic Stardust Trail behind the sleigh */}
                        <g opacity="0.9">
                            <circle cx="8" cy="68" r="3" fill="#FDE047" />
                            <circle cx="22" cy="74" r="2.5" fill="#F9A8D4" />
                            <circle cx="34" cy="64" r="3.5" fill="#FEF08A" />
                            <circle cx="48" cy="72" r="2.5" fill="#FDE047" />
                            <path d="M 16 58 Q 42 70 72 62" stroke="#FDE047" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                        </g>

                        {/* Sleigh Runners (Gold Blades) */}
                        <path
                            d="M 56 80 L 142 80 Q 156 80 160 66"
                            stroke="#F59E0B"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <line x1="76" y1="68" x2="76" y2="80" stroke="#F59E0B" strokeWidth="3" />
                        <line x1="126" y1="68" x2="126" y2="80" stroke="#F59E0B" strokeWidth="3" />

                        {/* Toy Sack & Colorful Gifts in Back of Sleigh */}
                        <circle cx="78" cy="46" r="16" fill="#F43F5E" />
                        <rect x="66" y="30" width="12" height="10" rx="2" fill="#34D399" />
                        <line x1="72" y1="30" x2="72" y2="40" stroke="#FEF08A" strokeWidth="2" />
                        <rect x="80" y="28" width="11" height="11" rx="2" fill="#60A5FA" />
                        <line x1="85.5" y1="28" x2="85.5" y2="39" stroke="#FDE047" strokeWidth="2" />

                        {/* Santa Claus Sitting & Waving */}
                        {/* Santa Body */}
                        <ellipse cx="108" cy="46" rx="14" ry="16" fill="#DC2626" />
                        <path d="M 95 48 L 121 48" stroke="#1E293B" strokeWidth="3.5" />
                        <rect x="105" y="45" width="6" height="6" fill="#FACC15" />
                        {/* Santa Head & Fluffy White Beard */}
                        <circle cx="108" cy="28" r="9" fill="#FDE68A" />
                        <path d="M 99 30 Q 108 44 118 30 Q 114 38 108 38 Q 102 38 99 30 Z" fill="#FFFFFF" />
                        <circle cx="108" cy="32" r="7" fill="#FFFFFF" />
                        <circle cx="111" cy="26" r="1.5" fill="#1E293B" />
                        <circle cx="114" cy="28" r="2" fill="#FB7185" />
                        {/* Santa Hat */}
                        <path d="M 98 24 Q 106 10 120 18 L 116 24 Z" fill="#DC2626" />
                        <rect x="97" y="22" width="21" height="4" rx="2" fill="#FFFFFF" />
                        <circle cx="121" cy="18" r="3.5" fill="#FFFFFF" />
                        {/* Santa Waving Arm */}
                        <path d="M 102 40 L 92 24" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
                        <circle cx="91" cy="22" r="3" fill="#FFFFFF" />

                        {/* Classic Red Sleigh Body with Gold Trim */}
                        <path
                            d="M 58 46 Q 58 70 80 70 L 134 70 Q 150 70 154 50 L 140 50 Q 134 58 118 58 L 76 58 Q 68 58 66 46 Z"
                            fill="#EF4444"
                            stroke="#FDE047"
                            strokeWidth="2"
                        />

                        {/* Golden Reins connecting Sleigh to Reindeer */}
                        <path
                            d="M 148 54 Q 185 60 218 50 Q 250 56 278 46"
                            stroke="#FBBF24"
                            strokeWidth="1.8"
                            strokeDasharray="3 2"
                            fill="none"
                        />

                        {/* Reindeer #1 (Middle Reindeer) */}
                        <g transform="translate(182, 26)">
                            {/* Legs */}
                            <path d="M 12 32 L 4 46" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 18 32 L 14 48" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 34 32 L 42 46" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 38 32 L 48 42" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
                            {/* Tail */}
                            <path d="M 6 22 L 0 18" stroke="#FEF3C7" strokeWidth="3" strokeLinecap="round" />
                            {/* Body & Neck */}
                            <ellipse cx="24" cy="26" rx="16" ry="9" fill="#B45309" />
                            <path d="M 34 22 L 42 10" stroke="#B45309" strokeWidth="7" strokeLinecap="round" />
                            {/* Head */}
                            <ellipse cx="45" cy="10" rx="7" ry="5" fill="#B45309" />
                            <circle cx="47" cy="9" r="1.3" fill="#1E293B" />
                            <circle cx="52" cy="10" r="2" fill="#78350F" />
                            {/* Antlers */}
                            <path d="M 41 6 L 37 -4 M 39 1 L 34 0 M 44 5 L 43 -5" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
                            {/* Collar with Gold Bell */}
                            <path d="M 35 16 L 42 20" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="39" cy="20" r="2.2" fill="#FACC15" />
                        </g>

                        {/* Reindeer #2 (Lead Reindeer — Rudolph with Glowing Red Nose!) */}
                        <g transform="translate(242, 20)">
                            {/* Legs */}
                            <path d="M 12 32 L 2 44" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 18 32 L 12 47" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 34 32 L 44 45" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
                            <path d="M 38 32 L 50 40" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
                            {/* Tail */}
                            <path d="M 6 22 L 0 18" stroke="#FEF3C7" strokeWidth="3" strokeLinecap="round" />
                            {/* Body & Neck */}
                            <ellipse cx="24" cy="26" rx="16" ry="9" fill="#D97706" />
                            <path d="M 34 22 L 42 10" stroke="#D97706" strokeWidth="7" strokeLinecap="round" />
                            {/* Head */}
                            <ellipse cx="45" cy="10" rx="7" ry="5" fill="#D97706" />
                            <circle cx="47" cy="9" r="1.3" fill="#1E293B" />
                            {/* Antlers */}
                            <path d="M 41 6 L 37 -4 M 39 1 L 34 0 M 44 5 L 43 -5" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
                            {/* Collar with Gold Bell */}
                            <path d="M 35 16 L 42 20" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="39" cy="20" r="2.2" fill="#FACC15" />
                            {/* Rudolph's Glowing Red Nose */}
                            <circle cx="53" cy="10" r="5" fill="#FB7185" opacity="0.45" />
                            <circle cx="53" cy="10" r="2.8" fill="#EF4444" />
                        </g>
                    </svg>
                </div>
            </div>

            {/* Distant Pastel Sunlit Alpine Mountains */}
            <svg className="absolute bottom-[18%] w-full h-[42%]" preserveAspectRatio="none" viewBox="0 0 1200 240">
                <defs>
                    <linearGradient id="back-alpine-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#C7D2FE" />
                        <stop offset="100%" stopColor="#E0F2FE" />
                    </linearGradient>
                    <linearGradient id="front-alpine-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#BAE6FD" />
                        <stop offset="100%" stopColor="#F0F9FF" />
                    </linearGradient>
                </defs>

                {/* Back Mountain Range */}
                <path
                    d="M 0 240 L 0 110 Q 140 35 280 125 T 560 55 T 880 120 T 1200 45 L 1200 240 Z"
                    fill="url(#back-alpine-grad)"
                    opacity="0.85"
                />
                {/* Sunlit Snowcaps on Back Range */}
                <path d="M 556 57 Q 585 75 572 105 L 532 105 Q 522 75 556 57 Z" fill="#FFFFFF" opacity="0.9" />
                <path d="M 140 72 Q 165 88 155 112 L 118 112 Q 110 88 140 72 Z" fill="#FFFFFF" opacity="0.85" />

                {/* Front Mountain Range */}
                <path
                    d="M 0 240 L 0 150 Q 180 90 360 165 T 720 85 T 1060 145 T 1200 110 L 1200 240 Z"
                    fill="url(#front-alpine-grad)"
                    opacity="0.95"
                />
                {/* Sunlit Snowcaps on Front Range */}
                <path d="M 718 87 Q 752 108 738 138 L 692 138 Q 680 108 718 87 Z" fill="#FFFFFF" opacity="0.95" />
            </svg>

            {/* Layered Sunlit Snowhills & Carnival Ground */}
            <svg
                className="absolute bottom-0 left-0 w-[140%] h-[32%] -translate-x-[10%]"
                preserveAspectRatio="none"
                viewBox="0 0 1200 140"
            >
                <defs>
                    <linearGradient id="snow-hill-back" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#F0F9FF" />
                        <stop offset="100%" stopColor="#E0F2FE" />
                    </linearGradient>
                    <linearGradient id="snow-hill-front" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#F1F5F9" />
                    </linearGradient>
                </defs>
                <path d="M 0 140 L 0 55 Q 300 18 600 55 T 1200 42 L 1200 140 Z" fill="url(#snow-hill-back)" />
                <path d="M 0 140 L 0 78 Q 260 46 540 78 T 1020 58 T 1200 72 L 1200 140 Z" fill="url(#snow-hill-front)" />
            </svg>

            {/* 🎪 Festive Carnival Pastel Bunting Flags & Fairy Lights */}
            <svg
                className="absolute bottom-[16%] left-[4%] w-[92%] h-[120px] z-10 hidden md:block pointer-events-none"
                viewBox="0 0 1100 120"
                preserveAspectRatio="none"
            >
                {/* Left String connecting Tree to Chalet */}
                <path d="M 80 25 Q 250 75 430 20" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
                <polygon points="120,35 134,39 125,54" fill="#FDA4AF" />
                <polygon points="165,45 179,48 171,63" fill="#FDE047" />
                <polygon points="210,51 224,53 216,68" fill="#6EE7B7" />
                <polygon points="255,53 269,53 262,68" fill="#93C5FD" />
                <polygon points="300,50 314,48 308,64" fill="#C4B5FD" />
                <polygon points="345,44 359,40 354,56" fill="#FDA4AF" />
                <polygon points="390,34 404,29 399,45" fill="#FDE047" />

                {/* Right String connecting Chalet to Right Pine Trees */}
                <path d="M 555 22 Q 760 78 960 20" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
                <polygon points="600,34 614,38 606,53" fill="#6EE7B7" />
                <polygon points="650,44 664,47 657,62" fill="#FDA4AF" />
                <polygon points="700,51 714,52 707,67" fill="#FDE047" />
                <polygon points="750,53 764,53 757,68" fill="#C4B5FD" />
                <polygon points="800,50 814,48 808,64" fill="#93C5FD" />
                <polygon points="850,43 864,39 858,55" fill="#FDA4AF" />
                <polygon points="900,33 914,28 909,44" fill="#6EE7B7" />

                {/* Warm Glowing Carnival Bulbs along the strings */}
                <circle cx="148" cy="42" r="3.5" fill="#FEF08A" />
                <circle cx="240" cy="53" r="3.5" fill="#FEF08A" />
                <circle cx="330" cy="47" r="3.5" fill="#FEF08A" />
                <circle cx="632" cy="40" r="3.5" fill="#FEF08A" />
                <circle cx="732" cy="53" r="3.5" fill="#FEF08A" />
                <circle cx="832" cy="47" r="3.5" fill="#FEF08A" />
            </svg>

            {/* Frosted Mint & Emerald Pine Trees with Pastel Ornaments */}
            <div className="absolute bottom-[13%] left-[5%] transform scale-110 origin-bottom z-10">
                <svg width="85" height="130" viewBox="0 0 85 130" className="drop-shadow-lg">
                    <rect x="37" y="96" width="11" height="30" rx="2" fill="#92400E" />
                    <path d="M 42 12 L 8 58 L 28 58 L 2 102 L 82 102 L 56 58 L 76 58 Z" fill="#10B981" />
                    <path d="M 42 12 L 26 36 L 36 31 L 42 22 L 48 31 L 58 36 Z" fill="#FFFFFF" />
                    <path d="M 28 58 L 12 82 L 25 77 L 38 64 L 48 64 L 60 77 L 72 82 Z" fill="#FFFFFF" />
                    {/* Ornaments */}
                    <circle cx="42" cy="45" r="3.5" fill="#FDA4AF" />
                    <circle cx="30" cy="85" r="3.5" fill="#FDE047" />
                    <circle cx="55" cy="82" r="3.5" fill="#93C5FD" />
                </svg>
            </div>

            <div className="absolute bottom-[11%] right-[6%] transform scale-125 origin-bottom z-10">
                <svg width="85" height="130" viewBox="0 0 85 130" className="drop-shadow-lg">
                    <rect x="37" y="96" width="11" height="30" rx="2" fill="#92400E" />
                    <path d="M 42 12 L 8 58 L 28 58 L 2 102 L 82 102 L 56 58 L 76 58 Z" fill="#34D399" />
                    <path d="M 42 12 L 26 36 L 36 31 L 42 22 L 48 31 L 58 36 Z" fill="#FFFFFF" />
                    <path d="M 28 58 L 12 82 L 25 77 L 38 64 L 48 64 L 60 77 L 72 82 Z" fill="#FFFFFF" />
                    {/* Ornaments & Star */}
                    <circle cx="42" cy="10" r="5" fill="#FACC15" />
                    <circle cx="35" cy="48" r="3.5" fill="#FDE047" />
                    <circle cx="50" cy="52" r="3.5" fill="#F472B6" />
                    <circle cx="28" cy="86" r="3.5" fill="#C4B5FD" />
                    <circle cx="56" cy="88" r="3.5" fill="#FDE047" />
                </svg>
            </div>

            {/* ☕ Cozy Winter Carnival "HOT COCOA" Chalet (Center-Back) */}
            <div className="absolute bottom-[13%] left-[38%] transform scale-105 sm:scale-115 origin-bottom z-10 hidden sm:block">
                {/* Warm White Chimney Smoke Puffs */}
                {smokes.map((smoke) => (
                    <motion.div
                        key={smoke.id}
                        className="absolute w-7 h-7 rounded-full bg-white/80 blur-[4px]"
                        initial={{ left: 132, top: 8, scale: 0.5, opacity: 0.85 }}
                        animate={{
                            top: -75,
                            left: [132, 132 + smoke.xOffset, 142 + smoke.xOffset],
                            scale: 2.3,
                            opacity: 0,
                        }}
                        transition={{ duration: smoke.duration, repeat: Infinity, delay: smoke.delay, ease: 'easeOut' }}
                    />
                ))}

                <svg width="190" height="160" viewBox="0 0 190 160" className="drop-shadow-xl">
                    {/* Chimney */}
                    <rect x="128" y="18" width="22" height="42" rx="2" fill="#FB7185" />
                    <rect x="124" y="14" width="30" height="8" rx="4" fill="#FFFFFF" />

                    {/* Chalet Walls (Warm Pastel Cream & Coral Trim) */}
                    <rect x="32" y="64" width="126" height="82" rx="4" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="2" />
                    <rect x="26" y="140" width="138" height="8" rx="3" fill="#FDBA74" />

                    {/* Candy Cane Corner Pillars */}
                    <rect x="32" y="64" width="8" height="76" fill="#FDA4AF" />
                    <rect x="150" y="64" width="8" height="76" fill="#FDA4AF" />

                    {/* Warm Glowing Windows */}
                    <rect x="48" y="86" width="26" height="28" rx="4" fill="#FEF08A" stroke="#F59E0B" strokeWidth="2.5" />
                    <path d="M 61 86 L 61 114 M 48 100 L 74 100" stroke="#F59E0B" strokeWidth="2" />
                    <rect x="116" y="86" width="26" height="28" rx="4" fill="#FEF08A" stroke="#F59E0B" strokeWidth="2.5" />
                    <path d="M 129 86 L 129 114 M 116 100 L 142 100" stroke="#F59E0B" strokeWidth="2" />

                    {/* Festive Mint Door & Wreath */}
                    <rect x="82" y="92" width="26" height="50" rx="4" fill="#34D399" />
                    <circle cx="95" cy="108" r="7" fill="none" stroke="#059669" strokeWidth="3.5" />
                    <circle cx="95" cy="102" r="2" fill="#EF4444" />
                    <circle cx="103" cy="120" r="2" fill="#FACC15" />

                    {/* Chalet Roof & Fluffy Snow Cap */}
                    <path d="M 16 66 L 95 12 L 174 66 Z" fill="#F472B6" />
                    <path
                        d="M 12 68 L 95 8 L 178 68 Q 160 75 144 65 Q 124 75 106 65 Q 95 73 84 65 Q 64 75 46 65 Q 28 75 12 68 Z"
                        fill="#FFFFFF"
                    />

                    {/* "HOT COCOA" Carnival Signboard */}
                    <rect x="54" y="54" width="82" height="18" rx="9" fill="#FFFFFF" stroke="#FB7185" strokeWidth="2" />
                    <text x="95" y="66" fontSize="8" fill="#E11D48" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">
                        HOT COCOA
                    </text>
                </svg>
            </div>

            {/* ⛸️ Frozen Mirror Pond & Gliding Ice Skater (Left-Center Foreground) */}
            <div className="absolute bottom-[3%] left-[6%] sm:left-[12%] z-20 origin-bottom">
                <div className="relative w-[270px] sm:w-[340px] h-[110px]">
                    {/* Crystal Blue Frozen Pond SVG */}
                    <svg width="100%" height="100%" viewBox="0 0 340 110" className="drop-shadow-sm">
                        <defs>
                            <linearGradient id="frozen-pond-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#E0F2FE" />
                                <stop offset="55%" stopColor="#BAE6FD" />
                                <stop offset="100%" stopColor="#7DD3FC" />
                            </linearGradient>
                        </defs>
                        {/* Outer Snow Rim */}
                        <ellipse cx="170" cy="68" rx="164" ry="34" fill="#FFFFFF" />
                        {/* Mirror Ice Surface */}
                        <ellipse cx="170" cy="68" rx="152" ry="28" fill="url(#frozen-pond-grad)" />
                        {/* Ice Shimmer & Figure-8 Skate Tracks */}
                        <path
                            d="M 65 66 Q 115 52 170 68 T 275 66"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            fill="none"
                            opacity="0.75"
                        />
                        <path
                            d="M 85 74 Q 140 84 195 66 T 260 72"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                            fill="none"
                            opacity="0.65"
                        />
                    </svg>

                    {/* Animated Character Ice Skating across the Frozen Pond */}
                    <motion.div
                        className="absolute bottom-[28px] left-[45px]"
                        animate={{
                            x: [0, 175, 0],
                            y: [0, -8, 4, -6, 0],
                            scaleX: [1, 1, -1, -1, 1],
                        }}
                        transition={{
                            duration: 9,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <svg width="56" height="72" viewBox="0 0 56 72" className="drop-shadow-md">
                            {/* Skates & Legs */}
                            <path d="M 28 46 L 18 62" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                            <path d="M 28 46 L 38 56" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                            <line x1="14" y1="65" x2="24" y2="65" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="35" y1="59" x2="44" y2="57" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                            {/* Pastel Lavender Winter Coat & Scarf */}
                            <path d="M 20 26 L 36 26 L 40 48 L 16 48 Z" fill="#C084FC" rx="4" />
                            <path d="M 20 26 Q 28 30 36 26" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" fill="none" />
                            <path d="M 22 27 L 12 34" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" />
                            {/* Arms outstretched gracefully */}
                            <path d="M 16 30 L 42 28" stroke="#A855F7" strokeWidth="4" strokeLinecap="round" />
                            {/* Head & Cute Pink Earmuffs */}
                            <circle cx="28" cy="17" r="7.5" fill="#FDE68A" />
                            <circle cx="21" cy="17" r="3.5" fill="#F472B6" />
                            <path d="M 21 15 Q 28 6 35 15" stroke="#F472B6" strokeWidth="2" fill="none" />
                        </svg>
                    </motion.div>
                </div>
            </div>

            {/* ⛄ Cheerful Carnival Snowman (Near Center) */}
            <div className="absolute bottom-[7%] left-[31%] z-20 origin-bottom transform scale-75 sm:scale-95">
                <svg width="95" height="135" viewBox="0 0 95 135" className="drop-shadow-lg">
                    {/* Snowman Body */}
                    <circle cx="48" cy="100" r="30" fill="#E2E8F0" />
                    <circle cx="48" cy="97" r="30" fill="#FFFFFF" />
                    <circle cx="48" cy="60" r="23" fill="#E2E8F0" />
                    <circle cx="48" cy="58" r="23" fill="#FFFFFF" />
                    <circle cx="48" cy="28" r="18" fill="#E2E8F0" />
                    <circle cx="48" cy="26" r="18" fill="#FFFFFF" />

                    {/* Pastel Buttons */}
                    <circle cx="48" cy="52" r="2.8" fill="#F43F5E" />
                    <circle cx="48" cy="64" r="2.8" fill="#F59E0B" />
                    <circle cx="48" cy="76" r="2.8" fill="#10B981" />

                    {/* Smiling Face & Carrot Nose */}
                    <circle cx="42" cy="22" r="2.2" fill="#1E293B" />
                    <circle cx="54" cy="22" r="2.2" fill="#1E293B" />
                    <ellipse cx="37" cy="26" rx="3.2" ry="1.8" fill="#FDA4AF" opacity="0.8" />
                    <ellipse cx="59" cy="26" rx="3.2" ry="1.8" fill="#FDA4AF" opacity="0.8" />
                    <path d="M 48 24 L 66 26 L 48 29 Z" fill="#FB923C" />
                    <path d="M 42 32 Q 48 36 54 32" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />

                    {/* Cheering Branch Arms */}
                    <path d="M 26 56 L 8 38 M 14 44 L 6 47" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 70 56 L 88 38 M 82 44 L 90 47" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />

                    {/* Striped Pastel Scarf */}
                    <path d="M 32 39 Q 48 45 64 39 L 62 44 Q 48 50 34 44 Z" fill="#FB7185" />
                    <path d="M 54 43 L 58 68 L 50 68 L 48 43 Z" fill="#FDE047" />

                    {/* Festive Knit Beanie with Pom-Pom */}
                    <path d="M 31 18 Q 48 -2 65 18 Z" fill="#FB7185" />
                    <rect x="29" y="15" width="38" height="5" rx="2.5" fill="#FEF08A" />
                    <circle cx="48" cy="4" r="5" fill="#FFFFFF" />
                </svg>
            </div>

            {/* ❄️🎯 Interactive Snowball Fight Scene (Right-Center Foreground) */}
            <div className="absolute bottom-[4.5%] right-[8%] sm:right-[13%] z-20 origin-bottom w-[290px] sm:w-[330px] h-[135px]">
                {/* Left Snowball Thrower (Sky Blue & Sunny Yellow Outfit) */}
                <div className="absolute bottom-0 left-0">
                    <svg width="85" height="105" viewBox="0 0 85 105" className="drop-shadow-md overflow-visible">
                        {/* Legs */}
                        <path d="M 28 72 L 24 94" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
                        <path d="M 38 72 L 42 94" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
                        {/* Parka Coat */}
                        <path d="M 20 42 L 46 42 L 50 76 L 16 76 Z" fill="#38BDF8" rx="5" />
                        <path d="M 18 42 Q 33 47 48 42" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none" />
                        {/* Head & Sunny Beanie */}
                        <circle cx="33" cy="30" r="9" fill="#FDE68A" />
                        <path d="M 23 27 Q 33 12 43 27 Z" fill="#FACC15" />
                        <circle cx="33" cy="16" r="3.5" fill="#FFFFFF" />
                        {/* Animated Throwing Arm */}
                        <g
                            style={{
                                transformOrigin: '36px 48px',
                                animation: 'throwerArmLeft 3.2s ease-in-out infinite',
                            }}
                        >
                            <path d="M 36 48 L 54 36" stroke="#0284C7" strokeWidth="5.5" strokeLinecap="round" />
                            <circle cx="56" cy="34" r="4" fill="#FFFFFF" />
                        </g>

                        {/* Snow Fort & Stacked Snowballs (Left) */}
                        <path d="M 44 96 L 44 68 Q 62 60 78 68 L 78 96 Z" fill="#E0F2FE" />
                        <path d="M 44 92 L 44 66 Q 62 58 78 66 L 78 92 Z" fill="#FFFFFF" />
                        <circle cx="52" cy="62" r="4.5" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
                        <circle cx="61" cy="62" r="4.5" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
                        <circle cx="56" cy="55" r="4.5" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
                    </svg>
                </div>

                {/* Right Snowball Thrower (Coral Rose & Mint Outfit) */}
                <div className="absolute bottom-0 right-0">
                    <svg width="85" height="105" viewBox="0 0 85 105" className="drop-shadow-md overflow-visible">
                        {/* Legs */}
                        <path d="M 46 72 L 42 94" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
                        <path d="M 56 72 L 60 94" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
                        {/* Parka Coat */}
                        <path d="M 38 42 L 64 42 L 68 76 L 34 76 Z" fill="#FB7185" rx="5" />
                        <path d="M 36 42 Q 51 47 66 42" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none" />
                        {/* Head & Mint Beanie */}
                        <circle cx="51" cy="30" r="9" fill="#FDE68A" />
                        <path d="M 41 27 Q 51 12 61 27 Z" fill="#34D399" />
                        <circle cx="51" cy="16" r="3.5" fill="#FFFFFF" />
                        {/* Animated Throwing Arm */}
                        <g
                            style={{
                                transformOrigin: '48px 48px',
                                animation: 'throwerArmRight 3.2s ease-in-out infinite',
                            }}
                        >
                            <path d="M 48 48 L 30 36" stroke="#E11D48" strokeWidth="5.5" strokeLinecap="round" />
                            <circle cx="28" cy="34" r="4" fill="#FFFFFF" />
                        </g>

                        {/* Snow Fort & Stacked Snowballs (Right) */}
                        <path d="M 6 96 L 6 68 Q 22 60 40 68 L 40 96 Z" fill="#E0F2FE" />
                        <path d="M 6 92 L 6 66 Q 22 58 40 66 L 40 92 Z" fill="#FFFFFF" />
                        <circle cx="22" cy="62" r="4.5" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
                        <circle cx="31" cy="62" r="4.5" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
                        <circle cx="26" cy="55" r="4.5" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
                    </svg>
                </div>

                {/* Flying Snowball #1 (Left -> Right Parabolic Arc) */}
                <div
                    className="absolute bottom-[58px] left-[48px] w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] border border-sky-100"
                    style={{
                        animation: 'snowballArcRight 3.2s ease-in-out infinite',
                    }}
                />
                {/* Snow Puff Burst when Snowball #1 hits Right Fort */}
                <div
                    className="absolute bottom-[48px] left-[272px] w-7 h-7 rounded-full border-2 border-dashed border-white"
                    style={{
                        animation: 'snowPuffRight 3.2s ease-out infinite',
                    }}
                />

                {/* Flying Snowball #2 (Right -> Left Parabolic Arc) */}
                <div
                    className="absolute bottom-[58px] left-[48px] w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] border border-sky-100"
                    style={{
                        animation: 'snowballArcLeft 3.2s ease-in-out infinite',
                    }}
                />
                {/* Snow Puff Burst when Snowball #2 hits Left Fort */}
                <div
                    className="absolute bottom-[48px] left-[44px] w-7 h-7 rounded-full border-2 border-dashed border-white"
                    style={{
                        animation: 'snowPuffLeft 3.2s ease-out infinite',
                    }}
                />
            </div>

            {/* ✨ Sparkling Sunlit Diamond Dust Particles */}
            {diamondDust.map((d) => (
                <div
                    key={d.id}
                    className={`absolute rounded-full z-30 ${
                        d.isGolden
                            ? 'bg-amber-100 shadow-[0_0_8px_rgba(254,240,138,0.95)]'
                            : 'bg-white shadow-[0_0_8px_rgba(186,230,253,0.95)]'
                    }`}
                    style={{
                        left: d.left,
                        top: d.top,
                        width: `${d.size}px`,
                        height: `${d.size}px`,
                        animation: `diamondDustTwinkle ${d.duration}s ease-in-out infinite ${d.delay}s`,
                    }}
                />
            ))}

            {/* ❄️ Fluffy Round Snowflakes (Front Layer) */}
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className={`absolute bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.85)] ${flake.blur} z-40`}
                    style={
                        {
                            left: flake.left,
                            top: '-10%',
                            width: flake.size,
                            height: flake.size,
                            opacity: flake.opacity,
                            '--sway': `${flake.sway}px`,
                            animation: `snow-fall ${flake.duration}s linear infinite ${flake.delay}s, snow-sway ${
                                flake.duration * 0.85
                            }s ease-in-out infinite ${flake.delay}s alternate`,
                        } as React.CSSProperties
                    }
                />
            ))}

            {/* Soft Warm Winter Daylight Veil */}
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-50/10 via-transparent to-amber-100/15 pointer-events-none z-50" />
        </div>
    );
};

export default SeasonSnow;
