import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // 1. นำเข้า ReactDOM สำหรับทำ Portal
import { Check, Settings, ToggleLeft, ToggleRight, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MASTER_META } from './MasterTabNavigation';

interface MasterDataTabConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeTabsConfig: string[] | null;
    onSave: (selected: string[]) => Promise<void>;
}

const GROUPS = [
    {
        id: 'workflow',
        title: 'Production & Workflow',
        keys: ['STATUS', 'TASK_STATUS', 'PROJECT_TYPE', 'TAG_PRESET', 'EVENT_TYPE', 'YEARLY', 'CALENDAR']
    },
    {
        id: 'content',
        title: 'Content Metadata',
        keys: ['FORMAT', 'PILLAR', 'CATEGORY', 'SCRIPT_CATEGORY', 'SHOOT_LOCATION', 'MEETING_CATEGORY']
    },
    {
        id: 'resources',
        title: 'Resources & HR',
        keys: ['INVENTORY', 'ITEM_CONDITION', 'POSITION', 'ATTENDANCE_RULES', 'REJECTION_REASON']
    },
    {
        id: 'system',
        title: 'System Config',
        keys: ['GAME_TUNING', 'PAYROLL_RULES', 'TRIBUNAL_SETTINGS', 'REWARDS', 'GREETINGS', 'DASHBOARD', 'MAINTENANCE', 'WIKI_CATEGORY', 'STORAGE_HUB', 'SYSTEM_POLICY']
    }
];

const ALL_KEYS = GROUPS.flatMap(g => g.keys);

const MasterDataTabConfigModal: React.FC<MasterDataTabConfigModalProps> = ({
    isOpen,
    onClose,
    activeTabsConfig,
    onSave
}) => {
    const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Sync selected tabs when modal opens or configuration changes
    useEffect(() => {
        if (isOpen) {
            setSelectedTabs(activeTabsConfig || ALL_KEYS);
        }
    }, [isOpen, activeTabsConfig]);

    const handleToggle = (key: string) => {
        setSelectedTabs(prev => {
            if (prev.includes(key)) {
                // Keep at least one tab selected to avoid empty workspace
                if (prev.length <= 1) return prev;
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const handleSelectAll = () => {
        setSelectedTabs(ALL_KEYS);
    };

    const handleResetDefault = () => {
        setSelectedTabs(ALL_KEYS);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(selectedTabs);
            onClose();
        } catch (error) {
            console.error('Failed to save tab configuration:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.95, y: 15, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 15, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white border border-gray-100 rounded-3xl p-6 w-full max-w-5xl shadow-2xl text-gray-800 max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Settings className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-gray-800">
                                        ตั้งค่าแถบตัวเลือกข้อมูลระบบ ⚙️ (Configure System Tabs)
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        เปิดหรือปิดการแสดงผลแท็บในหน้า Master Data บันทึกลงฐานข้อมูลเพื่อให้ทีมเห็นตรงกัน
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Top Alert Bar */}
                        <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl mb-4 flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                การซ่อนแท็บจะไม่ทำให้ข้อมูลสูญหาย เป็นเพียงการปิดการแสดงผลแถบควบคุมด้านซ้ายสำหรับพนักงานทุกคน เพื่อจัดระเบียบหน้าทำงานให้คล่องตัวยิ่งขึ้น
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 mb-4">
                            <button
                                onClick={handleSelectAll}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                            >
                                เลือกทั้งหมด
                            </button>
                            <button
                                onClick={handleResetDefault}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                            >
                                รีเซ็ตค่าเริ่มต้น
                            </button>
                        </div>

                        {/* Bento-style Groups */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {GROUPS.map((group) => (
                                    <div key={group.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                                {group.title}
                                            </h4>
                                            <span className="text-[10px] bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                                {group.keys.filter(k => selectedTabs.includes(k)).length} / {group.keys.length} เปิดใช้งาน
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {group.keys.map((key) => {
                                                const meta = MASTER_META[key];
                                                if (!meta) return null;
                                                const Icon = meta.icon;
                                                const isSelected = selectedTabs.includes(key);
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleToggle(key)}
                                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group
                                                            ${isSelected 
                                                                ? 'bg-white border-indigo-200 hover:border-indigo-300 shadow-sm' 
                                                                : 'bg-white/50 border-gray-100/80 text-gray-400 opacity-60 hover:opacity-100 hover:border-gray-200'}`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className={`text-xs font-bold block ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>
                                                                    {meta.label}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 block truncate mt-0.5">
                                                                    {meta.desc}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 ml-3">
                                                            {isSelected ? (
                                                                <ToggleRight className="w-6 h-6 text-indigo-600" />
                                                            ) : (
                                                                <ToggleLeft className="w-6 h-6 text-gray-300" />
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 pt-4 mt-4 flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
                                disabled={isSaving}
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body // ส่งออกไปเรนเดอร์ที่ body โดยตรง
    );
};

export default MasterDataTabConfigModal;
