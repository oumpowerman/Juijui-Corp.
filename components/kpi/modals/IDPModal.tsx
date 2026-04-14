
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Calendar, Tag, MessageSquare, Sparkles, Rocket, ListTodo, Plus, Minus } from 'lucide-react';

interface IDPModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (topic: string, actionPlan: string, category: string, targetDate: Date, subGoals: { title: string }[]) => void;
}

const CATEGORIES = [
    { label: 'Hard Skills', value: 'HARD_SKILLS', color: 'bg-blue-100 text-blue-600' },
    { label: 'Soft Skills', value: 'SOFT_SKILLS', color: 'bg-purple-100 text-purple-600' },
    { label: 'Leadership', value: 'LEADERSHIP', color: 'bg-amber-100 text-amber-600' },
    { label: 'Mindset', value: 'MINDSET', color: 'bg-rose-100 text-rose-600' },
];

const IDPModal: React.FC<IDPModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [topic, setTopic] = useState('');
    const [actionPlan, setActionPlan] = useState('');
    const [category, setCategory] = useState('HARD_SKILLS');
    const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
    const [subGoals, setSubGoals] = useState<{ title: string }[]>([]);
    const [newSubGoal, setNewSubGoal] = useState('');

    const addSubGoal = () => {
        if (!newSubGoal.trim()) return;
        setSubGoals([...subGoals, { title: newSubGoal.trim() }]);
        setNewSubGoal('');
    };

    const removeSubGoal = (index: number) => {
        setSubGoals(subGoals.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim() || !actionPlan.trim()) return;
        onAdd(topic, actionPlan, category, new Date(targetDate), subGoals);
        setTopic('');
        setActionPlan('');
        setSubGoals([]);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-white/40 backdrop-blur-xl"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xl bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-white/50 p-10 overflow-hidden"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-200/20 to-rose-200/20 rounded-full blur-3xl -ml-32 -mb-32" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                        <Rocket className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">วางแผนการเติบโต</h2>
                                        <p className="text-sm font-medium text-gray-500">ก้าวต่อไปที่ยิ่งใหญ่ เริ่มต้นที่นี่ ✨</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Topic */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Target className="w-3 h-3" /> หัวข้อการพัฒนา
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="เช่น ทักษะการสื่อสาร, การเขียน Code, ภาษาอังกฤษ"
                                        className="w-full bg-white/50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold placeholder:text-gray-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Action Plan */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" /> แผนการลงมือทำ (Action Plan)
                                    </label>
                                    <textarea
                                        value={actionPlan}
                                        onChange={(e) => setActionPlan(e.target.value)}
                                        placeholder="ระบุขั้นตอนที่คุณจะทำเพื่อให้บรรลุเป้าหมายนี้..."
                                        rows={2}
                                        className="w-full bg-white/50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-medium placeholder:text-gray-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Tag className="w-3 h-3" /> หมวดหมู่
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-white/50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Target Date */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> วันที่เป้าหมาย
                                        </label>
                                        <input
                                            type="date"
                                            value={targetDate}
                                            onChange={(e) => setTargetDate(e.target.value)}
                                            className="w-full bg-white/50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Sub Goals */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <ListTodo className="w-3 h-3" /> เป้าหมายย่อย (Sub-goals)
                                    </label>
                                    
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSubGoal}
                                            onChange={(e) => setNewSubGoal(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubGoal())}
                                            placeholder="เพิ่มเป้าหมายย่อย..."
                                            className="flex-1 bg-white/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={addSubGoal}
                                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {subGoals.map((sg, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                key={idx}
                                                className="flex items-center justify-between bg-gray-50/50 p-3 rounded-xl border border-gray-100 group"
                                            >
                                                <span className="text-sm font-medium text-gray-700">{sg.title}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubGoal(idx)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={!topic.trim() || !actionPlan.trim()}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3"
                                    >
                                        <Sparkles className="w-6 h-6" />
                                        สร้างเป้าหมายการเติบโต
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default IDPModal;
