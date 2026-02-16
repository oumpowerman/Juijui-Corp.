
import { FileText, HeartPulse, Palmtree, Briefcase, Clock, Moon, Siren, Home } from 'lucide-react';

export const DEFAULT_QUOTAS: Record<string, number> = {
    'SICK': 30,
    'VACATION': 6,
    'PERSONAL': 6,
    'WFH': 100, // WFH usually has high or unlimited quota depending on policy
};

export const LEAVE_THEMES: Record<string, any> = {
    'SICK': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', bar: 'bg-red-500', btn: 'bg-red-500 hover:bg-red-600', icon: HeartPulse },
    'VACATION': { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', bar: 'bg-sky-500', btn: 'bg-sky-500 hover:bg-sky-600', icon: Palmtree },
    'PERSONAL': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', bar: 'bg-purple-500', btn: 'bg-purple-500 hover:bg-purple-600', icon: Briefcase },
    'LATE_ENTRY': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', bar: 'bg-amber-500', btn: 'bg-amber-500 hover:bg-amber-600', icon: Clock },
    'OVERTIME': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', bar: 'bg-indigo-500', btn: 'bg-indigo-600 hover:bg-indigo-700', icon: Moon },
    'EMERGENCY': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', bar: 'bg-orange-500', btn: 'bg-orange-500 hover:bg-orange-600', icon: Siren },
    'WFH': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', bar: 'bg-blue-500', btn: 'bg-blue-600 hover:bg-blue-700', icon: Home },
    'DEFAULT': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', bar: 'bg-slate-500', btn: 'bg-slate-800 hover:bg-slate-900', icon: FileText }
};
