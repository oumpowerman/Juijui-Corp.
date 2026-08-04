import React from 'react';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { Task, Channel } from '../../../../../types';

interface StockRowMetadataProps {
    task: Task;
    channel: Channel | null;
    getFormatLabel: (key?: string) => string;
    getPillarLabel: (key?: string) => string;
    getCategoryLabel: (key?: string) => string;
    onTagClick?: (tag: string) => void;
}

export const StockRowMetadata: React.FC<StockRowMetadataProps> = ({
    task,
    channel,
    getFormatLabel,
    getPillarLabel,
    getCategoryLabel,
    onTagClick
}) => {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {channel ? (
                <div 
                    className="flex items-center justify-center p-0.5 rounded-full bg-white border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors"
                    title={channel.name}
                >
                    {channel.logoUrl ? (
                        <img 
                            src={channel.logoUrl} 
                            alt={channel.name} 
                            className="w-6 h-6 rounded-full object-cover shadow-sm" 
                            referrerPolicy="no-referrer" 
                        />
                    ) : (
                        <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm" 
                            style={{ backgroundColor: channel.color || '#6366f1' }}
                        >
                            {channel.name.charAt(0)}
                        </div>
                    )}
                </div>
            ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-full border border-slate-100 text-slate-400 uppercase tracking-tight">-</span>
            )}
            
            {task.contentFormats && task.contentFormats.length > 0 ? (
                <div className="flex items-center gap-1">
                    <span className="text-[9px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 font-bold flex items-center">
                        {getFormatLabel(task.contentFormats[0])}
                    </span>
                    {task.contentFormats.length > 1 && (
                        <div className="relative group/tooltip">
                            <motion.span 
                                whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0] }}
                                transition={{ 
                                    scale: { type: "spring", stiffness: 400, damping: 10 },
                                    rotate: { duration: 0.4, ease: "easeInOut" }
                                }}
                                className="text-[9px] text-purple-500 bg-purple-100/50 px-2 py-0.5 rounded-full border border-purple-200 font-bold cursor-help flex items-center justify-center"
                            >
                                +{task.contentFormats.length - 1}
                            </motion.span>
                            
                            {/* Custom Animated Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50">
                                <div className="bg-white/90 backdrop-blur-xl text-purple-900 text-[10px] font-bold px-3 py-2 rounded-2xl shadow-2xl shadow-purple-200/50 border border-purple-100 flex flex-col gap-1.5 min-w-max">
                                    <div className="text-[8px] text-purple-500 uppercase tracking-widest mb-0.5 opacity-70">Format อื่นๆ</div>
                                    {task.contentFormats.slice(1).map(f => (
                                        <div key={f} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.4)]" />
                                            {getFormatLabel(f)}
                                        </div>
                                    ))}
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-white/90" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            {task.pillar && (
                <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-bold flex items-center">
                    {getPillarLabel(task.pillar)}
                </span>
            )}

            {task.category && (
                <span className="text-[9px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 font-bold flex items-center">
                    <Tag className="w-2.5 h-2.5 mr-1 opacity-50" />
                    {getCategoryLabel(task.category)}
                </span>
            )}

            {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {task.tags.slice(0, 2).map((tag) => (
                        <motion.span 
                            key={tag} 
                            whileHover={{ scale: 1.05, y: -0.5 }}
                            onClick={() => onTagClick?.(tag)}
                            className="text-[9px] font-bold inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10 text-indigo-650 hover:text-indigo-700 border border-indigo-500/20 shadow-[0_2px_4px_rgba(99,102,241,0.03)] hover:shadow-[0_6px_12px_rgba(99,102,241,0.12)] hover:border-indigo-400/50 transition-all duration-300 cursor-pointer"
                        >
                            <span className="text-[10px] text-indigo-400 font-extrabold leading-none animate-pulse">#</span>
                            {tag}
                        </motion.span>
                    ))}
                    {task.tags.length > 2 && (
                        <div className="relative group/tag-tooltip">
                            <motion.span 
                                whileHover={{ scale: 1.1 }}
                                className="text-[9px] text-indigo-500 bg-white px-1.5 py-0.5 rounded-full border border-indigo-100 font-extrabold cursor-help flex items-center justify-center shadow-[0_2px_4px_rgba(99,102,241,0.02)] hover:shadow-[0_4px_8px_rgba(99,102,241,0.08)] transition-all"
                            >
                                +{task.tags.length - 2}
                            </motion.span>
                            
                            {/* Custom Animated Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tag-tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tag-tooltip:translate-y-0 z-50">
                                <div className="bg-white/95 backdrop-blur-xl text-indigo-900 text-[10px] font-bold px-3 py-2 rounded-2xl shadow-xl border border-indigo-100 flex flex-col gap-1.5 min-w-max">
                                    <div className="text-[8px] text-indigo-400 uppercase tracking-widest mb-0.5 opacity-80">แท็กทั้งหมด</div>
                                    {task.tags.slice(2).map(t => (
                                        <div 
                                            key={t} 
                                            onClick={() => onTagClick?.(t)}
                                            className="flex items-center gap-1.5 text-indigo-700 font-extrabold cursor-pointer hover:underline"
                                        >
                                            <span className="text-indigo-400">#</span>
                                            {t}
                                        </div>
                                    ))}
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-white" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
