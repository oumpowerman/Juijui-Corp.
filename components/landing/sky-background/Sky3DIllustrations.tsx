import React from 'react';

/**
 * Custom 3D Pastel Piggy Bank SVG Illustration for the PRICING Stage
 */
export const PiggyBank3DIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 overflow-visible">
    <defs>
      <radialGradient id="piggyBodyGrad" cx="35%" cy="28%" r="70%">
        <stop offset="0%" stopColor="#FFE4E6" />
        <stop offset="48%" stopColor="#FDA4AF" />
        <stop offset="100%" stopColor="#F43F5E" />
      </radialGradient>
      <linearGradient id="piggyCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="55%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Golden Coin Dropping into Slot */}
    <circle cx="33" cy="12" r="8.5" fill="url(#piggyCoinGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
    <text
      x="33"
      y="15.5"
      textAnchor="middle"
      fill="#78350F"
      fontSize="10"
      fontWeight="700"
      fontFamily="sans-serif"
    >
      ฿
    </text>
    {/* Piggy Ears */}
    <path d="M20 24 C17 15, 25 14, 26 22 Z" fill="#FB7185" />
    <path d="M39 22 C41 14, 48 16, 44 24 Z" fill="#F43F5E" />
    {/* Piggy Legs */}
    <rect x="20" y="46" width="6" height="8" rx="3" fill="#E11D48" />
    <rect x="37" y="46" width="6" height="8" rx="3" fill="#E11D48" />
    {/* Sculpted 3D Piggy Body */}
    <ellipse cx="32" cy="36" rx="18" ry="14.5" fill="url(#piggyBodyGrad)" />
    {/* Coin Slot */}
    <rect x="27" y="22.5" width="11" height="2.6" rx="1.3" fill="#881337" />
    {/* Cute Snout */}
    <ellipse cx="14" cy="36" rx="5" ry="6.2" fill="#FECDD3" stroke="#FB7185" strokeWidth="1.2" />
    <circle cx="12.5" cy="34.5" r="1" fill="#9F1239" />
    <circle cx="15.5" cy="34.5" r="1" fill="#9F1239" />
    {/* Eye & Rosy Cheek */}
    <circle cx="22" cy="31.5" r="1.8" fill="#1E293B" />
    <circle cx="21.4" cy="30.9" r="0.6" fill="#FFFFFF" />
    <ellipse cx="24.5" cy="36.5" rx="2.8" ry="1.8" fill="#F43F5E" opacity="0.45" />
    {/* Specular 3D Glass Highlight */}
    <ellipse cx="36" cy="29" rx="7" ry="3.2" transform="rotate(-12 36 29)" fill="white" opacity="0.55" />
  </svg>
);

/**
 * Custom 3D Pastel Banknote Stack SVG Illustration for the PRICING Stage
 */
export const BanknoteStack3DIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 overflow-visible">
    <defs>
      <linearGradient id="billBackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
      <linearGradient id="billFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ECFDF5" />
        <stop offset="45%" stopColor="#6EE7B7" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Back Tilted Pastel Bill */}
    <g transform="rotate(-11 32 32)">
      <rect
        x="10"
        y="18"
        width="44"
        height="26"
        rx="6"
        fill="url(#billBackGrad)"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
    </g>
    {/* Front 3D Pastel Mint Banknote */}
    <g transform="rotate(4 32 34)">
      <rect
        x="10"
        y="20"
        width="44"
        height="26"
        rx="6"
        fill="url(#billFrontGrad)"
        stroke="#FFFFFF"
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="24"
        width="36"
        height="18"
        rx="3.5"
        stroke="#D1FAE5"
        strokeWidth="1.2"
        strokeDasharray="3 2"
      />
      <circle cx="32" cy="33" r="6.5" fill="#FFFFFF" fillOpacity="0.88" />
      <text
        x="32"
        y="36.5"
        textAnchor="middle"
        fill="#047857"
        fontSize="11"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        ฿
      </text>
      <circle cx="19" cy="33" r="2" fill="#A7F3D0" />
      <circle cx="45" cy="33" r="2" fill="#A7F3D0" />
      {/* Glossy Top Reflection */}
      <path d="M14 22 H46" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </g>
  </svg>
);

/**
 * Custom 3D Pastel Numeric Badge SVG ("฿0") for the PRICING Stage
 */
export const NumberSeven3DIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 overflow-visible">
    <defs>
      <linearGradient id="numTileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="50%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <rect
      x="11"
      y="11"
      width="42"
      height="42"
      rx="13"
      fill="url(#numTileGrad)"
      stroke="#FFFFFF"
      strokeWidth="2"
    />
    <ellipse cx="26" cy="18" rx="10" ry="3.5" fill="#FFFFFF" opacity="0.65" />
    <text
      x="32"
      y="39"
      textAnchor="middle"
      fill="#78350F"
      fontSize="21"
      fontWeight="700"
      fontFamily="sans-serif"
    >
      ฿0
    </text>
  </svg>
);

/**
 * Custom 3D Pastel Numeric "7 วัน" Coin/Tile SVG for the PRICING Stage
 */
export const NumberPercent3DIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 overflow-visible">
    <defs>
      <linearGradient id="percentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0E7FF" />
        <stop offset="50%" stopColor="#A5B4FC" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <rect
      x="11"
      y="11"
      width="42"
      height="42"
      rx="13"
      fill="url(#percentGrad)"
      stroke="#FFFFFF"
      strokeWidth="2"
    />
    <ellipse cx="26" cy="18" rx="10" ry="3.5" fill="#FFFFFF" opacity="0.65" />
    <text
      x="32"
      y="38"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="17"
      fontWeight="700"
      fontFamily="sans-serif"
    >
      7 วัน
    </text>
  </svg>
);

/**
 * 3D Volumetric Fluffy Cloud SVG with multi-stop pastel shading & specular top rim light
 */
export const FluffyCloud3D: React.FC<{ idPrefix: string; flip?: boolean }> = ({
  idPrefix,
  flip,
}) => (
  <svg
    viewBox="0 0 420 210"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-auto drop-shadow-[0_24px_38px_rgba(148,163,184,0.16)] ${
      flip ? '-scale-x-100' : ''
    }`}
  >
    <defs>
      <linearGradient id={`${idPrefix}-cloudBase`} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
        <stop offset="68%" stopColor="#F8FAFC" stopOpacity="0.92" />
        <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-cloudPuff`} x1="30%" y1="0%" x2="70%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
        <stop offset="75%" stopColor="#FDF4FF" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.82" />
      </linearGradient>
      <radialGradient id={`${idPrefix}-innerGlow`} cx="50%" cy="25%" r="60%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Soft Pastel Shadow Cushion under the cloud */}
    <ellipse cx="210" cy="172" rx="158" ry="22" fill="rgba(196, 181, 253, 0.22)" />

    {/* Back Fluffy Volume */}
    <path
      d="M78 158H342C369.614 158 392 135.614 392 108C392 83.249 374.011 62.7007 350.391 58.6989C342.441 26.1536 313.105 2 278 2C246.308 2 219.124 21.8056 208.352 49.7082C197.702 41.1325 184.165 36 169.4 36C138.983 36 113.896 57.8266 108.458 86.6524C104.769 85.5761 100.867 85 96.8 85C73.7145 85 55 103.714 55 126.8C55 144.031 65.4426 158 78 158Z"
      fill={`url(#${idPrefix}-cloudBase)`}
      stroke="rgba(255, 255, 255, 0.95)"
      strokeWidth="2.5"
    />

    {/* Front 3D Sculpted Puffs for Depth */}
    <circle cx="152" cy="112" r="46" fill={`url(#${idPrefix}-cloudPuff)`} />
    <circle cx="238" cy="96" r="58" fill={`url(#${idPrefix}-cloudPuff)`} />
    <circle cx="312" cy="118" r="40" fill={`url(#${idPrefix}-cloudPuff)`} />
    <circle cx="104" cy="126" r="32" fill={`url(#${idPrefix}-cloudPuff)`} />

    {/* Top Specular Highlight Rim */}
    <ellipse cx="234" cy="74" rx="46" ry="26" fill={`url(#${idPrefix}-innerGlow)`} />
    <ellipse cx="148" cy="96" rx="34" ry="18" fill={`url(#${idPrefix}-innerGlow)`} />
  </svg>
);
