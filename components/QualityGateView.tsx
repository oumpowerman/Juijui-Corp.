
import React, { useState } from 'react';
import { useReviews } from '../hooks/useReviews';
import { useQualityActions } from '../hooks/useQualityActions';
import { isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { Clock, Search, Filter, AlertTriangle, Info } from 'lucide-react';
import { Channel, Task, MasterOption, User } from '../types';
import MentorTip from './MentorTip';
import ReviewCard from './quality-gate/ReviewCard';
import ReviewActionModal from './quality-gate/ReviewActionModal';
import QualityStatsWidget from './quality-gate/QualityStatsWidget';
import InfoModal from './ui/InfoModal'; // Import
import QualityGuide from './quality-gate/QualityGuide'; // Import

interface QualityGateViewProps {
    channels: Channel[];
    users: User[]; 
    masterOptions: MasterOption[]; 
    onOpenTask: (task: Task) => void;
}

const QualityGateView: React.FC<QualityGateViewProps> = ({ channels, users, masterOptions, onOpenTask }) => {
    const { reviews, isLoading, updateReviewStatus } = useReviews();
    const { handleConfirmAction } = useQualityActions();
    
    // UI State
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'REVISE' | 'PASSED'>('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterChannel, setFilterChannel] = useState<string>('ALL');
    const [isInfoOpen, setIsInfoOpen] = useState(false); // Info Modal State

    // Modal State
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, type: 'PASS' | 'REVISE' | null, reviewId: string, taskId: string, task?: Task }>({
        isOpen: false,
        type: null,
        reviewId: '',
        taskId: '',
        task: undefined
    });

    // --- Filtering Logic ---
    const filteredReviews = reviews.filter(r => {
        const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
        const taskTitle = r.task?.title || '';
        const matchesSearch = taskTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesChannel = filterChannel === 'ALL' || r.task?.channelId === filterChannel;
        return matchesStatus && matchesSearch && matchesChannel;
    });

    const groupedReviews = {
        overdue: filteredReviews.filter(r => isPast(r.scheduledAt) && !isToday(r.scheduledAt) && r.status === 'PENDING'),
        today: filteredReviews.filter(r => isToday(r.scheduledAt)),
        tomorrow: filteredReviews.filter(r => isTomorrow(r.scheduledAt)),
        upcoming: filteredReviews.filter(r => isFuture(r.scheduledAt) && !isTomorrow(r.scheduledAt) && !isToday(r.scheduledAt)),
    };

    const getStatusInfo = (statusKey: string) => {
        const option = masterOptions.find(o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === statusKey);
        if (option) {
            return {
                label: option.label,
                color: option.color || 'bg-gray-100 text-gray-500'
            };
        }
        return { label: statusKey, color: 'bg-gray-100 text-gray-500' };
    };

    const getChannelName = (id?: string) => channels.find(c => c.id === id)?.name || 'Unknown';

    // --- Actions ---
    const handleActionClick = (reviewId: string, action: 'PASS' | 'REVISE', taskId: string, task: Task) => {
        setModalConfig({
            isOpen: true,
            type: action,
            reviewId,
            taskId,
            task
        });
    };

    const onConfirmModal = async (feedback?: string) => {
        const success = await handleConfirmAction(
            modalConfig.reviewId,
            modalConfig.type!,
            modalConfig.taskId,
            modalConfig.task,
            feedback,
            updateReviewStatus
        );

        if (success) {
            setModalConfig({ ...modalConfig, isOpen: false });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="purple" messages={[
                "Tip หัวหน้า: กด 'Pass' จะเปลี่ยนสถานะเป็น Done และแจก XP ให้ลูกทีมทันที! 🎉", 
                "Tip: กด 'Revise' งานจะเด้งกลับไป Doing พร้อมคอมเมนต์ เพื่อให้แก้ไขต่อ",
                "อย่าลืมเช็คงานที่ 'เลยกำหนด (Overdue)' ก่อนเป็นอันดับแรกนะครับ"
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex items-start gap-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                            ห้องตรวจงาน 🔍 (Quality Gate)
                        </h1>
                        <p className="text-gray-500 mt-1">
                            จัดการคิวตรวจ Draft และอนุมัติงานแบบ Real-time
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsInfoOpen(true)}
                        className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors mt-1"
                        title="ดูคู่มือการใช้งาน"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Widget */}
            <QualityStatsWidget reviews={reviews} />

            {/* Filters Bar */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-2 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหางาน..." 
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="relative">
                    <select 
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-bold cursor-pointer focus:outline-none focus:border-indigo-500 min-w-[150px]"
                        value={filterChannel}
                        onChange={(e) => setFilterChannel(e.target.value)}
                    >
                        <option value="ALL">📺 ทุกช่องทาง</option>
                        {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                    <select 
                        className="appearance-none bg-indigo-50 border border-indigo-100 text-indigo-700 py-2.5 pl-4 pr-10 rounded-lg text-sm font-bold cursor-pointer focus:outline-none focus:border-indigo-500 min-w-[160px]"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                        <option value="PENDING">⏳ รอตรวจ (Pending)</option>
                        <option value="REVISE">🛠️ กำลังแก้ (Revise)</option>
                        <option value="PASSED">✅ ผ่านแล้ว (Passed)</option>
                        <option value="ALL">📋 ทั้งหมด (All)</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="py-20 text-center text-gray-400">กำลังโหลดข้อมูล...</div>
            ) : (
                <div className="space-y-8">
                    
                    {/* 1. Overdue (Warning) */}
                    {groupedReviews.overdue.length > 0 && (
                        <div className="space-y-3 animate-pulse-slow">
                            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2" /> เลยกำหนดตรวจ (Overdue)
                            </h3>
                            <div className="space-y-3">
                                {groupedReviews.overdue.map(r => (
                                    <ReviewCard 
                                        key={r.id} 
                                        review={r} 
                                        users={users}
                                        onAction={handleActionClick} 
                                        onOpenTask={onOpenTask} 
                                        getChannelName={getChannelName} 
                                        getStatusInfo={getStatusInfo}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. Today */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center bg-indigo-50 w-fit px-3 py-1 rounded-lg">
                            <Clock className="w-4 h-4 mr-2" /> วันนี้ (Today)
                        </h3>
                        {groupedReviews.today.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                ไม่มีคิวตรวจงานวันนี้ จุ๊ยๆ เลย 🍹
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {groupedReviews.today.map(r => (
                                    <ReviewCard 
                                        key={r.id} 
                                        review={r} 
                                        users={users}
                                        onAction={handleActionClick} 
                                        onOpenTask={onOpenTask} 
                                        getChannelName={getChannelName} 
                                        getStatusInfo={getStatusInfo}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. Tomorrow & Upcoming */}
                    {(groupedReviews.tomorrow.length > 0 || groupedReviews.upcoming.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">วันพรุ่งนี้ (Tomorrow)</h3>
                                <div className="space-y-3">
                                    {groupedReviews.tomorrow.map(r => (
                                        <ReviewCard 
                                            key={r.id} 
                                            review={r} 
                                            users={users}
                                            onAction={handleActionClick} 
                                            onOpenTask={onOpenTask} 
                                            getChannelName={getChannelName} 
                                            getStatusInfo={getStatusInfo}
                                        />
                                    ))}
                                    {groupedReviews.tomorrow.length === 0 && <p className="text-sm text-gray-400 italic">ไม่มีคิวตรวจ</p>}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">เร็วๆ นี้ (Upcoming)</h3>
                                <div className="space-y-3">
                                    {groupedReviews.upcoming.map(r => (
                                        <ReviewCard 
                                            key={r.id} 
                                            review={r} 
                                            users={users}
                                            onAction={handleActionClick} 
                                            onOpenTask={onOpenTask} 
                                            getChannelName={getChannelName} 
                                            getStatusInfo={getStatusInfo}
                                        />
                                    ))}
                                    {groupedReviews.upcoming.length === 0 && <p className="text-sm text-gray-400 italic">ไม่มีคิวตรวจล่วงหน้า</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Action Modal */}
            <ReviewActionModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                actionType={modalConfig.type}
                onConfirm={onConfirmModal}
            />

            {/* INFO MODAL */}
            <InfoModal 
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="คู่มือห้องตรวจงาน (Quality Gate)"
            >
                <QualityGuide />
            </InfoModal>
        </div>
    );
};

export default QualityGateView;
