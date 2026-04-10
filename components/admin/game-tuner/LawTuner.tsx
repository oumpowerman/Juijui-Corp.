import React, { useMemo } from 'react';
import { 
    Clock, AlertTriangle, ShieldAlert, Gavel, Info, Zap, RefreshCw, 
    UserCheck, Target, Calendar, History, ShieldCheck, ClipboardCheck,
    HelpCircle, BookOpen, ShieldQuestion, Trophy, TrendingUp, ShoppingBag
} from 'lucide-react';
import { ConfigSlider, HealthBarSimulator, RuleEditor } from './components/SharedComponents';
import { motion } from 'framer-motion';

interface LawTunerProps {
    localConfig: any;
    handleChange: (section: string, key: string, value: any) => void;
    setLocalConfig: (config: any) => void;
    setIsDirty: (dirty: boolean) => void;
    getAttendanceLabel: (key: string) => string;
    getAttendanceColor: (key: string) => string;
    masterOptions: any[];
}

const PRETTY_LABELS: Record<string, string> = {
    // GLOBAL_MULTIPLIERS
    XP_TASK_COMPLETE: "XP เมื่อจบงาน (Task)",
    COIN_TASK: "Coins เมื่อจบงาน (Task)",
    XP_DUTY_COMPLETE: "XP เมื่อทำเวรเสร็จ",
    XP_DUTY_ASSIST: "XP เมื่อช่วยเพื่อนทำเวร",
    XP_ATTENDANCE: "XP พื้นฐานการเข้างาน",
    COIN_ATTENDANCE: "Coins พื้นฐานการเข้างาน",
    XP_BONUS_EARLY: "XP โบนัสมาเช้า",
    COIN_BONUS_EARLY: "Coins โบนัสมาเช้า",
    XP_PER_HOUR: "XP ต่อชั่วโมงการทำงาน",
    COIN_PER_TASK: "Coins ต่อหนึ่งงาน",
    BASE_XP_PER_LEVEL: "XP พื้นฐานต่อเลเวล (Global)",
    XP_DUTY_LATE_SUBMIT: "XP เมื่อส่งเวรสาย",
    COIN_DUTY: "Coins จากการทำเวร",

    // PENALTY_RATES
    HP_PENALTY_LATE: "โทษหัก HP มาสาย (Base)",
    HP_PENALTY_MISSED_DUTY: "โทษหัก HP ไม่ทำเวร",
    HP_PENALTY_LATE_MULTIPLIER: "ตัวคูณหัก HP มาสายรายวัน",
    HP_PENALTY_DUTY_LATE_SUBMIT: "โทษหัก HP ส่งเวรสาย",
    HP_PENALTY_EARLY_LEAVE_RATE: "อัตราหัก HP กลับก่อนเวลา",
    HP_PENALTY_UNAUTHORIZED_WFH: "โทษหัก HP WFH ไม่ได้รับอนุญาต",
    HP_PENALTY_EARLY_LEAVE_INTERVAL: "ช่วงเวลาหัก HP กลับก่อน (นาที)",
    COIN_PENALTY_LATE_PER_DAY: "โทษหัก Coins มาสายรายวัน",

    // AUTO_JUDGE_CONFIG
    duty_grace_hour: "ชั่วโมงผ่อนปรนการส่งเวร (น.)",
    lookback_days_check: "จำนวนวันตรวจสอบย้อนหลัง (AI)",
    negligence_penalty_hp: "โทษหัก HP ความเพิกเฉย (AI)",
    negligence_threshold_days: "เกณฑ์วันตัดสินความเพิกเฉย",

    // DIFFICULTY_XP
    EASY: "รางวัล XP ระดับง่าย (Easy)",
    MEDIUM: "รางวัล XP ระดับกลาง (Medium)",
    HARD: "รางวัล XP ระดับยาก (Hard)",

    // LEVELING_SYSTEM
    base_xp_per_level: "XP พื้นฐานสำหรับ Level Up",
    level_up_bonus_coins: "โบนัส Coins เมื่อเลเวลอัป",
    max_level: "เลเวลสูงสุด",

    // ITEM_MECHANICS
    shop_tax_rate: "ภาษีร้านค้า (%)",
    time_warp_refund_cap_hp: "ขีดจำกัดการคืน HP (Time Warp)",
    time_warp_refund_percent: "เปอร์เซ็นต์การคืน HP (Time Warp)",

    // TRIBUNAL
    reward_hp: "รางวัล HP ผู้แจ้งเหตุ",
    penalty_hp: "โทษหัก HP ผู้ถูกแจ้ง",
    false_report_penalty_hp: "โทษหัก HP แจ้งเหตุเท็จ",
    reward_points: "รางวัลแต้มผู้แจ้งเหตุ"
};

// --- FEATURE BASED GROUPING DEFINITION ---
const FEATURE_GROUPS = [
    {
        id: 'ATTENDANCE',
        title: 'Attendance System',
        description: 'การเข้างาน, การมาเช้า และการกลับก่อนเวลา',
        icon: Clock,
        color: 'indigo',
        keys: [
            'XP_ATTENDANCE', 'COIN_ATTENDANCE', 'XP_BONUS_EARLY', 'COIN_BONUS_EARLY', 
            'XP_PER_HOUR', 'HP_PENALTY_EARLY_LEAVE_RATE', 'HP_PENALTY_EARLY_LEAVE_INTERVAL', 
            'HP_PENALTY_UNAUTHORIZED_WFH'
        ]
    },
    {
        id: 'DUTY',
        title: 'Duty & Responsibility',
        description: 'การจัดการเวรทำความสะอาดและหน้าที่รับผิดชอบ',
        icon: ClipboardCheck,
        color: 'orange',
        keys: [
            'XP_DUTY_COMPLETE', 'COIN_DUTY', 'XP_DUTY_ASSIST', 'HP_PENALTY_MISSED_DUTY', 
            'HP_PENALTY_DUTY_LATE_SUBMIT', 'XP_DUTY_LATE_SUBMIT', 'duty_grace_hour'
        ]
    },
    {
        id: 'TASK',
        title: 'Task & Performance',
        description: 'การส่งงานและบทลงโทษการส่งงานล่าช้า',
        icon: Target,
        color: 'rose',
        keys: [
            'XP_TASK_COMPLETE', 'COIN_TASK', 'COIN_PER_TASK', 'HP_PENALTY_LATE', 
            'HP_PENALTY_LATE_MULTIPLIER', 'COIN_PENALTY_LATE_PER_DAY'
        ]
    },
    {
        id: 'GROWTH',
        title: 'Leveling & Difficulty',
        description: 'เกณฑ์การขึ้นเลเวลและรางวัลตามความยากของงาน',
        icon: TrendingUp,
        color: 'emerald',
        keys: [
            'BASE_XP_PER_LEVEL', 'base_xp_per_level', 'level_up_bonus_coins', 'max_level',
            'EASY', 'MEDIUM', 'HARD'
        ]
    },
    {
        id: 'SYSTEM',
        title: 'AI & Mechanics',
        description: 'ระบบตัดสินอัตโนมัติ ภาษี และกลไกไอเทม',
        icon: ShieldAlert,
        color: 'slate',
        keys: [
            'lookback_days_check', 'negligence_penalty_hp', 'negligence_threshold_days',
            'shop_tax_rate', 'time_warp_refund_cap_hp', 'time_warp_refund_percent'
        ]
    },
    {
        id: 'TRIBUNAL',
        title: 'Tribunal System',
        description: 'การฟ้องร้องและรางวัลการแจ้งเหตุ',
        icon: Gavel,
        color: 'amber',
        keys: [
            'reward_hp', 'penalty_hp', 'false_report_penalty_hp', 'reward_points'
        ]
    }
];

const DynamicConfigSection: React.FC<{
    title: string;
    description: string;
    icon: any;
    color: string;
    items: { section: string, key: string, value: any }[];
    onChange: (section: string, key: string, value: any) => void;
}> = ({ title, description, icon: Icon, color, items, onChange }) => {
    if (items.length === 0) return null;

    const colorMap: Record<string, string> = {
        indigo: "bg-indigo-100 text-indigo-600 border-indigo-100",
        rose: "bg-rose-100 text-rose-600 border-rose-100",
        amber: "bg-amber-100 text-amber-600 border-amber-100",
        emerald: "bg-emerald-100 text-emerald-600 border-emerald-100",
        blue: "bg-blue-100 text-blue-600 border-blue-100",
        slate: "bg-slate-100 text-slate-600 border-slate-100",
        purple: "bg-purple-100 text-purple-600 border-purple-100",
        orange: "bg-orange-100 text-orange-600 border-orange-100"
    };

    return (
        <div className={`p-6 rounded-3xl border space-y-5 ${colorMap[color] || colorMap.slate} bg-opacity-30`}>
            <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Icon className="w-4 h-4" /> {title}
            </h4>
            <div className="space-y-4">
                {items.map(item => (
                    <ConfigSlider 
                        key={`${item.section}-${item.key}`}
                        label={PRETTY_LABELS[item.key] || item.key} 
                        value={item.value} 
                        min={0} 
                        max={item.key.toLowerCase().includes('xp') ? 2000 : 500} 
                        step={item.key.toLowerCase().includes('rate') || item.key.toLowerCase().includes('multiplier') ? 0.1 : 1}
                        unit={item.key.toLowerCase().includes('xp') ? 'XP' : item.key.toLowerCase().includes('coin') ? 'Coins' : 'Val'}
                        icon={Zap} 
                        color={color}
                        onChange={(v: number) => onChange(item.section, item.key, v)}
                    />
                ))}
            </div>
            <p className="text-[10px] opacity-60 italic">* {description}</p>
        </div>
    );
};

const KPIRewardsEditor: React.FC<{
    config: any;
    onChange: (section: string, key: string, value: any) => void;
}> = ({ config, onChange }) => {
    if (!config) return null;
    return (
        <div className="p-6 rounded-3xl border border-emerald-100 bg-emerald-50/30 space-y-5">
            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                <Trophy className="w-4 h-4" /> KPI Rewards (รางวัลตามเกรด)
            </h4>
            <div className="space-y-6">
                {Object.keys(config).sort().map(grade => (
                    <div key={grade} className="space-y-3 p-3 bg-white/50 rounded-2xl border border-emerald-50">
                        <h5 className="text-[10px] font-black text-emerald-500 uppercase">Grade {grade}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ConfigSlider 
                                label="XP" 
                                value={config[grade].xp} 
                                min={0} max={5000} step={50} unit="XP"
                                icon={Zap} color="emerald"
                                onChange={(v) => onChange('KPI_REWARDS', grade, { ...config[grade], xp: v })}
                            />
                            <ConfigSlider 
                                label="Coins" 
                                value={config[grade].coins} 
                                min={0} max={2000} step={10} unit="Coins"
                                icon={Zap} color="amber"
                                onChange={(v) => onChange('KPI_REWARDS', grade, { ...config[grade], coins: v })}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-emerald-600/60 italic">* รางวัลที่จะได้รับเมื่อพนักงานได้เกรด KPI ในระดับต่างๆ</p>
        </div>
    );
};

const LawTuner: React.FC<LawTunerProps> = ({ 
    localConfig, handleChange, setLocalConfig, setIsDirty, getAttendanceLabel, getAttendanceColor, masterOptions 
}) => {

    const categorizedOptions = useMemo(() => {
        const groups = {
            WORK: [] as any[],
            LEAVE: [] as any[],
            CORRECTION: [] as any[],
            SYSTEM: [] as any[] // New group for rules missing in master_options
        };
        
        const seenKeys = new Set<string>();
        const masterKeys = new Set<string>();

        // 1. Process Master Options
        masterOptions
            .filter(o => o.type === 'ATTENDANCE_TYPE' || o.type === 'LEAVE_TYPE' || o.type === 'ATTENDANCE_RULE_KEY')
            .forEach(o => {
                if (seenKeys.has(o.key)) return;
                seenKeys.add(o.key);
                masterKeys.add(o.key);
                
                if (['CORRECTION_REFUND', 'ABSENT_REFUND'].includes(o.key)) return;
                
                if (['OFFICE', 'WFH', 'SITE'].includes(o.key)) {
                    groups.WORK.push(o);
                } else if (['VACATION', 'SICK', 'PERSONAL', 'EMERGENCY', 'UNPAID'].includes(o.key)) {
                    groups.LEAVE.push(o);
                } else {
                    groups.CORRECTION.push(o);
                }
            });

        // 2. Detect "Orphaned" Rules in game_configs
        if (localConfig.ATTENDANCE_RULES) {
            Object.keys(localConfig.ATTENDANCE_RULES).forEach(key => {
                // Skip if already seen in master options or if it's a special refund key handled elsewhere
                if (masterKeys.has(key) || ['CORRECTION_REFUND', 'ABSENT_REFUND'].includes(key)) return;

                groups.SYSTEM.push({
                    key,
                    label: key, // Use raw key as label
                    type: 'SYSTEM_RULE',
                    color: 'bg-slate-400'
                });
            });
        }
            
        Object.values(groups).forEach(g => g.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
        return groups;
    }, [masterOptions, localConfig.ATTENDANCE_RULES]);

    const handleRuleChange = (key: string, field: 'xp' | 'hp' | 'coins', val: number) => {
        const rules = { ...localConfig.ATTENDANCE_RULES };
        if (!rules[key]) rules[key] = { xp: 0, hp: 0, coins: 0 };
        rules[key] = { ...rules[key], [field]: val };
        
        setLocalConfig((prev: any) => ({ ...prev, ATTENDANCE_RULES: rules }));
        setIsDirty(true);
    };

    return (
        <div className="space-y-10 pb-10">
            
            {/* 1. SIMULATOR SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 bg-white/40 backdrop-blur-sm p-6 rounded-3xl border border-slate-200/50 flex flex-col justify-center"
                >
                    <HealthBarSimulator 
                        penalties={[
                            { label: 'Late', value: localConfig.PENALTY_RATES?.HP_PENALTY_LATE || 5, color: 'bg-orange-500' },
                            { label: 'Missed Duty', value: localConfig.PENALTY_RATES?.HP_PENALTY_MISSED_DUTY || 10, color: 'bg-red-500' },
                            { label: 'Negligence', value: localConfig.AUTO_JUDGE_CONFIG?.negligence_penalty_hp || 20, color: 'bg-rose-600' }
                        ]}
                    />
                    <p className="text-[10px] text-slate-400 mt-4 text-center flex justify-center items-center gap-1">
                        <Info className="w-3 h-3" />
                        จำลองความเสียหายต่อ HP เมื่อพนักงานทำผิดกฎ (HP หมด = Game Over)
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-200 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all"></div>
                    <h4 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Admin Logic Guide
                    </h4>
                    <ul className="text-[11px] space-y-2.5 opacity-90 font-medium">
                        <li className="flex gap-2">
                            <span className="text-indigo-200">●</span>
                            <span><b>WFH Logic:</b> ถ้าขออนุญาตล่วงหน้า = ไม่หัก HP | ถ้าไม่ขอแต่เช็คอิน WFH = หัก HP ทันที</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-indigo-200">●</span>
                            <span><b>Late Penalty:</b> คำนวณแบบทวีคูณตามจำนวนวันที่ล่าช้า (Base x Multiplier)</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-indigo-200">●</span>
                            <span><b>Refunds:</b> ใช้คืนเลือดให้พนักงานเมื่อมีการแก้ไขข้อมูลที่ผิดพลาดให้ถูกต้อง</span>
                        </li>
                    </ul>
                </motion.div>
            </div>

            {/* 2. STATUS & CORRECTION RULES (The Table Part) */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Status & Correction Rules</h3>
                        <p className="text-xs text-slate-500">กฎพื้นฐานตามสถานะการเข้างานและการลา (XP/HP/Coins per Status)</p>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Gavel className="w-4 h-4" /> ตารางสถานะ (Attendance & Leave Rules)
                        </h4>
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full">
                            {masterOptions.filter(o => o.type === 'ATTENDANCE_TYPE' || o.type === 'LEAVE_TYPE' || o.type === 'ATTENDANCE_RULE_KEY').length} Rules
                        </span>
                    </div>

                    <div className="space-y-8">
                        {/* 1. Work Section */}
                        {categorizedOptions.WORK.length > 0 && (
                            <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Clock className="w-3.5 h-3.5" /> การเข้างาน (Attendance & Work)
                                </h5>
                                <div className="grid grid-cols-1 gap-3">
                                    {categorizedOptions.WORK.map(option => (
                                        <div key={option.key} className="relative pl-4 group">
                                            <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${option.color?.includes('bg-') ? option.color : option.color?.replace('text-', 'bg-') || 'bg-slate-500'}`}></div>
                                            <RuleEditor label={option.label} ruleKey={option.key} rule={localConfig.ATTENDANCE_RULES?.[option.key] || { xp: 0, hp: 0, coins: 0 }} onChange={handleRuleChange} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Leave Section */}
                        {categorizedOptions.LEAVE.length > 0 && (
                            <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Calendar className="w-3.5 h-3.5" /> ประเภทการลา (Leave Types)
                                </h5>
                                <div className="grid grid-cols-1 gap-3">
                                    {categorizedOptions.LEAVE.map(option => (
                                        <div key={option.key} className="relative pl-4 group">
                                            <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${option.color?.includes('bg-') ? option.color : option.color?.replace('text-', 'bg-') || 'bg-slate-500'}`}></div>
                                            <RuleEditor label={option.label} ruleKey={option.key} rule={localConfig.ATTENDANCE_RULES?.[option.key] || { xp: 0, hp: 0, coins: 0 }} onChange={handleRuleChange} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Correction Section */}
                        {categorizedOptions.CORRECTION.length > 0 && (
                            <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <RefreshCw className="w-3.5 h-3.5" /> แก้ไขและอื่นๆ (Corrections & Special)
                                </h5>
                                <div className="grid grid-cols-1 gap-3">
                                    {categorizedOptions.CORRECTION.map(option => (
                                        <div key={option.key} className="relative pl-4 group">
                                            <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${option.color?.includes('bg-') ? option.color : option.color?.replace('text-', 'bg-') || 'bg-slate-500'}`}></div>
                                            <RuleEditor label={option.label} ruleKey={option.key} rule={localConfig.ATTENDANCE_RULES?.[option.key] || { xp: 0, hp: 0, coins: 0 }} onChange={handleRuleChange} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.section>

            {/* 3. GAME MECHANICS & REWARDS (The Dynamic Feature Cards) */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Game Mechanics & Rewards</h3>
                        <p className="text-xs text-slate-500">ตั้งค่าตัวคูณ รางวัล และบทลงโทษแยกตามฟีเจอร์ (Feature-Based Configuration)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(() => {
                        // 1. Flatten all available configs from localConfig
                        const allConfigs: { section: string, key: string, value: any }[] = [];
                        const sections = [
                            'GLOBAL_MULTIPLIERS', 'LEVELING_SYSTEM', 'DIFFICULTY_XP', 
                            'PENALTY_RATES', 'AUTO_JUDGE_CONFIG', 'ITEM_MECHANICS', 'TRIBUNAL_CONFIG'
                        ];
                        
                        sections.forEach(section => {
                            if (localConfig[section]) {
                                Object.keys(localConfig[section]).forEach(key => {
                                    if (typeof localConfig[section][key] === 'number') {
                                        allConfigs.push({ section, key, value: localConfig[section][key] });
                                    }
                                });
                            }
                        });

                        const usedKeys = new Set<string>();

                        // 2. Render Feature Groups
                        const featureCards = FEATURE_GROUPS.map(group => {
                            const groupItems = allConfigs.filter(item => group.keys.includes(item.key));
                            groupItems.forEach(item => usedKeys.add(`${item.section}-${item.key}`));
                            
                            return (
                                <DynamicConfigSection 
                                    key={group.id}
                                    title={group.title}
                                    description={group.description}
                                    icon={group.icon}
                                    color={group.color}
                                    items={groupItems}
                                    onChange={handleChange}
                                />
                            );
                        });

                        // 3. Render Safety Net (Uncategorized)
                        const uncategorizedItems = allConfigs.filter(item => !usedKeys.has(`${item.section}-${item.key}`));
                        
                        return (
                            <>
                                {featureCards}
                                {uncategorizedItems.length > 0 && (
                                    <DynamicConfigSection 
                                        title="Other / New Configs"
                                        description="ค่าพลังใหม่ๆ หรือค่าที่ยังไม่ได้จัดหมวดหมู่ (Safety Net)"
                                        icon={ShieldQuestion}
                                        color="slate"
                                        items={uncategorizedItems}
                                        onChange={handleChange}
                                    />
                                )}
                            </>
                        );
                    })()}

                    <KPIRewardsEditor 
                        config={localConfig.KPI_REWARDS}
                        onChange={handleChange}
                    />
                </div>
            </motion.section>
        </div>
    );
};

export default LawTuner;
