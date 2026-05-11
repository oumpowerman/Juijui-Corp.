
import React from 'react';
import { motion } from 'framer-motion';
import { Folder, HardDrive, Copy } from 'lucide-react';
import { Task } from '../../../../types';
import { useToast } from '../../../../context/ToastContext';
import { useStorage } from '../../../../context/StorageContext';

interface StorageSectionProps {
    task: Task;
}

const StorageSection: React.FC<StorageSectionProps> = ({ task }) => {
    const { showToast } = useToast();
    const { storageConfigs } = useStorage();

    const handleCopyPath = (path: string) => {
        navigator.clipboard.writeText(path);
        showToast('คัดลอก Path เรียบร้อย! นำไปวางใน File Explorer ได้เลย 📁', 'success');
    };

    const activeHub = task.driveLabel ? storageConfigs.find(c => c.label === task.driveLabel) : null;
    const resolvedPath = activeHub ? `${activeHub.currentLetter}${task.localPath || ''}` : task.localPath;
    const displayPath = resolvedPath || 'Not set';

    if (!task.localPath && !task.driveLabel) return null;

    return (
        <motion.section 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-slate-300">
                    <Folder className="w-4 h-4" />
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Quick Access: Local Storage</h4>
                </div>
                {activeHub && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-500">
                        <HardDrive className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Hub: {activeHub.label}</span>
                    </div>
                )}
            </div>
            <motion.div 
                whileHover={{ scale: 1.01, translateY: -2 }}
                onClick={() => handleCopyPath(resolvedPath || '')}
                className={`
                    relative p-6 rounded-[2rem] border group cursor-pointer overflow-hidden transition-all duration-500
                    ${activeHub 
                        ? 'bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border-emerald-100 shadow-[0_12px_30px_-5px_rgba(16,185,129,0.1)]' 
                        : 'bg-slate-50/40 border-slate-100 shadow-sm'}
                `}
            >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <HardDrive className="w-16 h-16 rotate-12" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${activeHub ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${activeHub ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {activeHub ? 'Resolved via Storage Hub' : 'Manual Storage Path'}
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl shadow-inner transition-colors border group-hover:bg-white flex items-center justify-between gap-3 ${activeHub ? 'bg-white/60 border-emerald-50/50' : 'bg-white border-slate-100'}`}>
                            <code className="text-sm font-mono font-bold text-slate-700 break-all">
                                {displayPath}
                            </code>
                            <div className={`shrink-0 transition-all text-emerald-500 scale-110 opacity-0 group-hover:opacity-100`}>
                               <Copy className="w-4 h-4" />
                            </div>
                        </div>
                        {activeHub && (
                            <p className="text-[9px] text-emerald-500/70 mt-2 font-medium px-1">
                                Current Mapping: {activeHub.label} → {activeHub.currentLetter}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <p className={`text-[10px] font-bold uppercase ${activeHub ? 'text-emerald-500' : 'text-slate-400'}`}>Click to Copy Path</p>
                            <p className="text-[9px] text-slate-400">Open in File Explorer</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:text-white transition-all ${activeHub ? 'bg-white text-emerald-500 group-hover:bg-emerald-500' : 'bg-white text-slate-400 group-hover:bg-slate-500'}`}>
                            <Copy className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.section>
    );
};

export default StorageSection;
