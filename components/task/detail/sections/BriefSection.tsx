
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Paperclip } from 'lucide-react';
import Markdown from 'react-markdown';
import { Task } from '../../../../types';

interface BriefSectionProps {
    task: Task;
}

const BriefSection: React.FC<BriefSectionProps> = ({ task }) => {
    const bouncyHover = {
        scale: 1.03,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 12 }
    } as const;

    return (
        <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 text-slate-300 px-1">
                    <FileText className="w-4 h-4" />
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Content Brief</h4>
                </div>
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[300px] relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-100/30 via-purple-100/30 to-pink-100/30" />
                    <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:text-slate-500 prose-p:leading-relaxed prose-strong:text-slate-700">
                        {task.description ? (
                            <Markdown>{task.description}</Markdown>
                        ) : (
                            <p className="italic text-slate-200 text-lg">No description provided for this content.</p>
                        )}
                    </div>
                </motion.div>
            </div>

            <div className="space-y-8">
                {task.remark && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <AlertTriangle className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Important Remark</h4>
                        </div>
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-amber-50/20 p-8 rounded-[2.5rem] border border-amber-100/20 shadow-sm relative overflow-hidden"
                        >
                            <p className="text-sm text-amber-600/80 font-semibold leading-relaxed relative z-10">{task.remark}</p>
                        </motion.div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-300 px-1">
                        <Paperclip className="w-4 h-4" />
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Quick Assets</h4>
                    </div>
                    <motion.div 
                        whileHover={bouncyHover}
                        className="bg-slate-50/30 p-8 rounded-[2.5rem] text-slate-400 border border-slate-100/50 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Paperclip className="w-12 h-12 rotate-12" />
                        </div>
                        <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-2">Attached Files</p>
                        <p className="text-4xl font-semibold text-slate-400/80 mb-1">{task.assets?.length || 0}</p>
                        <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Total Assets Linked</p>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
};

export default BriefSection;
