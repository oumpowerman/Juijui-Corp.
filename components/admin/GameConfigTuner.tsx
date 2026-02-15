
import React, { useState, useEffect, useCallback } from 'react';
import { useGameConfig } from '../../context/GameConfigContext';
import { useToast } from '../../context/ToastContext';
import { 
    Save, RefreshCw, Trophy, Heart, Gavel, ShoppingBag, 
    Coins, Zap, ShieldAlert, TrendingUp, Clock, AlertTriangle,
    Minus, Plus, Info, RotateCcw
} from 'lucide-react';

// --- REUSABLE UI COMPONENTS ---

const ConfigSlider = ({ 
    label, value, min, max, step = 1, unit = '', 
    onChange, color = 'indigo', icon: Icon 
}: any) => {
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

const StatPreview = ({ title, value, subtext, icon: Icon, color = 'slate' }: any) => (
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

const HealthBarSimulator = ({ maxHp = 100, penalties }: { maxHp?: number, penalties: { label: string, value: number, color: string }[] }) => {
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

// --- MAIN COMPONENT ---

const GameConfigTuner = () => {
    const { config, updateConfigValue, refreshConfig, isLoading } = useGameConfig();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'ECONOMY' | 'QUESTS' | 'LAW' | 'SHOP'>('ECONOMY');
    const [localConfig, setLocalConfig] = useState<any>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sync with global config on load
    useEffect(() => {
        if (config) {
            setLocalConfig(JSON.parse(JSON.stringify(config)));
            setIsDirty(false);
        }
    }, [config]);

    // Helper to update deep values
    const handleChange = useCallback((section: string, key: string, value: any) => {
        setLocalConfig((prev: any) => {
            const next = { ...prev };
            if (!next[section]) next[section] = {};
            next[section][key] = value;
            return next;
        });
        setIsDirty(true);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const promises = [];
            // Save only modified sections or all? Safe to save all relevant sections for this tuner.
            if (localConfig.GLOBAL_MULTIPLIERS) promises.push(updateConfigValue('GLOBAL_MULTIPLIERS', localConfig.GLOBAL_MULTIPLIERS));
            if (localConfig.LEVELING_SYSTEM) promises.push(updateConfigValue('LEVELING_SYSTEM', localConfig.LEVELING_SYSTEM));
            if (localConfig.DIFFICULTY_XP) promises.push(updateConfigValue('DIFFICULTY_XP', localConfig.DIFFICULTY_XP));
            if (localConfig.PENALTY_RATES) promises.push(updateConfigValue('PENALTY_RATES', localConfig.PENALTY_RATES));
            if (localConfig.AUTO_JUDGE_CONFIG) promises.push(updateConfigValue('AUTO_JUDGE_CONFIG', localConfig.AUTO_JUDGE_CONFIG));
            if (localConfig.ITEM_MECHANICS) promises.push(updateConfigValue('ITEM_MECHANICS', localConfig.ITEM_MECHANICS));

            await Promise.all(promises);
            showToast('บันทึกการตั้งค่าเรียบร้อย 🎮', 'success');
            setIsDirty(false);
        } catch (error) {
            showToast('บันทึกไม่สำเร็จ', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('คืนค่ากลับเป็นค่าล่าสุดที่บันทึกไว้?')) {
            setLocalConfig(JSON.parse(JSON.stringify(config)));
            setIsDirty(false);
        }
    };

    if (!localConfig) return <div className="p-10 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></div>;

    // --- RENDER CONTENT BY TAB ---
    
    const renderEconomy = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConfigSlider 
                    label="XP Base / Level" 
                    value={localConfig.LEVELING_SYSTEM?.base_xp_per_level || 1000} 
                    min={500} max={5000} step={100} unit="XP"
                    icon={Trophy} color="amber"
                    onChange={(v: number) => handleChange('LEVELING_SYSTEM', 'base_xp_per_level', v)}
                />
                <ConfigSlider 
                    label="Bonus Coin (Level Up)" 
                    value={localConfig.LEVELING_SYSTEM?.level_up_bonus_coins || 500} 
                    min={0} max={2000} step={50} unit="JP"
                    icon={Coins} color="yellow"
                    onChange={(v: number) => handleChange('LEVELING_SYSTEM', 'level_up_bonus_coins', v)}
                />
            </div>
            
            <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-indigo-800 text-sm">Hourly Rate (ค่าแรงรายชั่วโมง)</h4>
                    <p className="text-xs text-indigo-600 mt-1">สูตรคำนวณ: Hours x Rate = XP Bonus</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => handleChange('GLOBAL_MULTIPLIERS', 'XP_PER_HOUR', (localConfig.GLOBAL_MULTIPLIERS?.XP_PER_HOUR || 20) - 5)} className="p-2 bg-white rounded-lg text-indigo-600 hover:bg-indigo-100"><Minus className="w-4 h-4" /></button>
                    <span className="text-2xl font-black text-indigo-700 min-w-[60px] text-center">{localConfig.GLOBAL_MULTIPLIERS?.XP_PER_HOUR || 20}</span>
                    <button onClick={() => handleChange('GLOBAL_MULTIPLIERS', 'XP_PER_HOUR', (localConfig.GLOBAL_MULTIPLIERS?.XP_PER_HOUR || 20) + 5)} className="p-2 bg-white rounded-lg text-indigo-600 hover:bg-indigo-100"><Plus className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <StatPreview 
                    title="Estimated Time to Lv.2" 
                    value={`~${Math.ceil((localConfig.LEVELING_SYSTEM?.base_xp_per_level || 1000) / ((localConfig.DIFFICULTY_XP?.MEDIUM || 100) + ((localConfig.GLOBAL_MULTIPLIERS?.XP_PER_HOUR || 20) * 2)))} Jobs`} 
                    subtext="Based on Medium Task (2hrs)"
                    icon={Clock} color="slate"
                />
                <StatPreview 
                    title="Inflation Rate" 
                    value="Stable" 
                    subtext="Economy looks healthy"
                    icon={TrendingUp} color="emerald"
                />
            </div>
        </div>
    );

    const renderQuests = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Base Rewards (ค่าตอบแทนพื้นฐาน)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ConfigSlider 
                    label="Easy Task" 
                    value={localConfig.DIFFICULTY_XP?.EASY || 50} 
                    min={10} max={200} step={10} unit="XP"
                    icon={Zap} color="green"
                    onChange={(v: number) => handleChange('DIFFICULTY_XP', 'EASY', v)}
                />
                <ConfigSlider 
                    label="Medium Task" 
                    value={localConfig.DIFFICULTY_XP?.MEDIUM || 100} 
                    min={50} max={500} step={10} unit="XP"
                    icon={Zap} color="blue"
                    onChange={(v: number) => handleChange('DIFFICULTY_XP', 'MEDIUM', v)}
                />
                <ConfigSlider 
                    label="Hard Task" 
                    value={localConfig.DIFFICULTY_XP?.HARD || 250} 
                    min={100} max={1000} step={50} unit="XP"
                    icon={Zap} color="purple"
                    onChange={(v: number) => handleChange('DIFFICULTY_XP', 'HARD', v)}
                />
            </div>

            <div className="p-5 bg-yellow-50 rounded-3xl border border-yellow-100 mt-4">
                <h4 className="text-sm font-bold text-yellow-800 mb-4 flex items-center">
                    <Coins className="w-5 h-5 mr-2" /> Global Coin Rewards
                </h4>
                <div className="grid grid-cols-2 gap-4">
                     <ConfigSlider 
                        label="Per Task" 
                        value={localConfig.GLOBAL_MULTIPLIERS?.COIN_PER_TASK || 10} 
                        min={0} max={100} step={5} unit="JP"
                        color="yellow"
                        onChange={(v: number) => handleChange('GLOBAL_MULTIPLIERS', 'COIN_PER_TASK', v)}
                    />
                    <ConfigSlider 
                        label="Early Bonus" 
                        value={localConfig.GLOBAL_MULTIPLIERS?.COIN_BONUS_EARLY || 20} 
                        min={0} max={100} step={5} unit="JP"
                        color="yellow"
                        onChange={(v: number) => handleChange('GLOBAL_MULTIPLIERS', 'COIN_BONUS_EARLY', v)}
                    />
                </div>
            </div>
        </div>
    );

    const renderLaw = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            <HealthBarSimulator 
                penalties={[
                    { label: 'Late', value: localConfig.PENALTY_RATES?.HP_PENALTY_LATE || 5, color: 'bg-orange-500' },
                    { label: 'Missed Duty', value: localConfig.PENALTY_RATES?.HP_PENALTY_MISSED_DUTY || 10, color: 'bg-red-500' },
                    { label: 'Negligence', value: localConfig.AUTO_JUDGE_CONFIG?.negligence_penalty_hp || 20, color: 'bg-rose-600' }
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Minor Offenses</h4>
                    <ConfigSlider 
                        label="Late Submission" 
                        value={localConfig.PENALTY_RATES?.HP_PENALTY_LATE || 5} 
                        min={1} max={20} step={1} unit="HP"
                        icon={Clock} color="orange"
                        onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_LATE', v)}
                    />
                    <ConfigSlider 
                        label="Check-in Late (Base)" 
                        value={Math.abs(localConfig.ATTENDANCE_RULES?.LATE?.hp || 5)} 
                        min={1} max={20} step={1} unit="HP"
                        icon={User} color="orange"
                        onChange={(v: number) => {
                            // Update attendance rule directly inside ATTENDANCE_RULES
                            const rules = { ...localConfig.ATTENDANCE_RULES };
                            rules.LATE = { ...rules.LATE, hp: -v };
                            setLocalConfig({ ...localConfig, ATTENDANCE_RULES: rules });
                            setIsDirty(true);
                        }}
                    />
                </div>
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-red-800 uppercase tracking-widest">Critical Offenses</h4>
                    <ConfigSlider 
                        label="Missed Duty" 
                        value={localConfig.PENALTY_RATES?.HP_PENALTY_MISSED_DUTY || 10} 
                        min={5} max={50} step={5} unit="HP"
                        icon={AlertTriangle} color="red"
                        onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_MISSED_DUTY', v)}
                    />
                     <ConfigSlider 
                        label="Negligence (Auto)" 
                        value={localConfig.AUTO_JUDGE_CONFIG?.negligence_penalty_hp || 20} 
                        min={10} max={100} step={5} unit="HP"
                        icon={ShieldAlert} color="rose"
                        onChange={(v: number) => handleChange('AUTO_JUDGE_CONFIG', 'negligence_penalty_hp', v)}
                    />
                </div>
            </div>
        </div>
    );

    const renderShop = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                 <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600">
                     <ShoppingBag className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800">Item Shop Mechanics</h3>
                 <p className="text-slate-500 text-sm">ตั้งค่าภาษีและการคืนเงินเมื่อใช้ไอเทม</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConfigSlider 
                    label="Time Warp Refund %" 
                    value={localConfig.ITEM_MECHANICS?.time_warp_refund_percent || 100} 
                    min={50} max={100} step={10} unit="%"
                    icon={RotateCcw} color="indigo"
                    onChange={(v: number) => handleChange('ITEM_MECHANICS', 'time_warp_refund_percent', v)}
                />
                
                <ConfigSlider 
                    label="Shop Tax Rate" 
                    value={localConfig.ITEM_MECHANICS?.shop_tax_rate || 0} 
                    min={0} max={20} step={1} unit="%"
                    icon={Coins} color="slate"
                    onChange={(v: number) => handleChange('ITEM_MECHANICS', 'shop_tax_rate', v)}
                />
            </div>
        </div>
    );

    // --- Main Layout ---
    const TABS = [
        { id: 'ECONOMY', label: 'Economy', icon: TrendingUp },
        { id: 'QUESTS', label: 'Quests', icon: Zap },
        { id: 'LAW', label: 'Law & Order', icon: Gavel },
        { id: 'SHOP', label: 'Shop', icon: ShoppingBag },
    ];

    // Dummy Icon for User if not imported (Lucide imports handled at top)
    function User(props: any) { return <span {...props}>👤</span> }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-indigo-600" /> Game Config Tuner
                    </h2>
                    <p className="text-xs text-slate-500">ปรับสมดุลเกมแบบ Real-time Control</p>
                </div>
                
                <div className="flex gap-2">
                    {isDirty && (
                        <button 
                            onClick={handleReset}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                        >
                            Reset Changes
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={!isDirty || isSaving}
                        className={`
                            px-6 py-2 rounded-xl text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95
                            ${isDirty ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-300 cursor-not-allowed'}
                        `}
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        {isDirty ? 'Save Config' : 'Saved'}
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                            ${activeTab === tab.id 
                                ? 'bg-white text-indigo-700 shadow-sm' 
                                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}
                        `}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'ECONOMY' && renderEconomy()}
                {activeTab === 'QUESTS' && renderQuests()}
                {activeTab === 'LAW' && renderLaw()}
                {activeTab === 'SHOP' && renderShop()}
            </div>

        </div>
    );
};

export default GameConfigTuner;
