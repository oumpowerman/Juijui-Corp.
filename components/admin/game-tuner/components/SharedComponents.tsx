import React, { useState, useEffect } from 'react';
import { Heart, Trophy, Coins, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ClipboardCheck = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
);

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
    
    const textClass = `text-${color}-600`;
    const bgClass = `bg-${color}-500`;
    const borderClass = `border-${color}-500`;

    const handleDecrement = () => {
        const newValue = Math.max(min, value - step);
        onChange(Number(newValue.toFixed(2)));
    };

    const handleIncrement = () => {
        const newValue = Math.min(max, value + step);
        onChange(Number(newValue.toFixed(2)));
    };

    return (
        <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200/80 transition-all flex flex-col justify-between h-full">
            <div className="flex justify-between items-start gap-2 mb-1.5">
                <label className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 leading-tight ${textClass}`}>
                    {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span>{label}</span>
                </label>
                
                {/* Precision Controls */}
                <div className="flex items-center gap-1 bg-slate-50/80 px-1 py-0.5 rounded-lg border border-slate-100/50">
                    <button 
                        type="button"
                        onClick={handleDecrement}
                        className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold active:scale-90 transition-transform text-xs cursor-pointer select-none"
                    >
                        -
                    </button>
                    <span className={`text-xs font-black min-w-[2.5rem] text-center font-mono ${textClass}`}>
                        {value} <span className="text-[9px] text-slate-400 font-medium">{unit}</span>
                    </span>
                    <button 
                        type="button"
                        onClick={handleIncrement}
                        className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 font-bold active:scale-90 transition-transform text-xs cursor-pointer select-none"
                    >
                        +
                    </button>
                </div>
            </div>
            
            {/* Range Slider Container */}
            <div className="relative h-4 flex items-center">
                <input 
                    type="range" 
                    min={min} max={max} step={step} 
                    value={value} 
                    onChange={(e) => onChange(Number(Number(e.target.value).toFixed(2)))}
                    className="absolute w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer z-10 opacity-0"
                />
                <div className="w-full h-1 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div 
                        className={`h-full ${bgClass} transition-all duration-75 ease-out`} 
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div 
                    className={`absolute h-3 w-3 bg-white border-2 ${borderClass} rounded-full shadow-md pointer-events-none transition-all duration-75 ease-out`}
                    style={{ left: `calc(${percentage}% - 6px)` }}
                />
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
    readOnly?: boolean;
    message?: string;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({ label, ruleKey, rule, onChange, readOnly = false, message }) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 hover:border-indigo-200 transition-colors">
            <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">{ruleKey}</span>
                <span className="text-sm font-bold text-slate-800">{label}</span>
                {readOnly && message && (
                    <span className="block mt-1 text-[11px] font-medium text-amber-600 bg-amber-50/60 border border-amber-100 rounded px-2 py-0.5 w-fit">
                        {message}
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-3">
                {/* HP Input (Negative) */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                        <Heart className="w-3 h-3 text-red-400" />
                    </div>
                    <input 
                        type="number" 
                        disabled={readOnly}
                        className={`w-20 pl-7 pr-2 py-1.5 text-xs font-bold border rounded-lg outline-none text-right ${readOnly ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-red-100 bg-red-50 text-red-600 focus:ring-2 focus:ring-red-200'}`}
                        value={rule.hp}
                        onChange={(e) => onChange(ruleKey, 'hp', parseInt(e.target.value) || 0)}
                        placeholder="-HP"
                    />
                    {!readOnly && <span className="absolute -top-2 left-2 text-[8px] bg-white px-1 text-red-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Penalty</span>}
                </div>

                {/* XP Input (Positive) */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                        <Trophy className="w-3 h-3 text-amber-400" />
                    </div>
                    <input 
                        type="number" 
                        disabled={readOnly}
                        className={`w-20 pl-7 pr-2 py-1.5 text-xs font-bold border rounded-lg outline-none text-right ${readOnly ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-amber-100 bg-amber-50 text-amber-600 focus:ring-2 focus:ring-amber-200'}`}
                        value={rule.xp}
                        onChange={(e) => onChange(ruleKey, 'xp', parseInt(e.target.value) || 0)}
                        placeholder="+XP"
                    />
                    {!readOnly && <span className="absolute -top-2 left-2 text-[8px] bg-white px-1 text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Reward</span>}
                </div>

                {/* Coins Input (Positive) */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                        <Coins className="w-3 h-3 text-yellow-500" />
                    </div>
                    <input 
                        type="number" 
                        disabled={readOnly}
                        className={`w-20 pl-7 pr-2 py-1.5 text-xs font-bold border rounded-lg outline-none text-right ${readOnly ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-yellow-100 bg-yellow-50 text-yellow-700 focus:ring-2 focus:ring-yellow-200'}`}
                        value={rule.coins}
                        onChange={(e) => onChange(ruleKey, 'coins', parseInt(e.target.value) || 0)}
                        placeholder="+JP"
                    />
                    {!readOnly && <span className="absolute -top-2 left-2 text-[8px] bg-white px-1 text-yellow-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Coins</span>}
                </div>
            </div>
        </div>
    );
};

export const CollapsibleCard: React.FC<{
    title: string;
    description: string;
    icon: any;
    colorClass?: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    badgeText?: string;
}> = ({ title, description, icon: Icon, colorClass = "indigo", children, defaultExpanded = true, badgeText }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    useEffect(() => {
        setIsExpanded(defaultExpanded);
    }, [defaultExpanded]);

    const colorMap: Record<string, string> = {
        indigo: "border-indigo-100 bg-indigo-50/20 text-indigo-700",
        rose: "border-rose-100 bg-rose-50/20 text-rose-700",
        amber: "border-amber-100 bg-amber-50/20 text-amber-700",
        emerald: "border-emerald-100 bg-emerald-50/20 text-emerald-700",
        blue: "border-blue-100 bg-blue-50/20 text-blue-700",
        slate: "border-slate-100 bg-slate-50/20 text-slate-700",
        purple: "border-purple-100 bg-purple-50/20 text-purple-700",
        orange: "border-orange-100 bg-orange-50/20 text-orange-700"
    };

    return (
        <div className={`border rounded-3xl overflow-hidden transition-all duration-300 bg-white ${isExpanded ? 'shadow-md border-slate-200/80' : 'shadow-sm hover:border-slate-300'}`}>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/40"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${colorMap[colorClass] || colorMap.slate} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">{title}</h4>
                            {badgeText && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-widest">
                                    {badgeText}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5 leading-normal">{description}</p>
                    </div>
                </div>
                <div className="p-1 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>
            
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="border-t border-slate-100/60 overflow-hidden"
                    >
                        <div className="p-5 bg-slate-50/30 space-y-5">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

