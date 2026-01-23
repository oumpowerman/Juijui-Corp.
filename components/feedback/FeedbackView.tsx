
import React, { useState } from 'react';
import { User } from '../../types';
import { useFeedback } from '../../hooks/useFeedback';
import FeedbackCard from './FeedbackCard';
import FeedbackForm from './FeedbackForm';
import FeedbackStats from './FeedbackStats';
import MentorTip from '../MentorTip';
import { Inbox, ShieldCheck } from 'lucide-react';
import Skeleton from '../ui/Skeleton';

interface FeedbackViewProps {
    currentUser: User;
}

const FeedbackView: React.FC<FeedbackViewProps> = ({ currentUser }) => {
    const { feedbacks, isLoading, submitFeedback, toggleVote, updateStatus, deleteFeedback } = useFeedback(currentUser);
    const [tab, setTab] = useState<'BOARD' | 'ADMIN'>('BOARD');
    const isAdmin = currentUser.role === 'ADMIN';

    // Filter Logic
    const approvedFeedbacks = feedbacks.filter(f => f.status === 'APPROVED');
    const pendingFeedbacks = feedbacks.filter(f => f.status === 'PENDING' || f.status === 'REJECTED'); // Admins see pending/rejected in admin tab

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="pink" messages={[
                "พื้นที่ปลอดภัยสำหรับทุกคน! อยากเสนอไอเดียหรือชมเพื่อน จัดไป!",
                "เลือก 'Anonymous' ได้นะ ถ้ายอมรับความจริงกันได้ ทีมจะแกร่งขึ้นแน่นอน",
                "Admin จะคอยดูอยู่ห่างๆ เพื่อความเรียบร้อยครับ"
            ]} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        เสียงจากทีม 📣 (Voice of Team)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        เสนอแนะ, แจ้งปัญหา, หรือชื่นชมเพื่อนร่วมงาน
                    </p>
                </div>

                {isAdmin && (
                    <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                        <button 
                            onClick={() => setTab('BOARD')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'BOARD' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Public Board
                        </button>
                        <button 
                            onClick={() => setTab('ADMIN')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${tab === 'ADMIN' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <ShieldCheck className="w-3 h-3" /> Inbox ({pendingFeedbacks.length})
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Input Form (Only show on Public Board) */}
                    {tab === 'BOARD' && (
                        <FeedbackForm onSubmit={submitFeedback} />
                    )}

                    {/* Feed List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wider pl-1">
                            {tab === 'BOARD' ? 'ล่าสุด (Latest Updates)' : 'รอการตรวจสอบ (Moderation Queue)'}
                        </h3>
                        
                        {isLoading ? (
                             <div className="space-y-4">
                                {Array.from({length: 3}).map((_, i) => (
                                     <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                         <div className="flex items-start gap-4">
                                             <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                                             <div className="flex-1 space-y-2">
                                                 <div className="flex justify-between">
                                                     <Skeleton className="w-32 h-4 rounded" />
                                                     <Skeleton className="w-16 h-3 rounded" />
                                                 </div>
                                                 <Skeleton className="w-full h-16 rounded-xl" />
                                                 <div className="flex justify-between pt-2">
                                                     <Skeleton className="w-20 h-6 rounded-full" />
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                ))}
                             </div>
                        ) : (
                            <>
                                {(tab === 'BOARD' ? approvedFeedbacks : pendingFeedbacks).length === 0 ? (
                                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
                                        <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400 font-medium">ยังไม่มีข้อมูลในส่วนนี้</p>
                                    </div>
                                ) : (
                                    (tab === 'BOARD' ? approvedFeedbacks : pendingFeedbacks).map(item => (
                                        <FeedbackCard 
                                            key={item.id} 
                                            item={item} 
                                            currentUser={currentUser}
                                            onVote={toggleVote}
                                            onUpdateStatus={updateStatus}
                                            onDelete={deleteFeedback}
                                        />
                                    ))
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Stats & Info */}
                <div className="hidden lg:block">
                    <div className="sticky top-6">
                        <FeedbackStats items={feedbacks} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackView;
