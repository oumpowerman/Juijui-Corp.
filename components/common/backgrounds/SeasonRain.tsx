import React from 'react';
import { motion } from 'framer-motion';

// Static array of sun-kissed translucent raindrops outside component to prevent re-creation on renders
const raindrops = Array.from({ length: 85 }).map((_, i) => ({
    id: `rain-${i}`,
    left: `${(i * 1.19 + (i % 7) * 3.1) % 100}%`,
    height: (i % 4) * 7 + 18, // 18px - 39px sleek rain streaks
    delay: (i * 0.17) % 2.4,
    duration: 0.65 + (i % 5) * 0.12, // 0.65s - 1.13s smooth fall
    opacity: 0.35 + (i % 4) * 0.12,
    width: i % 5 === 0 ? '2.5px' : '1.5px',
    isGolden: i % 3 === 0, // Every 3rd drop catches extra warm sunlight
}));

// Floating sun-kissed mist sparkles in the air
const sunSparkles = Array.from({ length: 26 }).map((_, i) => ({
    id: `sparkle-${i}`,
    left: `${(i * 3.8 + 5) % 96}%`,
    top: `${(i * 7.3 + 8) % 78}%`,
    size: (i % 3) * 2 + 4,
    delay: (i * 0.35) % 4,
    duration: 2.4 + (i % 4) * 0.6,
}));

// Animated water ripples on the ground & puddles
const puddleRipples = [
    { id: 'ripple-1', left: '14%', bottom: '4.5%', delay: 0, scale: 1 },
    { id: 'ripple-2', left: '28%', bottom: '2.8%', delay: 0.8, scale: 0.85 },
    { id: 'ripple-3', left: '46%', bottom: '5.2%', delay: 0.4, scale: 1.15 },
    { id: 'ripple-4', left: '62%', bottom: '3.2%', delay: 1.3, scale: 0.9 },
    { id: 'ripple-5', left: '78%', bottom: '5.8%', delay: 0.6, scale: 1.05 },
    { id: 'ripple-6', left: '89%', bottom: '3.6%', delay: 1.7, scale: 0.8 },
    { id: 'ripple-7', left: '36%', bottom: '6.5%', delay: 1.1, scale: 0.75 },
    { id: 'ripple-8', left: '54%', bottom: '2.2%', delay: 1.9, scale: 0.95 },
];

// Fluffy white & warm sunlit clouds
const clouds = [
    { id: 'cloud-1', top: '4%', delay: 0, duration: 75, opacity: 0.88, scale: 1.15 },
    { id: 'cloud-2', top: '11%', delay: -22, duration: 90, opacity: 0.78, scale: 0.9 },
    { id: 'cloud-3', top: '6%', delay: -45, duration: 82, opacity: 0.85, scale: 1.25 },
    { id: 'cloud-4', top: '15%', delay: -60, duration: 95, opacity: 0.72, scale: 0.85 },
];

const SeasonRain: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-amber-50">
            {/* Ambient Sunshower Sky Glows */}
            <div className="absolute -top-24 -right-16 w-[650px] h-[650px] bg-amber-200/60 blur-[130px] rounded-full" />
            <div className="absolute top-12 right-1/4 w-[700px] h-[420px] bg-yellow-100/60 blur-[120px] rounded-full" />
            <div className="absolute top-1/4 left-10 w-[600px] h-[360px] bg-teal-100/50 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 inset-x-0 h-[38%] bg-gradient-to-t from-emerald-100/60 via-teal-50/30 to-transparent" />

            {/* Warm Radiant Sun & Crepuscular Sunbeams (God-Rays) */}
            <div className="absolute top-[-4%] right-[8%] w-[320px] h-[320px] flex items-center justify-center">
                <motion.div
                    className="w-44 h-44 rounded-full bg-gradient-to-br from-yellow-100 via-amber-200 to-orange-200/80 blur-[18px]"
                    animate={{ scale: [1, 1.08, 1], opacity: [0.85, 0.98, 0.85] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute w-24 h-24 rounded-full bg-white/90 blur-[6px]" />
            </div>

            {/* Diagonal Sunbeams shining through clouds */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute -top-[20%] right-[2%] w-[900px] h-[140vh] origin-top-right pointer-events-none"
                    style={{ transform: 'rotate(24deg)' }}
                >
                    <div
                        className="absolute top-0 left-[10%] w-28 h-full bg-gradient-to-b from-amber-100/45 via-yellow-50/20 to-transparent blur-2xl"
                        style={{ animation: 'sunbeamPulse 7s ease-in-out infinite' }}
                    />
                    <div
                        className="absolute top-0 left-[32%] w-40 h-full bg-gradient-to-b from-white/40 via-amber-100/20 to-transparent blur-2xl"
                        style={{ animation: 'sunbeamPulse 9s ease-in-out infinite 1.5s' }}
                    />
                    <div
                        className="absolute top-0 left-[58%] w-24 h-full bg-gradient-to-b from-yellow-100/40 via-sky-50/15 to-transparent blur-xl"
                        style={{ animation: 'sunbeamPulse 8s ease-in-out infinite 3s' }}
                    />
                    <div
                        className="absolute top-0 left-[78%] w-36 h-full bg-gradient-to-b from-amber-50/45 via-yellow-100/15 to-transparent blur-2xl"
                        style={{ animation: 'sunbeamPulse 6.5s ease-in-out infinite 0.8s' }}
                    />
                </div>
            </div>

            {/* Lush 7-Band Pastel Rainbow Arch */}
            <div className="absolute inset-x-0 top-[2%] flex justify-center items-start opacity-80">
                <svg
                    viewBox="0 0 1200 620"
                    className="w-full max-w-[1480px] min-w-[860px] h-auto overflow-visible"
                    preserveAspectRatio="xMidYMin slice"
                >
                    <defs>
                        <filter id="sunshower-rainbow-blur" x="-15%" y="-15%" width="130%" height="130%">
                            <feGaussianBlur stdDeviation="8" />
                        </filter>
                        <linearGradient id="rainbow-fade-mask" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.95" />
                            <stop offset="68%" stopColor="white" stopOpacity="0.75" />
                            <stop offset="95%" stopColor="white" stopOpacity="0" />
                        </linearGradient>
                        <mask id="sunshower-rainbow-mask">
                            <rect x="0" y="0" width="1200" height="620" fill="url(#rainbow-fade-mask)" />
                        </mask>
                    </defs>

                    <g
                        filter="url(#sunshower-rainbow-blur)"
                        mask="url(#sunshower-rainbow-mask)"
                        fill="none"
                        strokeLinecap="round"
                    >
                        {/* Pastel Coral Red */}
                        <path d="M 80 560 A 520 500 0 0 1 1120 560" stroke="#FF9AA2" strokeWidth="18" opacity="0.62" />
                        {/* Pastel Peach Orange */}
                        <path d="M 96 560 A 504 484 0 0 1 1104 560" stroke="#FFB7B2" strokeWidth="18" opacity="0.62" />
                        {/* Pastel Warm Cream Yellow */}
                        <path d="M 112 560 A 488 468 0 0 1 1088 560" stroke="#FFDAC1" strokeWidth="18" opacity="0.65" />
                        {/* Pastel Fresh Mint Lime */}
                        <path d="M 128 560 A 472 452 0 0 1 1072 560" stroke="#E2F0CB" strokeWidth="18" opacity="0.65" />
                        {/* Pastel Aqua Sky */}
                        <path d="M 144 560 A 456 436 0 0 1 1056 560" stroke="#B5EAD7" strokeWidth="18" opacity="0.65" />
                        {/* Pastel Periwinkle Blue */}
                        <path d="M 160 560 A 440 420 0 0 1 1040 560" stroke="#C7CEEA" strokeWidth="18" opacity="0.62" />
                        {/* Pastel Lavender Violet */}
                        <path d="M 176 560 A 424 404 0 0 1 1024 560" stroke="#E0BBE4" strokeWidth="18" opacity="0.60" />
                    </g>
                </svg>
            </div>

            {/* Drifting Fluffy Sun-Kissed Clouds */}
            {clouds.map((cloud) => (
                <motion.div
                    key={cloud.id}
                    className="absolute"
                    style={{ top: cloud.top, opacity: cloud.opacity, scale: cloud.scale }}
                    initial={{ left: '-35%' }}
                    animate={{ left: '125%' }}
                    transition={{
                        duration: cloud.duration,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: cloud.delay,
                    }}
                >
                    <svg width="320" height="115" viewBox="0 0 320 115" className="drop-shadow-sm">
                        <defs>
                            <linearGradient id={`cloud-grad-${cloud.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFFFFF" />
                                <stop offset="65%" stopColor="#FFFBEB" />
                                <stop offset="100%" stopColor="#E0F2FE" />
                            </linearGradient>
                        </defs>
                        {/* Soft golden rim glow */}
                        <path
                            d="M 55 82 Q 28 82 28 58 Q 28 34 62 34 Q 82 10 125 16 Q 168 4 210 26 Q 242 12 272 38 Q 295 42 295 64 Q 295 82 264 82 Z"
                            fill="#FDE68A"
                            opacity="0.35"
                            transform="translate(3, -3)"
                        />
                        {/* Main fluffy cloud body */}
                        <path
                            d="M 55 82 Q 28 82 28 58 Q 28 34 62 34 Q 82 10 125 16 Q 168 4 210 26 Q 242 12 272 38 Q 295 42 295 64 Q 295 82 264 82 Z"
                            fill={`url(#cloud-grad-${cloud.id})`}
                            opacity="0.92"
                        />
                    </svg>
                </motion.div>
            ))}

            {/* Distant Lush Rolling Meadow Hills */}
            <svg
                className="absolute bottom-[9%] left-0 w-[120%] h-[34%] -translate-x-[10%]"
                preserveAspectRatio="none"
                viewBox="0 0 1200 260"
            >
                <defs>
                    <linearGradient id="distant-hill-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#A7F3D0" />
                        <stop offset="100%" stopColor="#6EE7B7" />
                    </linearGradient>
                    <linearGradient id="mid-hill-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6EE7B7" />
                        <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                    <linearGradient id="front-hill-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                </defs>

                {/* Back Misty Mint Hill */}
                <path
                    d="M 0 260 L 0 130 Q 220 45 480 115 T 960 95 Q 1100 80 1200 120 L 1200 260 Z"
                    fill="url(#distant-hill-grad)"
                    opacity="0.75"
                />

                {/* Mid Sunlit Meadow Hill */}
                <path
                    d="M 0 260 L 0 165 Q 300 85 620 150 T 1200 125 L 1200 260 Z"
                    fill="url(#mid-hill-grad)"
                    opacity="0.88"
                />

                {/* Foreground Lush Meadow */}
                <path
                    d="M 0 260 L 0 190 Q 260 140 560 185 T 1200 170 L 1200 260 Z"
                    fill="url(#front-hill-grad)"
                    opacity="0.92"
                />

                {/* Cute Pastel Trees & Meadow Bushes */}
                <g opacity="0.9">
                    {/* Left Hill Trees */}
                    <rect x="137" y="138" width="6" height="24" rx="2" fill="#92400E" />
                    <circle cx="140" cy="128" r="18" fill="#6EE7B7" />
                    <circle cx="132" cy="134" r="13" fill="#34D399" />
                    <circle cx="148" cy="134" r="13" fill="#A7F3D0" />

                    <rect x="188" y="148" width="5" height="20" rx="2" fill="#92400E" />
                    <circle cx="190" cy="140" r="14" fill="#A7F3D0" />
                    <circle cx="184" cy="144" r="11" fill="#34D399" />

                    {/* Center-Right Meadow Trees */}
                    <rect x="678" y="132" width="6" height="24" rx="2" fill="#92400E" />
                    <circle cx="681" cy="122" r="17" fill="#6EE7B7" />
                    <circle cx="673" cy="127" r="12" fill="#34D399" />
                    <circle cx="689" cy="126" r="13" fill="#FEF08A" opacity="0.65" />

                    {/* Little Meadow Flowers */}
                    <circle cx="290" cy="185" r="3.5" fill="#FDE047" />
                    <circle cx="315" cy="192" r="3" fill="#FDA4AF" />
                    <circle cx="340" cy="182" r="3.5" fill="#FDE047" />
                    <circle cx="520" cy="195" r="3.5" fill="#F9A8D4" />
                    <circle cx="545" cy="188" r="3" fill="#FDE047" />
                    <circle cx="610" cy="194" r="3.5" fill="#C4B5FD" />
                </g>
            </svg>

            {/* Sun-Kissed Garden Promenade & Wet Reflective Path */}
            <svg
                className="absolute bottom-0 left-0 w-[140%] h-[16%] -translate-x-[10%]"
                preserveAspectRatio="none"
                viewBox="0 0 1200 120"
            >
                <defs>
                    <linearGradient id="promenade-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#E0F2FE" />
                        <stop offset="50%" stopColor="#FEF3C7" />
                        <stop offset="100%" stopColor="#DCFCE7" />
                    </linearGradient>
                    <linearGradient id="wet-ground-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#BAE6FD" />
                        <stop offset="45%" stopColor="#CBD5E1" />
                        <stop offset="100%" stopColor="#94A3B8" />
                    </linearGradient>
                </defs>

                {/* Grassy curb border */}
                <path d="M 0 42 L 0 20 Q 600 6 1200 20 L 1200 42 Z" fill="#10B981" opacity="0.7" />
                {/* Sidewalk stones */}
                <path d="M 0 58 L 0 32 Q 600 18 1200 32 L 1200 58 Z" fill="url(#promenade-grad)" opacity="0.9" />
                {/* Wet reflective pathway */}
                <path d="M 0 120 L 0 52 Q 600 38 1200 52 L 1200 120 Z" fill="url(#wet-ground-grad)" opacity="0.85" />

                {/* Shimmering Rainbow & Sky Puddle Reflections on the Ground */}
                <ellipse cx="260" cy="86" rx="95" ry="11" fill="#7DD3FC" opacity="0.45" />
                <ellipse cx="590" cy="92" rx="130" ry="13" fill="#FDE68A" opacity="0.4" />
                <ellipse cx="920" cy="84" rx="110" ry="11" fill="#F9A8D4" opacity="0.35" />
            </svg>

            {/* Animated Puddle Water Ripples */}
            <div className="absolute inset-x-0 bottom-0 h-[14%] z-10 pointer-events-none">
                {puddleRipples.map((ripple) => (
                    <div
                        key={ripple.id}
                        className="absolute"
                        style={{
                            left: ripple.left,
                            bottom: ripple.bottom,
                            transform: `scale(${ripple.scale})`,
                        }}
                    >
                        <div
                            className="w-14 h-4 rounded-full border border-white/80"
                            style={{
                                animation: `rippleExpand 2.6s ease-out infinite ${ripple.delay}s`,
                            }}
                        />
                        <div
                            className="absolute inset-0 w-14 h-4 rounded-full border border-sky-100/70"
                            style={{
                                animation: `rippleExpand 2.6s ease-out infinite ${ripple.delay + 0.7}s`,
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Charming Pastel Garden Lamp Post (Left) */}
            <div className="absolute bottom-[6%] left-[16%] transform scale-110 z-10 origin-bottom hidden sm:block">
                <svg width="80" height="210" viewBox="0 0 80 210" className="drop-shadow-md">
                    {/* Warm Glow Halo */}
                    <circle cx="40" cy="42" r="26" fill="#FEF08A" opacity="0.45" />
                    {/* Lamp Post Base & Pole */}
                    <rect x="33" y="182" width="14" height="22" rx="3" fill="#0F766E" />
                    <rect x="36" y="48" width="8" height="140" fill="#14B8A6" />
                    {/* Decorative Crossbar & Hanging Flower Basket */}
                    <path d="M 22 72 L 58 72" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 25 72 L 22 84 M 25 72 L 28 84" stroke="#78350F" strokeWidth="1.5" />
                    <path d="M 18 84 Q 25 94 32 84 Z" fill="#B45309" />
                    <circle cx="21" cy="83" r="3.5" fill="#FDA4AF" />
                    <circle cx="25" cy="81" r="3.5" fill="#FDE047" />
                    <circle cx="29" cy="83" r="3.5" fill="#F9A8D4" />

                    {/* Lantern Housing */}
                    <path d="M 28 48 L 52 48 L 56 32 L 24 32 Z" fill="#FEF9C3" stroke="#0F766E" strokeWidth="2.5" />
                    <path d="M 40 16 L 20 32 L 60 32 Z" fill="#0F766E" />
                    {/* Warm Glowing Bulb */}
                    <circle cx="40" cy="40" r="6" fill="#FACC15" />
                </svg>
            </div>

            {/* Bright & Cozy Pastel Cafe Storefront (Right) */}
            <div className="absolute bottom-[8.5%] right-[10%] transform scale-105 md:scale-115 z-10 origin-bottom hidden sm:block">
                <svg width="290" height="185" viewBox="0 0 290 185" className="drop-shadow-xl">
                    {/* Soft Warm Interior Glow Behind Windows */}
                    <rect x="28" y="64" width="234" height="108" rx="6" fill="#FFFBEB" />

                    {/* Main Cafe Building Body (Pastel Cream & Soft Mint Trim) */}
                    <rect x="22" y="52" width="246" height="122" rx="4" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="2" />
                    <rect x="18" y="166" width="254" height="10" rx="3" fill="#FDBA74" />

                    {/* Roof Crown */}
                    <path d="M 12 52 L 278 52 L 262 22 L 28 22 Z" fill="#F9A8D4" />
                    <rect x="24" y="18" width="242" height="6" rx="3" fill="#F472B6" />

                    {/* Cafe Signboard on Roof */}
                    <rect x="88" y="25" width="114" height="20" rx="10" fill="#FFFFFF" stroke="#F472B6" strokeWidth="2" />
                    <text x="145" y="38" fontSize="9" fill="#DB2777" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                        SUNBOW CAFE
                    </text>

                    {/* Striped Pastel Coral & Cream Scalloped Awning */}
                    <g>
                        <path d="M 10 52 L 48 52 L 42 70 Q 26 78 10 70 Z" fill="#FDA4AF" />
                        <path d="M 48 52 L 86 52 L 80 70 Q 64 78 48 70 Z" fill="#FFF1F2" />
                        <path d="M 86 52 L 124 52 L 118 70 Q 102 78 86 70 Z" fill="#FDA4AF" />
                        <path d="M 124 52 L 162 52 L 156 70 Q 140 78 124 70 Z" fill="#FFF1F2" />
                        <path d="M 162 52 L 200 52 L 194 70 Q 178 78 162 70 Z" fill="#FDA4AF" />
                        <path d="M 200 52 L 238 52 L 232 70 Q 216 78 200 70 Z" fill="#FFF1F2" />
                        <path d="M 238 52 L 278 52 L 272 70 Q 256 78 238 70 Z" fill="#FDA4AF" />
                    </g>

                    {/* Left Warm Glowing Cafe Window */}
                    <rect x="38" y="82" width="76" height="58" rx="6" fill="#FEF08A" />
                    <rect x="42" y="86" width="68" height="50" rx="4" fill="#FDE047" opacity="0.65" />
                    {/* Hanging pendant lights inside window */}
                    <line x1="62" y1="86" x2="62" y2="98" stroke="#D97706" strokeWidth="1.5" />
                    <circle cx="62" cy="100" r="4" fill="#FFFBEB" />
                    <line x1="90" y1="86" x2="90" y2="102" stroke="#D97706" strokeWidth="1.5" />
                    <circle cx="90" cy="104" r="4" fill="#FFFBEB" />
                    {/* Window panes */}
                    <path d="M 76 82 L 76 140 M 38 112 L 114 112" stroke="#F59E0B" strokeWidth="3" />
                    <rect x="38" y="82" width="76" height="58" rx="6" fill="none" stroke="#34D399" strokeWidth="4" />

                    {/* Flower Box under Left Window */}
                    <rect x="34" y="140" width="84" height="12" rx="3" fill="#FDBA74" />
                    <circle cx="46" cy="138" r="5" fill="#4ADE80" />
                    <circle cx="58" cy="137" r="5" fill="#FDA4AF" />
                    <circle cx="70" cy="138" r="5" fill="#FDE047" />
                    <circle cx="82" cy="137" r="5" fill="#C4B5FD" />
                    <circle cx="94" cy="138" r="5" fill="#FDA4AF" />
                    <circle cx="106" cy="138" r="5" fill="#4ADE80" />

                    {/* Cozy Mint & Honey Wood Door */}
                    <rect x="130" y="82" width="46" height="90" rx="5" fill="#34D399" />
                    <rect x="136" y="88" width="34" height="44" rx="3" fill="#FEF08A" />
                    <circle cx="168" cy="136" r="2.5" fill="#F59E0B" />
                    {/* Cute OPEN Sign */}
                    <rect x="142" y="102" width="22" height="11" rx="2" fill="#FB7185" />
                    <text x="153" y="110" fontSize="6.5" fill="#FFFFFF" fontWeight="bold" textAnchor="middle">
                        OPEN
                    </text>

                    {/* Right Warm Glowing Cafe Window */}
                    <rect x="192" y="82" width="58" height="58" rx="6" fill="#FEF08A" />
                    <path d="M 221 82 L 221 140 M 192 112 L 250 112" stroke="#F59E0B" strokeWidth="3" />
                    <rect x="192" y="82" width="58" height="58" rx="6" fill="none" stroke="#34D399" strokeWidth="4" />

                    {/* Flower Box under Right Window */}
                    <rect x="188" y="140" width="66" height="12" rx="3" fill="#FDBA74" />
                    <circle cx="200" cy="138" r="5" fill="#4ADE80" />
                    <circle cx="214" cy="137" r="5" fill="#F9A8D4" />
                    <circle cx="228" cy="138" r="5" fill="#FDE047" />
                    <circle cx="242" cy="138" r="5" fill="#4ADE80" />
                </svg>
            </div>

            {/* Cheerful Person Strolling with Bright Sunny Umbrella */}
            <motion.div
                className="absolute bottom-[6.5%] left-[-10%] z-20 origin-bottom"
                initial={{ x: '-10vw' }}
                animate={{ x: '110vw' }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            >
                <motion.div
                    animate={{ y: [0, -3.5, 0] }}
                    transition={{ duration: 0.75, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <svg width="90" height="130" viewBox="0 0 90 130" className="drop-shadow-md">
                        {/* Subtle ground shadow */}
                        <ellipse cx="44" cy="122" rx="16" ry="4" fill="#0F172A" opacity="0.15" />

                        {/* Legs & Cute Yellow Rain Boots */}
                        <path d="M 41 86 L 36 114" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
                        <path d="M 47 86 L 52 114" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
                        <path d="M 33 112 L 39 118 L 43 118" stroke="#FACC15" strokeWidth="6" strokeLinecap="round" />
                        <path d="M 50 112 L 56 118 L 60 118" stroke="#FACC15" strokeWidth="6" strokeLinecap="round" />

                        {/* Pastel Mint/Sky Raincoat */}
                        <path d="M 32 54 L 56 54 L 62 90 L 26 90 Z" fill="#38BDF8" rx="6" />
                        {/* Arm holding umbrella */}
                        <path d="M 46 60 L 56 68 L 60 48" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" fill="none" />

                        {/* Head */}
                        <circle cx="44" cy="44" r="9" fill="#FDE68A" />

                        {/* Umbrella Handle */}
                        <path d="M 60 48 L 42 12" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Bright Pastel Yellow & Coral Umbrella Canopy */}
                        <path
                            d="M 12 34 Q 42 -8 74 34 Q 62 28 42 34 Q 26 28 12 34 Z"
                            fill="#FACC15"
                        />
                        <path
                            d="M 26 32 Q 42 0 58 32 Q 50 29 42 33 Q 34 29 26 32 Z"
                            fill="#FDA4AF"
                            opacity="0.85"
                        />
                        {/* Sunlight highlight on umbrella top */}
                        <path
                            d="M 22 24 Q 42 2 62 24"
                            stroke="#FEF9C3"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.8"
                        />
                    </svg>
                </motion.div>
            </motion.div>

            {/* Keyframe Animations for Sun-Kissed Rain, Ripples & Sunbeams */}
            <style>{`
                @keyframes sunshowerRainfall {
                    0% { transform: translateY(-15vh) rotate(14deg); }
                    100% { transform: translateY(115vh) rotate(14deg); }
                }
                @keyframes rippleExpand {
                    0% { transform: scale(0.2); opacity: 0.85; }
                    70% { opacity: 0.35; }
                    100% { transform: scale(1.65); opacity: 0; }
                }
                @keyframes sunSparkleTwinkle {
                    0%, 100% { transform: scale(0.6); opacity: 0.2; }
                    50% { transform: scale(1.25); opacity: 0.9; }
                }
                @keyframes sunbeamPulse {
                    0%, 100% { opacity: 0.55; }
                    50% { opacity: 0.9; }
                }
            `}</style>

            {/* Floating Sun-Kissed Mist Sparkles */}
            {sunSparkles.map((s) => (
                <div
                    key={s.id}
                    className="absolute rounded-full bg-amber-100 shadow-[0_0_8px_rgba(254,240,138,0.9)] z-30"
                    style={{
                        left: s.left,
                        top: s.top,
                        width: `${s.size}px`,
                        height: `${s.size}px`,
                        animation: `sunSparkleTwinkle ${s.duration}s ease-in-out infinite ${s.delay}s`,
                    }}
                />
            ))}

            {/* Translucent Sun-Kissed Sparkling Raindrops */}
            {raindrops.map((drop) => (
                <div
                    key={drop.id}
                    className={`absolute rounded-full z-40 ${
                        drop.isGolden
                            ? 'bg-gradient-to-b from-white/10 via-amber-100/85 to-yellow-200/95 shadow-[0_0_6px_rgba(254,240,138,0.6)]'
                            : 'bg-gradient-to-b from-white/10 via-sky-100/75 to-white/90'
                    }`}
                    style={{
                        left: drop.left,
                        top: '-10%',
                        width: drop.width,
                        height: `${drop.height}px`,
                        opacity: drop.opacity,
                        animation: `sunshowerRainfall ${drop.duration}s linear infinite ${drop.delay}s`,
                    }}
                />
            ))}

            {/* Soft Warm Sunshower Ambient Veil */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/10 via-transparent to-amber-100/20 pointer-events-none z-50" />
        </div>
    );
};

export default SeasonRain;
