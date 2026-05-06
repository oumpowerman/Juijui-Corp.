import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ExternalLink, Link2Off, Settings, UploadCloud, ArrowUpRight } from 'lucide-react';
import { Task, Platform, MasterOption } from '../../../types';
import { PLATFORM_ICONS } from '../../../constants';
import PlatformConfigModal from './PlatformConfigModal';
import { useUserSession } from '../../../context/UserSessionContext';
import { useMasterData } from '../../../hooks/useMasterData';

interface PlatformSectionProps {
    task: Task;
}

const getPlatformStyle = (p: string, isPublished: boolean) => {
    if (!isPublished) {
        switch (p) {
            case 'YOUTUBE': return 'bg-red-50/30 border-red-200/50 text-red-400 group-hover:bg-red-50 group-hover:border-red-300';
            case 'FACEBOOK': return 'bg-blue-50/30 border-blue-200/50 text-blue-400 group-hover:bg-blue-50 group-hover:border-blue-300';
            case 'TIKTOK': return 'bg-zinc-50/30 border-zinc-200/50 text-zinc-400 group-hover:bg-zinc-50 group-hover:border-zinc-300';
            case 'INSTAGRAM': return 'bg-pink-50/30 border-pink-200/50 text-pink-400 group-hover:bg-pink-50 group-hover:border-pink-300';
            default: return 'bg-slate-50/30 border-slate-200/50 text-slate-400';
        }
    }
    switch (p) {
        case 'YOUTUBE': return 'bg-red-50 border-red-100 text-red-600';
        case 'FACEBOOK': return 'bg-blue-50 border-blue-100 text-blue-600';
        case 'TIKTOK': return 'bg-zinc-50 border-zinc-100 text-zinc-800';
        case 'INSTAGRAM': return 'bg-pink-50 border-pink-100 text-pink-600';
        default: return 'bg-slate-50 border-slate-100 text-slate-600';
    }
};

const PlatformSection: React.FC<PlatformSectionProps> = ({ task }) => {
    const { currentUserProfile } = useUserSession();
    const { masterOptions } = useMasterData();
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const isAdmin = currentUserProfile?.role === 'ADMIN';

    const targetPlatforms = task.targetPlatforms || [];

    const platformConfigs = masterOptions.filter(opt => opt.type === 'PLATFORM_CONFIG');
    const configMap: Record<string, string> = {};
    platformConfigs.forEach(opt => {
        configMap[opt.key] = opt.description || '';
    });

    return (
        <div className="relative z-10 space-y-3">
            <div className="flex justify-between items-end px-1.5 pb-0.5">
                <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Production</p>
                    <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-tight leading-none">Target Platforms</h4>
                </div>
                {isAdmin && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsConfigOpen(true);
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all group border border-slate-100/50 hover:border-indigo-100 hover:shadow-sm"
                        title="Platform Configuration"
                    >
                        <Settings className="w-3 h-3 group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                {targetPlatforms.length > 0 ? (
                    ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'].map(p => {
                        const isActive = targetPlatforms.includes(p as Platform);
                        const taskLink = task.publishedLinks?.[p];
                        const baseLink = configMap[p];
                        const isPublished = !!taskLink;
                        
                        const finalLink = taskLink || baseLink;
                        
                        const Icon = PLATFORM_ICONS[p as Platform] || Globe;
                        const pastelStyle = getPlatformStyle(p, isPublished);

                        const content = (
                            <div 
                                className={`
                                    flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl border transition-all w-full overflow-hidden
                                    ${isActive 
                                        ? `${pastelStyle} shadow-sm font-semibold` 
                                        : 'bg-slate-50 border-slate-50 text-slate-200 opacity-40'}
                                    ${isActive && finalLink ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer group' : ''}
                                    ${isActive && !isPublished && baseLink ? 'border-dashed' : ''}
                                `}
                            >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isPublished ? 'opacity-70' : 'opacity-40'}`} />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[8.5px] font-bold tracking-tight uppercase truncate leading-none">{p}</span>
                                        {isActive && !isPublished && baseLink && (
                                            <span className="text-[6px] font-bold text-slate-400 mt-0.5 animate-pulse">CLICK TO UPLOAD</span>
                                        )}
                                    </div>
                                </div>
                                
                                {isActive && (
                                    <div className="flex items-center shrink-0">
                                        {isPublished ? (
                                            <div className="bg-white/50 p-1 rounded-md shadow-inner">
                                                <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                                            </div>
                                        ) : baseLink ? (
                                            <div className="bg-white/40 p-1 rounded-md border border-white/20 group-hover:bg-white transition-colors">
                                                <UploadCloud className="w-2.5 h-2.5 opacity-60 group-hover:text-indigo-500" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[6px] font-black text-amber-600/90 bg-amber-50/90 px-1 py-0.5 rounded-md border border-amber-200/50 whitespace-nowrap shadow-sm">
                                                <Link2Off className="w-2.5 h-2.5 shrink-0" />
                                                <span className="hidden sm:inline leading-none">OFFLINE</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );

                        if (isActive && finalLink) {
                            return (
                                <motion.a
                                    key={p}
                                    href={finalLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.05 }}
                                    className="block"
                                >
                                    {content}
                                </motion.a>
                            );
                        }

                        return (
                            <motion.div 
                                key={p} 
                                whileHover={isActive ? { scale: 1.02 } : {}}
                            >
                                {content}
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-2">
                        <div className="bg-slate-50 border-2 border-slate-100 border-dashed p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                <Link2Off className="w-5 h-5 text-slate-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-[15px] font-bold text-slate-400 leading-tight uppercase">No Platforms Selected</p>
                                <p className="text-[11px] font-medium text-slate-300 uppercase tracking-tighter">ไม่มีการเลือกแพลตฟอร์มสำหรับคอนเทนต์นี้</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <PlatformConfigModal 
                isOpen={isConfigOpen} 
                onClose={() => setIsConfigOpen(false)} 
            />
        </div>
    );
};

export default PlatformSection;
