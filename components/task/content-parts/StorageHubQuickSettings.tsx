import React from 'react';
import { createPortal } from 'react-dom';
import { X, HardDrive, RefreshCw, Save, Info } from 'lucide-react';
import { useStorage } from '../../../context/StorageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface StorageHubQuickSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const StorageHubQuickSettings: React.FC<StorageHubQuickSettingsProps> = ({ isOpen, onClose }) => {
    const { storageConfigs, saveConfig, isLoading } = useStorage();

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200"
            >
                {/* Header */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                            <HardDrive className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-[26px] font-bold text-slate-800 tracking-tight">Storage Hubs</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Drive Letter Mapping</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-300 hover:text-rose-500 border border-transparent hover:border-slate-100 shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto scrollbar-hide">
                    {storageConfigs.length === 0 ? (
                        <div className="text-center py-10 opacity-40">
                             <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin-slow" />
                             <p className="text-sm font-bold">No Hubs Configured</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {storageConfigs.map(config => (
                                <div key={config.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all duration-300">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-black text-slate-700 truncate">{config.label}</span>
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter truncate opacity-60 group-hover:opacity-100">{config.description || 'No description'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <input 
                                            type="text"
                                            value={config.currentLetter}
                                            onChange={(e) => saveConfig({ ...config, currentLetter: e.target.value.toUpperCase() })}
                                            placeholder="G:"
                                            className="w-16 px-3 py-2 bg-white border-2 border-slate-100 rounded-xl text-center font-mono font-black text-indigo-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-amber-50/50 border border-amber-100/30 p-4 rounded-2xl flex gap-3">
                        <Info className="w-5 h-5 text-amber-400 shrink-0" />
                        <p className="text-[11px] font-bold text-amber-700/70 leading-relaxed italic">
                            เปลี่ยน Drive Letter เพื่อให้ระบบ "Resolved Output" ตรงกับตำแหน่งจริงที่คอมพิวเตอร์ของคุณเห็นในปัจจุบัน
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 px-10 rounded-[1.5rem] bg-slate-800 text-white font-bold text-sm uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl active:scale-[0.98]"
                    >
                        เรียบร้อย
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(
        <AnimatePresence>
            {isOpen && modalContent}
        </AnimatePresence>,
        document.body
    );
};

export default StorageHubQuickSettings;
