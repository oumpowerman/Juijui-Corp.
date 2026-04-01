
import React, { useState } from 'react';
import { Wand2, X, Sparkles, FileText, Layout, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WikiAIDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string, type: 'OUTLINE' | 'FULL' | 'SOP') => Promise<void>;
    isGenerating: boolean;
    initialTitle?: string;
}

const WikiAIDialog: React.FC<WikiAIDialogProps> = ({ isOpen, onClose, onGenerate, isGenerating, initialTitle }) => {
    const [aiPrompt, setAiPrompt] = useState('');

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="absolute bottom-24 right-10 w-80 bg-white rounded-3xl shadow-2xl border border-indigo-100 z-[100] p-6 overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-bold text-indigo-700 flex items-center text-sm">
                            <Wand2 className="w-4 h-4 mr-2" /> Wiki AI Assistant
                        </h3>
                        <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 hover:bg-slate-50 rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none mb-4 transition-all placeholder:text-slate-300 leading-relaxed"
                        rows={3}
                        placeholder="What do you want to write? (e.g., 'SOP for video editing', 'JD for Creative')"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                    />
                    
                    <div className="space-y-2.5">
                        <button 
                            onClick={() => onGenerate(aiPrompt || initialTitle || '', 'OUTLINE')} 
                            disabled={isGenerating} 
                            className="w-full py-3 bg-white border border-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm group"
                        >
                            <Layout className="w-3.5 h-3.5 mr-2 opacity-50 group-hover:opacity-100" /> วางโครงสร้าง (Outline)
                        </button>
                        <button 
                            onClick={() => onGenerate(aiPrompt || initialTitle || '', 'SOP')} 
                            disabled={isGenerating} 
                            className="w-full py-3 bg-white border border-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all flex items-center justify-center shadow-sm group"
                        >
                            <List className="w-3.5 h-3.5 mr-2 opacity-50 group-hover:opacity-100" /> เขียน SOP (Step-by-Step)
                        </button>
                        <button 
                            onClick={() => onGenerate(aiPrompt || initialTitle || '', 'FULL')} 
                            disabled={isGenerating} 
                            className="w-full py-3.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center group"
                        >
                            {isGenerating ? (
                                <span className="flex items-center"><Sparkles className="w-3.5 h-3.5 mr-2 animate-spin" /> Thinking...</span>
                            ) : (
                                <span className="flex items-center"><FileText className="w-3.5 h-3.5 mr-2" /> เขียนเนื้อหาเต็ม (Full Page)</span>
                            )}
                        </button>
                    </div>
                    
                    <div className="mt-4 text-[10px] text-slate-400 text-center font-medium">
                        * AI may make mistakes. Please review carefully.
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WikiAIDialog;
