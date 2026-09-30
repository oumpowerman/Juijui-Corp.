export interface SectionPastelTheme {
    key: string;
    name: string;
    cardBorder: string;
    headerGradient: string;
    ambientOrb: string;
    squircleBadge: string;
    countBadge: string;
    progressTrack: string;
    progressBar: string;
    syncBarBorder: string;
    syncIconText: string;
    jumpDot: string;
    jumpPillIdle: string;
    subgroupTray: string;
}

const SECTION_PASTEL_THEMES: SectionPastelTheme[] = [
    // 0: Lavender Indigo (ม่วงลาเวนเดอร์พาสเทล)
    {
        key: 'lavender-indigo',
        name: 'Lavender Indigo',
        cardBorder: 'border-white/95 ring-1 ring-indigo-200/60',
        headerGradient:
            'bg-gradient-to-r from-indigo-50/80 via-white/85 to-purple-50/55 border-b border-indigo-100/80',
        ambientOrb: 'bg-indigo-300/25',
        squircleBadge:
            'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25 ring-2 ring-white/90',
        countBadge:
            'bg-white/85 text-indigo-700 border border-indigo-200/80 shadow-2xs',
        progressTrack: 'bg-indigo-100/80',
        progressBar: 'bg-gradient-to-r from-indigo-400 to-violet-500',
        syncBarBorder: 'border-indigo-100/80',
        syncIconText: 'text-indigo-600',
        jumpDot: 'bg-indigo-400 ring-2 ring-indigo-100',
        jumpPillIdle:
            'bg-indigo-50/55 border-indigo-200/75 text-slate-700 hover:bg-indigo-100/60 hover:border-indigo-300',
        subgroupTray:
            'bg-indigo-50/35 backdrop-blur-md border-white/90 ring-1 ring-indigo-100/80 shadow-inner'
    },
    // 1: Sky Cyan (ฟ้าครามพาสเทล)
    {
        key: 'sky-cyan',
        name: 'Sky Cyan',
        cardBorder: 'border-white/95 ring-1 ring-sky-200/60',
        headerGradient:
            'bg-gradient-to-r from-sky-50/80 via-white/85 to-cyan-50/55 border-b border-sky-100/80',
        ambientOrb: 'bg-sky-300/25',
        squircleBadge:
            'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/25 ring-2 ring-white/90',
        countBadge:
            'bg-white/85 text-sky-700 border border-sky-200/80 shadow-2xs',
        progressTrack: 'bg-sky-100/80',
        progressBar: 'bg-gradient-to-r from-sky-400 to-cyan-500',
        syncBarBorder: 'border-sky-100/80',
        syncIconText: 'text-sky-600',
        jumpDot: 'bg-sky-400 ring-2 ring-sky-100',
        jumpPillIdle:
            'bg-sky-50/55 border-sky-200/75 text-slate-700 hover:bg-sky-100/60 hover:border-sky-300',
        subgroupTray:
            'bg-sky-50/35 backdrop-blur-md border-white/90 ring-1 ring-sky-100/80 shadow-inner'
    },
    // 2: Peach Amber (ส้มพีชพาสเทล)
    {
        key: 'peach-amber',
        name: 'Peach Amber',
        cardBorder: 'border-white/95 ring-1 ring-amber-200/65',
        headerGradient:
            'bg-gradient-to-r from-amber-50/80 via-white/85 to-orange-50/55 border-b border-amber-100/80',
        ambientOrb: 'bg-amber-300/25',
        squircleBadge:
            'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-white/90',
        countBadge:
            'bg-white/85 text-amber-800 border border-amber-200/80 shadow-2xs',
        progressTrack: 'bg-amber-100/80',
        progressBar: 'bg-gradient-to-r from-amber-400 to-orange-500',
        syncBarBorder: 'border-amber-100/80',
        syncIconText: 'text-amber-600',
        jumpDot: 'bg-amber-400 ring-2 ring-amber-100',
        jumpPillIdle:
            'bg-amber-50/55 border-amber-200/75 text-slate-700 hover:bg-amber-100/60 hover:border-amber-300',
        subgroupTray:
            'bg-amber-50/35 backdrop-blur-md border-white/90 ring-1 ring-amber-100/80 shadow-inner'
    },
    // 3: Rose Blossom (ชมพูโรสพาสเทล)
    {
        key: 'rose-blossom',
        name: 'Rose Blossom',
        cardBorder: 'border-white/95 ring-1 ring-rose-200/60',
        headerGradient:
            'bg-gradient-to-r from-rose-50/80 via-white/85 to-pink-50/55 border-b border-rose-100/80',
        ambientOrb: 'bg-rose-300/25',
        squircleBadge:
            'bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-white/90',
        countBadge:
            'bg-white/85 text-rose-700 border border-rose-200/80 shadow-2xs',
        progressTrack: 'bg-rose-100/80',
        progressBar: 'bg-gradient-to-r from-rose-400 to-pink-500',
        syncBarBorder: 'border-rose-100/80',
        syncIconText: 'text-rose-600',
        jumpDot: 'bg-rose-400 ring-2 ring-rose-100',
        jumpPillIdle:
            'bg-rose-50/55 border-rose-200/75 text-slate-700 hover:bg-rose-100/60 hover:border-rose-300',
        subgroupTray:
            'bg-rose-50/35 backdrop-blur-md border-white/90 ring-1 ring-rose-100/80 shadow-inner'
    },
    // 4: Violet Lilac (ม่วงไลแลคพาสเทล)
    {
        key: 'violet-lilac',
        name: 'Violet Lilac',
        cardBorder: 'border-white/95 ring-1 ring-purple-200/60',
        headerGradient:
            'bg-gradient-to-r from-purple-50/80 via-white/85 to-fuchsia-50/55 border-b border-purple-100/80',
        ambientOrb: 'bg-purple-300/25',
        squircleBadge:
            'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-md shadow-purple-500/25 ring-2 ring-white/90',
        countBadge:
            'bg-white/85 text-purple-700 border border-purple-200/80 shadow-2xs',
        progressTrack: 'bg-purple-100/80',
        progressBar: 'bg-gradient-to-r from-purple-400 to-fuchsia-500',
        syncBarBorder: 'border-purple-100/80',
        syncIconText: 'text-purple-600',
        jumpDot: 'bg-purple-400 ring-2 ring-purple-100',
        jumpPillIdle:
            'bg-purple-50/55 border-purple-200/75 text-slate-700 hover:bg-purple-100/60 hover:border-purple-300',
        subgroupTray:
            'bg-purple-50/35 backdrop-blur-md border-white/90 ring-1 ring-purple-100/80 shadow-inner'
    },
    // 5: Mint Emerald (เขียวมิ้นต์พาสเทล — และใช้เมื่อหมวดเช็คครบ 100%)
    {
        key: 'mint-emerald',
        name: 'Mint Emerald',
        cardBorder: 'border-white/95 ring-1 ring-emerald-200/75',
        headerGradient:
            'bg-gradient-to-r from-emerald-50/85 via-white/85 to-teal-50/60 border-b border-emerald-100/85',
        ambientOrb: 'bg-emerald-300/25',
        squircleBadge:
            'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-white/90',
        countBadge:
            'bg-emerald-100/90 text-emerald-800 border border-emerald-200/90 shadow-2xs',
        progressTrack: 'bg-emerald-100/80',
        progressBar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
        syncBarBorder: 'border-emerald-100/80',
        syncIconText: 'text-emerald-600',
        jumpDot: 'bg-emerald-400 ring-2 ring-emerald-100',
        jumpPillIdle:
            'bg-emerald-50/65 border-emerald-200/80 text-emerald-800 hover:bg-emerald-100/70 hover:border-emerald-300',
        subgroupTray:
            'bg-emerald-50/35 backdrop-blur-md border-white/90 ring-1 ring-emerald-100/80 shadow-inner'
    }
];

export const getSectionPastelTheme = (
    secIndex: number,
    isAllDone: boolean = false
): SectionPastelTheme => {
    if (isAllDone) {
        return SECTION_PASTEL_THEMES[5]; // Mint Emerald when 100% completed
    }
    const idx = Math.abs(secIndex) % SECTION_PASTEL_THEMES.length;
    return SECTION_PASTEL_THEMES[idx];
};
