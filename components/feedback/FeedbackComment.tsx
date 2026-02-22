
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import th from 'date-fns/locale/th';
import { User as UserIcon } from 'lucide-react';

interface FeedbackCommentProps {
    comment: {
        id: string;
        content: string;
        createdAt: Date;
        user: {
            name: string;
            avatar: string;
        };
    };
}

const FeedbackComment: React.FC<FeedbackCommentProps> = ({ comment }) => {
    return (
        <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0 animate-in fade-in slide-in-from-left-2">
            <div className="shrink-0">
                {comment.user.avatar ? (
                    <img src={comment.user.avatar} className="w-8 h-8 rounded-full object-cover border border-gray-100" alt={comment.user.name} />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-700">{comment.user.name}</span>
                    <span className="text-[10px] text-gray-400">
                        {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: th } as any)}
                    </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                    {comment.content}
                </p>
            </div>
        </div>
    );
};

export default FeedbackComment;
