
import React, { useState, useEffect } from 'react';
import { Gavel, ShieldAlert, Zap, Save, RefreshCw, AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';
import { useGameConfig } from '../../../../context/GameConfigContext';
import { useToast } from '../../../../context/ToastContext';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { motion } from 'framer-motion';
import { ConfigSlider } from '../../game-tuner/components/SharedComponents';

const TribunalSettingsView: React.FC = () => {
    const { config, updateConfigValue, isLoading } = useGameConfig();
    const { showToast } = useToast();
    const { showConfirm, showPrompt } = useGlobalDialog();

    const [localConfig, setLocalConfig] = useState<any>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (config?.TRIBUNAL_CONFIG) {
            setLocalConfig(JSON.parse(JSON.stringify(config.TRIBUNAL_CONFIG)));
        }
    }, [config]);

    const handleChange = (key: string, value: any) => {
        setLocalConfig((prev: any) => ({
            ...prev,
            [key]: value
        }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!localConfig) return;
        setIsSaving(true);
        try {
            const success = await updateConfigValue('TRIBUNAL_CONFIG', localConfig);
            if (success) {
                showToast('บันทึกการตั้งค่า Tribunal เรียบร้อย ⚖️', 'success');
                setIsDirty(false);
            } else {
                showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = async () => {
        if (await showConfirm('คืนค่ากลับเป็นค่าล่าสุดที่บันทึกไว้?')) {
            setLocalConfig(JSON.parse(JSON.stringify(config.TRIBUNAL_CONFIG)));
            setIsDirty(false);
        }
    };

    const handleAddCategory = async () => {
        const newCatLabel = await showPrompt('ระบุชื่อหมวดหมู่ที่ต้องการเพิ่ม:', '', 'เพิ่มหมวดหมู่ใหม่');
        if (newCatLabel) {
            const id = newCatLabel.toLowerCase().replace(/\s+/g, '_');
            if (!localConfig.categories.find((c: any) => (typeof c === 'string' ? c : c.label) === newCatLabel)) {
                const newCatObj = { id, label: newCatLabel, severity: 'LOW' };
                handleChange('categories', [...localConfig.categories, newCatObj]);
            }
        }
    };

    const handleRemoveCategory = (cat: any) => {
        if (localConfig.categories.length <= 1) {
            showToast('ต้องมีอย่างน้อย 1 หมวดหมู่', 'warning');
            return;
        }
        const catId = typeof cat === 'string' ? cat : cat.id;
        handleChange('categories', localConfig.categories.filter((c: any) => (typeof c === 'string' ? c : c.id) !== catId));
    };

    if (isLoading || !localConfig) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                <p className="text-gray-500 font-medium">กำลังโหลดการตั้งค่า...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Actions */}
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <Gavel className="w-6 h-6 text-indigo-600" />
                        Tribunal System Configuration
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">ตั้งค่ารางวัล, บทลงโทษ และหมวดหมู่สำหรับการฟ้องร้อง</p>
                </div>
                <div className="flex gap-2">
                    {isDirty && (
                        <button 
                            onClick={handleReset}
                            className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors"
                        >
                            ยกเลิก
                        </button>
                    )}
                    <button 
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                        className={`px-6 py-2 rounded-xl text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all ${isDirty ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        บันทึกการตั้งค่า
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rewards & Penalties */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" /> รางวัลและบทลงโทษ (Rewards & Penalties)
                        </h3>
                        
                        <div className="space-y-8">
                            <ConfigSlider 
                                label="รางวัลสำหรับผู้แจ้ง (Reward HP)" 
                                value={localConfig.reward_hp} 
                                min={0} max={50} step={1} unit="HP"
                                icon={Zap} color="amber"
                                onChange={(v: number) => handleChange('reward_hp', v)}
                            />
                            <ConfigSlider 
                                label="รางวัลสำหรับผู้แจ้ง (Reward JP)" 
                                value={localConfig.reward_points} 
                                min={0} max={500} step={10} unit="JP"
                                icon={Zap} color="indigo"
                                onChange={(v: number) => handleChange('reward_points', v)}
                            />
                            <div className="h-px bg-gray-100 my-4"></div>
                            <ConfigSlider 
                                label="บทลงโทษผู้ถูกแจ้ง (Penalty HP)" 
                                value={localConfig.penalty_hp} 
                                min={0} max={100} step={5} unit="HP"
                                icon={ShieldAlert} color="rose"
                                onChange={(v: number) => handleChange('penalty_hp', v)}
                            />
                        </div>
                    </div>

                    <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 space-y-4">
                        <h3 className="text-sm font-bold text-rose-700 uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> False Report Penalty
                        </h3>
                        <p className="text-xs text-rose-600 leading-relaxed">
                            บทลงโทษสำหรับผู้ที่แจ้งความเท็จ (Admin ตัดสินว่าจงใจแกล้งหรือข้อมูลไม่เป็นความจริง)
                        </p>
                        <ConfigSlider 
                            label="หัก HP ผู้แจ้งเท็จ" 
                            value={localConfig.false_report_penalty_hp} 
                            min={0} max={100} step={5} unit="HP"
                            icon={ShieldAlert} color="rose"
                            onChange={(v: number) => handleChange('false_report_penalty_hp', v)}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-500" /> หมวดหมู่การแจ้ง (Categories)
                        </h3>
                        <button 
                            onClick={handleAddCategory}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-2">
                        {localConfig.categories.map((cat: any, idx: number) => {
                            const isObject = typeof cat === 'object' && cat !== null;
                            const label = isObject ? cat.label : cat;
                            const id = isObject ? cat.id : `cat_${idx}`;
                            const severity = isObject ? cat.severity : 'LOW';

                            return (
                                <div key={id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-700">{label}</span>
                                        {isObject && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                                                severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                                severity === 'MEDIUM' ? 'bg-blue-100 text-blue-600' :
                                                'bg-gray-200 text-gray-600'
                                            }`}>
                                                {severity}
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveCategory(cat)}
                                        className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] text-blue-600 flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            หมวดหมู่เหล่านี้จะแสดงให้พนักงานเลือกตอนส่งรายงานฟ้องร้อง
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TribunalSettingsView;
