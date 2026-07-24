import { MasterOption } from '../../../types';

export interface Holiday {
    id: string;
    name: string;
    day: number;
    month: number;
    typeKey: string;
    type_key?: string; // fallback from database format
}

export interface MonthInfo {
    num: number;
    name: string;
    short: string;
}

export const MONTHS: MonthInfo[] = [
    { num: 1, name: 'มกราคม', short: 'ม.ค.' }, 
    { num: 2, name: 'กุมภาพันธ์', short: 'ก.พ.' }, 
    { num: 3, name: 'มีนาคม', short: 'มี.ค.' },
    { num: 4, name: 'เมษายน', short: 'เม.ย.' }, 
    { num: 5, name: 'พฤษภาคม', short: 'พ.ค.' }, 
    { num: 6, name: 'มิถุนายน', short: 'มิ.ย.' },
    { num: 7, name: 'กรกฎาคม', short: 'ก.ค.' }, 
    { num: 8, name: 'สิงหาคม', short: 'ส.ค.' }, 
    { num: 9, name: 'กันยายน', short: 'ก.ย.' },
    { num: 10, name: 'ตุลาคม', short: 'ต.ค.' }, 
    { num: 11, name: 'พฤศจิกายน', short: 'พ.ย.' }, 
    { num: 12, name: 'ธันวาคม', short: 'ธ.ค.' }
];

export interface HolidayTypeConfig {
    key: string;
    label: string;
    color: string;
    icon: string;
}

export const HOLIDAY_TYPES: HolidayTypeConfig[] = [
    { key: 'ANNUAL', label: 'วันหยุดประจำปี 📆', color: 'bg-rose-50 border-rose-200/80 text-rose-700 hover:bg-rose-100/40', icon: '📆' },
    { key: 'RELIGIOUS', label: 'วันหยุดทางศาสนา 🪔', color: 'bg-amber-50 border-amber-200/80 text-amber-700 hover:bg-amber-100/40', icon: '🪔' },
    { key: 'SPECIAL', label: 'วันหยุดพิเศษ 🌟', color: 'bg-indigo-50 border-indigo-200/80 text-indigo-700 hover:bg-indigo-100/40', icon: '🌟' },
    { key: 'OTHER', label: 'วันหยุดอื่นๆ ☕', color: 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/40', icon: '☕' },
];

export const getHolidayTypeInfo = (typeKey: string, eventTypeOptions: MasterOption[]) => {
    const foundCustom = HOLIDAY_TYPES.find(t => t.key === typeKey);
    if (foundCustom) {
        return {
            label: foundCustom.label,
            color: foundCustom.color,
            icon: foundCustom.icon
        };
    }
    const foundMaster = eventTypeOptions.find(o => o.key === typeKey);
    if (foundMaster) {
        return {
            label: foundMaster.label,
            color: foundMaster.color || 'bg-indigo-50 border-indigo-100 text-indigo-700',
            icon: '📆'
        };
    }
    return {
        label: typeKey || 'วันหยุด',
        color: 'bg-slate-50 border-slate-100 text-slate-600',
        icon: '📆'
    };
};
