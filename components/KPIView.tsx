
import React, { useState, useMemo, useEffect } from 'react';
import { User, KPIStats } from '../types';
import { useKPI } from '../hooks/useKPI';
import { useGamification } from '../hooks/useGamification'; 
import { format, addMonths } from 'date-fns';
import { User as UserIcon, Printer, Coins, Lock } from 'lucide-react';
import MentorTip from './MentorTip';
import KPIConfigModal from './kpi/KPIConfigModal';
import DisciplineScore from './kpi/DisciplineScore';
import KPIHeader from './kpi/KPIHeader';
import KPISummaryCard from './kpi/KPISummaryCard';
import OKRSection from './kpi/sections/OKRSection';
import BehaviorSection from './kpi/sections/BehaviorSection';
import KPIHistoryChart from './kpi/analytics/KPIHistoryChart';
import KPIRadarChart from './kpi/analytics/KPIRadarChart';
import IDPSection from './kpi/sections/IDPSection';
import PeerReviewSection from './kpi/sections/PeerReviewSection';
import KPIExportSlip from './kpi/KPIExportSlip';

// Import Logic
import { calculateKPIGrade, calculateKPIBonus } from '../lib/kpiLogic';

interface KPIViewProps {
    users: User[];
    currentUser: User;
}

const KPIView: React.FC<KPIViewProps> = ({ users, currentUser }) => {
    const { 
        kpiRecords, criteria, goals, config, idpItems, peerReviews,
        saveEvaluation, saveSelfEvaluation, 
        addGoal, updateGoalActual, deleteGoal, updateConfig, fetchUserStats,
        addIDPItem, updateIDPStatus, deleteIDPItem,
        sendKudos 
    } = useKPI();

    const { processAction } = useGamification(currentUser);
    
    // UI State
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.role === 'ADMIN' && users.length > 0 ? users[0].id : currentUser.id);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false); 
    
    // Evaluation Form State (Manager Side)
    const [scores, setScores] = useState<Record<string, number>>({});
    const [feedback, setFeedback] = useState('');
    
    // Self Evaluation Form State (Member Side)
    const [selfScores, setSelfScores] = useState<Record<string, number>>({});
    const [selfFeedback, setSelfFeedback] = useState('');

    // Live Stats
    const [liveStats, setLiveStats] = useState<KPIStats>({ taskCompleted: 0, taskOverdue: 0, attendanceLate: 0, attendanceAbsent: 0, dutyAssigned: 0, dutyMissed: 0 });

    const activeUsers = users.filter(u => u.isActive);
    const isAdmin = currentUser.role === 'ADMIN';

    // Ensure Member can only see their own
    useEffect(() => {
        if (!isAdmin) setSelectedUserId(currentUser.id);
    }, [isAdmin, currentUser.id]);

    const currentRecord = useMemo(() => kpiRecords.find(r => r.userId === selectedUserId && r.monthKey === selectedMonth), [kpiRecords, selectedUserId, selectedMonth]);
    const userHistory = useMemo(() => kpiRecords.filter(r => r.userId === selectedUserId), [kpiRecords, selectedUserId]);
    
    const currentGoals = useMemo(() => goals.filter(g => g.userId === selectedUserId && g.monthKey === selectedMonth), [goals, selectedUserId, selectedMonth]);
    const currentIDP = useMemo(() => idpItems.filter(i => i.userId === selectedUserId && i.monthKey === selectedMonth), [idpItems, selectedUserId, selectedMonth]);
    
    const currentReviews = useMemo(() => peerReviews.filter(r => r.toUserId === selectedUserId && r.monthKey === selectedMonth), [peerReviews, selectedUserId, selectedMonth]);

    const selectedUser = users.find(u => u.id === selectedUserId);

    // MODE DETECTION
    const isSelfEvalMode = !isAdmin;
    const isPaid = currentRecord?.status === 'PAID';

    // Load Record Data
    useEffect(() => {
        const defaultScores: Record<string, number> = {};
        if (criteria) criteria.forEach(c => defaultScores[c.key] = 0);

        if (currentRecord) {
            setScores(currentRecord.scores || defaultScores);
            setFeedback(currentRecord.managerFeedback || '');
            setSelfScores(currentRecord.selfScores || defaultScores);
            setSelfFeedback(currentRecord.selfFeedback || '');
        } else {
            setScores(defaultScores);
            setFeedback('');
            setSelfScores(defaultScores);
            setSelfFeedback('');
        }
    }, [currentRecord, criteria, selectedUserId, selectedMonth]);

    // Load Live Stats
    useEffect(() => {
        const loadStats = async () => {
            if (currentRecord?.statsSnapshot) {
                setLiveStats(currentRecord.statsSnapshot);
            } else {
                const stats = await fetchUserStats(selectedUserId, new Date(selectedMonth));
                setLiveStats(stats);
            }
        };
        loadStats();
    }, [selectedUserId, selectedMonth, currentRecord, fetchUserStats]);

    // --- REFACTORED: Use Logic Helper ---
    const gradeData = useMemo(() => calculateKPIGrade(
        config,
        criteria,
        currentGoals,
        scores,
        liveStats
    ), [config, criteria, currentGoals, scores, liveStats]);

    // Manager Save
    const handleManagerSave = async (status: 'DRAFT' | 'FINAL' | 'PAID') => {
        const result = calculateKPIGrade(config, criteria, currentGoals, scores, liveStats);
        
        await saveEvaluation(
            selectedUserId, 
            selectedMonth, 
            scores, 
            feedback, 
            status, 
            currentUser.id, 
            liveStats, 
            result.breakdown
        );
        
        if (status === 'PAID') {
            await processAction(selectedUserId, 'KPI_REWARD', { grade: result.grade });
        }
    };

    // Member Save
    const handleSelfSave = () => {
        saveSelfEvaluation(selectedUserId, selectedMonth, selfScores, selfFeedback);
    };

    if (!selectedUser) return <div>Loading...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="orange" messages={[
                "KPI V10 Complete! 🚀 เพิ่มระบบ Peer Review, เชื่อมเกม และใบสรุปผลแบบ Print ได้แล้ว",
                "เมื่อสถานะเป็น PAID ระบบจะแจก Coin และ XP ให้พนักงานโดยอัตโนมัติตามเกรด",
                "อย่าลืมกด 'ส่งคำชม' ให้เพื่อนร่วมทีมบ้างนะ กำลังใจสำคัญมาก!"
            ]} />

            <KPIHeader 
                monthLabel={selectedMonth}
                onPrevMonth={() => setSelectedMonth(format(addMonths(new Date(selectedMonth), -1), 'yyyy-MM'))}
                onNextMonth={() => setSelectedMonth(format(addMonths(new Date(selectedMonth), 1), 'yyyy-MM'))}
                onOpenConfig={() => setIsConfigOpen(true)}
                isAdmin={isAdmin}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar User List (Admin Only) */}
                {isAdmin && (
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-600 flex items-center">
                            <UserIcon className="w-4 h-4 mr-2" /> รายชื่อทีม
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            {activeUsers.map(u => (
                                <button key={u.id} onClick={() => setSelectedUserId(u.id)} className={`w-full p-3 flex items-center gap-3 text-left border-l-4 transition-all ${u.id === selectedUserId ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                                    <img src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate">{u.name}</p>
                                        <p className="text-[10px] text-gray-400">{u.position}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className={`${isAdmin ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6`}>
                    
                    {/* 1. Summary Card */}
                    <div className="relative">
                        <KPISummaryCard 
                            user={selectedUser}
                            record={currentRecord}
                            gradeData={{
                                final: gradeData.finalScore,
                                breakdown: gradeData.breakdown
                            }}
                            config={config}
                        />
                        {/* Export Button */}
                        {currentRecord && (
                            <button 
                                onClick={() => setIsExportOpen(true)}
                                className="absolute top-6 right-6 p-2 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl shadow-sm border border-gray-100 transition-all"
                                title="พิมพ์ใบสรุปผล (Print Slip)"
                            >
                                <Printer className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    
                    {/* Gamification Preview Badge */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${isPaid ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-transparent shadow-lg' : 'bg-gray-50 border-gray-200 text-gray-500 opacity-80'}`}>
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-white/20 rounded-full backdrop-blur-md">
                                 {isPaid ? <Coins className="w-6 h-6 text-white animate-bounce" /> : <Lock className="w-6 h-6" />}
                             </div>
                             <div>
                                 <h4 className="font-bold text-sm">{isPaid ? 'รางวัลถูกส่งเข้ากระเป๋าแล้ว!' : 'Bonus Locked (รออนุมัติ)'}</h4>
                                 <p className="text-xs opacity-90">Grade {gradeData.grade} Reward: {calculateKPIBonus(gradeData.grade)} JP</p>
                             </div>
                         </div>
                    </div>

                    {/* 2. Analytics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
                         <KPIHistoryChart history={userHistory} />
                         <KPIRadarChart breakdown={gradeData.breakdown} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 3. Discipline Score */}
                        <DisciplineScore stats={liveStats} config={config} />

                         {/* 4. OKR Goals Section */}
                        <OKRSection 
                            goals={currentGoals}
                            isAdmin={isAdmin}
                            onAddGoal={(t, v, u) => addGoal(selectedUserId, selectedMonth, t, v, u)}
                            onUpdateActual={updateGoalActual}
                            onDeleteGoal={deleteGoal}
                        />
                    </div>
                    
                    {/* 5. IDP Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[300px]">
                        <IDPSection 
                            items={currentIDP}
                            userId={selectedUserId}
                            monthKey={selectedMonth}
                            onAdd={addIDPItem}
                            onToggle={updateIDPStatus}
                            onDelete={deleteIDPItem}
                            readOnly={false} 
                        />
                        
                        {/* 6. Peer Review Section */}
                        <PeerReviewSection 
                            reviews={currentReviews}
                            users={users}
                            currentUser={currentUser}
                            targetUserId={selectedUserId}
                            monthKey={selectedMonth}
                            onSendKudos={(to, msg, badge) => sendKudos(currentUser.id, to, selectedMonth, msg, badge)}
                            readOnly={selectedUserId === currentUser.id} 
                        />
                    </div>

                    {/* 7. Behavioral Assessment */}
                    <BehaviorSection 
                        criteria={criteria}
                        // Manager Props
                        scores={scores}
                        onScoreChange={(key, val) => setScores(prev => ({ ...prev, [key]: val }))}
                        feedback={feedback}
                        onFeedbackChange={setFeedback}
                        // Self Props
                        selfScores={selfScores}
                        onSelfScoreChange={(key, val) => setSelfScores(prev => ({ ...prev, [key]: val }))}
                        selfFeedback={selfFeedback}
                        onSelfFeedbackChange={setSelfFeedback}
                        // Mode Config
                        isAdmin={isAdmin}
                        isSelfEval={isSelfEvalMode}
                        // Actions
                        onSave={handleManagerSave}
                        onSaveSelf={handleSelfSave}
                        // Status
                        currentStatus={currentRecord?.status || 'DRAFT'}
                        finalScore={gradeData.finalScore}
                        canPay={gradeData.finalScore >= 80}
                    />
                </div>
            </div>

            {/* Modals */}
            <KPIConfigModal 
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                config={config}
                onSave={updateConfig}
            />

            {isExportOpen && currentRecord && (
                <KPIExportSlip 
                    user={selectedUser}
                    record={currentRecord}
                    grade={gradeData.grade}
                    bonus={calculateKPIBonus(gradeData.grade)}
                    month={selectedMonth}
                    onClose={() => setIsExportOpen(false)}
                />
            )}
        </div>
    );
};

export default KPIView;
