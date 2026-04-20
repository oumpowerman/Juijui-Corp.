
import { ChipConfig } from '../types';

// --- Calendar Smart Filter Constants ---
export const DEFAULT_CHIPS: ChipConfig[] = [
    { id: 'def_1', label: 'Video ยาว', type: 'FORMAT', value: 'LONG_FORM', colorTheme: 'indigo' },
    { id: 'def_2', label: 'Shorts/Reels', type: 'FORMAT', value: 'SHORT_FORM', colorTheme: 'rose' },
    { id: 'def_3', label: 'งานที่เสร็จแล้ว', type: 'STATUS', value: 'DONE', colorTheme: 'emerald' },
];

export const COLOR_THEMES = [
    { id: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-100', activeBg: 'bg-indigo-400', ring: 'ring-indigo-300', hex: '#818cf8' },
    { id: 'rose', bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100', activeBg: 'bg-rose-400', ring: 'ring-rose-300', hex: '#fb7185' },
    { id: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100', activeBg: 'bg-emerald-400', ring: 'ring-emerald-300', hex: '#34d399' },
    { id: 'amber', bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-100', activeBg: 'bg-amber-400', ring: 'ring-amber-300', hex: '#fbbf24' },
    { id: 'sky', bg: 'bg-sky-50', text: 'text-sky-500', border: 'border-sky-100', activeBg: 'bg-sky-400', ring: 'ring-sky-300', hex: '#38bdf8' },
    { id: 'purple', bg: 'bg-purple-50', text: 'text-purple-500', border: 'border-purple-100', activeBg: 'bg-purple-400', ring: 'ring-purple-300', hex: '#c084fc' },
];
