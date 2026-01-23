
import React, { useState } from 'react';
import { Wand2, X, Sparkles } from 'lucide-react';

interface AIDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => Promise<void>;
    isGenerating: boolean;
    initialTitle?: string;
}

const AIDialog: React.FC<AIDialogProps> = ({ isOpen, onClose, onGenerate, isGenerating, initialTitle }) => {
    const [aiPrompt, setAiPrompt] = useState('');

    if (!isOpen) return null;

    return (
        <div className="absolute top-16 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-indigo-100 z-50 p-5 animate-in slide-in-from-right-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-indigo-700 flex items-center text-sm">
                    <Wand2 className="w-4 h-4 mr-2" /> AI Assistant
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-gray-100 rounded-full">
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <textarea 
                className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none resize-none mb-3 transition-all placeholder:text-indigo-300"
                rows={3}
                placeholder="อยากให้ช่วยอะไร? (เช่น คิด Hook, เขียนบทนำ...)"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
            />
            
            <div className="flex flex-col gap-2.5">
                <button 
                    onClick={() => onGenerate(aiPrompt || initialTitle || '', 'HOOK')} 
                    disabled={isGenerating} 
                    className="w-full py-2.5 bg-white border border-indigo-100 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center shadow-sm"
                >
                    🪝 คิด Hook (5 วิแรก)
                </button>
                <button 
                    onClick={() => onGenerate(aiPrompt || initialTitle || '', 'OUTLINE')} 
                    disabled={isGenerating} 
                    className="w-full py-2.5 bg-white border border-purple-100 text-purple-600 text-xs font-bold rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all flex items-center justify-center shadow-sm"
                >
                    📑 วางโครงเรื่อง (Outline)
                </button>
                <button 
                    onClick={() => onGenerate(aiPrompt || initialTitle || '', 'FULL')} 
                    disabled={isGenerating} 
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center group"
                >
                    {isGenerating ? (
                        <span className="flex items-center"><Sparkles className="w-3 h-3 mr-2 animate-spin" /> กำลังคิด...</span>
                    ) : (
                        <span className="flex items-center"><Wand2 className="w-3 h-3 mr-2" /> เขียนบทเต็ม (Full Script)</span>
                    )}
                </button>
            </div>
            <div className="mt-3 text-[10px] text-gray-400 text-center">
                * AI อาจมีข้อผิดพลาด โปรดตรวจสอบความถูกต้อง
            </div>
        </div>
    );
};

export default AIDialog;
