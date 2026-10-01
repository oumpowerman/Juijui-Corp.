export const MAX_DOCK_VISIBLE_PRESETS = 4;

export interface HeaderPresetColorTheme {
    activeBadge: string;
    inactiveBadge: string;
    progressFill: string;
    activeGlow: string;
}

export const COLOR_THEME_MAP: Record<string, HeaderPresetColorTheme> = {
    indigo: {
        activeBadge:
            'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        inactiveBadge:
            'bg-gradient-to-br from-indigo-50 to-white text-indigo-600 border border-indigo-100/90 shadow-[0_2px_6px_rgba(99,102,241,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
        progressFill: 'from-indigo-400 to-sky-400',
        activeGlow: 'from-indigo-500/25 via-sky-500/10 to-transparent'
    },
    emerald: {
        activeBadge:
            'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        inactiveBadge:
            'bg-gradient-to-br from-emerald-50 to-white text-emerald-600 border border-emerald-100/90 shadow-[0_2px_6px_rgba(16,185,129,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
        progressFill: 'from-emerald-400 to-teal-300',
        activeGlow: 'from-emerald-500/25 via-teal-500/10 to-transparent'
    },
    amber: {
        activeBadge:
            'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        inactiveBadge:
            'bg-gradient-to-br from-amber-50 to-white text-amber-600 border border-amber-100/90 shadow-[0_2px_6px_rgba(245,158,11,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
        progressFill: 'from-amber-400 to-yellow-300',
        activeGlow: 'from-amber-500/25 via-orange-500/10 to-transparent'
    },
    rose: {
        activeBadge:
            'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        inactiveBadge:
            'bg-gradient-to-br from-rose-50 to-white text-rose-600 border border-rose-100/90 shadow-[0_2px_6px_rgba(244,63,94,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
        progressFill: 'from-rose-400 to-pink-400',
        activeGlow: 'from-rose-500/25 via-pink-500/10 to-transparent'
    },
    sky: {
        activeBadge:
            'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        inactiveBadge:
            'bg-gradient-to-br from-sky-50 to-white text-sky-600 border border-sky-100/90 shadow-[0_2px_6px_rgba(14,165,233,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
        progressFill: 'from-sky-400 to-cyan-300',
        activeGlow: 'from-sky-500/25 via-cyan-500/10 to-transparent'
    }
};

export const getHeaderPresetColorTheme = (color?: string): HeaderPresetColorTheme =>
    COLOR_THEME_MAP[color || 'indigo'] || COLOR_THEME_MAP.indigo;
