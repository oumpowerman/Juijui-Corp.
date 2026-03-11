
import React, { useState } from 'react';
import { ListChecks, CheckCircle2, Circle, Plus, ArrowRight } from 'lucide-react';
import { MeetingAgendaItem } from '../../types';
import { motion } from 'framer-motion';
import AgendaModal from './AgendaModal';

interface MeetingAgendaProps {
    agenda: MeetingAgendaItem[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onAdd: (topic: string) => void;
}

const MeetingAgenda: React.FC<MeetingAgendaProps> = ({ agenda, onToggle, onDelete, onAdd }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const completedCount = agenda.filter(a => a.isCompleted).length;
    const totalCount = agenda.length;

    return (
        <>
            <div className="w-full bg-white rounded-[2rem] border-b-4 border-r-2 border-slate-200 shadow-lg overflow-hidden flex flex-col h-full min-h-[140px] group relative hover:border-indigo-200 transition-all">
                
                {/* Widget Header */}
                <div 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-3 border-b border-slate-100 flex justify-between items-center cursor-pointer bg-slate-50/30 hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 shadow-sm">
                            <ListChecks className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-[16px] uppercase tracking-widest leading-none">
                                Agenda
                            </h3>
                            <p className="text-[10px] text-slate-400 font-black mt-1">
                                {totalCount > 0 ? `${completedCount}/${totalCount} Done` : 'No Topics'}
                            </p>
                        </div>
                    </div>
                    <div className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all shadow-sm">
                        <ArrowRight className="w-3 h-3" />
                    </div>
                </div>

                {/* Compact List */}
                <div className="p-2 bg-white flex-1 overflow-y-auto scrollbar-hide min-h-[80px]">
                    {agenda.length === 0 ? (
                        <motion.button 
                            whileHover={{ scale: 0.99, backgroundColor: '#f8fafc' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setIsModalOpen(true)}
                            className="w-full h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl transition-all p-3 gap-1 group/empty"
                        >
                            <Plus className="w-4 h-4 opacity-50 group-hover/empty:scale-110 transition-transform" />
                            <span className="text-[20px] font-kanit font-bold uppercase tracking-widest">เพิ่มวาระการประชุม</span>
                        </motion.button>
                    ) : (
                        <div className="space-y-1">
                            {agenda.slice(0, 3).map(item => (
                                <motion.div 
                                    whileHover={{ x: 2 }}
                                    key={item.id}
                                    onClick={() => onToggle(item.id)}
                                    className={`
                                        flex items-start gap-2 p-2 rounded-xl cursor-pointer select-none transition-all group/item
                                        ${item.isCompleted 
                                            ? 'bg-slate-50 text-slate-400' 
                                            : 'bg-white hover:bg-indigo-50/30'
                                        }
                                    `}
                                >
                                    <div className={`mt-0.5 shrink-0 transition-colors ${item.isCompleted ? 'text-emerald-500' : 'text-slate-300 group-hover/item:text-indigo-400'}`}>
                                        {item.isCompleted 
                                            ? <CheckCircle2 className="w-3.5 h-3.5" /> 
                                            : <Circle className="w-3.5 h-3.5" />
                                        }
                                    </div>
                                    <span className={`text-[11px] font-bold leading-snug truncate ${item.isCompleted ? 'line-through decoration-slate-300' : 'text-slate-700'}`}>
                                        {item.topic}
                                    </span>
                                </motion.div>
                            ))}
                            {agenda.length > 3 && (
                                <div className="text-center py-1">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">+{agenda.length - 3} more topics</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Quick Add Footer */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2 bg-slate-50 hover:bg-indigo-50 border-t border-slate-100 text-[16px] font-bold font-kanit text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1 uppercase tracking-widest"
                >
                    <Plus className="w-3 h-3" /> จัดการวาระ
                </button>
            </div>

            <AgendaModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                agenda={agenda}
                onToggle={onToggle}
                onDelete={onDelete}
                onAdd={onAdd}
            />
        </>
    );
};

export default MeetingAgenda;
