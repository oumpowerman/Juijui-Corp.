
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send, Sparkles, ShieldCheck, Lightbulb, Users, Smile } from 'lucide-react';

interface PraiseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string, badge: string) => void;
    remainingKudos: number;
    targetUserName: string;
    targetUserAvatar: string;
}

const BADGES = [
    { id: 'TEAMWORK', label: 'Teamwork Hero', icon: Users, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200', description: 'ทำงานเป็นทีมยอดเยี่ยม' },
    { id: 'HELPFUL', label: 'Super Helpful', icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200', description: 'ช่วยเหลือเพื่อนเสมอ' },
    { id: 'CREATIVE', label: 'Creative Mind', icon: Lightbulb, color: 'bg-amber-100 text-amber-600', border: 'border-amber-200', description: 'ไอเดียบรรเจิด' },
    { id: 'LEADERSHIP', label: 'Leadership', icon: Sparkles, color: 'bg-purple-100 text-purple-600', border: 'border-purple-200', description: 'ความเป็นผู้นำโดดเด่น' },
    { id: 'FUN', label: 'Positive Vibe', icon: Smile, color: 'bg-pink-100 text-pink-600', border: 'border-pink-200', description: 'สร้างรอยยิ้มให้ทีม' },
];

const PraiseModal: React.FC<PraiseModalProps> = ({ isOpen, onClose, onSend, remainingKudos, targetUserName, targetUserAvatar }) => {
    const [message, setMessage] = useState('');
    const [selectedBadge, setSelectedBadge] = useState(BADGES[0].id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || remainingKudos <= 0) return;
        onSend(message, selectedBadge);
        setMessage('');
        onClose();
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-rose-900/20 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xl bg-white rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(244,63,94,0.2)] border border-rose-100 p-10 overflow-hidden"
                    >
                        {/* Decorative background */}
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-rose-100/40 rounded-full blur-3xl" />
                        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-pink-100/40 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                        <img 
                                            src={targetUserAvatar} 
                                            alt={targetUserName}
                                            className="w-20 h-20 rounded-[2rem] object-cover border-4 border-white shadow-xl"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                                            <Heart className="w-4 h-4 text-white fill-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">ส่งพลังบวกให้ {targetUserName}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-sm font-bold">
                                                เหลือ {remainingKudos} หัวใจในเดือนนี้ ❤️
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">เลือกเหรียญตราแห่งความภูมิใจ</label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {BADGES.map((badge) => {
                                            const Icon = badge.icon;
                                            const isSelected = selectedBadge === badge.id;
                                            return (
                                                <button
                                                    key={badge.id}
                                                    type="button"
                                                    onClick={() => setSelectedBadge(badge.id)}
                                                    className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border-2 transition-all duration-300 ${
                                                        isSelected 
                                                        ? `${badge.border} ${badge.color} scale-105 shadow-lg ring-4 ring-white` 
                                                        : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <Icon className="w-8 h-8" />
                                                    <span className="text-[10px] font-black text-center leading-tight uppercase tracking-wider">{badge.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">ข้อความชื่นชมที่จริงใจ</label>
                                    <div className="relative">
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder={`บอกความประทับใจที่คุณมีต่อ ${targetUserName}...`}
                                            rows={4}
                                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-[2.5rem] px-8 py-6 text-lg text-gray-700 font-medium placeholder:text-gray-300 focus:bg-white focus:border-rose-200 outline-none transition-all resize-none shadow-inner"
                                        />
                                        <div className="absolute bottom-6 right-8 text-xs font-bold text-gray-300">
                                            {message.length} ตัวอักษร
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={!message.trim() || remainingKudos <= 0}
                                    className="w-full bg-gradient-to-r from-rose-500 via-pink-600 to-rose-500 bg-[length:200%_auto] hover:bg-right text-white py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-rose-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-4"
                                >
                                    <Send className="w-6 h-6" />
                                    ส่งพลังบวกเลย!
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default PraiseModal;

