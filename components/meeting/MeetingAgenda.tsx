import React, { useState } from 'react';
import { ListChecks, ChevronRight, CheckCircle2, Circle, Plus, Settings2 } from 'lucide-react';
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
            <div className="w-full bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[200px]">
                
                {/* Header: Click to open full manager */}
                <div 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors group bg-gradient-to-r from-white to-gray-50/50"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform">
                            <ListChecks className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 text-sm tracking-tight group-hover:text-indigo-700 transition-colors">
                                วาระการประชุม (Agenda)
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                สำเร็จ {completedCount}/{totalCount} หัวข้อ
                            </p>
                        </div>
                    </div>
                    <button className="p-1.5 rounded-full text-gray-300 hover:text-indigo-600 hover:bg-white transition-all">
                        <Settings2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Body: Interactive Checklist */}
                <div className="p-4 bg-[#f8fafc] flex-1 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-200">
                    {agenda.length === 0 ? (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full h-full min-h-[120px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-500 transition-all p-6 group"
                        >
                            <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 stroke-[3px]" />
                            </div>
                            <span className="text-xs font-bold">เพิ่มวาระการประชุม</span>
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {agenda.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={() => onToggle(item.id)}
                                    className={`
                                        group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.98]
                                        ${item.isCompleted 
                                            ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' 
                                            : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                                        }
                                    `}
                                >
                                    <div className={`mt-0.5 transition-all duration-300 ${item.isCompleted ? 'text-emerald-500 scale-110' : 'text-gray-300 group-hover:text-indigo-400'}`}>
                                        {item.isCompleted 
                                            ? <CheckCircle2 className="w-5 h-5 fill-emerald-100" /> 
                                            : <Circle className="w-5 h-5" />
                                        }
                                    </div>
                                    <span className={`text-sm font-bold leading-snug transition-all ${item.isCompleted ? 'text-emerald-800 line-through decoration-emerald-300 decoration-2 opacity-60' : 'text-gray-700'}`}>
                                        {item.topic}
                                    </span>
                                </div>
                            ))}
                            
                            {/* Add More Button */}
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="mt-2 w-full py-2.5 text-xs font-bold text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" /> จัดการ / เพิ่มวาระ
                            </button>
                        </div>
                    )}
                </div>
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