
import React from 'react';
import { Palette, Lightbulb, Clapperboard } from 'lucide-react';

interface PositionSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

const PositionSelector: React.FC<PositionSelectorProps> = ({ value, onChange }) => {
    const options = [
        { id: 'GRAPHIC', label: 'GRAPHIC', icon: Palette, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
        { id: 'CREATIVE', label: 'CREATIVE', icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50/50' },
        { id: 'EDITOR', label: 'EDITOR', icon: Clapperboard, color: 'text-slate-600', bg: 'bg-slate-50/50' },
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
                        onClick={() => onChange(opt.id)}
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

export default PositionSelector;
