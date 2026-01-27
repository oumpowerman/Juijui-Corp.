
import React, { useState } from 'react';
import { ListChecks, CheckCircle2, Circle, Plus, ArrowRight } from 'lucide-react';
import { MeetingAgendaItem } from '../../types';
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
            <div className="w-full bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[180px] group relative hover:border-indigo-200 transition-colors">
                
                {/* Widget Header */}
                <div 
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-4 border-b border-gray-100 flex justify-between items-center cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 shadow-sm">
                            <ListChecks className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 text-sm tracking-tight leading-none">
                                Agenda
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                {totalCount > 0 ? `${completedCount}/${totalCount} Done` : 'No Topics'}
                            </p>
                        </div>
                    </div>
                    <div className="p-1.5 bg-white border border-gray-200 rounded-full text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all">
                        <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* Compact List */}
                <div className="p-3 bg-white flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 min-h-[100px]">
                    {agenda.length === 0 ? (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/10 hover:text-indigo-500 transition-all p-4 gap-2"
                        >
                            <Plus className="w-5 h-5 opacity-50" />
                            <span className="text-[10px] font-bold">เพิ่มวาระการประชุม</span>
                        </button>
                    ) : (
                        <div className="space-y-1">
                            {agenda.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={() => onToggle(item.id)}
                                    className={`
                                        flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer select-none transition-all group/item
                                        ${item.isCompleted 
                                            ? 'bg-gray-50 text-gray-400' 
                                            : 'bg-white hover:bg-indigo-50/30'
                                        }
                                    `}
                                >
                                    <div className={`mt-0.5 shrink-0 transition-colors ${item.isCompleted ? 'text-green-500' : 'text-gray-300 group-hover/item:text-indigo-400'}`}>
                                        {item.isCompleted 
                                            ? <CheckCircle2 className="w-4 h-4" /> 
                                            : <Circle className="w-4 h-4" />
                                        }
                                    </div>
                                    <span className={`text-xs font-bold leading-snug ${item.isCompleted ? 'line-through decoration-gray-300' : 'text-gray-700'}`}>
                                        {item.topic}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Quick Add Footer */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2 bg-gray-50 hover:bg-indigo-50 border-t border-gray-100 text-[10px] font-bold text-gray-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1"
                >
                    <Plus className="w-3 h-3" /> จัดการวาระทั้งหมด
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
