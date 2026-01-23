
import React from 'react';
import { FeedbackItem, User } from '../../types';
import { ThumbsUp, Trash2, CheckCircle2, XCircle, ShieldAlert, Lightbulb, Heart, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface FeedbackCardProps {
    item: FeedbackItem;
    currentUser: User;
    onVote: (id: string, current: boolean) => void;
    onUpdateStatus: (id: string, status: any) => void;
    onDelete: (id: string) => void;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ item, currentUser, onVote, onUpdateStatus, onDelete }) => {
    const isAdmin = currentUser.role === 'ADMIN';
    const isOwner = false; // We can't really check owner if it's anonymous from the frontend logic unless we stored it locally or exposed it (which breaks anonymity)
    // Actually, API might return creatorName only if not anonymous. 
    // We shouldn't rely on 'isOwner' for deletion of anonymous items for safety, only Admin can delete.

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
        <div className={`bg-white rounded-2xl p-5 border ${getBorderColor()} shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
            
            {/* Status Ribbon for Admin View */}
            {item.status === 'PENDING' && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-2 py-0.5 rounded-bl-xl">
                    WAITING REVIEW
                </div>
            )}

            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${getBgColor()}`}>
                    {getIcon()}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="mb-2">
                            {item.isAnonymous ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                        <UserIcon className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">Anonymous (นินจา)</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <img src={item.creatorAvatar} className="w-6 h-6 rounded-full object-cover" />
                                    <span className="text-xs font-bold text-gray-700">{item.creatorName}</span>
                                </div>
                            )}
                            <span className="text-[10px] text-gray-400 ml-8 block -mt-1">
                                {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: th })}
                            </span>
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                        {item.content}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                        <button 
                            onClick={() => onVote(item.id, item.hasVoted)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${item.hasVoted ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            <ThumbsUp className={`w-3.5 h-3.5 ${item.hasVoted ? 'fill-indigo-600' : ''}`} />
                            {item.voteCount > 0 ? item.voteCount : 'เห็นด้วย'}
                        </button>

                        {/* Admin Actions */}
                        {isAdmin && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.status === 'PENDING' && (
                                    <>
                                        <button onClick={() => onUpdateStatus(item.id, 'APPROVED')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="อนุมัติ">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onUpdateStatus(item.id, 'REJECTED')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="ปฏิเสธ/ลบ">
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackCard;
