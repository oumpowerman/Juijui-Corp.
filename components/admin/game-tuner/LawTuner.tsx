import React from 'react';
import { Clock, AlertTriangle, ShieldAlert, Gavel, Info , Zap} from 'lucide-react';
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

const LawTuner: React.FC<LawTunerProps> = ({ 
    localConfig, handleChange, setLocalConfig, setIsDirty, getAttendanceLabel, getAttendanceColor, masterOptions 
}) => {

    const handleRuleChange = (key: string, field: 'xp' | 'hp' | 'coins', val: number) => {
        const rules = { ...localConfig.ATTENDANCE_RULES };
        if (!rules[key]) rules[key] = { xp: 0, hp: 0, coins: 0 };
        rules[key] = { ...rules[key], [field]: val };
        
        setLocalConfig((prev: any) => ({ ...prev, ATTENDANCE_RULES: rules }));
        setIsDirty(true);
    };

    return (
        <div className="space-y-8">
            
            {/* Simulator Section */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <HealthBarSimulator 
                    penalties={[
                        { label: 'Late', value: localConfig.PENALTY_RATES?.HP_PENALTY_LATE || 5, color: 'bg-orange-500' },
                        { label: 'Missed Duty', value: localConfig.PENALTY_RATES?.HP_PENALTY_MISSED_DUTY || 10, color: 'bg-red-500' },
                        { label: 'Negligence', value: localConfig.AUTO_JUDGE_CONFIG?.negligence_penalty_hp || 20, color: 'bg-rose-600' }
                    ]}
                />
                <p className="text-[10px] text-slate-400 mt-2 text-center flex justify-center items-center gap-1">
                    <Info className="w-3 h-3" />
                    จำลองความเสียหายต่อ HP เมื่อพนักงานทำผิดกฎ (HP หมด = Game Over / ถูกพักงาน)
                </p>
            </motion.div>

            {/* Basic Penalties */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                <div className="space-y-4 p-5 bg-orange-50/50 rounded-3xl border border-orange-100">
                    <h4 className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Minor Offenses (โทษเบา)
                    </h4>
                    <ConfigSlider 
                        label="Late Submission" 
                        value={localConfig.PENALTY_RATES?.HP_PENALTY_LATE || 5} 
                        min={1} max={20} step={1} unit="HP"
                        icon={Clock} color="orange"
                        onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_LATE', v)}
                    />
                    <p className="text-[10px] text-orange-600/60">
                        หัก HP เมื่อส่งงานช้ากว่ากำหนด (Late Submission)
                    </p>
                </div>
                <div className="space-y-4 p-5 bg-red-50/50 rounded-3xl border border-red-100">
                    <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Critical Offenses (โทษหนัก)
                    </h4>
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
                    <ConfigSlider 
                        label="Late Submit Penalty" 
                        value={localConfig.PENALTY_RATES?.HP_PENALTY_DUTY_LATE_SUBMIT || 3} 
                        min={1} max={10} step={1} unit="HP"
                        icon={Clock} color="amber"
                        onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_DUTY_LATE_SUBMIT', v)}
                    />
                    <ConfigSlider 
                        label="Duty Grace Hour" 
                        value={localConfig.AUTO_JUDGE_CONFIG?.duty_grace_hour || 10} 
                        min={0} max={23} step={1} unit=":00"
                        icon={Clock} color="slate"
                        onChange={(v: number) => handleChange('AUTO_JUDGE_CONFIG', 'duty_grace_hour', v)}
                    />
                    <div className="pt-4 border-t border-red-100 mt-2 space-y-4">
                        <h5 className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Duty Rewards (รางวัลทำเวร)</h5>
                        <ConfigSlider 
                            label="Duty XP Reward" 
                            value={localConfig.GLOBAL_MULTIPLIERS?.XP_DUTY_COMPLETE || 20} 
                            min={0} max={100} step={5} unit="XP"
                            icon={Zap} color="indigo"
                            onChange={(v: number) => handleChange('GLOBAL_MULTIPLIERS', 'XP_DUTY_COMPLETE', v)}
                        />
                        <ConfigSlider 
                            label="Hero Assist Bonus" 
                            value={localConfig.GLOBAL_MULTIPLIERS?.XP_DUTY_ASSIST || 30} 
                            min={0} max={200} step={10} unit="XP"
                            icon={Zap} color="rose"
                            onChange={(v: number) => handleChange('GLOBAL_MULTIPLIERS', 'XP_DUTY_ASSIST', v)}
                        />
                    </div>
                    <p className="text-[10px] text-red-600/60">
                        หัก HP เมื่อละเลยหน้าที่ (Missed Duty) หรือถูก AI ตัดสินว่าเพิกเฉยงาน (Negligence)
                    </p>
                </div>
            </motion.div>

            {/* Dynamic Attendance Rules Section (Full Control) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-full opacity-50 pointer-events-none"></div>
                
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h4 className="font-bold text-slate-700 flex items-center text-lg">
                            <Gavel className="w-5 h-5 mr-2 text-slate-500" />
                            กฎการเข้างาน & สถานะ (Attendance Rules)
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">กำหนดบทลงโทษ (HP) และรางวัล (XP) สำหรับแต่ละสถานะการเข้างาน</p>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                        Full Control Mode
                    </span>
                </div>
                
                <div className="grid grid-cols-1 gap-4 relative z-10">
                    {masterOptions
                        .filter(o => o.type === 'ATTENDANCE_TYPE' || o.type === 'LEAVE_TYPE' || o.type === 'ATTENDANCE_RULE_KEY')
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map((option, index) => {
                            const key = option.key;
                            const label = option.label;
                            const colorClass = option.color?.includes('bg-')
                                ? option.color
                                : option.color?.replace('text-', 'bg-') || 'bg-slate-500';
                            const rule = localConfig.ATTENDANCE_RULES?.[key] || { xp: 0, hp: 0, coins: 0 };
                            
                            return (
                                <motion.div
                                    key={`${option.type}-${key}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative pl-4"
                                >
                                    {/* Color Indicator Bar */}
                                    <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${colorClass}`}></div>
                                    
                                    <RuleEditor 
                                        label={label}
                                        ruleKey={key}
                                        rule={rule}
                                        onChange={handleRuleChange}
                                    />
                                </motion.div>
                            );
                        })}
                </div>
                <p className="text-[10px] text-slate-400 mt-6 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    * <b>Tip:</b> การตั้งค่า HP ติดลบจะถือเป็นบทลงโทษ (Penalty) ส่วน XP ที่เป็นบวกจะถือเป็นรางวัล (Reward) <br/>
                    สามารถใช้ร่วมกันได้ เช่น มาสาย (-5 HP) แต่ยังได้ (+10 XP) จากการทำงาน
                </p>
            </motion.div>
        </div>
    );
};

export default LawTuner;
