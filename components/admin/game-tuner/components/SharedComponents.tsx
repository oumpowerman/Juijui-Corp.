import React from 'react';
import { Heart, Trophy, Coins } from 'lucide-react';

interface ConfigSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (val: number) => void;
    color?: string;
    icon?: React.ElementType;
}

export const ConfigSlider: React.FC<ConfigSliderProps> = ({ 
    label, value, min, max, step = 1, unit = '', 
    onChange, color = 'indigo', icon: Icon 
}) => {
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all">
            <div className="flex justify-between items-center mb-3">
                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-${color}-600`}>
                    {Icon && <Icon className="w-4 h-4" />}
                    {label}
                </label>
                <span className={`text-lg font-black text-${color}-600 font-mono`}>
                    {value} <span className="text-xs text-slate-400 font-medium">{unit}</span>
                </span>
            </div>
            <div className="relative h-6 flex items-center">
                <input 
                    type="range" 
                    min={min} max={max} step={step} 
                    value={value} 
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer z-10 opacity-0"
                />
                <div className="w-full h-2 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div 
                        className={`h-full bg-${color}-500 transition-all duration-75 ease-out`} 
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div 
                    className={`absolute h-4 w-4 bg-white border-2 border-${color}-500 rounded-full shadow-md pointer-events-none transition-all duration-75 ease-out`}
                    style={{ left: `calc(${percentage}% - 8px)` }}
                />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
};

interface StatPreviewProps {
    title: string;
    value: string;
    subtext?: string;
    icon?: React.ElementType;
    color?: string;
}

export const StatPreview: React.FC<StatPreviewProps> = ({ title, value, subtext, icon: Icon, color = 'slate' }) => (
    <div className={`p-4 rounded-2xl border bg-white flex items-center gap-3 border-${color}-100 shadow-sm`}>
        <div className={`p-2.5 rounded-xl bg-${color}-50 text-${color}-600`}>
            {Icon && <Icon className="w-5 h-5" />}
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
            <p className={`text-xl font-black text-${color}-700 leading-none mt-0.5`}>{value}</p>
            {subtext && <p className="text-[10px] text-slate-500 mt-1 font-medium">{subtext}</p>}
        </div>
    </div>
);

interface HealthBarSimulatorProps {
    maxHp?: number;
    penalties: { label: string, value: number, color: string }[];
}

export const HealthBarSimulator: React.FC<HealthBarSimulatorProps> = ({ maxHp = 100, penalties }) => {
    return (
        <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
                <div className="flex justify-between items-end mb-2">
                    <h4 className="font-bold flex items-center gap-2 text-sm"><Heart className="w-4 h-4 text-red-500 fill-red-500" /> Damage Simulator</h4>
                    <span className="text-xs font-mono text-slate-400">Max HP: {maxHp}</span>
                </div>
                
                <div className="h-8 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative flex">
                    {/* Base Health */}
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 flex-1"></div>
                    
                    {/* Damage Chunks (Simulated) */}
                    {penalties.map((p, i) => {
                        const widthPct = (p.value / maxHp) * 100;
                        return (
                            <div 
                                key={i} 
                                className={`h-full ${p.color} border-l border-slate-900/20 relative group cursor-help`} 
                                style={{ width: `${widthPct}%` }}
                                title={`${p.label}: -${p.value} HP`}
                            >
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                                    -{p.value}
                                </span>
                            </div>
                        );
                    })}
                </div>
                
                <div className="flex gap-4 mt-4 text-[10px] font-bold text-slate-400 justify-center">
                    {penalties.map((p, i) => (
                         <div key={i} className="flex items-center gap-1.5">
                             <div className={`w-2 h-2 rounded-full ${p.color}`}></div>
                             <span>{p.label} (-{p.value})</span>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface RuleEditorProps {
    label: string;
    ruleKey: string;
    rule: { xp: number, hp: number, coins: number };
    onChange: (key: string, field: 'xp' | 'hp' | 'coins', val: number) => void;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({ label, ruleKey, rule, onChange }) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-indigo-200 transition-colors">
            <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">{ruleKey}</span>
                <span className="text-sm font-bold text-slate-800">{label}</span>
            </div>
            
            <div className="flex items-center gap-3">
                {/* HP Input (Negative) */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                        <Heart className="w-3 h-3 text-red-400" />
                    </div>
                    <input 
                        type="number" 
                        className="w-20 pl-7 pr-2 py-1.5 text-xs font-bold border border-red-100 bg-red-50 text-red-600 rounded-lg focus:ring-2 focus:ring-red-200 outline-none text-right"
                        value={rule.hp}
                        onChange={(e) => onChange(ruleKey, 'hp', parseInt(e.target.value) || 0)}
                        placeholder="-HP"
                    />
                    <span className="absolute -top-2 left-2 text-[8px] bg-white px-1 text-red-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Penalty</span>
                </div>

                {/* XP Input (Positive) */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                        <Trophy className="w-3 h-3 text-amber-400" />
                    </div>
                    <input 
                        type="number" 
                        className="w-20 pl-7 pr-2 py-1.5 text-xs font-bold border border-amber-100 bg-amber-50 text-amber-600 rounded-lg focus:ring-2 focus:ring-amber-200 outline-none text-right"
                        value={rule.xp}
                        onChange={(e) => onChange(ruleKey, 'xp', parseInt(e.target.value) || 0)}
                        placeholder="+XP"
                    />
                    <span className="absolute -top-2 left-2 text-[8px] bg-white px-1 text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Reward</span>
                </div>

                {/* Coins Input (Positive) */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                        <Coins className="w-3 h-3 text-yellow-500" />
                    </div>
                    <input 
                        type="number" 
                        className="w-20 pl-7 pr-2 py-1.5 text-xs font-bold border border-yellow-100 bg-yellow-50 text-yellow-700 rounded-lg focus:ring-2 focus:ring-yellow-200 outline-none text-right"
                        value={rule.coins}
                        onChange={(e) => onChange(ruleKey, 'coins', parseInt(e.target.value) || 0)}
                        placeholder="+JP"
                    />
                    <span className="absolute -top-2 left-2 text-[8px] bg-white px-1 text-yellow-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Coins</span>
                </div>
            </div>
        </div>
    );
};
