import React from 'react';

interface RoundSceneProps {
    progress: number;
    isReady100: boolean;
}

/**
 * รอบที่ 2: ยกกลับจากหน้างาน (Golden Hour On-Set Wrap & Pack Back)
 * ใช้ Pure GPU-Accelerated CSS @keyframes (15s infinite)
 */
const Round2PackBackScene: React.FC<RoundSceneProps> = ({ progress, isReady100 }) => {
    const accentColor = isReady100 ? '#10b981' : '#d97706';

    return (
        <div className="relative w-full overflow-hidden">
            <style>{`
                @keyframes r2-trolley-move {
                    0%, 14% { transform: translate3d(0px, 0, 0); }
                    48%, 74% { transform: translate3d(220px, 0, 0); }
                    96%, 100% { transform: translate3d(0px, 0, 0); }
                }
                @keyframes r2-trolley-boxes {
                    0%, 6% { opacity: 0; transform: translateY(8px) scale(0.9); }
                    14%, 52% { opacity: 1; transform: translateY(0px) scale(1); }
                    64%, 100% { opacity: 0; transform: translateY(-8px) scale(0.9); }
                }
                @keyframes r2-set-beam {
                    0%, 6% { opacity: 0.42; }
                    16%, 84% { opacity: 0.05; }
                    94%, 100% { opacity: 0.42; }
                }
                @keyframes r2-clapper-snap {
                    0% { transform: rotate(-22deg); }
                    8%, 85% { transform: rotate(0deg); }
                    96%, 100% { transform: rotate(-22deg); }
                }
                @keyframes r2-wrap-badge {
                    0%, 4% { opacity: 0; transform: translateY(6px); }
                    10%, 28% { opacity: 1; transform: translateY(-4px); }
                    36%, 100% { opacity: 0; transform: translateY(-10px); }
                }
                @keyframes r2-hazard-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.2; }
                }
                @keyframes r2-van-crate-1 {
                    0%, 50% { opacity: 0.25; }
                    58%, 88% { opacity: 1; }
                    96%, 100% { opacity: 0.25; }
                }
                @keyframes r2-van-crate-2 {
                    0%, 55% { opacity: 0.25; }
                    63%, 88% { opacity: 1; }
                    96%, 100% { opacity: 0.25; }
                }
                @keyframes r2-van-crate-3 {
                    0%, 60% { opacity: 0.22; transform: translateY(5px); }
                    68%, 88% { opacity: 1; transform: translateY(0px); }
                    96%, 100% { opacity: 0.22; transform: translateY(5px); }
                }
                @keyframes r2-van-crate-4 {
                    0%, 65% { opacity: 0.22; transform: translateY(5px); }
                    73%, 88% { opacity: 1; transform: translateY(0px); }
                    96%, 100% { opacity: 0.22; transform: translateY(5px); }
                }
                @keyframes r2-crew-walk {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-3px); }
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
                    stroke="#fcd34d"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.85"
                />

                {/* LEFT STATION: ON-SET LOCATION & STUDIO LIGHT WRAP */}
                <g transform="translate(65, 32)">
                    <text
                        x="60"
                        y="-10"
                        textAnchor="middle"
                        fill="#92400e"
                        fontSize="10.5"
                        fontWeight="700"
                        letterSpacing="0.8"
                    >
                        2. หน้ากองถ่าย (ON-SET WRAP)
                    </text>

                    {/* Studio Light Stand */}
                    <line x1="34" y1="34" x2="34" y2="126" stroke="#334155" strokeWidth="3.5" />
                    <line x1="34" y1="98" x2="10" y2="126" stroke="#334155" strokeWidth="3" />
                    <line x1="34" y1="98" x2="58" y2="126" stroke="#334155" strokeWidth="3" />
                    <polygon points="18,16 52,8 52,46 18,38" fill="#1e293b" />
                    <line x1="52" y1="12" x2="52" y2="42" stroke="#f59e0b" strokeWidth="3.5" />

                    {/* Studio Light Beam dimming out on wrap */}
                    <polygon
                        points="54,10 138,-8 138,62 54,44"
                        fill="#fbbf24"
                        style={{ animation: 'r2-set-beam 15s ease-in-out infinite' }}
                    />

                    {/* Clapperboard snapping shut */}
                    <g transform="translate(68, 72)">
                        <rect x="0" y="18" width="54" height="36" rx="5" fill="#1e293b" />
                        <text
                            x="27"
                            y="40"
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize="8.5"
                            fontWeight="700"
                        >
                            WRAP!
                        </text>
                        <g
                            style={{
                                animation: 'r2-clapper-snap 15s ease-in-out infinite',
                                transformOrigin: '0px 18px'
                            }}
                        >
                            <rect x="0" y="10" width="54" height="8" rx="2" fill="#f59e0b" />
                        </g>
                    </g>

                    {/* Floating Wrap Checked Badge */}
                    <g style={{ animation: 'r2-wrap-badge 15s ease-in-out infinite' }}>
                        <rect x="60" y="42" width="76" height="20" rx="10" fill="#d97706" />
                        <text
                            x="98"
                            y="55.5"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8.5"
                            fontWeight="700"
                        >
                            เก็บของ ✓
                        </text>
                    </g>
                </g>

                {/* MIDDLE: CREW & TROLLEY (15s Loop Set 215 -> Van 435 -> Set 215) */}
                <g transform="translate(215, 68)">
                    <g
                        style={{
                            animation: 'r2-trolley-move 15s ease-in-out infinite',
                            willChange: 'transform'
                        }}
                    >
                        <g style={{ animation: 'r2-crew-walk 0.9s ease-in-out infinite' }}>
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

                        <path
                            d="M 28 24 L 28 74 L 114 74"
                            stroke="#334155"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <rect x="26" y="70" width="90" height="7" rx="3.5" fill="#1e293b" />

                        <g
                            style={{
                                animation: 'r2-trolley-boxes 15s ease-in-out infinite',
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
                                x1="38"
                                y1="18"
                                x2="104"
                                y2="18"
                                stroke="#475569"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </g>

                        <circle cx="42" cy="82" r="7.5" fill="#0f172a" />
                        <circle cx="42" cy="82" r="3" fill="#cbd5e1" />
                        <circle cx="98" cy="82" r="7.5" fill="#0f172a" />
                        <circle cx="98" cy="82" r="3" fill="#cbd5e1" />
                    </g>
                </g>

                {/* RIGHT STATION: PRODUCTION VAN AT WRAP (x: 565, y: 30) */}
                <g transform="translate(565, 30)">
                    <g transform="translate(54, -10)">
                        <rect x="0" y="0" width="160" height="22" rx="11" fill={accentColor} />
                        <text
                            x="80"
                            y="14.5"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9.5"
                            fontWeight="700"
                            letterSpacing="0.6"
                        >
                            {isReady100 ? 'ของครบ ไม่ตกหล่น!' : `ยกกลับขึ้นรถ • ${progress}%`}
                        </text>
                    </g>

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

                    <path
                        d="M 24 30 H 224 C 236 30 246 38 252 52 L 268 84 C 272 92 274 98 274 108 V 112 C 274 115 271 118 267 118 H 20 C 16 118 14 115 14 110 V 40 C 14 34 18 30 24 30 Z"
                        fill="#1e293b"
                    />

                    <rect x="14" y="88" width="258" height="8" rx="2" fill={accentColor} />
                    <path d="M 206 40 H 238 L 256 74 H 206 V 40 Z" fill="#fde68a" />

                    {/* Blinking Amber Hazard Lights */}
                    <g style={{ animation: 'r2-hazard-blink 1.1s ease-in-out infinite' }}>
                        <rect x="8" y="76" width="8" height="18" rx="4" fill="#f59e0b" />
                        <circle cx="12" cy="85" r="14" fill="#f59e0b" opacity="0.3" />
                        <rect x="268" y="88" width="7" height="14" rx="3" fill="#f59e0b" />
                    </g>

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

                    <rect x="26" y="40" width="166" height="68" rx="6" fill="#0f172a" />

                    <g style={{ animation: 'r2-van-crate-1 15s ease-in-out infinite' }}>
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

                    <g style={{ animation: 'r2-van-crate-2 15s ease-in-out infinite' }}>
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

                    <g style={{ animation: 'r2-van-crate-3 15s ease-in-out infinite' }}>
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

                    <g style={{ animation: 'r2-van-crate-4 15s ease-in-out infinite' }}>
                        <rect x="108" y="48" width="68" height="24" rx="4" fill="#10b981" />
                        <text
                            x="142"
                            y="63"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="700"
                        >
                            ALL BACK ✓
                        </text>
                    </g>

                    <circle cx="68" cy="118" r="16" fill="#0f172a" />
                    <circle cx="68" cy="118" r="7" fill="#cbd5e1" />
                    <circle cx="220" cy="118" r="16" fill="#0f172a" />
                    <circle cx="220" cy="118" r="7" fill="#cbd5e1" />
                </g>
            </svg>
        </div>
    );
};

export default Round2PackBackScene;
