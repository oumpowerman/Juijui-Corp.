
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, IDPItem, PeerReview } from '../../../types';
import { Rocket, Heart, MessageCircle, Sparkles } from 'lucide-react';
import IDPSection from '../sections/IDPSection';
import PeerReviewSection from '../sections/PeerReviewSection';
import PraiseModal from '../modals/PraiseModal';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

interface GrowthTabProps {
    isAdmin: boolean;
    isSelfEvalMode: boolean;
    isViewingSelf: boolean;
    currentUser: User;
    selectedUser: User;
    selectedUserId: string;
    selectedMonth: string;
    currentIDP: IDPItem[];
    currentReviews: PeerReview[];
    peerReviews: PeerReview[];
    users: User[];
    publicPraiseCount: number;
    addIDPItem: (userId: string, monthKey: string, topic: string, actionPlan: string, category?: string, targetDate?: Date, subGoals?: { title: string }[]) => void;
    updateIDPStatus: (id: string, isDone: boolean) => void;
    reorderIDPItems: (items: IDPItem[]) => void;
    toggleIDPSubGoal: (itemId: string, subGoalId: string) => void;
    deleteIDPItem: (id: string) => void;
    sendKudos: (toUserId: string, message: string, badge: string) => void;
    remainingKudos: number;
}

const GrowthTab: React.FC<GrowthTabProps> = ({
    isAdmin, isSelfEvalMode, isViewingSelf, currentUser, selectedUser, selectedUserId, selectedMonth,
    currentIDP, currentReviews, peerReviews, users, publicPraiseCount,
    addIDPItem, updateIDPStatus, toggleIDPSubGoal, reorderIDPItems, deleteIDPItem, sendKudos, remainingKudos
}) => {
    const navigate = useNavigate();
    const { showPrompt } = useGlobalDialog();
    const [praiseTarget, setPraiseTarget] = React.useState<{ id: string, name: string, avatarUrl: string } | null>(null);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-12"
        >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center gap-6"
                    >
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                            <Rocket className="w-8 h-8 text-white animate-bounce" />
                        </div>
                        <h2 className="text-4xl font-bold tracking-tighter">Growth & Evolution Zone 🌱</h2>
                    </motion.div>
                    <p className="text-emerald-50 text-lg font-kanit font-bold max-w-2xl leading-relaxed">
                        พื้นที่สำหรับการพัฒนาทักษะและส่งต่อพลังบวกให้ทีม ยิ่งคุณเติบโต ทีมยิ่งแข็งแกร่ง! 
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* IDP Section */}
                <div className="h-full">
                    <IDPSection 
                        items={currentIDP}
                        userId={selectedUserId}
                        monthKey={selectedMonth}
                        onAdd={addIDPItem}
                        onToggle={updateIDPStatus}
                        onToggleSubGoal={toggleIDPSubGoal}
                        onReorder={reorderIDPItems}
                        onDelete={async (id) => {
                            const confirm = await showPrompt('คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมายการเติบโตนี้?', '', 'ยืนยันการลบเป้าหมาย 🗑️');
                            if (confirm) deleteIDPItem(id);
                        }}
                        readOnly={!isSelfEvalMode} 
                    />
                </div>

                {/* Kudos Section */}
                <div className="space-y-8">
                    {/* Public Praise Deep Link */}
                    <div className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-xl shadow-indigo-50/50 flex items-center justify-between group hover:border-indigo-300 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">คำชมสาธารณะ (Voice of Team)</h4>
                                <p className="text-xs font-bold text-gray-400">ได้รับทั้งหมด {publicPraiseCount} ครั้งในเดือนนี้</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                if (publicPraiseCount > 0) {
                                    navigate(`/feedback?targetUserId=${selectedUserId}&monthKey=${selectedMonth}`);
                                }
                            }}
                            disabled={publicPraiseCount === 0}
                            title={publicPraiseCount === 0 ? "ไม่มีคำชมจาก Voice of Team ในเดือนนี้" : "คลิกเพื่อดูรายละเอียดคำชม"}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${publicPraiseCount > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            {publicPraiseCount > 0 ? 'ดูรายละเอียด' : 'ไม่มีข้อมูล'}
                        </button>
                    </div>

                    {/* Received Kudos */}
                    <PeerReviewSection 
                        reviews={currentReviews}
                        users={users}
                        currentUser={currentUser}
                        targetUserId={selectedUserId}
                        monthKey={selectedMonth}
                        onSendKudos={sendKudos}
                        readOnly={true}
                        title="คำชมที่คุณได้รับ (Received)"
                        variant="received"
                    />

                    {/* Sent Kudos History (Only for self viewing) */}
                    {isViewingSelf && (
                        <PeerReviewSection 
                            reviews={peerReviews.filter(r => r.fromUserId === currentUser.id && r.monthKey === selectedMonth)}
                            users={users}
                            currentUser={currentUser}
                            targetUserId={selectedUserId}
                            monthKey={selectedMonth}
                            onSendKudos={sendKudos}
                            readOnly={true}
                            title="ประวัติการส่งคำชม (Sent)"
                            variant="sent"
                        />
                    )}
                </div>
            </div>

            {/* Send Kudos to Friends (For non-admin or self-viewing member) */}
            {(!isAdmin || isViewingSelf) && (
                <div className="bg-white p-10 rounded-[3rem] border border-pink-100 shadow-xl shadow-pink-50/50">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">ส่งพลังบวกให้เพื่อนร่วมทีม</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-2xl">
                            <span className="text-xs font-bold text-rose-500">โควตาเดือนนี้:</span>
                            <div className="flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                    <Heart key={i} className={`w-4 h-4 ${i < remainingKudos ? 'text-rose-500 fill-rose-500' : 'text-gray-200'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {users.filter(u => u.isActive && u.id !== currentUser.id).map(user => (
                            <motion.button
                                key={user.id}
                                whileHover={{ y: -5, scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPraiseTarget({ id: user.id, name: user.name, avatarUrl: user.avatarUrl })}
                                className="flex flex-col items-center gap-3 p-4 rounded-[2rem] hover:bg-pink-50 transition-all border border-transparent hover:border-pink-100 group"
                            >
                                <div className="relative">
                                    <img src={user.avatarUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-white shadow-md group-hover:ring-2 ring-pink-400 transition-all" referrerPolicy="no-referrer" />
                                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-sm">
                                        <Sparkles className="w-3 h-3 text-pink-500" />
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-gray-700 text-center line-clamp-1">{user.name}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            <PraiseModal 
                isOpen={!!praiseTarget}
                onClose={() => setPraiseTarget(null)}
                targetUserName={praiseTarget?.name || ''}
                targetUserAvatar={praiseTarget?.avatarUrl || ''}
                remainingKudos={remainingKudos}
                onSend={(msg, badge) => {
                    if (praiseTarget) {
                        sendKudos(praiseTarget.id, msg, badge);
                    }
                }}
            />
        </motion.div>
    );
};

export default GrowthTab;
