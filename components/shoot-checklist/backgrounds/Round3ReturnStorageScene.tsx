import React from 'react';

interface RoundSceneProps {
    progress: number;
    isReady100: boolean;
}

/**
 * รอบที่ 3: คืนเข้าคลังอุปกรณ์ (Studio Return & Shelf Restock)
 * ใช้ Pure GPU-Accelerated CSS @keyframes (15s infinite, Reverse Flow: Van -> Storage Rack)
 */
const Round3ReturnStorageScene: React.FC<RoundSceneProps> = ({ progress, isReady100 }) => {
    const accentColor = isReady100 ? '#059669' : '#0d9488';

    return (
        <div className="relative w-full overflow-hidden">
            <style>{`
                @keyframes r3-trolley-move {
                    0%, 14% { transform: translate3d(220px, 0, 0); }
                    48%, 74% { transform: translate3d(0px, 0, 0); }
                    96%, 100% { transform: translate3d(220px, 0, 0); }
                }
                @keyframes r3-trolley-boxes {
                    0%, 6% { opacity: 0; transform: translateY(8px) scale(0.9); }
                    14%, 52% { opacity: 1; transform: translateY(0px) scale(1); }
                    64%, 100% { opacity: 0; transform: translateY(-8px) scale(0.9); }
                }
                @keyframes r3-van-unload {
                    0%, 8% { opacity: 1; }
                    18%, 84% { opacity: 0.22; }
                    94%, 100% { opacity: 1; }
                }
                @keyframes r3-shelf-restock {
                    0%, 50% { opacity: 0.22; transform: translateX(8px); }
                    60%, 88% { opacity: 1; transform: translateX(0px); }
                    96%, 100% { opacity: 0.22; transform: translateX(8px); }
                }
                @keyframes r3-stored-badge {
                    0%, 54% { opacity: 0; transform: translateY(6px); }
                    62%, 86% { opacity: 1; transform: translateY(-4px); }
                    94%, 100% { opacity: 0; transform: translateY(6px); }
                }
                @keyframes r3-crew-walk {
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
                    stroke="#6ee7b7"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.85"
                />

                {/* LEFT STATION: STUDIO STORAGE RACK RECEIVING GEAR */}
                <g transform="translate(65, 32)">
                    <text
                        x="60"
                        y="-10"
                        textAnchor="middle"
                        fill="#0f766e"
                        fontSize="10.5"
                        fontWeight="700"
                        letterSpacing="0.8"
                    >
                        3. คืนเข้าชั้นวางคลัง (STORAGE)
                    </text>

                    <rect
                        x="0"
                        y="0"
                        width="120"
                        height="126"
                        rx="6"
                        stroke="#0d9488"
                        strokeWidth="3"
                        fill="#ffffff"
                        fillOpacity="0.85"
                    />
                    <line x1="0" y1="42" x2="120" y2="42" stroke="#0d9488" strokeWidth="2.5" />
                    <line x1="0" y1="84" x2="120" y2="84" stroke="#0d9488" strokeWidth="2.5" />

                    <rect x="12" y="14" width="38" height="28" rx="4" fill="#64748b" opacity="0.6" />
                    <rect x="12" y="54" width="44" height="30" rx="4" fill="#475569" opacity="0.65" />
                    <rect x="14" y="96" width="52" height="30" rx="4" fill="#334155" opacity="0.7" />

                    {/* Animated Returned Cases Restocking onto Shelf */}
                    <g style={{ animation: 'r3-shelf-restock 15s ease-in-out infinite' }}>
                        <rect x="60" y="16" width="46" height="26" rx="4" fill="#6366f1" />
                        <rect x="66" y="58" width="42" height="26" rx="4" fill="#f59e0b" />
                        <rect x="74" y="98" width="36" height="28" rx="4" fill="#10b981" />
                    </g>

                    {/* Floating STORED Badge */}
                    <g style={{ animation: 'r3-stored-badge 15s ease-in-out infinite' }}>
                        <rect x="90" y="-6" width="74" height="20" rx="10" fill="#10b981" />
                        <text
                            x="127"
                            y="7.5"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8.5"
                            fontWeight="700"
                        >
                            คืนคลังครบ ✓
                        </text>
                    </g>
                </g>

                {/* MIDDLE: CREW & TROLLEY (15s Reverse Loop: Van 435 -> Rack 215 -> Van 435) */}
                <g transform="translate(215, 68)">
                    <g
                        style={{
                            animation: 'r3-trolley-move 15s ease-in-out infinite',
                            willChange: 'transform'
                        }}
                    >
                        <path
                            d="M 102 24 L 102 74 L 16 74"
                            stroke="#334155"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <rect x="16" y="70" width="90" height="7" rx="3.5" fill="#1e293b" />

                        <g
                            style={{
                                animation: 'r3-trolley-boxes 15s ease-in-out infinite',
                                transformOrigin: '60px 50px'
                            }}
                        >
                            <rect x="26" y="44" width="68" height="26" rx="5" fill={accentColor} />
                            <line
                                x1="32"
                                y1="57"
                                x2="88"
                                y2="57"
                                stroke="#ffffff"
                                strokeWidth="1.5"
                                opacity="0.65"
                            />
                            <rect x="34" y="24" width="50" height="20" rx="4" fill="#0f172a" />
                            <circle cx="59" cy="34" r="4.5" fill="#10b981" />
                        </g>

                        <circle cx="32" cy="82" r="7.5" fill="#0f172a" />
                        <circle cx="32" cy="82" r="3" fill="#cbd5e1" />
                        <circle cx="88" cy="82" r="7.5" fill="#0f172a" />
                        <circle cx="88" cy="82" r="3" fill="#cbd5e1" />

                        <g
                            transform="translate(114, 0)"
                            style={{ animation: 'r3-crew-walk 0.9s ease-in-out infinite' }}
                        >
                            <circle cx="8" cy="14" r="9" fill="#1e293b" />
                            <path d="M 14 10 H -2 C -4 10 -4 13 -1 13 H 14 Z" fill={accentColor} />
                            <rect x="0" y="25" width="16" height="32" rx="7" fill="#334155" />
                            <path
                                d="M 4 34 L -12 40"
                                stroke="#1e293b"
                                strokeWidth="5"
                                strokeLinecap="round"
                            />
                            <line
                                x1="4"
                                y1="56"
                                x2="1"
                                y2="86"
                                stroke="#0f172a"
                                strokeWidth="5"
                                strokeLinecap="round"
                            />
                            <line
                                x1="12"
                                y1="56"
                                x2="15"
                                y2="86"
                                stroke="#334155"
                                strokeWidth="5"
                                strokeLinecap="round"
                            />
                        </g>
                    </g>
                </g>

                {/* RIGHT STATION: PRODUCTION VAN UNLOADING AT STUDIO (x: 565, y: 30) */}
                <g transform="translate(565, 30)">
                    <g transform="translate(52, -10)">
                        <rect x="0" y="0" width="164" height="22" rx="11" fill={accentColor} />
                        <text
                            x="82"
                            y="14.5"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9.5"
                            fontWeight="700"
                            letterSpacing="0.6"
                        >
                            {isReady100 ? '100% คืนคลังเรียบร้อย!' : `ขนลงจากรถตู้ • ${progress}%`}
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
                    <path d="M 206 40 H 238 L 256 74 H 206 V 40 Z" fill="#99f6e4" />

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

                    <g style={{ animation: 'r3-van-unload 15s ease-in-out infinite' }}>
                        <rect x="34" y="76" width="68" height="26" rx="4" fill="#6366f1" />
                        <rect x="108" y="76" width="74" height="26" rx="4" fill="#f59e0b" />
                        <rect x="38" y="48" width="62" height="24" rx="4" fill="#ec4899" />
                        <rect x="108" y="48" width="68" height="24" rx="4" fill="#10b981" />
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

export default Round3ReturnStorageScene;
