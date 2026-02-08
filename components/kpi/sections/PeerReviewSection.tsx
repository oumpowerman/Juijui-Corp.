
import React, { useState } from 'react';
import { PeerReview, User } from '../../../types';
import { Heart, Send, User as UserIcon, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import th from 'date-fns/locale/th';

interface PeerReviewSectionProps {
    reviews: PeerReview[];
    users: User[];
    currentUser: User;
    targetUserId: string; // The person being reviewed (or viewed)
    monthKey: string;
    onSendKudos: (toUserId: string, message: string, badge: string) => void;
    readOnly: boolean; // If true, can't send
}

const BADGES = [
    { key: 'TEAMWORK', label: 'Teamwork', icon: '🤝' },
    { key: 'HELPFUL', label: 'Helpful', icon: '🦸‍♂️' },
    { key: 'CREATIVE', label: 'Creative', icon: '🎨' },
    { key: 'LEADERSHIP', label: 'Leadership', icon: '🦁' },
    { key: 'FUN', label: 'Fun & Joy', icon: '🎉' },
];

const PeerReviewSection: React.FC<PeerReviewSectionProps> = ({ 
    reviews, users, currentUser, targetUserId, monthKey, onSendKudos, readOnly 
}) => {
    const [message, setMessage] = useState('');
    const [selectedBadge, setSelectedBadge] = useState('TEAMWORK');

    const handleSend = () => {
        if (!message.trim()) return;
        onSendKudos(targetUserId, message, selectedBadge);
        setMessage('');
    };

    return (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-6 shadow-sm border border-pink-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-pink-900 flex items-center text-lg">
                    <Heart className="w-6 h-6 mr-2 text-pink-500 fill-pink-500" />
                    คำชมจากเพื่อน (Kudos)
                </h3>
                <span className="bg-white/60 text-pink-600 px-3 py-1 rounded-full text-xs font-bold border border-pink-100">
                    {reviews.length} Kudos
                </span>
            </div>

            {/* List */}
            <div className="flex-1 space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-1">
                {reviews.length === 0 && (
                    <div className="text-center py-10 text-pink-300">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">ยังไม่มีคำชมในเดือนนี้</p>
                    </div>
                )}
                
                {reviews.map(review => (
                    <div key={review.id} className="bg-white p-3 rounded-xl border border-pink-100 shadow-sm flex gap-3">
                        <div className="shrink-0">
                            {review.fromUser?.avatarUrl ? (
                                <img src={review.fromUser.avatarUrl} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500"><UserIcon className="w-5 h-5" /></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-gray-700">{review.fromUser?.name || 'Unknown'}</span>
                                <span className="text-[10px] text-gray-400">{formatDistanceToNow(review.createdAt, { addSuffix: true, locale: th })}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{review.message}</p>
                            <div className="mt-2 inline-flex items-center gap-1 bg-pink-50 px-2 py-0.5 rounded text-[10px] font-bold text-pink-600 border border-pink-100">
                                {BADGES.find(b => b.key === review.badge)?.icon} {review.badge}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Send Form */}
            {!readOnly && currentUser.id !== targetUserId && (
                <div className="bg-white p-3 rounded-xl border border-pink-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 mb-2">ส่งกำลังใจให้เพื่อนหน่อย 👇</p>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                        {BADGES.map(b => (
                            <button
                                key={b.key}
                                onClick={() => setSelectedBadge(b.key)}
                                className={`
                                    px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border
                                    ${selectedBadge === b.key ? 'bg-pink-100 text-pink-700 border-pink-300' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-white'}
                                `}
                            >
                                {b.icon} {b.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200 focus:bg-white transition-all"
                            placeholder="พิมพ์คำชม..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!message.trim()}
                            className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeerReviewSection;
