
import React, { useState } from 'react';
import { Folder, HardDrive, Info, X, Copy, MousePointer2, Keyboard, Check, Database, Edit2, Save, ChevronRight, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../../context/StorageContext';
import FilterDropdown from '../../common/FilterDropdown';

interface CFStoragePathProps {
    localPath: string;
    setLocalPath: (val: string) => void;
    driveLabel: string;
    setDriveLabel: (val: string) => void;
}

const CFStoragePath: React.FC<CFStoragePathProps> = ({ localPath, setLocalPath, driveLabel, setDriveLabel }) => {
    const { storageConfigs, saveConfig } = useStorage();
    const [showInstructions, setShowInstructions] = useState(false);
    const [isQuickEditing, setIsQuickEditing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [quickDriveLetter, setQuickDriveLetter] = useState('');
    const [copied, setCopied] = useState(false);

    const activeConfig = storageConfigs.find(c => c.label === driveLabel);

    const hubOptions = storageConfigs.map(c => ({
        key: c.label,
        label: `${c.label} (${c.currentLetter})`,
        icon: <HardDrive className="w-4 h-4" />
    }));

    const handleCopyExample = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveQuickConfig = async () => {
        if (!activeConfig || !quickDriveLetter) return;
        const success = await saveConfig({
            ...activeConfig,
            currentLetter: quickDriveLetter
        });
        if (success) setIsQuickEditing(false);
    };

    const openQuickEdit = () => {
        if (activeConfig) {
            setQuickDriveLetter(activeConfig.currentLetter);
            setIsQuickEditing(true);
        }
    };

    return (
        <>
            <div className="relative group transition-all duration-500">
            {/* Background Decoration */}
            <div className={`absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[1.5rem] opacity-0 group-focus-within:opacity-10 blur-xl transition-opacity duration-700`} />
            
            <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
                <div className="p-1.5 flex items-center gap-1.5 overflow-visible">
                    
                    {/* HUB SELECTOR SECTION (Left Side) */}
                    <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100/50 p-1 overflow-visible relative z-30">
                        <motion.button 
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-2.5 rounded-lg transition-all duration-500 flex items-center justify-center ${activeConfig ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white text-slate-400 hover:text-indigo-500 shadow-sm'}`}
                            title={isExpanded ? 'Collapse Settings' : 'Hub Mapping Settings'}
                        >
                            <Database className={`w-4 h-4 ${activeConfig && !isExpanded ? 'animate-pulse' : ''}`} />
                        </motion.button>

                        <AnimatePresence initial={false}>
                            {isExpanded && (
                                <motion.div 
                                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                                    animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                                    className="overflow-visible whitespace-nowrap pr-1 flex items-center gap-2"
                                >
                                    <div className="w-[180px]">
                                        <FilterDropdown 
                                            label=""
                                            options={hubOptions}
                                            value={driveLabel || 'ALL'}
                                            onChange={(val) => {
                                                setDriveLabel(val === 'ALL' ? '' : val);
                                                if (val !== 'ALL') setIsExpanded(false);
                                            }}
                                            icon={<HardDrive className="w-3.5 h-3.5" />}
                                            activeColorClass="bg-white border-emerald-500 text-emerald-700 shadow-sm"
                                            placeholder="-- Manual Mode --"
                                            showAllOption={true}
                                        />
                                    </div>
                                    {activeConfig && (
                                        <button 
                                            type="button"
                                            onClick={openQuickEdit}
                                            className="p-2 text-emerald-600 hover:bg-emerald-100/50 rounded-lg transition-all active:scale-90"
                                            title="Quick Update Hub Path"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* PATH INPUT SECTION (Main Content) */}
                    <div className="flex-1 flex flex-col justify-center px-2 py-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                            <label className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${activeConfig ? 'text-emerald-500' : 'text-slate-300'}`}>
                                {activeConfig ? `MAP: ${activeConfig.label}` : 'Absolute Path'}
                            </label>
                            {localPath && (
                                <span className="text-[8px] font-bold text-slate-300 uppercase hidden sm:inline">Path Linked</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text"
                                value={localPath}
                                onChange={(e) => setLocalPath(e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-slate-700 font-bold placeholder:text-slate-200 outline-none"
                                placeholder={driveLabel ? '/Works/Project/EP01' : 'E:/Works/Project/EP01'}
                            />
                        </div>
                    </div>

                    {/* RIGHT ACTIONS */}
                    <div className="flex items-center gap-1 pr-1.5 border-l border-slate-100 pl-2">
                        <button 
                            type="button"
                            onClick={() => setShowInstructions(true)}
                            className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* RESOLVED PATH FOOTER */}
                <div className={`px-4 py-1.5 border-t border-slate-50 flex items-center justify-between gap-4 transition-all duration-500 ${activeConfig ? 'bg-emerald-50/20' : 'bg-slate-50/20'}`}>
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Resolved Output:</span>
                        <code className="text-[10px] font-mono font-bold text-slate-500 truncate bg-white/60 px-2 py-0.5 rounded border border-slate-100/50">
                            {activeConfig ? `${activeConfig.currentLetter}${localPath}` : (localPath || 'Waiting for path...')}
                        </code>
                    </div>
                    {activeConfig && (
                        <div className="flex items-center gap-1.5 shrink-0">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Dynamic Mapping On</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Instruction Tip */}
            <div className="mt-2 px-1 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <p className="text-[9px] text-slate-400 font-medium italic">
                    <span className="text-emerald-500 font-black px-1">Tip:</span> 
                    Shift + Right Click on folder {"->"} "Copy as path" then paste here.
                </p>
            </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
                {isQuickEditing && activeConfig && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsQuickEditing(false);
                            }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <Database className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 leading-tight">Quick Link Update</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{activeConfig.label}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">Drive Letter/Path</label>
                                    <input 
                                        type="text"
                                        value={quickDriveLetter}
                                        onChange={(e) => setQuickDriveLetter(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                                        placeholder="E:, F:, G:, D:/Work"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsQuickEditing(false);
                                        }}
                                        className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveQuickConfig();
                                        }}
                                        className="flex-3 py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Update Hub
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showInstructions && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInstructions(false);
                            }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="bg-emerald-500 p-8 text-white relative">
                                <div className="absolute top-6 right-6">
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowInstructions(false);
                                        }} 
                                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-3 bg-white/20 w-fit rounded-2xl mb-4"><HardDrive className="w-8 h-8" /></div>
                                <h3 className="text-2xl font-bold tracking-tight">วิธีคัดลอก Path</h3>
                                <p className="text-emerald-100 font-medium text-xs">เพื่อให้ระบบจัดการไดรฟ์ให้คุณอัตโนมัติ</p>
                            </div>
                            <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            {[
                                { num: '1', text: 'กด Shift ค้างไว้', icon: <Keyboard className="w-4 h-4" /> },
                                { num: '2', text: 'คลิกขวาที่โฟลเดอร์', icon: <MousePointer2 className="w-4 h-4" />, color: 'text-emerald-600' },
                                { num: '3', text: 'เลือก "Copy as path"', icon: <Copy className="w-4 h-4" />, color: 'text-emerald-600 underline underline-offset-4' }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">{step.num}</div>
                                    <p className={`font-bold text-slate-700 flex items-center gap-2 text-sm ${step.color || ''}`}>
                                        {step.icon} {step.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div 
                            className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-colors" 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCopyExample('D:\\Projects\\Content\\Video');
                            }}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Example</p>
                                    <code className="text-[10px] font-bold text-slate-600 truncate block">"D:\Projects\Video"</code>
                                </div>
                            </div>
                            <div className={`p-2 rounded-xl transition-all shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInstructions(false);
                            }} 
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all text-sm"
                        >
                            Dismiss
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
</>
);
};

export default CFStoragePath;

