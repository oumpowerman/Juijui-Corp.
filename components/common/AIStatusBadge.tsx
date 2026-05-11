
import React from 'react';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIStatusBadgeProps {
    collapsed?: boolean;
}

const AIStatusBadge: React.FC<AIStatusBadgeProps> = ({ collapsed = false }) => {
    // Check if Gemini API Key is available
    // In this environment, we check process.env.GEMINI_API_KEY
    const isAvailable = !!process.env.GEMINI_API_KEY;

    if (collapsed) {
        return (
            <div 
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${
                    isAvailable 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-rose-500/10 text-rose-500'
                }`}
                title={isAvailable ? 'AI System: Active' : 'AI System: Offline (Missing API Key)'}
            >
                {isAvailable ? <Sparkles className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all duration-300 ${
                isAvailable 
                    ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' 
                    : 'bg-rose-50/50 border-rose-100 text-rose-700'
            }`}
        >
            <div className={`p-1 rounded-full ${isAvailable ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {isAvailable ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            </div>
            
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-60 leading-none">System Status</span>
                <span className="text-xs font-bold leading-tight">AI {isAvailable ? 'Active' : 'Offline'}</span>
            </div>

            {isAvailable && (
                <div className="ml-auto flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default AIStatusBadge;
