import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Check, Trash2, ListTodo, BarChart3 } from 'lucide-react';
import { MeetingAgendaItem } from '../../types';

interface AgendaModalProps {
    isOpen: boolean;
    onClose: () => void;
    agenda: MeetingAgendaItem[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onAdd: (topic: string) => void;
}

const AgendaModal: React.FC<AgendaModalProps> = ({ isOpen, onClose, agenda, onToggle, onDelete, onAdd }) => {
    const [newTopic, setNewTopic] = useState('');

    if (!isOpen) return null;

    const handleAddClick = () => {
        if (newTopic.trim()) {
            onAdd(newTopic);
            setNewTopic('');
        }
    };

    const completedCount = agenda.filter(a => a.isCompleted).length;
    const totalCount = agenda.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            <ListTodo className="w-6 h-6 text-indigo-600" />
                            วาระการประชุม (Agenda)
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-500">
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>ความคืบหน้า: {percentage}% ({completedCount}/{totalCount})</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-[#f8fafc]">
                    <div className="space-y-3">
                        {agenda.length === 0 && (
                            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                                <p>ยังไม่มีวาระการประชุม</p>
                                <p className="text-xs">เพิ่มหัวข้อด้านล่างได้เลย</p>
                            </div>
                        )}
                        {agenda.map((item) => (
                            <div key={item.id} className="group flex items-start gap-3 bg-white p-3.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                                <button 
                                    onClick={() => onToggle(item.id)}
                                    className={`
                                        w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 shrink-0
                                        ${item.isCompleted 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 bg-white hover:border-indigo-400 text-transparent'}
                                    `}
                                >
                                    <Check className="w-3.5 h-3.5 stroke-[4px]" />
                                </button>
                                <span className={`flex-1 text-sm font-medium leading-relaxed ${item.isCompleted ? 'text-gray-400 line-through decoration-2' : 'text-gray-700'}`}>
                                    {item.topic}
                                </span>
                                <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-medium"
                            placeholder="พิมพ์หัวข้อวาระใหม่..."
                            value={newTopic}
                            onChange={e => setNewTopic(e.target.value)}
                            onKeyDown={e => { if(e.key === 'Enter') handleAddClick(); }}
                            autoFocus
                        />
                        <button 
                            onClick={handleAddClick}
                            disabled={!newTopic.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AgendaModal;