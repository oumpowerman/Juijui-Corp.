
import React, { useState, useEffect } from 'react';
import { Folder, HardDrive, Info, X, Copy, MousePointer2, Keyboard, Check, Database, Edit2, Save, ChevronRight, Settings2, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../../context/StorageContext';
import FilterDropdown from '../../common/FilterDropdown';
import StorageHubQuickSettings from './StorageHubQuickSettings';

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
    const [isHubModalOpen, setIsHubModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [quickDriveLetter, setQuickDriveLetter] = useState('');
    const [copied, setCopied] = useState(false);
    const [detectedMismatch, setDetectedMismatch] = useState<{ original: string, detected: string } | null>(null);

    const activeConfig = React.useMemo(() => 
        storageConfigs.find(c => c.label === driveLabel),
    [storageConfigs, driveLabel]);

    // Auto-Correction Detection
    useEffect(() => {
        if (!activeConfig || !localPath.match(/^[a-zA-Z]:/)) {
            if (detectedMismatch) setDetectedMismatch(null);
            return;
        }

        const driveMatch = localPath.match(/^([a-zA-Z]:)/);
        if (driveMatch) {
            const detected = driveMatch[1].toUpperCase();
            const current = activeConfig.currentLetter.toUpperCase();

            if (detected !== current) {
                // Only set if it's different from current detected state to prevent loops
                if (!detectedMismatch || detectedMismatch.detected !== detected) {
                    setDetectedMismatch({
                        original: activeConfig.currentLetter,
                        detected: detected
                    });
                }
            } else if (detectedMismatch) {
                setDetectedMismatch(null);
            }
        }
    }, [localPath, activeConfig]); // Removed detectedMismatch from dependencies

    // Smart Path Parsing Logic
    const handlePathChange = React.useCallback((val: string) => {
        // 1. Clean up quotes and trim
        let cleanVal = val.trim().replace(/^"(.*)"$/, '$1');

        // 2. Try to match with existing Storage Hubs
        // Sort by length longest first to match more specific paths
        const sortedConfigs = [...storageConfigs].sort((a, b) => (b.currentLetter?.length || 0) - (a.currentLetter?.length || 0));
        
        let matched = false;
        for (const config of sortedConfigs) {
            if (config.currentLetter && cleanVal.toLowerCase().startsWith(config.currentLetter.toLowerCase())) {
                const prefixLen = config.currentLetter.length;
                const remaining = cleanVal.substring(prefixLen);
                
                setDriveLabel(config.label);
                setLocalPath(remaining);
                matched = true;
                setDetectedMismatch(null);
                break;
            }
        }

        if (!matched) {
            setLocalPath(cleanVal);
            if (!driveLabel && (cleanVal.includes(':') || cleanVal.startsWith('/') || cleanVal.startsWith('\\\\'))) {
                setDriveLabel('');
            }
        }
    }, [storageConfigs, driveLabel, setDriveLabel, setLocalPath]);

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
        if (success) {
            setIsQuickEditing(false);
            // After successful update, re-parse the current localPath to fix it
            handlePathChange(`${quickDriveLetter}${localPath}`);
        }
    };

    const handleAutoCorrect = async () => {
        if (!activeConfig || !detectedMismatch) return;
        const success = await saveConfig({
            ...activeConfig,
            currentLetter: detectedMismatch.detected
        });
        if (success) {
            // Strip the drive letter from localPath since it's now covered by the hub
            const cleanPath = localPath.replace(/^[a-zA-Z]:/, '');
            setLocalPath(cleanPath);
            setDetectedMismatch(null);
        }
    };

    const openQuickEdit = () => {
        if (activeConfig) {
            setQuickDriveLetter(activeConfig.currentLetter);
            setIsQuickEditing(true);
        }
    };

    return (
        <>
        <div className={`relative group transition-all duration-300 ${isExpanded ? 'z-[100]' : 'z-10'}`}>
            {/* Background Decoration */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${detectedMismatch ? 'from-amber-400 to-rose-400 opacity-20' : 'from-emerald-500 to-teal-500 opacity-0'} rounded-[1.5rem] group-focus-within:opacity-20 blur-xl transition-all duration-700 pointer-events-none z-0`} />
            
            <div className={`relative bg-white rounded-2xl border ${detectedMismatch ? 'border-amber-200 shadow-lg shadow-amber-50' : 'border-slate-100 shadow-sm'} overflow-visible z-10`}>
                <div className="p-1.5 flex items-center gap-1.5 overflow-visible">
                    
                    {/* HUB SELECTOR SECTION (Left Side) */}
                    <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100/50 p-1 overflow-visible relative z-50">
                        <motion.button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
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
                                    className="overflow-visible whitespace-nowrap pr-1 flex items-center gap-2 relative z-[60]"
                                >
                                    <div className="w-[180px]" onClick={(e) => e.stopPropagation()}>
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
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsHubModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100"
                                        title="System Storage Hubs"
                                    >
                                        <Settings2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* PATH INPUT SECTION (Main Content) */}
                    <div className="flex-1 flex flex-col justify-center px-2 py-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                            <label className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${detectedMismatch ? 'text-amber-600' : activeConfig ? 'text-emerald-500' : 'text-slate-300'}`}>
                                {detectedMismatch ? '⚠️ DRIVE MISMATCH DETECTED' : activeConfig ? `MAP: ${activeConfig.label}` : 'Absolute Path'}
                            </label>
                            {localPath && !detectedMismatch && (
                                <span className="text-[8px] font-bold text-slate-300 uppercase hidden sm:inline">Path Linked</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text"
                                value={localPath}
                                onChange={(e) => handlePathChange(e.target.value)}
                                className={`w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold placeholder:text-slate-200 outline-none transition-colors ${detectedMismatch ? 'text-amber-700' : 'text-slate-700'}`}
                                placeholder={driveLabel ? '/Works/Project/EP01' : 'E:/Works/Project/EP01'}
                            />
                        </div>
                    </div>

                    {/* RIGHT ACTIONS */}
                    <div className="flex items-center gap-1 pr-1.5 border-l border-slate-100 pl-2 shrink-0">
                        <AnimatePresence>
                            {detectedMismatch && (
                                <motion.button
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    type="button"
                                    onClick={handleAutoCorrect}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95"
                                >
                                    <Zap className="w-3 h-3" />
                                    Update Hub to {detectedMismatch.detected}?
                                </motion.button>
                            )}
                        </AnimatePresence>
                        
                        {!detectedMismatch && (
                            <button 
                                type="button"
                                onClick={() => setShowInstructions(true)}
                                className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                            >
                                <Info className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* RESOLVED PATH FOOTER */}
                <div className={`px-4 py-1.5 border-t border-slate-50 flex items-center justify-between gap-4 transition-all duration-500 ${detectedMismatch ? 'bg-amber-50/40' : activeConfig ? 'bg-emerald-50/20' : 'bg-slate-50/20'}`}>
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Resolved Output:</span>
                        <div 
                            className="flex-1 flex items-center gap-2 overflow-hidden group/path cursor-pointer"
                            onClick={() => {
                                const fullPath = activeConfig ? `${activeConfig.currentLetter}${localPath}` : localPath;
                                if (fullPath) handleCopyExample(fullPath);
                            }}
                        >
                            <code className={`text-[10px] font-mono font-bold truncate bg-white/60 px-2 py-0.5 rounded border border-slate-100/50 group-hover/path:text-emerald-600 transition-colors ${detectedMismatch ? 'text-amber-600 border-amber-100' : 'text-slate-500'}`}>
                                {activeConfig ? `${activeConfig.currentLetter}${localPath}` : (localPath || 'Waiting for path...')}
                            </code>
                            <div className={`shrink-0 transition-all ${copied ? 'text-emerald-500 opacity-100 scale-110' : 'text-slate-300 opacity-0 group-hover/path:opacity-100'}`}>
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </div>
                        </div>
                    </div>
                    {activeConfig && !detectedMismatch && (
                        <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Mapped</span>
                        </div>
                    )}
                    {detectedMismatch && (
                        <div className="flex items-center gap-1.5 shrink-0">
                             <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                             <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter shrink-0">Mismatch</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Instruction Tip */}
            <div className="mt-2 px-1 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <p className="text-[9px] text-slate-400 font-medium italic">
                        <span className="text-emerald-500 font-black px-1">Tip:</span> 
                        Shift + Right Click folder {"->"} "Copy as path"
                    </p>
                </div>
                {activeConfig && !detectedMismatch && (
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openQuickEdit();
                        }}
                        className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 flex items-center gap-1 transition-colors relative z-10"
                    >
                        <Edit2 className="w-2.5 h-2.5" />
                        Remap Hub ({activeConfig.currentLetter})
                    </button>
                )}
            </div>
        </div>

        {/* Modals */}
        <StorageHubQuickSettings isOpen={isHubModalOpen} onClose={() => setIsHubModalOpen(false)} />

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
                                    <h3 className="text-lg font-bold text-slate-800 leading-tight">Quick Link Update</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{activeConfig.label}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider">Drive Letter/Path</label>
                                    <input 
                                        type="text"
                                        value={quickDriveLetter}
                                        onChange={(e) => setQuickDriveLetter(e.target.value.toUpperCase())}
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
                                        className="flex-3 py-3.5 px-8 bg-emerald-600 text-white font-bold rounded-2xl text-[11px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-3"
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
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">{step.num}</div>
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Example</p>
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

