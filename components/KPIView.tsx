
import React, { useState, useMemo, useEffect } from 'react';
import { User, KPIStats } from '../types';
import { supabase } from '../lib/supabase';
import { useKPI } from '../hooks/useKPI';
import { useGamification } from '../hooks/useGamification'; 
import { format, addMonths } from 'date-fns';
import { motion } from 'framer-motion';
import MentorTip from './MentorTip';
import KPIConfigModal from './kpi/KPIConfigModal';
import KPIHeader from './kpi/KPIHeader';
import KPIExportSlip from './kpi/KPIExportSlip';
import KPISidebar from './kpi/KPISidebar';
import KPITabNavigation from './kpi/KPITabNavigation';
import OverviewTab from './kpi/tabs/OverviewTab';
import EvaluationTab from './kpi/tabs/EvaluationTab';
import GrowthTab from './kpi/tabs/GrowthTab';

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
        addIDPItem, updateIDPStatus, toggleIDPSubGoal, reorderIDPItems, deleteIDPItem,
        sendKudos, remainingKudos 
    } = useKPI();

    const { processAction } = useGamification(currentUser);
    
    // UI State
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.role === 'ADMIN' && users.length > 0 ? users[0].id : currentUser.id);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false); 
    const [activeTab, setActiveTab] = useState<'overview' | 'evaluation' | 'growth'>('overview');
    
    // Evaluation Form State (Manager Side)
    const [scores, setScores] = useState<Record<string, number>>({});
    const [feedback, setFeedback] = useState('');
    
    // Self Evaluation Form State (Member Side)
    const [selfScores, setSelfScores] = useState<Record<string, number>>({});
    const [selfFeedback, setSelfFeedback] = useState('');
    const [selfReflectionPride, setSelfReflectionPride] = useState('');
    const [selfReflectionImprovement, setSelfReflectionImprovement] = useState('');
    
    // Public Praise Bridge State
    const [publicPraiseCount, setPublicPraiseCount] = useState(0);

    useEffect(() => {
        const fetchPublicPraiseCount = async () => {
            // Get start and end of the selected month
            const [year, month] = selectedMonth.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

            const { count, error } = await supabase
                .from('feedbacks')
                .select('*', { count: 'exact', head: true })
                .eq('target_user_id', selectedUserId)
                .eq('type', 'SHOUTOUT')
                .eq('status', 'APPROVED')
                .gte('created_at', startDate)
                .lte('created_at', endDate);

            if (!error) {
                setPublicPraiseCount(count || 0);
            }
        };

        fetchPublicPraiseCount();
    }, [selectedUserId, selectedMonth]);

    // Live Stats
    const [liveStats, setLiveStats] = useState<KPIStats>({ taskCompleted: 0, taskOverdue: 0, attendanceLate: 0, attendanceAbsent: 0, dutyAssigned: 0, dutyMissed: 0 });
    const [isStatsLoading, setIsStatsLoading] = useState(false);

    const activeUsers = users.filter(u => u.isActive);
    const isAdmin = currentUser.role === 'ADMIN';

    // Ensure Member defaults to self, but can select others
    useEffect(() => {
        if (!selectedUserId) setSelectedUserId(currentUser.id);
    }, [currentUser.id]);

    const isViewingSelf = selectedUserId === currentUser.id;
    const canSeePrivate = isAdmin || isViewingSelf;

    useEffect(() => {
        if (!canSeePrivate && activeTab !== 'growth') {
            setActiveTab('growth');
        }
    }, [canSeePrivate, activeTab]);

    const currentRecord = useMemo(() => kpiRecords.find(r => r.userId === selectedUserId && r.monthKey === selectedMonth), [kpiRecords, selectedUserId, selectedMonth]);
    const userHistory = useMemo(() => kpiRecords.filter(r => r.userId === selectedUserId), [kpiRecords, selectedUserId]);
    
    const currentGoals = useMemo(() => goals.filter(g => g.userId === selectedUserId && g.monthKey === selectedMonth), [goals, selectedUserId, selectedMonth]);
    const currentIDP = useMemo(() => idpItems.filter(i => 
        i.userId === selectedUserId && (i.status === 'TODO' || i.monthKey === selectedMonth)
    ), [idpItems, selectedUserId, selectedMonth]);
    
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
            setSelfReflectionPride(currentRecord.selfReflectionPride || '');
            setSelfReflectionImprovement(currentRecord.selfReflectionImprovement || '');
        } else {
            setScores(defaultScores);
            setFeedback('');
            setSelfScores(defaultScores);
            setSelfFeedback('');
            setSelfReflectionPride('');
            setSelfReflectionImprovement('');
        }
    }, [currentRecord, criteria, selectedUserId, selectedMonth]);

    // Load Live Stats
    useEffect(() => {
        const loadStats = async () => {
            setIsStatsLoading(true);
            try {
                if (currentRecord?.statsSnapshot) {
                    setLiveStats(currentRecord.statsSnapshot);
                } else {
                    const stats = await fetchUserStats(selectedUserId, new Date(selectedMonth));
                    setLiveStats(stats);
                }
            } finally {
                setIsStatsLoading(false);
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
    const handleSelfSave = (pride: string, improvement: string) => {
        saveSelfEvaluation(selectedUserId, selectedMonth, selfScores, selfFeedback, pride, improvement);
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

            <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-6`}>
                {/* Sidebar User List - Only for Admin */}
                {isAdmin && (
                    <KPISidebar 
                        users={users}
                        selectedUserId={selectedUserId}
                        onSelectUser={setSelectedUserId}
                    />
                )}

                {/* Main Content */}
                <div className={`${isAdmin ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-8 ${isStatsLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
                    
                    {/* Tab Navigation */}
                    <KPITabNavigation 
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        canSeePrivate={canSeePrivate}
                    />

                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="space-y-6"
                    >
                        {activeTab === 'overview' && (
                            <OverviewTab 
                                selectedUser={selectedUser}
                                currentRecord={currentRecord}
                                gradeData={gradeData}
                                config={config}
                                userHistory={userHistory}
                                liveStats={liveStats}
                                selectedMonth={selectedMonth}
                                onExport={() => setIsExportOpen(true)}
                            />
                        )}

                        {activeTab === 'evaluation' && (
                            <EvaluationTab 
                                selectedUserId={selectedUserId}
                                selectedMonth={selectedMonth}
                                currentGoals={currentGoals}
                                criteria={criteria}
                                scores={scores}
                                setScores={setScores}
                                feedback={feedback}
                                setFeedback={setFeedback}
                                selfScores={selfScores}
                                setSelfScores={setSelfScores}
                                selfFeedback={selfFeedback}
                                setSelfFeedback={setSelfFeedback}
                                selfReflectionPride={selfReflectionPride}
                                setSelfReflectionPride={setSelfReflectionPride}
                                selfReflectionImprovement={selfReflectionImprovement}
                                setSelfReflectionImprovement={setSelfReflectionImprovement}
                                isAdmin={isAdmin}
                                isSelfEvalMode={isSelfEvalMode}
                                onManagerSave={handleManagerSave}
                                onSelfSave={handleSelfSave}
                                currentRecord={currentRecord}
                                finalScore={gradeData.finalScore}
                                addGoal={addGoal}
                                updateGoalActual={updateGoalActual}
                                deleteGoal={deleteGoal}
                            />
                        )}
                        
                        {activeTab === 'growth' && (
                            <GrowthTab 
                                isAdmin={isAdmin}
                                isSelfEvalMode={isSelfEvalMode}
                                isViewingSelf={isViewingSelf}
                                currentUser={currentUser}
                                selectedUser={selectedUser}
                                selectedUserId={selectedUserId}
                                selectedMonth={selectedMonth}
                                currentIDP={currentIDP}
                                currentReviews={currentReviews}
                                peerReviews={peerReviews}
                                users={users}
                                publicPraiseCount={publicPraiseCount}
                                addIDPItem={addIDPItem}
                                updateIDPStatus={updateIDPStatus}
                                toggleIDPSubGoal={toggleIDPSubGoal}
                                reorderIDPItems={reorderIDPItems}
                                deleteIDPItem={deleteIDPItem}
                                sendKudos={(to, msg, badge) => sendKudos(currentUser.id, to, selectedMonth, msg, badge)}
                                remainingKudos={remainingKudos}
                            />
                        )}
                    </motion.div>
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
