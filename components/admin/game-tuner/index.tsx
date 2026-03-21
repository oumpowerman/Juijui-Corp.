import React, { useState, useEffect, useCallback } from 'react';
import { useGameConfig } from '../../../context/GameConfigContext';
import { useMasterData } from '../../../hooks/useMasterData';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { 
    Save, RefreshCw, Trophy, Gavel, ShoppingBag, 
    Zap, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

import EconomyTuner from './EconomyTuner';
import QuestsTuner from './QuestsTuner';
import LawTuner from './LawTuner';
import ShopTuner from './ShopTuner';

const GameConfigTuner = () => {
    const { config, updateConfigValue, refreshConfig, isLoading } = useGameConfig();
    const { masterOptions } = useMasterData();
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const [activeTab, setActiveTab] = useState<'ECONOMY' | 'QUESTS' | 'LAW' | 'SHOP'>('ECONOMY');
    const [localConfig, setLocalConfig] = useState<any>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sync with global config on load - but NOT while saving
    useEffect(() => {
        if (config && !isSaving) {
            setLocalConfig(JSON.parse(JSON.stringify(config)));
            setIsDirty(false);
        }
    }, [config, isSaving]);

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

    // Helper to get label from Master Data
    const getAttendanceLabel = (key: string) => {
        const option = masterOptions.find(o => o.key === key && (o.type === 'ATTENDANCE_TYPE' || o.type === 'LEAVE_TYPE' || o.type === 'ATTENDANCE_RULE_KEY'));
        return option ? option.label : key;
    };

    // Helper to get color from Master Data
    const getAttendanceColor = (key: string) => {
        const option = masterOptions.find(o => o.key === key && (o.type === 'ATTENDANCE_TYPE' || o.type === 'LEAVE_TYPE' || o.type === 'ATTENDANCE_RULE_KEY'));
        return option ? option.color || 'bg-slate-500' : 'bg-slate-500';
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const promises = [];
            
            // Only update sections that exist in localConfig
            const sections = [
                'GLOBAL_MULTIPLIERS', 'LEVELING_SYSTEM', 'DIFFICULTY_XP', 
                'PENALTY_RATES', 'AUTO_JUDGE_CONFIG', 'ITEM_MECHANICS', 
                'ATTENDANCE_RULES', 'KPI_REWARDS'
            ];

            for (const section of sections) {
                if (localConfig[section]) {
                    promises.push(updateConfigValue(section, localConfig[section]));
                }
            }

            const results = await Promise.all(promises);
            const allSuccess = results.every(r => r === true);

            if (allSuccess) {
                showToast('บันทึกการตั้งค่าทั้งหมดเรียบร้อย 🎮', 'success');
                setIsDirty(false);
            } else {
                showToast('การบันทึกบางส่วนล้มเหลว กรุณาลองใหม่', 'warning');
            }
        } catch (error) {
            console.error("Save error:", error);
            showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = async () => {
        if (await showConfirm('คืนค่ากลับเป็นค่าล่าสุดที่บันทึกไว้?')) {
            setLocalConfig(JSON.parse(JSON.stringify(config)));
            setIsDirty(false);
        }
    };

    if (!localConfig) return <div className="p-10 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></div>;

    // --- Main Layout ---
    const TABS = [
        { id: 'ECONOMY', label: 'สมดุลเลเวล & ค่าแรง', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'QUESTS', label: 'ภารกิจ & รางวัล', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'LAW', label: 'กฎระเบียบ & บทลงโทษ', icon: Gavel, color: 'text-rose-600', bg: 'bg-rose-50' },
        { id: 'SHOP', label: 'ร้านค้า & ไอเทม', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-6">
            
            {/* Header Actions - Glassy Effect */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-xl relative overflow-hidden"
            >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <Trophy className="w-6 h-6" />
                        </div>
                        Game Config Tuner
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 ml-1">ปรับสมดุลเกมแบบ Real-time Control (Full Control Mode)</p>
                </div>
                
                <div className="flex gap-3 relative z-10">
                    {isDirty && (
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleReset}
                            className="px-4 py-2.5 text-slate-500 hover:bg-slate-100/80 rounded-xl text-xs font-bold transition-colors backdrop-blur-sm"
                        >
                            Reset Changes
                        </motion.button>
                    )}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave} 
                        disabled={!isDirty || isSaving}
                        className={`
                            px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all
                            ${isDirty 
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-500/30' 
                                : 'bg-slate-300 cursor-not-allowed'}
                        `}
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        {isDirty ? 'Save Config' : 'Saved'}
                    </motion.button>
                </div>
            </motion.div>

            {/* Tab Navigation - Sliding Pill */}
            <div className="p-1.5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    relative flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all z-10
                                    ${isActive ? tab.color : 'text-slate-500 hover:text-slate-700'}
                                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="gameTunerActiveTab"
                                        className={`absolute inset-0 ${tab.bg} rounded-xl -z-10`}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''} transition-transform`} /> 
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content - Animated Transition */}
            <div className="min-h-[400px] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="bg-white/40 backdrop-blur-sm rounded-3xl p-1"
                    >
                        {activeTab === 'ECONOMY' && <EconomyTuner localConfig={localConfig} handleChange={handleChange} />}
                        {activeTab === 'QUESTS' && <QuestsTuner localConfig={localConfig} handleChange={handleChange} setLocalConfig={setLocalConfig} setIsDirty={setIsDirty} />}
                        {activeTab === 'LAW' && <LawTuner localConfig={localConfig} handleChange={handleChange} setLocalConfig={setLocalConfig} setIsDirty={setIsDirty} getAttendanceLabel={getAttendanceLabel} getAttendanceColor={getAttendanceColor} masterOptions={masterOptions} />}
                        {activeTab === 'SHOP' && <ShopTuner localConfig={localConfig} handleChange={handleChange} />}
                    </motion.div>
                </AnimatePresence>
            </div>

        </div>
    );
};

export default GameConfigTuner;
