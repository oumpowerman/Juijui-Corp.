
import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const BUBBLE_THEMES = [
    { name: 'Pink', bg: 'from-pink-50 via-white to-rose-50', border: 'border-pink-200', text: 'text-pink-600', icon: 'text-pink-400 fill-pink-100', shadow: 'rgba(236, 72, 153, 0.2)' },
    { name: 'Blue', bg: 'from-sky-50 via-white to-blue-50', border: 'border-sky-200', text: 'text-sky-600', icon: 'text-sky-400 fill-sky-100', shadow: 'rgba(14, 165, 233, 0.2)' },
    { name: 'Purple', bg: 'from-purple-50 via-white to-violet-50', border: 'border-purple-200', text: 'text-purple-600', icon: 'text-purple-400 fill-purple-100', shadow: 'rgba(168, 85, 247, 0.2)' },
    { name: 'Orange', bg: 'from-orange-50 via-white to-amber-50', border: 'border-orange-200', text: 'text-orange-600', icon: 'text-orange-400 fill-orange-100', shadow: 'rgba(249, 115, 22, 0.2)' },
    { name: 'Green', bg: 'from-emerald-50 via-white to-green-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'text-emerald-400 fill-emerald-100', shadow: 'rgba(16, 185, 129, 0.2)' },
    { name: 'Teal', bg: 'from-teal-50 via-white to-cyan-50', border: 'border-teal-200', text: 'text-teal-600', icon: 'text-teal-400 fill-teal-100', shadow: 'rgba(20, 184, 166, 0.2)' },
    { name: 'Rose', bg: 'from-rose-50 via-white to-red-50', border: 'border-rose-200', text: 'text-rose-600', icon: 'text-rose-400 fill-rose-100', shadow: 'rgba(225, 29, 72, 0.2)' },
    { name: 'Indigo', bg: 'from-indigo-50 via-white to-violet-50', border: 'border-indigo-200', text: 'text-indigo-600', icon: 'text-indigo-400 fill-indigo-100', shadow: 'rgba(79, 70, 229, 0.2)' },
];

interface FeelingBubbleProps {
    userId: string;
    feeling: string | null | undefined;
    className?: string;
}

const FeelingBubble: React.FC<FeelingBubbleProps> = ({ userId, feeling, className = "" }) => {
    const theme = useMemo(() => {
        if (!userId) return BUBBLE_THEMES[0];
        const todayStr = new Date().toDateString(); 
        const seedString = userId + todayStr; 
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % BUBBLE_THEMES.length;
        return BUBBLE_THEMES[index];
    }, [userId]);

    if (!feeling) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ 
                opacity: 1, 
                y: [0, -6, 0],
                scale: 1,
                rotate: [-3, 3, -3]
            }}
            transition={{
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
                y: { repeat: Infinity, duration: 3.5, ease: "easeInOut" },
                rotate: { repeat: Infinity, duration: 3.5, ease: "easeInOut" }
            }}
            className={`absolute z-30 w-max max-w-[160px] origin-bottom-center ${className}`}
        >
            <div 
                className={`relative bg-gradient-to-r ${theme.bg} border-2 ${theme.border} ${theme.text} font-bold text-[10px] px-3 py-1.5 rounded-2xl rounded-bl-none flex items-center gap-1.5`} 
                style={{ boxShadow: `3px 3px 0px ${theme.shadow}` }}
            >
                <Sparkles className={`w-3 h-3 ${theme.icon} shrink-0`} />
                <span className="truncate italic">"{feeling}"</span>
            </div>
        </motion.div>
    );
};

export default FeelingBubble;
