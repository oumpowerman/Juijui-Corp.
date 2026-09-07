export interface CompanyColorPreset {
    id: string;
    name: string;
    class: string;
    dot: string;
    border: string;
}

export const COMPANY_COLOR_PRESETS: CompanyColorPreset[] = [
    { 
        id: 'indigo', 
        name: 'Indigo (สุขุม / สำนักงานใหญ่)', 
        class: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
        border: 'border-indigo-300'
    },
    { 
        id: 'pink', 
        name: 'Pink (โปรดักชั่น / ครีเอทีฟ)', 
        class: 'bg-pink-50 text-pink-700 border-pink-200',
        dot: 'bg-pink-500',
        border: 'border-pink-300'
    },
    { 
        id: 'amber', 
        name: 'Amber (บันเทิง / มีเดีย)', 
        class: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        border: 'border-amber-300'
    },
    { 
        id: 'emerald', 
        name: 'Emerald (การเงิน / โอเปอเรชั่น)', 
        class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        border: 'border-emerald-300'
    },
    { 
        id: 'purple', 
        name: 'Purple (นวัตกรรม / เทคโนโลยี)', 
        class: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
        border: 'border-purple-300'
    },
    { 
        id: 'rose', 
        name: 'Rose (การตลาด / แบรนดิ้ง)', 
        class: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        border: 'border-rose-300'
    },
    { 
        id: 'cyan', 
        name: 'Cyan (ดิจิทัล / ออนไลน์)', 
        class: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        dot: 'bg-cyan-500',
        border: 'border-cyan-300'
    },
    { 
        id: 'slate', 
        name: 'Slate (แอดมิน / ซัพพอร์ต)', 
        class: 'bg-slate-100 text-slate-700 border-slate-300',
        dot: 'bg-slate-500',
        border: 'border-slate-300'
    }
];
