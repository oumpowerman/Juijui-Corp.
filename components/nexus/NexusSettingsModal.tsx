
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Shield, Zap, Database, Palette, Sparkles, Trash2, Check } from 'lucide-react';
import { BackgroundTheme } from '../common/AppBackground';

interface NexusSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    aiEnabled: boolean;
    onAiToggle: (enabled: boolean) => void;
    currentTheme: BackgroundTheme;
    onThemeChange: (theme: BackgroundTheme) => void;
    onClearCache: () => void;
}

const NexusSettingsModal: React.FC<NexusSettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    aiEnabled, 
    onAiToggle, 
    currentTheme, 
    onThemeChange,
    onClearCache
}) => {
    const themes: { id: BackgroundTheme; label: string; color: string }[] = [
        { id: 'pastel-indigo', label: 'Indigo', color: 'bg-indigo-400' },
        { id: 'pastel-purple', label: 'Purple', color: 'bg-purple-400' },
        { id: 'pastel-pink', label: 'Pink', color: 'bg-pink-400' },
        { id: 'pastel-rose', label: 'Rose', color: 'bg-rose-400' },
        { id: 'pastel-teal', label: 'Teal', color: 'bg-teal-400' },
        { id: 'pastel-cyan', label: 'Cyan', color: 'bg-cyan-400' },
        { id: 'pastel-sky', label: 'Sky', color: 'bg-sky-400' },
        { id: 'pastel-emerald', label: 'Emerald', color: 'bg-emerald-400' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white/95 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-8 py-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">ตั้งค่า</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Nexus Configuration</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-300" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto no-scrollbar">
                            {/* AI Settings */}
                            <div className="space-y-4">
                                <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> ปัญญาประดิษฐ์ (AI)
                                </h4>
                                <div 
                                    onClick={() => onAiToggle(!aiEnabled)}
                                    className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform`}>
                                            <Zap className={`w-4 h-4 ${aiEnabled ? 'text-amber-500' : 'text-slate-300'}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">ดึงข้อมูลอัตโนมัติ</span>
                                            <span className="text-[10px] text-slate-400 font-medium">ใช้ AI ช่วยดึงชื่อและคำอธิบายจากลิงก์</span>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full transition-colors relative ${aiEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <motion.div 
                                            animate={{ x: aiEnabled ? 26 : 4 }}
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Theme Settings */}
                            <div className="space-y-4">
                                <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <Palette className="w-3 h-3" /> ธีมการแสดงผล
                                </h4>
                                <div className="grid grid-cols-4 gap-3">
                                    {themes.map((theme) => (
                                        <button
                                            key={theme.id}
                                            onClick={() => onThemeChange(theme.id)}
                                            className={`aspect-square rounded-2xl border-2 transition-all flex items-center justify-center relative group ${
                                                currentTheme === theme.id ? 'border-indigo-600 scale-105 shadow-lg' : 'border-transparent hover:border-slate-200'
                                            }`}
                                        >
                                            <div className={`w-full h-full rounded-2xl ${theme.color} opacity-20`} />
                                            <div className={`absolute w-4 h-4 rounded-full ${theme.color} shadow-sm group-hover:scale-125 transition-transform`} />
                                            {currentTheme === theme.id && (
                                                <div className="absolute -top-1 -right-1 bg-indigo-600 rounded-full p-0.5 shadow-sm">
                                                    <Check className="w-2 h-2 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Data Management */}
                            <div className="space-y-4">
                                <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <Database className="w-3 h-3" /> การจัดการข้อมูล
                                </h4>
                                <button 
                                    onClick={onClearCache}
                                    className="w-full flex items-center justify-between p-5 bg-rose-50/50 rounded-2xl border border-rose-100/50 hover:bg-rose-50 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                            <Trash2 className="w-4 h-4 text-rose-500" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-sm font-bold text-rose-600">ล้างข้อมูลแคช</span>
                                            <span className="text-[10px] text-rose-400 font-medium">รีเฟรชข้อมูลจากฐานข้อมูลใหม่ทั้งหมด</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-kanit font-medium text-sm uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200"
                            >
                                เสร็จสิ้น
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NexusSettingsModal;
