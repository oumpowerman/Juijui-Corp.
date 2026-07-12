import React, { useMemo, useState } from 'react';
import { 
    Clock, Info, BookOpen, Search, Scale, Heart, Sparkles
} from 'lucide-react';
import { HealthBarSimulator } from './components/SharedComponents';
import { motion } from 'framer-motion';

import { 
    PRETTY_LABELS, 
    FEATURE_GROUPS, 
    calculateSeverity,
    ATTENDANCE_RULE_LABELS
} from './utils/tunerHelpers';

import { AttendanceTab } from './components/AttendanceTab';
import { DutyTasksTab } from './components/DutyTasksTab';
import { LawTribunalTab } from './components/LawTribunalTab';
import { LevelingKpiTab } from './components/LevelingKpiTab';

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
    localConfig, handleChange, setLocalConfig, setIsDirty, masterOptions 
}) => {
    // Sub-navigation tab state
    const [subTab, setSubTab] = useState<'ATTENDANCE' | 'DUTY_TASKS' | 'LAW_TRIBUNAL' | 'LEVELING_KPI'>('ATTENDANCE');
    // Search Term state
    const [searchTerm, setSearchTerm] = useState('');

    // Categorize options from master data
    const categorizedOptions = useMemo(() => {
        const groups = {
            CORE_STATUS: [] as any[],     // ON_TIME, LATE, NO_SHOW
            ABSENT_GROUP: [] as any[],    // ABSENT, ABSENT_REFUND
            CHECKOUT_GROUP: [] as any[],  // FORGOT_CHECKOUT, CORRECTION_REFUND
            LEAVE: [] as any[],           // SICK, VACATION, PERSONAL, EMERGENCY, UNPAID
            SYSTEM_LOCKED: [] as any[]    // OFFICE, SITE, WFH, etc. (Read-Only / locked)
        };
        
        const seenKeys = new Set<string>();
        const masterKeys = new Set<string>();

        masterOptions
            .filter(o => o.type === 'ATTENDANCE_TYPE' || o.type === 'LEAVE_TYPE' || o.type === 'ATTENDANCE_RULE_KEY')
            .forEach(o => {
                if (seenKeys.has(o.key)) return;
                seenKeys.add(o.key);
                masterKeys.add(o.key);
                
                const optionWithLabel = {
                    ...o,
                    label: ATTENDANCE_RULE_LABELS[o.key] || o.label
                };
                
                if (['ON_TIME', 'LATE', 'NO_SHOW'].includes(o.key)) {
                    groups.CORE_STATUS.push(optionWithLabel);
                } else if (['ABSENT', 'ABSENT_REFUND'].includes(o.key)) {
                    groups.ABSENT_GROUP.push(optionWithLabel);
                } else if (['FORGOT_CHECKOUT', 'CORRECTION_REFUND'].includes(o.key)) {
                    groups.CHECKOUT_GROUP.push(optionWithLabel);
                } else if (['VACATION', 'SICK', 'PERSONAL', 'EMERGENCY', 'UNPAID'].includes(o.key)) {
                    groups.LEAVE.push(optionWithLabel);
                } else {
                    groups.SYSTEM_LOCKED.push(optionWithLabel);
                }
            });

        if (localConfig.ATTENDANCE_RULES) {
            Object.keys(localConfig.ATTENDANCE_RULES).forEach(key => {
                if (masterKeys.has(key)) return;

                groups.SYSTEM_LOCKED.push({
                    key,
                    label: ATTENDANCE_RULE_LABELS[key] || key,
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

    // Calculate Dynamic System Balance & Severity using helper
    const severityInfo = useMemo(() => {
        return calculateSeverity(localConfig);
    }, [localConfig]);

    // Check if item match search
    const match = (key: string, label: string) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            key.toLowerCase().includes(term) || 
            label.toLowerCase().includes(term) || 
            (PRETTY_LABELS[key] || '').toLowerCase().includes(term) ||
            (ATTENDANCE_RULE_LABELS[key] || '').toLowerCase().includes(term)
        );
    };


    // Calculate match count for each tab
    const searchCounts = useMemo(() => {
        if (!searchTerm) return { ATTENDANCE: 0, DUTY_TASKS: 0, LAW_TRIBUNAL: 0, LEVELING_KPI: 0 };
        
        const term = searchTerm.toLowerCase();
        const checkMatch = (key: string, label: string) => {
            return (
                key.toLowerCase().includes(term) || 
                label.toLowerCase().includes(term) || 
                (PRETTY_LABELS[key] || '').toLowerCase().includes(term) ||
                (ATTENDANCE_RULE_LABELS[key] || '').toLowerCase().includes(term)
            );
        };

        let attendanceCount = 0;
        let dutyTasksCount = 0;
        let lawTribunalCount = 0;
        let levelingKPICount = 0;

        // Attendance Rules Matches
        Object.values(categorizedOptions).forEach((list: any[]) => {
            list.forEach(item => {
                if (checkMatch(item.key, item.label)) attendanceCount++;
            });
        });

        const allConfigsList: { section: string, key: string, value: any }[] = [];
        const sections = [
            'GLOBAL_MULTIPLIERS', 'LEVELING_SYSTEM', 'DIFFICULTY_XP', 
            'PENALTY_RATES', 'AUTO_JUDGE_CONFIG', 'ITEM_MECHANICS', 'TRIBUNAL_CONFIG'
        ];
        
        sections.forEach(section => {
            if (localConfig[section]) {
                Object.keys(localConfig[section]).forEach(key => {
                    if (typeof localConfig[section][key] === 'number') {
                        allConfigsList.push({ section, key, value: localConfig[section][key] });
                    }
                });
            }
        });

        const usedKeys = new Set<string>();

        FEATURE_GROUPS.forEach(group => {
            const groupItems = allConfigsList.filter(item => group.keys.includes(item.key));
            groupItems.forEach(item => usedKeys.add(`${item.section}-${item.key}`));
            
            const matchCount = groupItems.filter(item => checkMatch(item.key, PRETTY_LABELS[item.key] || item.key)).length;

            if (group.id === 'ATTENDANCE') {
                attendanceCount += matchCount;
            } else if (group.id === 'DUTY' || group.id === 'TASK') {
                dutyTasksCount += matchCount;
            } else if (group.id === 'TRIBUNAL' || group.id === 'SYSTEM') {
                lawTribunalCount += matchCount;
            } else if (group.id === 'GROWTH') {
                levelingKPICount += matchCount;
            }
        });

        const uncategorizedItems = allConfigsList.filter(item => !usedKeys.has(`${item.section}-${item.key}`));
        lawTribunalCount += uncategorizedItems.filter(item => checkMatch(item.key, PRETTY_LABELS[item.key] || item.key)).length;

        if (localConfig.KPI_REWARDS) {
            Object.keys(localConfig.KPI_REWARDS).forEach(grade => {
                if (checkMatch(grade, `Grade เกรด ${grade}`)) levelingKPICount++;
            });
        }

        return {
            ATTENDANCE: attendanceCount,
            DUTY_TASKS: dutyTasksCount,
            LAW_TRIBUNAL: lawTribunalCount,
            LEVELING_KPI: levelingKPICount
        };
    }, [searchTerm, categorizedOptions, localConfig]);

    // Flatten configs from localConfig for feature groups
    const allConfigs = useMemo(() => {
        const list: { section: string, key: string, value: any }[] = [];
        const sections = [
            'GLOBAL_MULTIPLIERS', 'LEVELING_SYSTEM', 'DIFFICULTY_XP', 
            'PENALTY_RATES', 'AUTO_JUDGE_CONFIG', 'ITEM_MECHANICS', 'TRIBUNAL_CONFIG'
        ];
        
        sections.forEach(section => {
            if (localConfig[section]) {
                Object.keys(localConfig[section]).forEach(key => {
                    if (typeof localConfig[section][key] === 'number') {
                        list.push({ section, key, value: localConfig[section][key] });
                    }
                });
            }
        });
        return list;
    }, [localConfig]);

    // Sub-Tabs definition
    const SUB_TABS = [
        { id: 'ATTENDANCE', label: '⏰ เข้างาน & การลา', color: 'text-indigo-600', hover: 'hover:bg-indigo-50/50', activeBg: 'bg-indigo-50/80 border-indigo-100', dot: 'bg-indigo-500' },
        { id: 'DUTY_TASKS', label: '🧹 หน้าที่ & ภารกิจ', color: 'text-rose-600', hover: 'hover:bg-rose-50/50', activeBg: 'bg-rose-50/80 border-rose-100', dot: 'bg-rose-500' },
        { id: 'LAW_TRIBUNAL', label: '⚖️ กฎ & ศาลไต่สวน', color: 'text-amber-600', hover: 'hover:bg-amber-50/50', activeBg: 'bg-amber-50/80 border-amber-100', dot: 'bg-amber-500' },
        { id: 'LEVELING_KPI', label: '🏆 เลเวล & รางวัลเกรด', color: 'text-emerald-600', hover: 'hover:bg-emerald-50/50', activeBg: 'bg-emerald-50/80 border-emerald-100', dot: 'bg-emerald-500' },
    ] as const;

    // Filter rule options based on search
    const filteredCoreStatusRules = useMemo(() => categorizedOptions.CORE_STATUS.filter(opt => match(opt.key, opt.label)), [categorizedOptions.CORE_STATUS, searchTerm]);
    const filteredAbsentRules = useMemo(() => categorizedOptions.ABSENT_GROUP.filter(opt => match(opt.key, opt.label)), [categorizedOptions.ABSENT_GROUP, searchTerm]);
    const filteredCheckoutRules = useMemo(() => categorizedOptions.CHECKOUT_GROUP.filter(opt => match(opt.key, opt.label)), [categorizedOptions.CHECKOUT_GROUP, searchTerm]);
    const filteredLeaveRules = useMemo(() => categorizedOptions.LEAVE.filter(opt => match(opt.key, opt.label)), [categorizedOptions.LEAVE, searchTerm]);
    const filteredSystemLockedRules = useMemo(() => categorizedOptions.SYSTEM_LOCKED.filter(opt => match(opt.key, opt.label)), [categorizedOptions.SYSTEM_LOCKED, searchTerm]);

    // Filter config fields for feature groups based on search
    const getFilteredGroupItems = (groupId: string) => {
        const group = FEATURE_GROUPS.find(g => g.id === groupId);
        if (!group) return [];
        return allConfigs.filter(item => group.keys.includes(item.key) && match(item.key, PRETTY_LABELS[item.key] || item.key));
    };

    // Uncategorized Safety Net
    const uncategorizedConfigs = useMemo(() => {
        const usedKeys = new Set<string>();
        FEATURE_GROUPS.forEach(g => g.keys.forEach(k => usedKeys.add(k)));
        return allConfigs.filter(item => !usedKeys.has(item.key) && match(item.key, PRETTY_LABELS[item.key] || item.key));
    }, [allConfigs, searchTerm]);

    return (
        <div className="space-y-8 pb-10">
            
            {/* 1. UPGRADED SIMULATOR & SYSTEM BALANCE DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: HP Damage Simulator */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-5 bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between"
                >
                    <div className="mb-4">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" /> 
                            HP Damage Simulator
                        </span>
                        <h4 className="text-sm font-bold text-slate-700 mt-1">จำลองพลังชีวิตที่สูญเสียเมื่อทำผิดกฎ</h4>
                    </div>

                    <div className="my-auto py-2">
                        <HealthBarSimulator 
                            penalties={[
                                { label: 'มาสาย', value: localConfig.PENALTY_RATES?.HP_PENALTY_LATE || 5, color: 'bg-orange-500' },
                                { label: 'ลืมทำเวร', value: localConfig.PENALTY_RATES?.HP_PENALTY_MISSED_DUTY || 15, color: 'bg-red-500' },
                                { label: 'เพิกเฉยงาน', value: localConfig.AUTO_JUDGE_CONFIG?.negligence_penalty_hp || 20, color: 'bg-rose-600' }
                            ]}
                        />
                    </div>

                    <p className="text-[10px] text-slate-400 mt-4 text-center flex justify-center items-center gap-1 bg-slate-50 p-2 rounded-xl">
                        <Info className="w-3 h-3 text-slate-500" />
                        หากพนักงานสูญเสีย HP จนเหลือ 0 ตัวละครจะอยู่ในสถานะ "หมดสติ" และต้องรอชุบชีวิต
                    </p>
                </motion.div>

                {/* Middle: System Severity Gauge */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="lg:col-span-4 bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-indigo-500" /> 
                            System Severity Gauge
                        </span>
                        <h4 className="text-sm font-bold text-slate-700 mt-1">ระดับความสมดุลและความตึงเครียดกฎระบบ</h4>
                    </div>

                    {/* Gauge Circle Slider */}
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                            {/* Color Bar */}
                            <div 
                                className={`h-full bg-gradient-to-r ${severityInfo.severityValue < 35 ? 'from-blue-400 to-teal-400' : severityInfo.severityValue <= 65 ? 'from-green-400 to-emerald-400' : severityInfo.severityValue <= 85 ? 'from-orange-400 to-amber-400' : 'from-rose-500 to-red-500'} transition-all duration-300`}
                                style={{ width: `${severityInfo.severityValue}%` }}
                            />
                        </div>
                        
                        <div className="flex justify-between w-full text-[9px] text-slate-400 font-bold mt-1 px-0.5">
                            <span>ชิวเกินไป</span>
                            <span>สมดุล</span>
                            <span>เข้มงวด</span>
                            <span>โหดร้าย</span>
                        </div>

                        <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-black border tracking-wide text-center w-full ${severityInfo.color.split(' ')[1] || 'bg-slate-50'} ${severityInfo.color.split(' ')[0] || 'text-slate-700'} ${severityInfo.color.split(' ')[2] || ''}`}>
                            {severityInfo.status} (ดัชนีโทษ: {severityInfo.sumPenalties} HP)
                        </div>
                    </div>

                    <div className="text-[10px] font-medium leading-relaxed text-slate-500 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                        {severityInfo.warning}
                    </div>
                </motion.div>

                {/* Right Side: Admin Rules Quick Guide */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-3 bg-indigo-600 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                    
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> คู่มือการตัดสินแอดมิน
                        </h4>
                        <ul className="text-[10.5px] space-y-3 opacity-90 font-medium">
                            <li className="flex gap-2">
                                <span className="text-indigo-200">●</span>
                                <span><b>ตรรกะ WFH:</b> ขออนุญาตล่วงหน้า = ไม่หัก HP | ถ้าเช็คอิน WFH โดยไม่มีใบขอ = ระบบ AI จะหัก HP อัตโนมัติ</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-indigo-200">●</span>
                                <span><b>โทษมาสายสะสม:</b> หัก HP แบบทวีคูณตามวันที่สายต่อเนื่องกัน (Base x Multiplier) ปรับให้พอดี</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-indigo-200">●</span>
                                <span><b>การชดเชยศาล:</b> ใช้แต้ม HP คืนให้สมาชิกเมื่อสภาศาลพิจารณาเห็นชอบคำร้องที่คลาดเคลื่อน</span>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[10px] font-bold text-indigo-100">
                        <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
                        ปรับเปลี่ยนแบบ Real-time มีผลทันที
                    </div>
                </motion.div>
            </div>

            {/* 2. SEARCH & SUB-NAVIGATION BAR */}
            <div className="space-y-4">
                
                {/* Search Input Card */}
                <div className="bg-white/40 backdrop-blur-sm p-2 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="ค้นหาตัวปรับแต่งกฎเกณฑ์ เช่น HP, XP, Late, ลากิจ, เกรด, เลเวล..."
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200/80 bg-white focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold font-mono px-1 rounded-md"
                            >
                                ล้าง
                            </button>
                        )}
                    </div>
                    {searchTerm && (
                        <div className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black tracking-wider uppercase">
                            พบผลลัพธ์ทั้งหมด {Object.values(searchCounts).reduce((a, b) => a + b, 0)} รายการ
                        </div>
                    )}
                </div>

                {/* Elegant 4-Category Sub-Navigation Pills */}
                <div className="p-1.5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm overflow-x-auto">
                    <div className="flex gap-1.5 min-w-max">
                        {SUB_TABS.map(tab => {
                            const isActive = subTab === tab.id;
                            const count = searchCounts[tab.id];
                            
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSubTab(tab.id as any)}
                                    className={`
                                        relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all z-10 cursor-pointer select-none border border-transparent
                                        ${isActive ? `${tab.color} ${tab.activeBg}` : `text-slate-500 hover:text-slate-700 ${tab.hover}`}
                                    `}
                                >
                                    {isActive && (
                                        <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
                                    )}
                                    <span>{tab.label}</span>
                                    {searchTerm && count > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-white text-slate-700 text-[8.5px] border font-black shadow-sm">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* 3. SUB-TAB VIEWPORT (DYNAMIC CONTENT) */}
            <div className="space-y-6">
                
                {/* SUBTAB 1: ATTENDANCE & LEAVE */}
                {subTab === 'ATTENDANCE' && (
                    <AttendanceTab 
                        localConfig={localConfig}
                        handleChange={handleChange}
                        handleRuleChange={handleRuleChange}
                        searchTerm={searchTerm}
                        filteredCoreStatusRules={filteredCoreStatusRules}
                        filteredAbsentRules={filteredAbsentRules}
                        filteredCheckoutRules={filteredCheckoutRules}
                        filteredLeaveRules={filteredLeaveRules}
                        filteredSystemLockedRules={filteredSystemLockedRules}
                        getFilteredGroupItems={getFilteredGroupItems}
                    />
                )}

                {/* SUBTAB 2: DUTY & TASKS */}
                {subTab === 'DUTY_TASKS' && (
                    <DutyTasksTab 
                        handleChange={handleChange}
                        getFilteredGroupItems={getFilteredGroupItems}
                        searchTerm={searchTerm}
                    />
                )}

                {/* SUBTAB 3: LAW & TRIBUNAL */}
                {subTab === 'LAW_TRIBUNAL' && (
                    <LawTribunalTab 
                        handleChange={handleChange}
                        getFilteredGroupItems={getFilteredGroupItems}
                        uncategorizedConfigs={uncategorizedConfigs}
                        searchTerm={searchTerm}
                    />
                )}

                {/* SUBTAB 4: LEVELING & KPI REWARDS */}
                {subTab === 'LEVELING_KPI' && (
                    <LevelingKpiTab 
                        localConfig={localConfig}
                        handleChange={handleChange}
                        getFilteredGroupItems={getFilteredGroupItems}
                        match={match}
                        searchTerm={searchTerm}
                    />
                )}

            </div>

        </div>
    );
};

export default LawTuner;
