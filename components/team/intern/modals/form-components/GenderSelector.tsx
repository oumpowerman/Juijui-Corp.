
import React from 'react';
import { Gender } from '../../../../../types';
import { User, UserCheck, Users } from 'lucide-react';

interface GenderSelectorProps {
    value: Gender;
    onChange: (value: Gender) => void;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({ value, onChange }) => {
    const options = [
        { id: 'MALE', label: 'ชาย', icon: User, color: 'text-blue-600', bg: 'bg-blue-50/50' },
        { id: 'FEMALE', label: 'หญิง', icon: UserCheck, color: 'text-pink-600', bg: 'bg-pink-50/50' },
        { id: 'OTHER', label: 'อื่นๆ', icon: Users, color: 'text-slate-600', bg: 'bg-slate-50/50' },
    ];

    return (
        <div className="flex gap-3">
            {options.map((opt) => {
                const Icon = opt.icon;
                const isActive = value === opt.id;
                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id as Gender)}
                        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                            isActive 
                            ? `border-indigo-500 ${opt.bg} shadow-md scale-[1.02]` 
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        <Icon className={`w-6 h-6 ${isActive ? opt.color : 'text-gray-300'}`} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-indigo-700' : 'text-gray-400'}`}>
                            {opt.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default GenderSelector;
