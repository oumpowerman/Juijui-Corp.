import React from 'react';

interface RoundSceneProps {
    progress: number;
    isReady100: boolean;
}

/**
 * รอบที่ 1: หยิบออกจากคลังไปใช้ (Morning Warehouse Load-Out)
 * ใช้ Pure GPU-Accelerated CSS @keyframes (15s infinite) ที่ทำงานได้ 100% ในทุก Browser และ iFrame
 */
const Round1PackOutScene: React.FC<RoundSceneProps> = ({ progress, isReady100 }) => {
    const accentColor = isReady100 ? '#10b981' : '#4f46e5';

    return (
        <div className="relative w-full overflow-hidden">
            <style>{`
                @keyframes r1-trolley-move {
                    0%, 14% { transform: translate3d(0px, 0, 0); }
                    48%, 74% { transform: translate3d(220px, 0, 0); }
                    96%, 100% { transform: translate3d(0px, 0, 0); }
                }
                @keyframes r1-trolley-boxes {
                    0%, 6% { opacity: 0; transform: translateY(8px) scale(0.9); }
                    14%, 52% { opacity: 1; transform: translateY(0px) scale(1); }
                    64%, 100% { opacity: 0; transform: translateY(-8px) scale(0.9); }
                }
                @keyframes r1-shelf-boxes {
                    0%, 8% { opacity: 1; transform: translateX(0px); }
                    16%, 82% { opacity: 0.22; transform: translateX(8px); }
                    94%, 100% { opacity: 1; transform: translateX(0px); }
                }
                @keyframes r1-picked-badge {
                    0%, 4% { opacity: 0; transform: translateY(6px); }
                    10%, 26% { opacity: 1; transform: translateY(-4px); }
                    34%, 100% { opacity: 0; transform: translateY(-10px); }
                }
                @keyframes r1-van-crate-1 {
                    0%, 50% { opacity: 0.25; transform: scale(0.92); }
                    58%, 88% { opacity: 1; transform: scale(1); }
                    96%, 100% { opacity: 0.25; transform: scale(0.92); }
                }
                @keyframes r1-van-crate-2 {
                    0%, 55% { opacity: 0.25; transform: scale(0.92); }
                    63%, 88% { opacity: 1; transform: scale(1); }
                    96%, 100% { opacity: 0.25; transform: scale(0.92); }
                }
                @keyframes r1-van-crate-3 {
                    0%, 60% { opacity: 0.22; transform: translateY(5px); }
                    68%, 88% { opacity: 1; transform: translateY(0px); }
                    96%, 100% { opacity: 0.22; transform: translateY(5px); }
                }
                @keyframes r1-van-crate-4 {
                    0%, 65% { opacity: 0.22; transform: translateY(5px); }
                    73%, 88% { opacity: 1; transform: translateY(0px); }
                    96%, 100% { opacity: 0.22; transform: translateY(5px); }
                }
                @keyframes r1-headlight-beam {
                    0%, 58% { opacity: 0.08; }
                    68%, 88% { opacity: 0.45; }
                    96%, 100% { opacity: 0.08; }
                }
                @keyframes r1-crew-walk {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-3px); }
                }
                @keyframes r1-wheel-spin {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(360deg); }
                    100% { transform: rotate(0deg); }
                }
            `}</style>

            <svg
                viewBox="0 0 920 175"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto max-h-44 overflow-visible"
            >
                {/* Ground Track */}
                <line
                    x1="20"
                    y1="158"
                    x2="900"
                    y2="158"
                    stroke="#94a3b8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="8 8"
                />
                <line
                    x1="70"
                    y1="158"
                    x2="850"
                    y2="158"
                    stroke="#fdba74"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.8"
                />

                {/* LEFT STATION: STUDIO STORAGE RACK */}
                <g transform="translate(65, 32)">
                    <text
                        x="60"
                        y="-10"
                        textAnchor="middle"
                        fill="#334155"
                        fontSize="10.5"
                        fontWeight="700"
                        letterSpacing="0.8"
                    >
                        1. คลังอุปกรณ์ (STORAGE)
                    </text>

                    <rect
                        x="0"
                        y="0"
                        width="120"
                        height="126"
                        rx="6"
                        stroke="#475569"
                        strokeWidth="3"
                        fill="#ffffff"
                        fillOpacity="0.85"
                    />
                    <line x1="0" y1="42" x2="120" y2="42" stroke="#64748b" strokeWidth="2.5" />
                    <line x1="0" y1="84" x2="120" y2="84" stroke="#64748b" strokeWidth="2.5" />

                    {/* Static Reference Gear */}
                    <rect x="12" y="14" width="38" height="28" rx="4" fill="#64748b" opacity="0.6" />
                    <rect x="12" y="54" width="44" height="30" rx="4" fill="#475569" opacity="0.65" />
                    <rect x="14" y="96" width="52" height="30" rx="4" fill="#334155" opacity="0.7" />

                    {/* Animated Cases Being Picked Off the Shelf (0s-2.5s) */}
                    <g style={{ animation: 'r1-shelf-boxes 15s ease-in-out infinite' }}>
                        <rect x="60" y="16" width="46" height="26" rx="4" fill="#6366f1" />
                        <rect x="66" y="58" width="42" height="26" rx="4" fill="#f59e0b" />
                        <rect x="74" y="98" width="36" height="28" rx="4" fill="#ec4899" />
                    </g>

                    {/* Floating PICKED Badge */}
                    <g style={{ animation: 'r1-picked-badge 15s ease-in-out infinite' }}>
                        <rect x="96" y="-6" width="68" height="20" rx="10" fill="#4f46e5" />
                        <text
                            x="130"
                            y="7.5"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="700"
                        >
                            หยิบของ ✓
                        </text>
                    </g>
                </g>

                {/* MIDDLE: CREW & TROLLEY (15s Loop moving Left 215 -> Right 435 -> Left 215) */}
                <g transform="translate(215, 68)">
                    <g
                        style={{
                            animation: 'r1-trolley-move 15s ease-in-out infinite',
                            willChange: 'transform'
                        }}
                    >
                        {/* Crew Member Silhouette */}
                        <g style={{ animation: 'r1-crew-walk 0.9s ease-in-out infinite' }}>
                            <circle cx="8" cy="14" r="9" fill="#1e293b" />
                            <path d="M 2 10 H 18 C 20 10 20 13 17 13 H 2 Z" fill={accentColor} />
                            <rect x="0" y="25" width="16" height="32" rx="7" fill="#334155" />
                            <path
                                d="M 12 34 L 28 40"
                                stroke="#1e293b"
                                strokeWidth="5"
                                strokeLinecap="round"
                            />
                            <line
                                x1="5"
                                y1="56"
                                x2="2"
                                y2="86"
                                stroke="#0f172a"
                                strokeWidth="5"
                                strokeLinecap="round"
                            />
                            <line
                                x1="12"
                                y1="56"
                                x2="16"
                                y2="86"
                                stroke="#334155"
                                strokeWidth="5"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* Trolley Frame */}
                        <path
                            d="M 28 24 L 28 74 L 114 74"
                            stroke="#334155"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <rect x="26" y="70" width="90" height="7" rx="3.5" fill="#1e293b" />

                        {/* Equipment Cases on Trolley */}
                        <g
                            style={{
                                animation: 'r1-trolley-boxes 15s ease-in-out infinite',
                                transformOrigin: '70px 50px'
                            }}
                        >
                            <rect x="38" y="44" width="68" height="26" rx="5" fill={accentColor} />
                            <line
                                x1="44"
                                y1="57"
                                x2="100"
                                y2="57"
                                stroke="#ffffff"
                                strokeWidth="1.5"
                                opacity="0.65"
                            />
                            <rect x="46" y="24" width="50" height="20" rx="4" fill="#0f172a" />
                            <circle cx="71" cy="34" r="4.5" fill="#fbbf24" />
                            <line
                                x1="40"
                                y1="18"
                                x2="104"
                                y2="12"
                                stroke="#475569"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* Trolley Wheels */}
                        <circle cx="42" cy="82" r="7.5" fill="#0f172a" />
                        <circle cx="42" cy="82" r="3" fill="#cbd5e1" />
                        <circle cx="98" cy="82" r="7.5" fill="#0f172a" />
                        <circle cx="98" cy="82" r="3" fill="#cbd5e1" />
                    </g>
                </g>

                {/* RIGHT STATION: PRODUCTION VAN (x: 565, y: 30) */}
                <g transform="translate(565, 30)">
                    {/* Roof Status Callboard */}
                    <g transform="translate(56, -10)">
                        <rect x="0" y="0" width="154" height="22" rx="11" fill={accentColor} />
                        <text
                            x="77"
                            y="14.5"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9.5"
                            fontWeight="700"
                            letterSpacing="0.6"
                        >
                            {isReady100 ? '100% พร้อมออกกอง!' : `ขนขึ้นรถตู้ • ${progress}%`}
                        </text>
                    </g>

                    {/* Roof Rack */}
                    <line
                        x1="48"
                        y1="22"
                        x2="218"
                        y2="22"
                        stroke="#475569"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                    />
                    <line x1="72" y1="22" x2="72" y2="30" stroke="#475569" strokeWidth="3" />
                    <line x1="138" y1="22" x2="138" y2="30" stroke="#475569" strokeWidth="3" />
                    <line x1="198" y1="22" x2="198" y2="30" stroke="#475569" strokeWidth="3" />

                    {/* Van Body */}
                    <path
                        d="M 24 30 H 224 C 236 30 246 38 252 52 L 268 84 C 272 92 274 98 274 108 V 112 C 274 115 271 118 267 118 H 20 C 16 118 14 115 14 110 V 40 C 14 34 18 30 24 30 Z"
                        fill="#1e293b"
                    />

                    {/* Side Stripe */}
                    <rect x="14" y="88" width="258" height="8" rx="2" fill={accentColor} />

                    {/* Front Cab Window */}
                    <path d="M 206 40 H 238 L 256 74 H 206 V 40 Z" fill="#bae6fd" />

                    {/* Headlight + Beam */}
                    <rect x="268" y="88" width="7" height="14" rx="3" fill="#fde047" />
                    <polygon
                        points="275,86 345,68 345,118 275,104"
                        fill="#fde047"
                        style={{ animation: 'r1-headlight-beam 15s ease-in-out infinite' }}
                    />

                    {/* Open Rear Cargo Hatch & Loading Ramp */}
                    <path
                        d="M 16 32 L -22 10"
                        stroke="#1e293b"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    <path
                        d="M 14 114 L -28 126"
                        stroke="#475569"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    {/* Cargo Bay Cutaway Interior */}
                    <rect x="26" y="40" width="166" height="68" rx="6" fill="#0f172a" />

                    {/* 4 Animated Equipment Cases Stacking Inside Cargo Bay */}
                    <g
                        style={{
                            animation: 'r1-van-crate-1 15s ease-in-out infinite',
                            transformOrigin: '68px 89px'
                        }}
                    >
                        <rect x="34" y="76" width="68" height="26" rx="4" fill="#6366f1" />
                        <text
                            x="68"
                            y="92"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="700"
                        >
                            CAM A/B
                        </text>
                    </g>

                    <g
                        style={{
                            animation: 'r1-van-crate-2 15s ease-in-out infinite',
                            transformOrigin: '145px 89px'
                        }}
                    >
                        <rect x="108" y="76" width="74" height="26" rx="4" fill="#f59e0b" />
                        <text
                            x="145"
                            y="92"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="700"
                        >
                            LIGHT & GRIP
                        </text>
                    </g>

                    <g style={{ animation: 'r1-van-crate-3 15s ease-in-out infinite' }}>
                        <rect x="38" y="48" width="62" height="24" rx="4" fill="#ec4899" />
                        <text
                            x="69"
                            y="63"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="700"
                        >
                            AUDIO
                        </text>
                    </g>

                    <g style={{ animation: 'r1-van-crate-4 15s ease-in-out infinite' }}>
                        <rect x="108" y="48" width="68" height="24" rx="4" fill="#10b981" />
                        <text
                            x="142"
                            y="63"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="700"
                        >
                            LOADED ✓
                        </text>
                    </g>

                    {/* Van Wheels */}
                    <circle cx="68" cy="118" r="16" fill="#0f172a" />
                    <circle cx="68" cy="118" r="7" fill="#cbd5e1" />
                    <circle cx="220" cy="118" r="16" fill="#0f172a" />
                    <circle cx="220" cy="118" r="7" fill="#cbd5e1" />
                </g>
            </svg>
        </div>
    );
};

export default Round1PackOutScene;
