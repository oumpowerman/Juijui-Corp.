
import React from 'react';
import { ScriptSummary, Channel, User, MasterOption } from '../../../types';
import { User as UserIcon, Plus, Hash, Layers, MonitorPlay } from 'lucide-react';
import { motion } from 'framer-motion';

interface LabScriptItemProps {
    script: ScriptSummary;
    channels: Channel[];
    masterOptions: MasterOption[];
    onAdd: (script: ScriptSummary) => void;
}

const LabScriptItem: React.FC<LabScriptItemProps> = ({ script, channels, masterOptions, onAdd }) => {
    const channel = channels.find(c => c.id === script.channelId);
    
    // Find category label from masterOptions
    const categoryOption = masterOptions.find(o => 
        (o.type === 'SCRIPT_CATEGORY' || o.type === 'CATEGORY') && o.key === script.category
    );
    const categoryLabel = categoryOption ? categoryOption.label : script.category || 'No Category';

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden"
            onClick={() => onAdd(script)}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 overflow-hidden flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                            {script.title}
                        </h4>
                        {script.tags?.includes('UsedInLab') && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-[8px] font-black uppercase shrink-0 animate-pulse">
                                Used
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/40">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <UserIcon className="w-3 h-3 text-white/20" />
                            <span className="truncate max-w-[80px]">{script.author?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Layers className="w-3 h-3 text-white/20" />
                            <span className="truncate max-w-[120px]">{categoryLabel}</span>
                        </div>
                        {channel && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <MonitorPlay className="w-3 h-3 text-white/20" />
                                <span className="truncate max-w-[80px]">{channel.name}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <button className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500 hover:text-white shrink-0">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            
            {/* Tags Section */}
            {script.tags && script.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {script.tags.filter(t => t !== 'UsedInLab').slice(0, 5).map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 text-white/40 border border-white/5 rounded text-[8px] font-bold">
                            <Hash className="w-2 h-2 opacity-50" />
                            {tag}
                        </span>
                    ))}
                    {script.tags.filter(t => t !== 'UsedInLab').length > 5 && (
                        <span className="text-[8px] text-white/20 font-bold">+{script.tags.length - 5}</span>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default LabScriptItem;
