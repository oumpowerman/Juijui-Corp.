
import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { useFeedback } from '../../hooks/useFeedback';
import FeedbackCard from './FeedbackCard';
import FeedbackForm from './FeedbackForm';
import FeedbackStats from './FeedbackStats';
import FeedbackControls, { FilterOption, SortOption } from './FeedbackControls'; // New Import
import FeedbackPagination from './FeedbackPagination'; // New Import
import MentorTip from '../MentorTip';
import { Inbox, ShieldCheck, Info } from 'lucide-react';
import Skeleton from '../ui/Skeleton';
import InfoModal from '../ui/InfoModal';
import FeedbackGuide from './FeedbackGuide';

interface FeedbackViewProps {
    currentUser: User;
}

const ITEMS_PER_PAGE = 6; // Configurable: How many items per page

const FeedbackView: React.FC<FeedbackViewProps> = ({ currentUser }) => {
    const { feedbacks, isLoading, submitFeedback, toggleVote, updateStatus, deleteFeedback } = useFeedback(currentUser);
    const [tab, setTab] = useState<'BOARD' | 'ADMIN'>('BOARD');
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const isAdmin = currentUser.role === 'ADMIN';

    // --- NEW STATE: Filter & Pagination ---
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
    const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
    const [currentPage, setCurrentPage] = useState(1);

    // --- Data Processing Logic ---
    const approvedFeedbacks = feedbacks.filter(f => f.status === 'APPROVED');
    const pendingFeedbacks = feedbacks.filter(f => f.status === 'PENDING' || f.status === 'REJECTED');

    const sourceData = tab === 'BOARD' ? approvedFeedbacks : pendingFeedbacks;

    // 1. Filtering
    const filteredData = useMemo(() => {
        return sourceData.filter(item => {
            const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (item.creatorName && item.creatorName.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesType = activeFilter === 'ALL' || item.type === activeFilter;
            return matchesSearch && matchesType;
        });
    }, [sourceData, searchQuery, activeFilter]);

    // 2. Sorting
    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            if (sortBy === 'VOTES') {
                return b.voteCount - a.voteCount;
            } else if (sortBy === 'OLDEST') {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else {
                // NEWEST (Default)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    }, [filteredData, sortBy]);

    // 3. Pagination
    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedData.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedData, currentPage]);

    // Reset page when filter changes
    useMemo(() => {
        setCurrentPage(1);
    }, [activeFilter, searchQuery, sortBy, tab]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="pink" messages={[
                "พื้นที่ปลอดภัยสำหรับทุกคน! อยากเสนอไอเดียหรือชมเพื่อน จัดไป!",
                "เลือก 'Anonymous' ได้นะ ถ้ายอมรับความจริงกันได้ ทีมจะแกร่งขึ้นแน่นอน",
                "Admin จะคอยดูอยู่ห่างๆ เพื่อความเรียบร้อยครับ"
            ]} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                            เสียงจากทีม 📣 (Voice of Team)
                        </h1>
                        <p className="text-gray-500 mt-1">
                            เสนอแนะ, แจ้งปัญหา, หรือชื่นชมเพื่อนร่วมงาน
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsInfoOpen(true)}
                        className="p-1.5 bg-white text-pink-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors shadow-sm border border-gray-100 self-start mt-1"
                        title="คู่มือการใช้งาน"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                </div>

                {isAdmin && (
                    <div className="bg-white p-1.5 rounded-2xl border border-gray-200 flex shadow-sm relative overflow-visible">
                        <button 
                            onClick={() => setTab('BOARD')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === 'BOARD' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Public Board
                        </button>
                        
                        <button 
                            onClick={() => setTab('ADMIN')}
                            className={`
                                relative px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 overflow-hidden
                                ${tab === 'ADMIN' 
                                    ? 'bg-orange-50 text-orange-700 shadow-inner ring-1 ring-orange-100' 
                                    : pendingFeedbacks.length > 0 
                                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-200 hover:scale-105 hover:-translate-y-0.5' 
                                        : 'text-gray-500 hover:bg-gray-50'
                                }
                            `}
                        >
                            <ShieldCheck className={`w-4 h-4 ${pendingFeedbacks.length > 0 && tab !== 'ADMIN' ? 'animate-bounce' : ''}`} /> 
                            <span>Inbox</span>
                            
                            {/* Counter Badge */}
                            {pendingFeedbacks.length > 0 && (
                                <span className={`
                                    ml-1 px-1.5 py-0.5 rounded-md text-[10px] min-w-[20px] text-center shadow-sm
                                    ${tab === 'ADMIN' ? 'bg-orange-200 text-orange-800' : 'bg-white text-rose-600 font-black'}
                                `}>
                                    {pendingFeedbacks.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Feed */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. Input Form (Only show on Public Board) */}
                    {tab === 'BOARD' && (
                        <FeedbackForm onSubmit={submitFeedback} />
                    )}

                    {/* 2. Controls (Search & Filter) */}
                    <FeedbackControls 
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        activeFilter={activeFilter}
                        setActiveFilter={setActiveFilter}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                    />

                    {/* 3. Feed List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wider pl-1 flex items-center justify-between">
                            <span className="flex items-center">
                                {tab === 'BOARD' ? (
                                    <>🔥 ล่าสุด (Latest Updates)</>
                                ) : (
                                    <>🛡️ รอการตรวจสอบ (Moderation Queue)</>
                                )}
                            </span>
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {sortedData.length} items
                            </span>
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
                                {paginatedData.length === 0 ? (
                                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
                                        <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400 font-medium">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                                        <button onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); }} className="text-indigo-500 text-sm font-bold mt-2 hover:underline">
                                            ล้างตัวกรอง
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 min-h-[400px]">
                                        {paginatedData.map(item => (
                                            <FeedbackCard 
                                                key={item.id} 
                                                item={item} 
                                                currentUser={currentUser}
                                                onVote={toggleVote}
                                                onUpdateStatus={updateStatus}
                                                onDelete={deleteFeedback}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* 4. Pagination */}
                        {!isLoading && sortedData.length > 0 && (
                            <FeedbackPagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
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

            {/* INFO MODAL */}
            <InfoModal 
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="คู่มือ Voice of Team"
            >
                <FeedbackGuide />
            </InfoModal>
        </div>
    );
};

export default FeedbackView;
