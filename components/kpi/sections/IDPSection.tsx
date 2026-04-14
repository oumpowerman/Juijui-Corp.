
import React, { useState } from 'react';
import { IDPItem } from '../../../types';
import { Sprout, CheckCircle2, Circle, Plus, Trash2, BookOpen, Rocket, Zap, ChevronUp, ChevronDown, Calendar, Tag, ListTodo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import IDPModal from '../modals/IDPModal';
import { format } from 'date-fns';

interface IDPSectionProps {
    items: IDPItem[];
    userId: string;
    monthKey: string;
    onAdd: (userId: string, monthKey: string, topic: string, actionPlan: string, category?: string, targetDate?: Date, subGoals?: { title: string }[]) => void;
    onToggle: (id: string, isDone: boolean) => void;
    onToggleSubGoal: (itemId: string, subGoalId: string) => void;
    onReorder: (items: IDPItem[]) => void;
    onDelete: (id: string) => void;
    readOnly: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
    'HARD_SKILLS': 'bg-blue-100 text-blue-600',
    'SOFT_SKILLS': 'bg-purple-100 text-purple-600',
    'LEADERSHIP': 'bg-amber-100 text-amber-600',
    'MINDSET': 'bg-rose-100 text-rose-600',
};

const IDPSection: React.FC<IDPSectionProps> = ({ 
    items, userId, monthKey, onAdd, onToggle, onToggleSubGoal, onReorder, onDelete, readOnly 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAdd = (topic: string, actionPlan: string, category: string, targetDate: Date, subGoals: { title: string }[]) => {
        onAdd(userId, monthKey, topic, actionPlan, category, targetDate, subGoals);
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...items];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= items.length) return;
        
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        onReorder(newItems);
    };

    return (
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-[2.5rem] p-8 shadow-xl border border-emerald-100 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-bl-full -mr-8 -mt-8 blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <h3 className="font-bold text-emerald-900 flex items-center text-2xl tracking-tight">
                        <Rocket className="w-8 h-8 mr-3 text-emerald-600 animate-bounce" />
                        เส้นทางการเติบโต (Growth Path)
                    </h3>
                    <p className="text-emerald-700/60 text-sm font-bold mt-1 ml-11">ยกระดับทักษะของคุณให้เหนือกว่าเดิม!</p>
                </div>
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-100">
                    <BookOpen className="w-6 h-6 text-emerald-500" />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-emerald-400/60 border-4 border-dashed border-emerald-100 rounded-[2rem] bg-white/50"
                        >
                            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">ยังไม่มีแผนพัฒนาในขณะนี้</p>
                        </motion.div>
                    ) : (
                        items.map((item, idx) => (
                            <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ scale: 1.02, x: 5 }}
                                className="bg-white p-5 rounded-[1.5rem] border border-emerald-100 shadow-sm flex items-start gap-4 group/item transition-all hover:shadow-md hover:border-emerald-200 relative overflow-hidden"
                            >
                                {/* Rank Indicator */}
                                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50/50 rounded-bl-3xl flex items-center justify-center pointer-events-none">
                                    <span className="text-xs font-black text-emerald-300">#{idx + 1}</span>
                                </div>

                                <button 
                                    onClick={() => onToggle(item.id, item.status !== 'DONE')}
                                    disabled={readOnly}
                                    className={`mt-1 shrink-0 ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-125 transition-transform active:scale-90'}`}
                                >
                                    {item.status === 'DONE' 
                                        ? <CheckCircle2 className="w-7 h-7 text-emerald-500 fill-emerald-50" /> 
                                        : <Circle className="w-7 h-7 text-gray-200 hover:text-emerald-300" />
                                    }
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {idx === 0 && (
                                            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm animate-pulse">
                                                TOP PRIORITY
                                            </span>
                                        )}
                                        <p className="text-sm font-bold text-emerald-900 uppercase tracking-wider">{item.topic}</p>
                                        {item.category && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-500'}`}>
                                                {item.category.replace('_', ' ')}
                                            </span>
                                        )}
                                        {item.targetDate && (
                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(item.targetDate), 'dd MMM yyyy')}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-base text-gray-600 leading-relaxed font-medium ${item.status === 'DONE' ? 'line-through text-gray-400' : ''}`}>{item.actionPlan}</p>
                                    
                                    {/* Sub Goals List */}
                                    {item.subGoals && item.subGoals.length > 0 && (
                                        <div className="mt-4 space-y-2 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <ListTodo className="w-3 h-3" /> เป้าหมายย่อย ({item.subGoals.filter(sg => sg.isDone).length}/{item.subGoals.length})
                                            </p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {item.subGoals.map((sg) => (
                                                    <button
                                                        key={sg.id}
                                                        disabled={readOnly}
                                                        onClick={() => onToggleSubGoal(item.id, sg.id)}
                                                        className="flex items-center gap-3 text-left group/sg"
                                                    >
                                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${sg.isDone ? 'bg-emerald-500 border-emerald-500' : 'border-emerald-200 group-hover/sg:border-emerald-400'}`}>
                                                            {sg.isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <span className={`text-sm font-medium transition-all ${sg.isDone ? 'text-emerald-700 line-through opacity-60' : 'text-gray-700'}`}>
                                                            {sg.title}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Progress Bar */}
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between items-center text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
                                            <span>Progress Status</span>
                                            <span className="bg-emerald-100 px-2 py-0.5 rounded-lg">{item.progress}%</span>
                                        </div>
                                        <div className="relative w-full h-2.5 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100/50">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.progress}%` }}
                                                transition={{ duration: 1, ease: "circOut" }}
                                                className={`absolute top-0 left-0 h-full transition-all duration-500 ${item.progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}
                                            ></motion.div>
                                        </div>
                                    </div>
                                </div>
                                {!readOnly && (
                                    <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => moveItem(idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-400 hover:text-emerald-600 disabled:opacity-20 transition-colors"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => moveItem(idx, 'down')}
                                                disabled={idx === items.length - 1}
                                                className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-400 hover:text-emerald-600 disabled:opacity-20 transition-colors"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => onDelete(item.id)}
                                            className="text-gray-200 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl flex justify-center"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Add Button */}
            {!readOnly && (
                <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(true)}
                    className="mt-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5 rounded-[1.5rem] font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 relative z-10"
                >
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                    </div>
                    เพิ่มเป้าหมายการเติบโตใหม่
                </motion.button>
            )}

            <IDPModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAdd}
            />
        </div>
    );
};

export default IDPSection;
