
import { ChipConfig } from '../types';

// --- Calendar Smart Filter Constants ---
export const DEFAULT_CHIPS: ChipConfig[] = [
    { id: 'def_1', label: 'Video ยาว', type: 'FORMAT', value: 'LONG_FORM', colorTheme: 'indigo' },
    { id: 'def_2', label: 'Shorts/Reels', type: 'FORMAT', value: 'SHORT_FORM', colorTheme: 'rose' },
    { id: 'def_3', label: 'งานที่เสร็จแล้ว', type: 'STATUS', value: 'DONE', colorTheme: 'emerald' },
];

export const COLOR_THEMES = [
    { id: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', activeBg: 'bg-indigo-600', ring: 'ring-indigo-500' },
    { id: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', activeBg: 'bg-rose-600', ring: 'ring-rose-500' },
    { id: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', activeBg: 'bg-emerald-600', ring: 'ring-emerald-500' },
    { id: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', activeBg: 'bg-amber-600', ring: 'ring-amber-500' },
    { id: 'sky', bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', activeBg: 'bg-sky-600', ring: 'ring-sky-500' },
    { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', activeBg: 'bg-purple-600', ring: 'ring-purple-500' },
];
