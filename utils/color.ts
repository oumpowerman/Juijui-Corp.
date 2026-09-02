export const getHexFromColorClass = (colorClass: string | undefined): string => {
    const raw = colorClass || '';
    if (raw.startsWith('#')) return raw; // หากเป็น Hex อยู่แล้วใช้ได้เลย
    
    if (raw.includes('emerald')) return '#10b981';
    if (raw.includes('green')) return '#22c55e';
    if (raw.includes('teal')) return '#14b8a6';
    if (raw.includes('sky')) return '#0ea5e9';
    if (raw.includes('blue')) return '#3b82f6';
    if (raw.includes('indigo')) return '#6366f1';
    if (raw.includes('violet')) return '#8b5cf6';
    if (raw.includes('purple')) return '#a855f7';
    if (raw.includes('fuchsia')) return '#d946ef';
    if (raw.includes('pink')) return '#ec4899';
    if (raw.includes('rose')) return '#f43f5e';
    if (raw.includes('red')) return '#ef4444';
    if (raw.includes('orange')) return '#f97316';
    if (raw.includes('amber')) return '#f59e0b';
    if (raw.includes('yellow')) return '#eab308';
    if (raw.includes('lime')) return '#84cc16';
    if (raw.includes('cyan')) return '#06b6d4';
    if (raw.includes('slate')) return '#64748b';
    if (raw.includes('gray') || raw.includes('grey')) return '#6b7280';
    if (raw.includes('zinc')) return '#71717a';
    if (raw.includes('neutral')) return '#737373';
    if (raw.includes('stone')) return '#78716c';
    
    return '#78716c'; // สี Stone Fallback
};

export interface UserColorTheme {
    key: string;
    bg: string;
    bgHover: string;
    border: string;
    text: string;
    accentDot: string;
    avatarRing: string;
    hex: string;
}

export const USER_PALETTES: UserColorTheme[] = [
    {
        key: 'violet',
        bg: 'bg-violet-50/95',
        bgHover: 'hover:bg-violet-100/90',
        border: 'border-violet-300',
        text: 'text-violet-950',
        accentDot: 'bg-violet-500',
        avatarRing: 'ring-violet-400',
        hex: '#8b5cf6'
    },
    {
        key: 'emerald',
        bg: 'bg-emerald-50/95',
        bgHover: 'hover:bg-emerald-100/90',
        border: 'border-emerald-300',
        text: 'text-emerald-950',
        accentDot: 'bg-emerald-500',
        avatarRing: 'ring-emerald-400',
        hex: '#10b981'
    },
    {
        key: 'amber',
        bg: 'bg-amber-50/95',
        bgHover: 'hover:bg-amber-100/90',
        border: 'border-amber-300',
        text: 'text-amber-950',
        accentDot: 'bg-amber-500',
        avatarRing: 'ring-amber-400',
        hex: '#f59e0b'
    },
    {
        key: 'sky',
        bg: 'bg-sky-50/95',
        bgHover: 'hover:bg-sky-100/90',
        border: 'border-sky-300',
        text: 'text-sky-950',
        accentDot: 'bg-sky-500',
        avatarRing: 'ring-sky-400',
        hex: '#0ea5e9'
    },
    {
        key: 'rose',
        bg: 'bg-rose-50/95',
        bgHover: 'hover:bg-rose-100/90',
        border: 'border-rose-300',
        text: 'text-rose-950',
        accentDot: 'bg-rose-500',
        avatarRing: 'ring-rose-400',
        hex: '#f43f5e'
    },
    {
        key: 'indigo',
        bg: 'bg-indigo-50/95',
        bgHover: 'hover:bg-indigo-100/90',
        border: 'border-indigo-300',
        text: 'text-indigo-950',
        accentDot: 'bg-indigo-500',
        avatarRing: 'ring-indigo-400',
        hex: '#6366f1'
    },
    {
        key: 'teal',
        bg: 'bg-teal-50/95',
        bgHover: 'hover:bg-teal-100/90',
        border: 'border-teal-300',
        text: 'text-teal-950',
        accentDot: 'bg-teal-500',
        avatarRing: 'ring-teal-400',
        hex: '#14b8a6'
    },
    {
        key: 'fuchsia',
        bg: 'bg-fuchsia-50/95',
        bgHover: 'hover:bg-fuchsia-100/90',
        border: 'border-fuchsia-300',
        text: 'text-fuchsia-950',
        accentDot: 'bg-fuchsia-500',
        avatarRing: 'ring-fuchsia-400',
        hex: '#d946ef'
    },
    {
        key: 'orange',
        bg: 'bg-orange-50/95',
        bgHover: 'hover:bg-orange-100/90',
        border: 'border-orange-300',
        text: 'text-orange-950',
        accentDot: 'bg-orange-500',
        avatarRing: 'ring-orange-400',
        hex: '#f97316'
    },
    {
        key: 'cyan',
        bg: 'bg-cyan-50/95',
        bgHover: 'hover:bg-cyan-100/90',
        border: 'border-cyan-300',
        text: 'text-cyan-950',
        accentDot: 'bg-cyan-500',
        avatarRing: 'ring-cyan-400',
        hex: '#06b6d4'
    }
];

export const getUserColorTheme = (userIdOrName?: string | null): UserColorTheme => {
    if (!userIdOrName) return USER_PALETTES[0];
    let hash = 0;
    for (let i = 0; i < userIdOrName.length; i++) {
        hash = (hash << 5) - hash + userIdOrName.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % USER_PALETTES.length;
    return USER_PALETTES[index];
};

export interface UserPastelTheme {
    bgHex: string;
    textHex: string;
    borderHex: string;
    accentHex: string;
}

export const getUserPastelTheme = (userIdOrName?: string | null): UserPastelTheme => {
    const theme = getUserColorTheme(userIdOrName);
    return {
        bgHex: `${theme.hex}18`,
        textHex: theme.hex,
        borderHex: `${theme.hex}60`,
        accentHex: theme.hex
    };
};

