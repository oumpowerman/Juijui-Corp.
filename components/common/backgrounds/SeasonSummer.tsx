import React from 'react';
import { motion } from 'framer-motion';

// Floating heat waves / golden sun motes
const motes = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: `${(i * 4.1 + 3) % 100}%`,
    size: (i % 3) * 3 + 4,
    delay: -((i * 1.3) % 20),
    duration: 12 + (i % 5) * 2.5,
    opacity: 0.35 + (i % 4) * 0.1,
    sway: (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 10),
}));

// Cloud properties
const clouds = Array.from({ length: 5 }).map((_, i) => ({
    id: `cloud-${i}`,
    y: `${6 + (i * 5) % 22}%`,
    scale: 0.65 + (i % 3) * 0.2,
    duration: 45 + i * 8,
    delay: -(i * 11),
    opacity: 0.55 + (i % 3) * 0.12,
}));

// Bird properties
const birds = Array.from({ length: 7 }).map((_, i) => ({
    id: `bird-${i}`,
    y: `${12 + (i * 6) % 32}%`,
    scale: 0.35 + (i % 3) * 0.12,
    duration: 22 + i * 3,
    delay: -(i * 4),
}));

const SeasonSummer: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-sky-400/70 via-amber-50/50 to-[#F5EFE6]">
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
                @keyframes animalWalk {
                    0% { transform: translateX(-15vw); }
                    100% { transform: translateX(115vw); }
                }
                @keyframes deerStep {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-3px) rotate(0.8deg); }
                    50% { transform: translateY(0px) rotate(0deg); }
                    75% { transform: translateY(-2px) rotate(-0.8deg); }
                }
                @keyframes deerTailWiggle {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(18deg); }
                }
                @keyframes bunnyNibble {
                    0%, 100% { transform: scaleY(1) translateY(0px); }
                    50% { transform: scaleY(0.96) translateY(1px); }
                }
            `}</style>

            {/* --- TOP SECTION (PRESERVED AS REQUESTED) --- */}

            {/* The Sun */}
            <motion.div
                className="absolute top-10 right-20 w-32 h-32 bg-yellow-300 rounded-full blur-[2px] shadow-[0_0_80px_rgba(253,224,71,0.85)]"
                animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Ambient Sunshine Glows */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-300/25 blur-[150px] rounded-full -translate-y-1/4 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-200/20 blur-[150px] rounded-full translate-y-1/4 -translate-x-1/4" />

            {/* Sun Rays (diagonal) */}
            <div className="absolute top-[-10%] right-[-10%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200/25 via-transparent to-transparent rotate-12 blur-3xl" />

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
                        animationDelay: `${cloud.delay}s`,
                    }}
                >
                    <svg
                        width="200"
                        height="60"
                        viewBox="0 0 200 60"
                        fill="white"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-lg opacity-90"
                    >
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
                        animationDelay: `${bird.delay}s`,
                    }}
                >
                    <svg
                        width="30"
                        height="20"
                        viewBox="0 0 120 80"
                        fill="none"
                        stroke="#4A4036"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-70"
                    >
                        <path
                            d="M 10 40 Q 30 10 60 40 Q 90 10 110 40"
                            style={{
                                animation: `bird-flap 0.8s ease-in-out infinite`,
                                transformOrigin: 'center',
                            }}
                        />
                    </svg>
                </div>
            ))}

            {/* --- BOTTOM SECTION: MINIMAL EARTH-TONE LANDSCAPE, TREES & STROLLING ANIMALS --- */}

            {/* Layered Earth-Tone Rolling Hills (Warm Sand, Muted Sage Olive & Oat Earth) */}
            <svg
                className="absolute bottom-0 left-0 w-[140%] h-[32%] -translate-x-[10%]"
                preserveAspectRatio="none"
                viewBox="0 0 1200 140"
            >
                <defs>
                    {/* Back Hill: Soft Warm Oat / Sand Earth */}
                    <linearGradient id="earth-hill-back" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#E6DDD0" />
                        <stop offset="100%" stopColor="#D5C5AE" />
                    </linearGradient>
                    {/* Mid Hill: Muted Olive Sage Accent */}
                    <linearGradient id="earth-hill-mid" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#C9D1C0" />
                        <stop offset="100%" stopColor="#A8B49B" />
                    </linearGradient>
                    {/* Front Hill: Warm Terracotta Sandstone */}
                    <linearGradient id="earth-hill-front" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#DFD2C0" />
                        <stop offset="100%" stopColor="#CBB8A0" />
                    </linearGradient>
                </defs>

                {/* Back Distant Earth Hill */}
                <path
                    d="M 0 140 L 0 52 Q 280 16 580 48 T 1200 38 L 1200 140 Z"
                    fill="url(#earth-hill-back)"
                    opacity="0.85"
                />

                {/* Mid Gentle Olive Sage Slope */}
                <path
                    d="M 0 140 L 0 68 Q 320 38 640 68 T 1200 56 L 1200 140 Z"
                    fill="url(#earth-hill-mid)"
                    opacity="0.7"
                />

                {/* Foreground Warm Minimal Hill */}
                <path
                    d="M 0 140 L 0 82 Q 260 52 540 82 T 1020 64 T 1200 76 L 1200 140 Z"
                    fill="url(#earth-hill-front)"
                    opacity="0.95"
                />

                {/* Minimalist Wild Grass Tufts & Terracotta Flower Accents */}
                <g opacity="0.75">
                    {/* Grass tufts in muted sage/olive */}
                    <path d="M 120 78 L 118 70 M 120 78 L 123 68 M 120 78 L 126 72" stroke="#8F9E78" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 340 86 L 338 78 M 340 86 L 343 76 M 340 86 L 346 80" stroke="#8F9E78" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 720 76 L 718 68 M 720 76 L 723 66 M 720 76 L 726 70" stroke="#8F9E78" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 960 74 L 958 66 M 960 74 L 963 64 M 960 74 L 966 68" stroke="#8F9E78" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Earthy Terracotta & Warm Ochre Minimal Flower Dots */}
                    <circle cx="160" cy="80" r="2.5" fill="#C58B58" />
                    <circle cx="280" cy="88" r="3" fill="#DDA15E" />
                    <circle cx="490" cy="84" r="2.5" fill="#BC6C25" />
                    <circle cx="680" cy="74" r="3" fill="#C58B58" />
                    <circle cx="850" cy="76" r="2.5" fill="#DDA15E" />
                    <circle cx="1060" cy="78" r="3" fill="#BC6C25" />
                </g>
            </svg>

            {/* --- MINIMAL EARTH-TONE TREES --- */}

            {/* Tree Grove 1 (Left Hill) */}
            <div className="absolute bottom-[10%] left-[8%] sm:left-[11%] z-10 pointer-events-none origin-bottom transform scale-90 sm:scale-105">
                <svg width="120" height="150" viewBox="0 0 120 150" className="drop-shadow-xs">
                    {/* Main Slender Minimal Tree */}
                    <rect x="56" y="80" width="8" height="65" rx="3" fill="#8C6D53" />
                    {/* Shadow underneath */}
                    <ellipse cx="60" cy="144" rx="22" ry="5" fill="#4A4036" opacity="0.12" />

                    {/* Minimalist Multi-Tone Earth Foliage (Sage Olive & Muted Khaki) */}
                    <circle cx="60" cy="58" r="34" fill="#8F9E78" />
                    <circle cx="48" cy="64" r="24" fill="#A2AC91" opacity="0.9" />
                    <circle cx="72" cy="62" r="22" fill="#7A8964" opacity="0.85" />
                    <circle cx="60" cy="46" r="22" fill="#A8B498" />

                    {/* Secondary Smaller Minimal Tree */}
                    <rect x="22" y="96" width="6" height="48" rx="2" fill="#74563C" />
                    <circle cx="25" cy="82" r="22" fill="#DDA15E" opacity="0.9" />
                    <circle cx="25" cy="74" r="16" fill="#E8C39E" />
                </svg>
            </div>

            {/* Tree Grove 2 (Center-Right Hill) */}
            <div className="absolute bottom-[9%] right-[14%] sm:right-[18%] z-10 pointer-events-none origin-bottom transform scale-95 sm:scale-110">
                <svg width="140" height="160" viewBox="0 0 140 160" className="drop-shadow-xs">
                    {/* Ground shadow */}
                    <ellipse cx="70" cy="154" rx="28" ry="6" fill="#4A4036" opacity="0.12" />

                    {/* Main Earthy Tree Trunk */}
                    <rect x="66" y="74" width="8" height="78" rx="3" fill="#8C6D53" />

                    {/* Geometric Minimal Foliage (Warm Olive & Sand Taupe) */}
                    <path
                        d="M 70 18 Q 106 50 94 92 Q 70 102 46 92 Q 34 50 70 18 Z"
                        fill="#8F9E78"
                    />
                    <circle cx="70" cy="54" r="28" fill="#A3B18A" opacity="0.85" />
                    <circle cx="60" cy="66" r="22" fill="#758360" opacity="0.6" />
                    <circle cx="80" cy="64" r="20" fill="#BCC6B1" opacity="0.75" />

                    {/* Cute Side Bush (Warm Ochre / Clay Earth) */}
                    <ellipse cx="106" cy="142" rx="18" ry="14" fill="#BC6C25" opacity="0.85" />
                    <ellipse cx="106" cy="138" rx="14" ry="10" fill="#DDA15E" />
                </svg>
            </div>

            {/* --- ANIMALS STROLLING & RELAXING ON THE SUMMER MEADOW --- */}

            {/* 🦌 Gentle Deer Strolling Across the Meadow (Animated Left -> Right) */}
            <div
                className="absolute bottom-[4.5%] left-0 z-20 pointer-events-none"
                style={{
                    animation: 'animalWalk 36s linear infinite',
                }}
            >
                <div style={{ animation: 'deerStep 1.1s ease-in-out infinite' }}>
                    <svg width="95" height="90" viewBox="0 0 95 90" className="drop-shadow-xs">
                        {/* Soft Ground Shadow under deer */}
                        <ellipse cx="48" cy="85" rx="26" ry="4.5" fill="#4A4036" opacity="0.14" />

                        {/* Slender Legs in Warm Earth Tone */}
                        <line x1="32" y1="58" x2="28" y2="82" stroke="#8C5C38" strokeWidth="3" strokeLinecap="round" />
                        <line x1="38" y1="58" x2="36" y2="84" stroke="#724827" strokeWidth="3" strokeLinecap="round" />
                        <line x1="62" y1="56" x2="65" y2="82" stroke="#8C5C38" strokeWidth="3" strokeLinecap="round" />
                        <line x1="68" y1="56" x2="72" y2="84" stroke="#724827" strokeWidth="3" strokeLinecap="round" />

                        {/* Little Hooves */}
                        <circle cx="28" cy="82" r="1.8" fill="#4A3423" />
                        <circle cx="36" cy="84" r="1.8" fill="#4A3423" />
                        <circle cx="65" cy="82" r="1.8" fill="#4A3423" />
                        <circle cx="72" cy="84" r="1.8" fill="#4A3423" />

                        {/* Deer Body (Warm Terracotta Fawn) */}
                        <ellipse cx="50" cy="50" rx="20" ry="12" fill="#B3784A" />
                        {/* Cream Underbelly */}
                        <ellipse cx="50" cy="54" rx="14" ry="6" fill="#F4ECE1" opacity="0.9" />

                        {/* Little White Fawn Spots */}
                        <circle cx="44" cy="46" r="1.5" fill="#FDF8F2" opacity="0.8" />
                        <circle cx="50" cy="44" r="1.5" fill="#FDF8F2" opacity="0.8" />
                        <circle cx="56" cy="46" r="1.5" fill="#FDF8F2" opacity="0.8" />
                        <circle cx="52" cy="49" r="1.4" fill="#FDF8F2" opacity="0.8" />

                        {/* Deer Tail with Wiggle */}
                        <g style={{ transformOrigin: '28px 46px', animation: 'deerTailWiggle 1.8s ease-in-out infinite' }}>
                            <path d="M 30 48 Q 22 46 25 40 Q 32 44 30 48 Z" fill="#F4ECE1" stroke="#B3784A" strokeWidth="1" />
                        </g>

                        {/* Graceful Neck & Head */}
                        <path d="M 62 52 L 72 32 L 78 35 L 68 56 Z" fill="#B3784A" />
                        <ellipse cx="78" cy="30" rx="9" ry="6" fill="#B3784A" />
                        {/* Snout */}
                        <path d="M 83 31 Q 89 31 87 27 Q 82 26 80 28 Z" fill="#F4ECE1" />
                        <circle cx="87" cy="28" r="1.2" fill="#4A3423" />

                        {/* Eye */}
                        <circle cx="78" cy="28" r="1.6" fill="#2E2016" />

                        {/* Cute Ear */}
                        <ellipse cx="71" cy="23" rx="5" ry="2.5" fill="#B3784A" transform="rotate(-30 71 23)" />
                        <ellipse cx="71" cy="23" rx="3.5" ry="1.5" fill="#F4ECE1" transform="rotate(-30 71 23)" />

                        {/* Small Minimal Antlers */}
                        <path d="M 73 24 L 71 16 M 72 20 L 76 17" stroke="#724827" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            {/* 🐰 Cute Minimalist Rabbit Grazing by the Left Tree */}
            <div
                className="absolute bottom-[5.8%] left-[22%] sm:left-[24%] z-15 pointer-events-none"
                style={{ animation: 'bunnyNibble 2.4s ease-in-out infinite' }}
            >
                <svg width="45" height="42" viewBox="0 0 45 42" className="drop-shadow-xs">
                    {/* Shadow */}
                    <ellipse cx="22" cy="38" rx="14" ry="3" fill="#4A4036" opacity="0.12" />

                    {/* Bunny Body (Warm Sand Cream) */}
                    <ellipse cx="20" cy="28" rx="11" ry="8" fill="#E8DDD0" />
                    <ellipse cx="21" cy="30" rx="8" ry="5" fill="#FAF5EF" />

                    {/* Fluffy Round Tail */}
                    <circle cx="9" cy="27" r="3.2" fill="#FFFFFF" />

                    {/* Head */}
                    <circle cx="28" cy="22" r="6.5" fill="#E8DDD0" />
                    <circle cx="31" cy="21" r="1.1" fill="#4A3423" />
                    <circle cx="33" cy="23" r="1" fill="#ECA79D" />

                    {/* Cute Tall Ears */}
                    <ellipse cx="26" cy="11" rx="2.5" ry="7" fill="#E8DDD0" transform="rotate(-10 26 11)" />
                    <ellipse cx="26" cy="11" rx="1.4" ry="4.5" fill="#F8DFD8" transform="rotate(-10 26 11)" />
                    <ellipse cx="30" cy="12" rx="2.4" ry="6.5" fill="#E8DDD0" transform="rotate(8 30 12)" />
                    <ellipse cx="30" cy="12" rx="1.3" ry="4" fill="#F8DFD8" transform="rotate(8 30 12)" />
                </svg>
            </div>

            {/* Floating Dust / Heat Motes (Preserved) */}
            {motes.map((mote) => (
                <div
                    key={mote.id}
                    className="absolute bg-amber-100 rounded-full blur-[1.5px]"
                    style={
                        {
                            left: mote.left,
                            width: mote.size,
                            height: mote.size,
                            opacity: mote.opacity + 0.2,
                            '--sway': `${mote.sway}px`,
                            animation: `mote-float ${mote.duration}s linear infinite ${mote.delay}s, mote-sway ${
                                mote.duration * 0.7
                            }s ease-in-out infinite ${mote.delay}s alternate`,
                        } as React.CSSProperties
                    }
                />
            ))}
        </div>
    );
};

export default SeasonSummer;
