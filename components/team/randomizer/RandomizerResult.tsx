import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, RotateCcw } from 'lucide-react';
import { User } from '../../../types';
import html2canvas from 'html2canvas';
import { useToast } from '../../../context/ToastContext';

interface RandomizerResultProps {
    winners: User[];
    topicLabel: string;
    onReset: () => void;
}

const RandomizerResult: React.FC<RandomizerResultProps> = ({ winners, topicLabel, onReset }) => {
    const resultRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    const handleDownload = async () => {
        if (!resultRef.current) return;
        try {
            const canvas = await html2canvas(resultRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true, // Allow external images like avatars
            });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `randomizer-result-${Date.now()}.png`;
            link.click();
        } catch (error) {
            console.error('Error saving image:', error);
            showToast('เกิดข้อผิดพลาดในการบันทึกรูปภาพ', 'error');
        }
    };

    return (
        <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="w-full flex flex-col items-center"
        >
            {/* The area to capture */}
            <div 
                ref={resultRef}
                className="w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-[2rem] p-8 sm:p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-inner border-4 border-white"
            >
                {/* Decorative background */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)', backgroundSize: '20px 20px' }} />
                
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2 relative z-10 text-center">
                    🎉 ขอแสดงความยินดี! 🎉
                </h2>
                <p className="text-lg sm:text-xl font-bold text-indigo-600 bg-white px-6 py-2 rounded-full shadow-sm relative z-10 mb-8 text-center">
                    {topicLabel}
                </p>

                <div className={`flex flex-wrap justify-center gap-6 sm:gap-10 relative z-10 ${winners.length > 2 ? 'max-w-2xl' : ''}`}>
                    {winners.map((winner, index) => (
                        <motion.div 
                            key={winner.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + (index * 0.1) }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-xl opacity-50 animate-pulse" />
                                <img 
                                    src={winner.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.name)}&background=random`}
                                    alt={winner.name}
                                    crossOrigin="anonymous"
                                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-2xl relative z-10"
                                />
                                {winners.length > 1 && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg z-20 border-2 border-white">
                                        #{index + 1}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-6 mb-1">
                                {winner.name}
                            </h3>
                            <p className="text-sm font-medium text-slate-500">
                                {winner.position || 'Team Member'}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-8 w-full max-w-sm">
                <button
                    onClick={handleDownload}
                    className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-lg"
                >
                    <Download className="w-5 h-5" />
                    บันทึกรูป
                </button>
                <button
                    onClick={onReset}
                    className="flex-1 py-4 bg-indigo-100 text-indigo-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-200 transition-colors shadow-sm"
                >
                    <RotateCcw className="w-5 h-5" />
                    สุ่มใหม่
                </button>
            </div>
        </motion.div>
    );
};

export default RandomizerResult;
