import React, { useMemo } from 'react';
import { 
    Clock, AlertTriangle, ShieldAlert, Gavel, Info, Zap, RefreshCw, 
    UserCheck, Target, Calendar, History, ShieldCheck, ClipboardCheck,
    HelpCircle, BookOpen, ShieldQuestion
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

const LawTuner: React.FC<LawTunerProps> = ({ 
    localConfig, handleChange, setLocalConfig, setIsDirty, getAttendanceLabel, getAttendanceColor, masterOptions 
}) => {

    const categorizedOptions = useMemo(() => {
        const groups = {
            WORK: [] as any[],
            LEAVE: [] as any[],
            CORRECTION: [] as any[]
        };
        
        const seenKeys = new Set<string>();
        masterOptions
            .filter(o => o.type === 'ATTENDANCE_TYPE' || o.type === 'LEAVE_TYPE' || o.type === 'ATTENDANCE_RULE_KEY')
            .forEach(o => {
                if (seenKeys.has(o.key)) return;
                seenKeys.add(o.key);
                
                // Hide specific keys that are already managed by dedicated sliders on the right
                if (['CORRECTION_REFUND', 'ABSENT_REFUND'].includes(o.key)) return;
                
                if (['OFFICE', 'WFH', 'SITE'].includes(o.key)) {
                    groups.WORK.push(o);
                } else if (['VACATION', 'SICK', 'PERSONAL', 'EMERGENCY', 'UNPAID'].includes(o.key)) {
                    groups.LEAVE.push(o);
                } else {
                    groups.CORRECTION.push(o);
                }
            });
            
        Object.values(groups).forEach(g => g.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
        return groups;
    }, [masterOptions]);

    const handleRuleChange = (key: string, field: 'xp' | 'hp' | 'coins', val: number) => {
        const rules = { ...localConfig.ATTENDANCE_RULES };
        if (!rules[key]) rules[key] = { xp: 0, hp: 0, coins: 0 };
        rules[key] = { ...rules[key], [field]: val };
        
        setLocalConfig((prev: any) => ({ ...prev, ATTENDANCE_RULES: rules }));
        setIsDirty(true);
    };

    return (
        <div className="space-y-10 pb-10">
            
            {/* 1. Simulator Section (Summary) */}
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
                        จำลองความเสียหายต่อ HP เมื่อพนักงานทำผิดกฎ (HP หมด = Game Over / ถูกพักงาน)
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

            {/* 2. ATTENDANCE & LEAVE SECTION */}
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
                        <h3 className="text-lg font-bold text-slate-800">Attendance & Leave</h3>
                        <p className="text-xs text-slate-500">กฎการเข้างาน การลา และนโยบายการคืนคะแนน</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attendance Rules List */}
                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Gavel className="w-4 h-4" /> ตารางสถานะ (Attendance Rules)
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
                                        {categorizedOptions.WORK.map(option => {
                                            const key = option.key;
                                            const rule = localConfig.ATTENDANCE_RULES?.[key] || { xp: 0, hp: 0, coins: 0 };
                                            const colorClass = option.color?.includes('bg-') ? option.color : option.color?.replace('text-', 'bg-') || 'bg-slate-500';
                                            
                                            return (
                                                <div key={key} className="relative pl-4 group">
                                                    <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${colorClass}`}></div>
                                                    <RuleEditor label={option.label} ruleKey={key} rule={rule} onChange={handleRuleChange} />
                                                    {key === 'WFH' && (
                                                        <div className="mt-1 ml-2 text-[9px] text-slate-400 flex items-center gap-1 italic">
                                                            <HelpCircle className="w-2.5 h-2.5" />
                                                            รางวัลพื้นฐานสำหรับผู้ที่ได้รับอนุมัติ WFH (แนะนำให้ตั้งเป็น 0 หากต้องการแค่ไม่หัก HP)
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
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
                                        {categorizedOptions.LEAVE.map(option => {
                                            const key = option.key;
                                            const rule = localConfig.ATTENDANCE_RULES?.[key] || { xp: 0, hp: 0, coins: 0 };
                                            const colorClass = option.color?.includes('bg-') ? option.color : option.color?.replace('text-', 'bg-') || 'bg-slate-500';
                                            
                                            return (
                                                <div key={key} className="relative pl-4 group">
                                                    <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${colorClass}`}></div>
                                                    <RuleEditor label={option.label} ruleKey={key} rule={rule} onChange={handleRuleChange} />
                                                </div>
                                            );
                                        })}
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
                                        {categorizedOptions.CORRECTION.map(option => {
                                            const key = option.key;
                                            const rule = localConfig.ATTENDANCE_RULES?.[key] || { xp: 0, hp: 0, coins: 0 };
                                            const colorClass = option.color?.includes('bg-') ? option.color : option.color?.replace('text-', 'bg-') || 'bg-slate-500';
                                            
                                            return (
                                                <div key={key} className="relative pl-4 group">
                                                    <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${colorClass}`}></div>
                                                    <RuleEditor label={option.label} ruleKey={key} rule={rule} onChange={handleRuleChange} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Early Leave & Refunds */}
                    <div className="space-y-6">
                        <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-5">
                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Early Leave (กลับก่อนเวลา)
                            </h4>
                            <ConfigSlider 
                                label="Penalty Rate" 
                                value={localConfig.PENALTY_RATES?.HP_PENALTY_EARLY_LEAVE_RATE || 1} 
                                min={1} max={10} step={1} unit="HP"
                                icon={AlertTriangle} color="blue"
                                onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_EARLY_LEAVE_RATE', v)}
                            />
                            <ConfigSlider 
                                label="Interval (Minutes)" 
                                value={localConfig.PENALTY_RATES?.HP_PENALTY_EARLY_LEAVE_INTERVAL || 10} 
                                min={1} max={60} step={5} unit="Min"
                                icon={History} color="slate"
                                onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_EARLY_LEAVE_INTERVAL', v)}
                            />
                            <ConfigSlider 
                                label="Unauthorized WFH" 
                                value={localConfig.PENALTY_RATES?.HP_PENALTY_UNAUTHORIZED_WFH || 5} 
                                min={0} max={50} step={1} unit="HP"
                                icon={ShieldAlert} color="rose"
                                onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_UNAUTHORIZED_WFH', v)}
                            />
                            <p className="text-[10px] text-blue-600/60 italic">
                                * หัก HP ทันทีหากพนักงานเช็คอิน WFH โดยไม่มีใบขออนุญาตที่ได้รับการอนุมัติ
                            </p>
                        </div>

                        <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 space-y-5">
                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Refund Policies (การคืนแต้ม)
                            </h4>
                            <ConfigSlider 
                                label="Correction Refund" 
                                value={localConfig.ATTENDANCE_RULES?.CORRECTION_REFUND?.hp || 5} 
                                min={0} max={50} step={1} unit="HP"
                                icon={ShieldCheck} color="emerald"
                                onChange={(v: number) => handleRuleChange('CORRECTION_REFUND', 'hp', v)}
                            />
                            <ConfigSlider 
                                label="Absent Refund" 
                                value={localConfig.ATTENDANCE_RULES?.ABSENT_REFUND?.hp || 15} 
                                min={0} max={50} step={1} unit="HP"
                                icon={RefreshCw} color="teal"
                                onChange={(v: number) => handleRuleChange('ABSENT_REFUND', 'hp', v)}
                            />
                        </div>

                        {/* TRIBUNAL SECTION */}
                        <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100 space-y-5">
                            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <Gavel className="w-4 h-4" /> Tribunal & Whistleblowing
                            </h4>
                            <ConfigSlider 
                                label="Reward for Reporter" 
                                value={localConfig.TRIBUNAL_CONFIG?.reward_hp || 10} 
                                min={0} max={50} step={1} unit="HP"
                                icon={Zap} color="amber"
                                onChange={(v: number) => handleChange('TRIBUNAL_CONFIG', 'reward_hp', v)}
                            />
                            <ConfigSlider 
                                label="Penalty for Target" 
                                value={localConfig.TRIBUNAL_CONFIG?.penalty_hp || 20} 
                                min={0} max={100} step={5} unit="HP"
                                icon={ShieldAlert} color="rose"
                                onChange={(v: number) => handleChange('TRIBUNAL_CONFIG', 'penalty_hp', v)}
                            />
                            <ConfigSlider 
                                label="False Report Penalty" 
                                value={localConfig.TRIBUNAL_CONFIG?.false_report_penalty_hp || 30} 
                                min={0} max={100} step={5} unit="HP"
                                icon={AlertTriangle} color="red"
                                onChange={(v: number) => handleChange('TRIBUNAL_CONFIG', 'false_report_penalty_hp', v)}
                            />
                            <p className="text-[10px] text-amber-600/60 italic">
                                * ระบบฟ้องร้องพฤติกรรมไม่เหมาะสม (Whistleblowing)
                            </p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* 3. DUTY & RESPONSIBILITY SECTION */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                        <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Duty & Responsibility</h3>
                        <p className="text-xs text-slate-500">การจัดการเวรทำความสะอาดและหน้าที่รับผิดชอบ</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-orange-50/30 rounded-3xl border border-orange-100 space-y-5">
                        <h4 className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Duty Penalties
                        </h4>
                        <ConfigSlider 
                            label="Missed Duty" 
                            value={localConfig.PENALTY_RATES?.HP_PENALTY_MISSED_DUTY || 10} 
                            min={5} max={50} step={5} unit="HP"
                            icon={AlertTriangle} color="orange"
                            onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_MISSED_DUTY', v)}
                        />
                        <ConfigSlider 
                            label="Late Submit Penalty" 
                            value={localConfig.PENALTY_RATES?.HP_PENALTY_DUTY_LATE_SUBMIT || 3} 
                            min={1} max={20} step={1} unit="HP"
                            icon={Clock} color="amber"
                            onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_DUTY_LATE_SUBMIT', v)}
                        />
                        <ConfigSlider 
                            label="Duty Grace Hour" 
                            value={localConfig.AUTO_JUDGE_CONFIG?.duty_grace_hour || 10} 
                            min={0} max={23} step={1} unit=":00"
                            icon={History} color="slate"
                            onChange={(v: number) => handleChange('AUTO_JUDGE_CONFIG', 'duty_grace_hour', v)}
                        />
                        <p className="text-[10px] text-orange-600/60 italic">
                            * เวลาสุดท้ายที่อนุญาตให้ส่งงานเวร (เช่น 10:00 น.) หากเกินจะถือว่า Missed Duty
                        </p>
                    </div>

                    <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 space-y-5">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Duty Rewards
                        </h4>
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
                </div>
            </motion.section>

            {/* 4. TASK & PERFORMANCE SECTION */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Task & Performance</h3>
                        <p className="text-xs text-slate-500">การส่งงานและระบบ AI ตัดสินความเพิกเฉย</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-rose-50/30 rounded-3xl border border-rose-100 space-y-5">
                        <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Task Deadlines
                        </h4>
                        <ConfigSlider 
                            label="Base Late Penalty" 
                            value={localConfig.PENALTY_RATES?.HP_PENALTY_LATE || 5} 
                            min={1} max={20} step={1} unit="HP"
                            icon={AlertTriangle} color="rose"
                            onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_LATE', v)}
                        />
                        <ConfigSlider 
                            label="Daily Multiplier" 
                            value={localConfig.PENALTY_RATES?.HP_PENALTY_LATE_MULTIPLIER || 2} 
                            min={1} max={10} step={1} unit="HP/Day"
                            icon={Zap} color="orange"
                            onChange={(v: number) => handleChange('PENALTY_RATES', 'HP_PENALTY_LATE_MULTIPLIER', v)}
                        />
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-5">
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> AI Auto-Judge (Negligence)
                        </h4>
                        <ConfigSlider 
                            label="Negligence Penalty" 
                            value={localConfig.AUTO_JUDGE_CONFIG?.negligence_penalty_hp || 20} 
                            min={10} max={100} step={5} unit="HP"
                            icon={ShieldAlert} color="slate"
                            onChange={(v: number) => handleChange('AUTO_JUDGE_CONFIG', 'negligence_penalty_hp', v)}
                        />
                        <ConfigSlider 
                            label="Lookback Days" 
                            value={localConfig.AUTO_JUDGE_CONFIG?.lookback_days_check || 60} 
                            min={7} max={365} step={7} unit="Days"
                            icon={Calendar} color="slate"
                            onChange={(v: number) => handleChange('AUTO_JUDGE_CONFIG', 'lookback_days_check', v)}
                        />
                        <p className="text-[10px] text-slate-500 italic">
                            * AI จะตรวจสอบงานและหน้าที่ย้อนหลังตามจำนวนวันที่กำหนด
                        </p>
                    </div>
                </div>
            </motion.section>
        </div>
    );
};

export default LawTuner;
