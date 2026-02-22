
import React, { useState, useEffect } from 'react';
import { FeedbackItem, User, FeedbackComment as FeedbackCommentType } from '../../types';
import { ThumbsUp, Trash2, CheckCircle2, XCircle, ShieldAlert, Lightbulb, Heart, User as UserIcon, MessageCircle, Repeat2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import th from 'date-fns/locale/th';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import FeedbackComment from './FeedbackComment';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackCardProps {
    item: FeedbackItem;
    currentUser: User;
    onVote: (id: string, current: boolean) => void;
    onUpdateStatus: (id: string, status: any) => void;
    onDelete: (id: string) => void;
    onFetchComments: (id: string) => Promise<FeedbackCommentType[]>;
    onSubmitComment: (id: string, content: string) => Promise<boolean>;
    onToggleRepost: (id: string, current: boolean) => void;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ 
    item, currentUser, onVote, onUpdateStatus, onDelete, 
    onFetchComments, onSubmitComment, onToggleRepost 
}) => {
    const { showConfirm } = useGlobalDialog();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [comments, setComments] = useState<FeedbackCommentType[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    const isAdmin = currentUser.role === 'ADMIN';

    useEffect(() => {
        if (isCommentsOpen) {
            loadComments();
        }
    }, [isCommentsOpen]);

    const loadComments = async () => {
        setIsLoadingComments(true);
        const data = await onFetchComments(item.id);
        setComments(data);
        setIsLoadingComments(false);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        const success = await onSubmitComment(item.id, newComment);
        if (success) {
            setNewComment('');
            loadComments();
        }
        setIsSubmittingComment(false);
    };

    const getIcon = () => {
        switch (item.type) {
            case 'IDEA': return <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-500" />;
            case 'ISSUE': return <ShieldAlert className="w-5 h-5 text-red-500" />;
            case 'SHOUTOUT': return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
            default: return <Lightbulb className="w-5 h-5" />;
        }
    };

    const getBorderColor = () => {
        switch (item.type) {
            case 'IDEA': return 'border-amber-100 hover:border-amber-200';
            case 'ISSUE': return 'border-red-100 hover:border-red-200';
            case 'SHOUTOUT': return 'border-pink-100 hover:border-pink-200';
            default: return 'border-gray-100';
        }
    };

    const getBgColor = () => {
        switch (item.type) {
            case 'IDEA': return 'bg-amber-50/30';
            case 'ISSUE': return 'bg-red-50/30';
            case 'SHOUTOUT': return 'bg-pink-50/30';
            default: return 'bg-white';
        }
    };

    return (
        <div className={`bg-white rounded-3xl p-6 border ${getBorderColor()} shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
            
            {/* Status Ribbon for Admin View */}
            {item.status === 'PENDING' && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-3 py-1 rounded-bl-2xl shadow-sm z-10">
                    WAITING REVIEW
                </div>
            )}

            <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl shrink-0 ${getBgColor()}`}>
                    {getIcon()}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            {item.isAnonymous ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                        <UserIcon className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-black text-gray-600">Anonymous (นินจา)</span>
                                        <span className="text-[10px] text-gray-400 block -mt-0.5">
                                            {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: th } as any)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <img src={item.creatorAvatar} className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-sm" alt={item.creatorName} />
                                    <div>
                                        <span className="text-sm font-black text-gray-800">{item.creatorName}</span>
                                        <span className="text-[10px] text-gray-400 block -mt-0.5">
                                            {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: th } as any)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Admin Actions */}
                        {isAdmin && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 p-1 rounded-xl border border-gray-100">
                                {item.status === 'PENDING' && (
                                    <>
                                        <button 
                                            onClick={async () => {
                                                const ok = await showConfirm(
                                                    'คุณต้องการอนุมัติข้อความนี้ให้แสดงบนบอร์ดสาธารณะใช่หรือไม่?',
                                                    'ยืนยันการอนุมัติ ✅'
                                                );
                                                if (ok) onUpdateStatus(item.id, 'APPROVED');
                                            }} 
                                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors" 
                                            title="อนุมัติ"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                const ok = await showConfirm(
                                                    'คุณต้องการปฏิเสธข้อความนี้ใช่หรือไม่? (ข้อความจะไม่แสดงบนบอร์ด)',
                                                    'ยืนยันการปฏิเสธ ❌'
                                                );
                                                if (ok) onUpdateStatus(item.id, 'REJECTED');
                                            }} 
                                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
                                            title="ปฏิเสธ"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button 
                                    onClick={async () => {
                                        const ok = await showConfirm(
                                            'คุณต้องการลบข้อความนี้อย่างถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
                                            'ยืนยันการลบถาวร 🗑️'
                                        );
                                        if (ok) onDelete(item.id);
                                    }} 
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                    title="ลบถาวร"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap font-medium mb-6">
                        {item.content}
                    </p>

                    <div className="flex items-center gap-6 border-t border-gray-50 pt-4">
                        <button 
                            onClick={() => onVote(item.id, item.hasVoted)}
                            className={`flex items-center gap-2 transition-all group/btn ${item.hasVoted ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}
                        >
                            <div className={`p-2 rounded-full transition-colors ${item.hasVoted ? 'bg-indigo-50' : 'group-hover/btn:bg-indigo-50'}`}>
                                <ThumbsUp className={`w-4 h-4 ${item.hasVoted ? 'fill-indigo-600' : ''}`} />
                            </div>
                            <span className="text-xs font-bold">{item.voteCount || 0}</span>
                        </button>

                        <button 
                            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                            className={`flex items-center gap-2 transition-all group/btn ${isCommentsOpen ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                        >
                            <div className={`p-2 rounded-full transition-colors ${isCommentsOpen ? 'bg-blue-50' : 'group-hover/btn:bg-blue-50'}`}>
                                <MessageCircle className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold">{item.commentCount || 0}</span>
                        </button>

                        <button 
                            onClick={() => onToggleRepost(item.id, item.hasReposted)}
                            className={`flex items-center gap-2 transition-all group/btn ${item.hasReposted ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-600'}`}
                        >
                            <div className={`p-2 rounded-full transition-colors ${item.hasReposted ? 'bg-emerald-50' : 'group-hover/btn:bg-emerald-50'}`}>
                                <Repeat2 className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold">{item.repostCount || 0}</span>
                        </button>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                        {isCommentsOpen && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 pt-4 border-t border-gray-50 space-y-4">
                                    {/* Comment Input */}
                                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="เขียนคอมเมนต์..."
                                            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-200 focus:bg-white transition-all"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!newComment.trim() || isSubmittingComment}
                                            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>

                                    {/* Comments List */}
                                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {isLoadingComments ? (
                                            <div className="py-4 text-center text-xs text-gray-400 animate-pulse">กำลังโหลดคอมเมนต์...</div>
                                        ) : comments.length === 0 ? (
                                            <div className="py-4 text-center text-xs text-gray-400 italic">ยังไม่มีคอมเมนต์ มาเริ่มคนแรกกัน!</div>
                                        ) : (
                                            comments.map(c => (
                                                <FeedbackComment key={c.id} comment={{
                                                    id: c.id,
                                                    content: c.content,
                                                    createdAt: c.createdAt,
                                                    user: {
                                                        name: c.user?.name || 'Unknown',
                                                        avatar: c.user?.avatarUrl || ''
                                                    }
                                                }} />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default FeedbackCard;
