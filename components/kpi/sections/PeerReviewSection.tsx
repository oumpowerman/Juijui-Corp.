
import React, { useState } from 'react';
import { PeerReview, User } from '../../../types';
import { Heart, Send, User as UserIcon, MessageCircle, Sparkles, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import th from 'date-fns/locale/th';
import { motion, AnimatePresence } from 'framer-motion';

interface PeerReviewSectionProps {
    reviews: PeerReview[];
    users: User[];
    currentUser: User;
    targetUserId: string; // The person being reviewed (or viewed)
    monthKey: string;
    onSendKudos: (toUserId: string, message: string, badge: string) => void;
    readOnly: boolean; // If true, can't send
    title?: string;
    variant?: 'received' | 'sent';
}

const BADGES = [
    { key: 'TEAMWORK', label: 'Teamwork', icon: '🤝' },
    { key: 'HELPFUL', label: 'Helpful', icon: '🦸‍♂️' },
    { key: 'CREATIVE', label: 'Creative', icon: '🎨' },
    { key: 'LEADERSHIP', label: 'Leadership', icon: '🦁' },
    { key: 'FUN', label: 'Fun & Joy', icon: '🎉' },
];

const PeerReviewSection: React.FC<PeerReviewSectionProps> = ({ 
    reviews, users, currentUser, targetUserId, monthKey, onSendKudos, readOnly,
    title = 'คำชมจากทีม (Kudos)',
    variant = 'received'
}) => {
    const [message, setMessage] = useState('');
    const [selectedBadge, setSelectedBadge] = useState('TEAMWORK');

    const handleSend = () => {
        if (!message.trim()) return;
        onSendKudos(targetUserId, message, selectedBadge);
        setMessage('');
    };

    const isSent = variant === 'sent';

    return (
        <div className={`bg-gradient-to-br ${isSent ? 'from-indigo-50 via-white to-blue-50 border-indigo-100' : 'from-pink-50 via-white to-rose-50 border-pink-100'} rounded-[2.5rem] p-8 shadow-xl border flex flex-col relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${isSent ? 'bg-indigo-100/30' : 'bg-pink-100/30'} rounded-bl-full -mr-8 -mt-8 blur-2xl`}></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h3 className={`font-bold ${isSent ? 'text-indigo-900' : 'text-pink-900'} flex items-center text-2xl tracking-tight`}>
                        {isSent ? (
                            <Sparkles className="w-8 h-8 mr-3 text-indigo-500 animate-pulse" />
                        ) : (
                            <Heart className="w-8 h-8 mr-3 text-pink-500 fill-pink-500 animate-pulse" />
                        )}
                        {title}
                    </h3>
                    <p className={`${isSent ? 'text-indigo-700/60' : 'text-pink-700/60'} text-sm font-bold mt-1 ml-11`}>
                        {isSent ? 'ประวัติความภูมิใจที่คุณได้ส่งต่อพลังบวก' : 'ส่งต่อพลังบวกให้เพื่อนร่วมทีมของคุณ!'}
                    </p>
                </div>
                <div className={`bg-white px-4 py-2 rounded-2xl ${isSent ? 'text-indigo-600 border-indigo-100' : 'text-pink-600 border-pink-100'} text-sm font-bold border shadow-sm flex items-center gap-2`}>
                    <Trophy className="w-4 h-4" /> {reviews.length}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                <AnimatePresence mode="popLayout">
                    {reviews.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`text-center py-12 ${isSent ? 'text-indigo-300 border-indigo-100' : 'text-pink-300 border-pink-100'} border-4 border-dashed rounded-[2rem] bg-white/50`}
                        >
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">{isSent ? 'คุณยังไม่ได้ส่งคำชมให้ใครเลย มาเริ่มกัน!' : 'ยังไม่มีคำชมในเดือนนี้ มาเริ่มส่งกันเลย!'}</p>
                        </motion.div>
                    ) : (
                        reviews.map((review, idx) => (
                            <motion.div 
                                key={review.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                className={`bg-white p-5 rounded-[1.5rem] border ${isSent ? 'border-indigo-100 hover:border-indigo-200' : 'border-pink-100 hover:border-pink-200'} shadow-sm flex gap-4 group/item transition-all hover:shadow-md`}
                            >
                                <div className="shrink-0">
                                    {isSent ? (
                                        // Show recipient avatar if it's a sent kudos
                                        // We need to find the user in the users list
                                        (() => {
                                            const toUser = users.find(u => u.id === review.toUserId);
                                            return toUser?.avatarUrl ? (
                                                <img src={toUser.avatarUrl} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-indigo-50" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-500"><UserIcon className="w-6 h-6" /></div>
                                            );
                                        })()
                                    ) : (
                                        review.fromUser?.avatarUrl ? (
                                            <img src={review.fromUser.avatarUrl} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-pink-50" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-500"><UserIcon className="w-6 h-6" /></div>
                                        )
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-bold text-gray-800">
                                            {isSent ? (
                                                <>ถึง: {users.find(u => u.id === review.toUserId)?.name || 'Unknown'}</>
                                            ) : (
                                                <>{review.fromUser?.name || 'Unknown'}</>
                                            )}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">{formatDistanceToNow(review.createdAt, { addSuffix: true, locale: th })}</span>
                                    </div>
                                    <p className="text-base text-gray-600 font-medium leading-relaxed italic">"{review.message}"</p>
                                    <div className={`mt-3 inline-flex items-center gap-2 ${isSent ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-pink-50 text-pink-600 border-pink-100'} px-3 py-1 rounded-xl text-[11px] font-bold border uppercase tracking-wider`}>
                                        <Sparkles className="w-3 h-3" /> {BADGES.find(b => b.key === review.badge)?.icon} {review.badge}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Send Form */}
            {!readOnly && currentUser.id !== targetUserId && (
                <motion.div 
                    layout
                    className="bg-white p-5 rounded-[2rem] border-2 border-pink-100 shadow-lg relative z-10"
                >
                    <p className="text-xs font-bold text-pink-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Send className="w-4 h-4" /> ส่งกำลังใจให้เพื่อนหน่อย 👇
                    </p>
                    
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                        {BADGES.map(b => (
                            <motion.button
                                key={b.key}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedBadge(b.key)}
                                className={`
                                    px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2
                                    ${selectedBadge === b.key ? 'bg-pink-500 text-white border-pink-400 shadow-md' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-white hover:border-pink-100'}
                                `}
                            >
                                {b.icon} {b.label}
                            </motion.button>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <input 
                            type="text" 
                            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-200 focus:bg-white transition-all"
                            placeholder="พิมพ์คำชมที่จริงใจ..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                        />
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSend}
                            disabled={!message.trim()}
                            className="bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-pink-200"
                        >
                            <Send className="w-6 h-6" />
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default PeerReviewSection;
