
import React, { useState } from 'react';
import { IDPItem } from '../../../types';
import { Sprout, CheckCircle2, Circle, Plus, Trash2, BookOpen } from 'lucide-react';

interface IDPSectionProps {
    items: IDPItem[];
    userId: string;
    monthKey: string;
    onAdd: (userId: string, monthKey: string, topic: string, actionPlan: string) => void;
    onToggle: (id: string, isDone: boolean) => void;
    onDelete: (id: string) => void;
    readOnly: boolean;
}

const IDPSection: React.FC<IDPSectionProps> = ({ 
    items, userId, monthKey, onAdd, onToggle, onDelete, readOnly 
}) => {
    const [topic, setTopic] = useState('');
    const [action, setAction] = useState('');

    const handleAdd = () => {
        if (!topic.trim() || !action.trim()) return;
        onAdd(userId, monthKey, topic, action);
        setTopic('');
        setAction('');
    };

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 shadow-sm border border-emerald-100 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-emerald-900 flex items-center text-lg">
                        <Sprout className="w-6 h-6 mr-2 text-emerald-600" />
                        แผนพัฒนารายบุคคล (IDP)
                    </h3>
                    <p className="text-emerald-700/70 text-xs mt-1">สิ่งที่ต้องพัฒนาให้ดีขึ้นในเดือนหน้า</p>
                </div>
                <div className="p-2 bg-white/50 rounded-xl">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-1">
                {items.length === 0 && (
                    <div className="text-center py-8 text-emerald-400/60 border-2 border-dashed border-emerald-200/50 rounded-xl">
                        <p>ยังไม่มีแผนพัฒนา</p>
                    </div>
                )}
                
                {items.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex items-start gap-3 group transition-all hover:shadow-md">
                        <button 
                            onClick={() => onToggle(item.id, item.status === 'DONE')}
                            disabled={readOnly}
                            className={`mt-1 shrink-0 ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
                        >
                            {item.status === 'DONE' 
                                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 
                                : <Circle className="w-5 h-5 text-gray-300" />
                            }
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-0.5">{item.topic}</p>
                            <p className={`text-sm text-gray-700 leading-snug ${item.status === 'DONE' ? 'line-through text-gray-400' : ''}`}>{item.actionPlan}</p>
                        </div>
                        {!readOnly && (
                            <button 
                                onClick={() => onDelete(item.id)}
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Form */}
            {!readOnly && (
                <div className="bg-white/60 p-3 rounded-xl border border-emerald-100">
                    <input 
                        type="text" 
                        placeholder="หัวข้อ (เช่น ตัดต่อ, ภาษาอังกฤษ)" 
                        className="w-full text-xs font-bold text-emerald-800 bg-transparent outline-none mb-2 placeholder:text-emerald-800/40"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="สิ่งที่ต้องทำ (Action Plan)" 
                            className="flex-1 text-sm bg-white rounded-lg border border-emerald-100 px-3 py-1.5 outline-none focus:border-emerald-300 transition-colors"
                            value={action}
                            onChange={e => setAction(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                        <button 
                            onClick={handleAdd}
                            disabled={!topic.trim() || !action.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IDPSection;
