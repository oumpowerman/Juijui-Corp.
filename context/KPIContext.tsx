
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { KPIRecord, MasterOption, IndividualGoal, KPIConfig, KPIStats, IDPItem, PeerReview, DisciplineAuditLog } from '../types';
import { useToast } from './ToastContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useMasterData } from '../hooks/useMasterData';
import { useUserSession } from './UserSessionContext';

const DEFAULT_CONFIG: KPIConfig = {
    id: 'default', roleTarget: 'ALL', 
    weightOkr: 50, weightBehavior: 30, weightAttendance: 20,
    penaltyLate: 5, penaltyAbsent: 20, penaltyMissedDuty: 15,
    isActive: true
};

interface KPIContextType {
    kpiRecords: KPIRecord[];
    goals: IndividualGoal[];
    idpItems: IDPItem[];
    peerReviews: PeerReview[];
    criteria: MasterOption[];
    config: KPIConfig;
    isLoading: boolean;
    
    saveEvaluation: (userId: string, monthKey: string, scores: Record<string, number>, feedback: string, status: 'DRAFT' | 'FINAL' | 'PAID', evaluatorId: string, statsSnapshot: KPIStats, finalBreakdown: any) => Promise<void>;
    saveSelfEvaluation: (userId: string, monthKey: string, selfScores: Record<string, number>, selfFeedback: string, pride: string, improvement: string) => Promise<void>;
    addGoal: (userId: string, monthKey: string, title: string, target: number, unit: string) => Promise<void>;
    updateGoalActual: (id: string, actual: number) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    addIDPItem: (userId: string, monthKey: string, topic: string, actionPlan: string, category?: string, targetDate?: Date, subGoals?: { title: string }[]) => Promise<void>;
    updateIDPStatus: (id: string, isDone: boolean) => Promise<void>;
    toggleIDPSubGoal: (itemId: string, subGoalId: string) => Promise<void>;
    reorderIDPItems: (items: IDPItem[]) => Promise<void>;
    deleteIDPItem: (id: string) => Promise<void>;
    sendKudos: (fromUserId: string, toUserId: string, monthKey: string, message: string, badge: string) => Promise<void>;
    remainingKudos: number;
    refreshKPI: () => Promise<void>;
    updateConfig: (newConfig: Partial<KPIConfig>) => Promise<void>;
    fetchUserStats: (userId: string, date: Date) => Promise<KPIStats>;
    fetchDisciplineAuditLogs: (userId: string, date: Date) => Promise<DisciplineAuditLog[]>;
}

const KPIContext = createContext<KPIContextType | undefined>(undefined);

export const KPIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { masterOptions } = useMasterData();
    const { currentUserProfile } = useUserSession();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [kpiRecords, setKpiRecords] = useState<KPIRecord[]>([]);
    const [goals, setGoals] = useState<IndividualGoal[]>([]);
    const [idpItems, setIdpItems] = useState<IDPItem[]>([]); 
    const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
    const [remainingKudos, setRemainingKudos] = useState(3);
    const [criteria, setCriteria] = useState<MasterOption[]>([]);
    const [config, setConfig] = useState<KPIConfig>(DEFAULT_CONFIG);

    // 1. Query Config
    const { data: qConfig, isLoading: isConfigLoading } = useQuery({
        queryKey: ['kpi_configs'],
        queryFn: async () => {
            const { data, error } = await supabase.from('kpi_configs').select('*').eq('is_active', true).single();
            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 10,
    });

    // 2. Query Records
    const { data: qRecords, isLoading: isRecordsLoading } = useQuery({
        queryKey: ['kpi_records'],
        queryFn: async () => {
            const { data, error } = await supabase.from('kpi_records').select('*');
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5,
    });

    // 3. Query Goals
    const { data: qGoals, isLoading: isGoalsLoading } = useQuery({
        queryKey: ['individual_goals'],
        queryFn: async () => {
            const { data, error } = await supabase.from('individual_goals').select('*');
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5,
    });

    // 4. Query IDP
    const { data: qIdp, isLoading: isIdpLoading } = useQuery({
        queryKey: ['idp_items'],
        queryFn: async () => {
            const { data, error } = await supabase.from('idp_items').select('*').order('created_at', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5,
    });

    // 5. Query Peer Reviews
    const { data: qReviews, isLoading: isReviewsLoading } = useQuery({
        queryKey: ['kpi_peer_reviews'],
        queryFn: async () => {
            const { data, error } = await supabase.from('kpi_peer_reviews').select('*, from_user:profiles!kpi_peer_reviews_from_user_id_fkey(full_name, avatar_url)');
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5,
    });

    // Sync Logic
    useEffect(() => {
        if (qConfig) {
            setConfig({
                id: qConfig.id,
                roleTarget: qConfig.role_target,
                weightOkr: qConfig.weight_okr,
                weightBehavior: qConfig.weight_behavior,
                weightAttendance: qConfig.weight_attendance,
                penaltyLate: qConfig.penalty_late_per_time,
                penaltyAbsent: qConfig.penalty_absent_per_day,
                penaltyMissedDuty: qConfig.penalty_missed_duty_per_time,
                isActive: qConfig.is_active
            });
        }
    }, [qConfig]);

    useEffect(() => {
        if (qRecords) {
            setKpiRecords(qRecords.map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                evaluatorId: r.evaluator_id,
                monthKey: r.month_key,
                scores: r.scores || {},
                selfScores: r.self_scores || {},
                feedback: r.manager_feedback || r.feedback || '', 
                managerFeedback: r.manager_feedback,
                selfFeedback: r.self_feedback,
                selfReflectionPride: r.self_reflection_pride,
                selfReflectionImprovement: r.self_reflection_improvement,
                developmentPlan: r.development_plan,
                status: r.status,
                totalScore: r.total_score,
                maxScore: r.max_score,
                updatedAt: new Date(r.updated_at),
                statsSnapshot: r.stats_snapshot,
                finalScoreBreakdown: r.final_score_breakdown
            })));
        }
    }, [qRecords]);

    useEffect(() => {
        if (qGoals) {
            setGoals(qGoals.map((g: any) => ({
                id: g.id, userId: g.user_id, monthKey: g.month_key, title: g.title, targetValue: g.target_value, actualValue: g.actual_value, unit: g.unit
            })));
        }
    }, [qGoals]);

    useEffect(() => {
        if (qIdp) {
            setIdpItems(qIdp.map((i: any) => ({
                id: i.id, 
                userId: i.user_id, 
                monthKey: i.month_key, 
                topic: i.topic, 
                actionPlan: i.action_plan, 
                status: i.status, 
                progress: i.progress || 0,
                category: i.category,
                targetDate: i.target_date ? new Date(i.target_date) : undefined,
                orderIndex: i.order_index || 0,
                subGoals: i.sub_goals || []
            })).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
        }
    }, [qIdp]);

    useEffect(() => {
        if (qReviews) {
            const reviews = qReviews.map((r: any) => ({
                id: r.id,
                fromUserId: r.from_user_id,
                toUserId: r.to_user_id,
                monthKey: r.month_key,
                message: r.message,
                badge: r.badge,
                createdAt: new Date(r.created_at),
                fromUser: r.from_user ? { name: r.from_user.full_name, avatarUrl: r.from_user.avatar_url } : undefined
            }));
            setPeerReviews(reviews);

            // Calculate remaining kudos for current user in current month
            if (currentUserProfile) {
                const currentMonthKey = format(new Date(), 'yyyy-MM');
                const sentThisMonth = reviews.filter(r => 
                    r.fromUserId === currentUserProfile.id && 
                    r.monthKey === currentMonthKey
                ).length;
                setRemainingKudos(Math.max(0, 3 - sentThisMonth));
            }
        }
    }, [qReviews, currentUserProfile]);

    useEffect(() => {
        const criteriaData = masterOptions.filter(o => o.type === 'KPI_CRITERIA' && o.isActive);
        setCriteria(criteriaData.map((c: any) => ({
            id: c.id, type: c.type, key: c.key, label: c.label, color: c.color, sortOrder: c.sortOrder, isActive: c.isActive
        })));
    }, [masterOptions]);

    const isLoading = isConfigLoading || isRecordsLoading || isGoalsLoading || isIdpLoading || isReviewsLoading;

    const refreshKPI = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['kpi_configs'] });
        await queryClient.invalidateQueries({ queryKey: ['kpi_records'] });
        await queryClient.invalidateQueries({ queryKey: ['individual_goals'] });
        await queryClient.invalidateQueries({ queryKey: ['idp_items'] });
        await queryClient.invalidateQueries({ queryKey: ['kpi_peer_reviews'] });
    }, [queryClient]);

    const fetchUserStats = useCallback(async (userId: string, date: Date): Promise<KPIStats> => {
        const start = format(startOfMonth(date), 'yyyy-MM-dd');
        const end = format(endOfMonth(date), 'yyyy-MM-dd');
        
        // Get Start Time from Master Data
        const startOption = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME');
        const startTimeStr = startOption?.label || '10:00';
        const [startHour, startMin] = startTimeStr.split(':').map(Number);

        // 1. Attendance
        const { data: attLogs } = await supabase.from('attendance_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('date', start).lte('date', end);
        
        let late = 0;
        let absent = 0;
        attLogs?.forEach((log: any) => {
             if (log.status === 'LATE' || log.work_type === 'LATE') late++;
             else if (log.check_in_time) {
                 const d = new Date(log.check_in_time);
                 if (d.getHours() > startHour || (d.getHours() === startHour && d.getMinutes() > startMin)) late++;
             }
             if (log.status === 'ABSENT' || log.work_type === 'ABSENT') absent++;
        });

        // 2. Duties
        const { data: duties } = await supabase.from('duties')
            .select('*')
            .eq('assignee_id', userId)
            .gte('date', start).lte('date', end);

        let assigned = duties?.length || 0;
        let missed = duties?.filter((d: any) => 
            ['ABANDONED', 'ACCEPTED_FAULT', 'LATE_COMPLETED'].includes(d.penalty_status)
        ).length || 0;

        // 3. Tasks (from game_logs for accuracy)
        const { data: gameLogs } = await supabase.from('game_logs')
            .select('action_type')
            .eq('user_id', userId)
            .gte('created_at', start).lte('created_at', end + 'T23:59:59');
        
        const completed = gameLogs?.filter(l => l.action_type === 'TASK_COMPLETE').length || 0;
        const overdue = gameLogs?.filter(l => l.action_type === 'TASK_LATE').length || 0;
        
        return {
            taskCompleted: completed,
            taskOverdue: overdue,
            attendanceLate: late,
            attendanceAbsent: absent,
            dutyAssigned: assigned,
            dutyMissed: missed
        };
    }, [masterOptions]);

    const fetchDisciplineAuditLogs = useCallback(async (userId: string, date: Date): Promise<DisciplineAuditLog[]> => {
        const start = format(startOfMonth(date), 'yyyy-MM-dd');
        const end = format(endOfMonth(date), 'yyyy-MM-dd');
        const logs: DisciplineAuditLog[] = [];

        // Get Start Time from Master Data
        const startOption = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME');
        const startTimeStr = startOption?.label || '10:00';
        const [startHour, startMin] = startTimeStr.split(':').map(Number);

        // 1. Attendance Logs
        const { data: attData } = await supabase.from('attendance_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('date', start).lte('date', end);
        
        attData?.forEach((log: any) => {
            let isLate = log.status === 'LATE' || log.work_type === 'LATE';
            if (!isLate && log.check_in_time) {
                const d = new Date(log.check_in_time);
                if (d.getHours() > startHour || (d.getHours() === startHour && d.getMinutes() > startMin)) isLate = true;
            }

            if (isLate) {
                logs.push({
                    id: `att-late-${log.id}`,
                    type: 'LATE',
                    date: new Date(log.date),
                    title: 'มาสาย (Late)',
                    detail: log.check_in_time ? `เข้างานเวลา ${format(new Date(log.check_in_time), 'HH:mm')}` : 'ไม่พบเวลาเช็คอิน',
                    penalty: config.penaltyLate
                });
            }
            if (log.status === 'ABSENT' || log.work_type === 'ABSENT') {
                logs.push({
                    id: `att-absent-${log.id}`,
                    type: 'ABSENT',
                    date: new Date(log.date),
                    title: 'ขาดงาน (Absent)',
                    detail: 'ไม่มีการเช็คอินเข้างาน',
                    penalty: config.penaltyAbsent
                });
            }
        });

        // 2. Task Overdue (from game_logs)
        const { data: taskLogs } = await supabase.from('game_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('action_type', 'TASK_LATE')
            .gte('created_at', start).lte('created_at', end + 'T23:59:59');
        
        taskLogs?.forEach((log: any) => {
            logs.push({
                id: `task-late-${log.id}`,
                type: 'TASK_OVERDUE',
                date: new Date(log.created_at),
                title: 'ส่งงานเลท (Task Overdue)',
                detail: log.description,
                penalty: 5 // Default penalty for task late
            });
        });

        // 3. Missed Duties
        const { data: dutyData } = await supabase.from('duties')
            .select('*')
            .eq('assignee_id', userId)
            .gte('date', start).lte('date', end);
        
        dutyData?.filter((d: any) => ['ABANDONED', 'ACCEPTED_FAULT', 'LATE_COMPLETED'].includes(d.penalty_status))
            .forEach((d: any) => {
                logs.push({
                    id: `duty-missed-${d.id}`,
                    type: 'MISSED_DUTY',
                    date: new Date(d.date),
                    title: `พลาดเวร: ${d.title}`,
                    detail: `สถานะ: ${d.penalty_status}`,
                    penalty: config.penaltyMissedDuty
                });
            });

        return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [masterOptions, config]);

    const updateConfig = async (newConfig: Partial<KPIConfig>) => {
        try {
            await supabase.from('kpi_configs').update({
                weight_okr: newConfig.weightOkr,
                weight_behavior: newConfig.weightBehavior,
                weight_attendance: newConfig.weightAttendance,
                penalty_late_per_time: newConfig.penaltyLate,
                penalty_absent_per_day: newConfig.penaltyAbsent,
                penalty_missed_duty_per_time: newConfig.penaltyMissedDuty
            }).eq('id', config.id);
            
            setConfig(prev => ({ ...prev, ...newConfig }));
            showToast('อัปเดตเกณฑ์ KPI เรียบร้อย', 'success');
        } catch (err) {
            showToast('อัปเดตไม่สำเร็จ', 'error');
        }
    };

    const saveEvaluation = async (
        userId: string, 
        monthKey: string, 
        scores: Record<string, number>, 
        feedback: string, 
        status: 'DRAFT' | 'FINAL' | 'PAID',
        evaluatorId: string,
        statsSnapshot: KPIStats,
        finalBreakdown: any 
    ) => {
        try {
            const totalScore = finalBreakdown.okrScore + finalBreakdown.behaviorScore + finalBreakdown.attendanceScore;
            const maxScore = 100; 

            const payload = {
                user_id: userId,
                month_key: monthKey,
                scores,
                manager_feedback: feedback, 
                status,
                evaluator_id: evaluatorId,
                total_score: totalScore,
                max_score: maxScore,
                updated_at: new Date().toISOString(),
                stats_snapshot: statsSnapshot,
                final_score_breakdown: finalBreakdown,
                weight_config_snapshot: config 
            };

            const { error } = await supabase
                .from('kpi_records')
                .upsert(payload, { onConflict: 'user_id, month_key' });

            if (error) throw error;
            await queryClient.invalidateQueries({ queryKey: ['kpi_records'] });
            showToast('บันทึกผลประเมินแล้ว ✅', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
        }
    };
    
    const saveSelfEvaluation = async (
        userId: string,
        monthKey: string,
        selfScores: Record<string, number>,
        selfFeedback: string,
        pride: string,
        improvement: string
    ) => {
        try {
            const payload = {
                user_id: userId,
                month_key: monthKey,
                self_scores: selfScores,
                self_feedback: selfFeedback,
                self_reflection_pride: pride,
                self_reflection_improvement: improvement,
                status: 'WAITING_SELF', 
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('kpi_records')
                .upsert(payload, { onConflict: 'user_id, month_key' });

            if (error) throw error;
            await queryClient.invalidateQueries({ queryKey: ['kpi_records'] });
            showToast('บันทึกผลประเมินตนเองแล้ว 📝', 'success');
        } catch (err: any) {
             console.error(err);
             showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const addIDPItem = async (userId: string, monthKey: string, topic: string, actionPlan: string, category?: string, targetDate?: Date, subGoals?: { title: string }[]) => {
        try {
            const maxOrder = idpItems.length > 0 ? Math.max(...idpItems.map(i => i.orderIndex || 0)) : -1;
            const formattedSubGoals = subGoals?.map(sg => ({
                id: crypto.randomUUID(),
                title: sg.title,
                isDone: false
            })) || [];

            const { error } = await supabase.from('idp_items').insert({
                user_id: userId, 
                month_key: monthKey, 
                topic, 
                action_plan: actionPlan, 
                status: 'TODO', 
                progress: 0,
                category,
                target_date: targetDate?.toISOString(),
                order_index: maxOrder + 1,
                sub_goals: formattedSubGoals
            });
            if (error) throw error;
            await queryClient.invalidateQueries({ queryKey: ['idp_items'] });
            showToast('เพิ่มแผนพัฒนาแล้ว 🌱', 'success');
        } catch (err) { console.error(err); }
    };

    const toggleIDPSubGoal = async (itemId: string, subGoalId: string) => {
        try {
            const item = idpItems.find(i => i.id === itemId);
            if (!item || !item.subGoals) return;

            const newSubGoals = item.subGoals.map(sg => 
                sg.id === subGoalId ? { ...sg, isDone: !sg.isDone } : sg
            );

            const doneCount = newSubGoals.filter(sg => sg.isDone).length;
            const totalCount = newSubGoals.length;
            const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
            const status = progress === 100 ? 'DONE' : 'TODO';

            const { error } = await supabase.from('idp_items').update({
                sub_goals: newSubGoals,
                progress,
                status
            }).eq('id', itemId);

            if (error) throw error;
            await queryClient.invalidateQueries({ queryKey: ['idp_items'] });
        } catch (err) {
            console.error('Toggle sub-goal failed:', err);
        }
    };

    const reorderIDPItems = async (items: IDPItem[]) => {
        try {
            const updates = items.map((item, index) => ({
                id: item.id,
                order_index: index
            }));

            // Supabase doesn't support bulk update with different values easily without a function
            // but for a small list, we can do it sequentially or use a RPC if available.
            // For now, let's do it sequentially or just update the local state and then sync.
            for (const update of updates) {
                await supabase.from('idp_items').update({ order_index: update.order_index }).eq('id', update.id);
            }
            
            await queryClient.invalidateQueries({ queryKey: ['idp_items'] });
        } catch (err) {
            console.error('Reorder failed:', err);
        }
    };

    const updateIDPStatus = async (id: string, isDone: boolean) => {
        const item = idpItems.find(i => i.id === id);
        const status = isDone ? 'DONE' : 'TODO';
        const progress = isDone ? 100 : 0;
        
        const updates: any = { status, progress };
        
        if (item?.subGoals && item.subGoals.length > 0) {
            updates.sub_goals = item.subGoals.map(sg => ({ ...sg, isDone }));
        }

        await supabase.from('idp_items').update(updates).eq('id', id);
        await queryClient.invalidateQueries({ queryKey: ['idp_items'] });
    };

    const deleteIDPItem = async (id: string) => {
        await supabase.from('idp_items').delete().eq('id', id);
        await queryClient.invalidateQueries({ queryKey: ['idp_items'] });
    };

    const sendKudos = async (fromUserId: string, toUserId: string, monthKey: string, message: string, badge: string) => {
        try {
            if (fromUserId === toUserId) {
                showToast('ชมตัวเองก็ได้ แต่ส่งให้เพื่อนดีกว่าครับ 😅', 'warning');
                return;
            }

            // Check limit again on server-side (simulated here, but real check would be in DB rules or function)
            if (remainingKudos <= 0) {
                showToast('คุณใช้โควตาหัวใจครบ 3 ดวงในเดือนนี้แล้วครับ 💖', 'warning');
                return;
            }

            const { error } = await supabase.from('kpi_peer_reviews').insert({
                from_user_id: fromUserId,
                to_user_id: toUserId,
                month_key: monthKey,
                message,
                badge
            });
            if (error) throw error;
            await queryClient.invalidateQueries({ queryKey: ['kpi_peer_reviews'] });
            
            // Trigger Confetti
            import('canvas-confetti').then(confetti => {
                confetti.default({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#f43f5e', '#fb7185', '#fda4af', '#fff1f2']
                });
            });

            showToast('ส่งกำลังใจให้เพื่อนแล้ว! 💖', 'success');
        } catch (err: any) {
            showToast('ส่งไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const addGoal = async (userId: string, monthKey: string, title: string, target: number, unit: string) => {
        try {
            await supabase.from('individual_goals').insert({ user_id: userId, month_key: monthKey, title, target_value: target, actual_value: 0, unit });
            await queryClient.invalidateQueries({ queryKey: ['individual_goals'] });
            showToast('เพิ่มเป้าหมายแล้ว', 'success');
        } catch (err) { console.error(err); }
    };
    const updateGoalActual = async (id: string, actual: number) => {
        await supabase.from('individual_goals').update({ actual_value: actual }).eq('id', id);
        await queryClient.invalidateQueries({ queryKey: ['individual_goals'] });
    };
    const deleteGoal = async (id: string) => {
        await supabase.from('individual_goals').delete().eq('id', id);
        await queryClient.invalidateQueries({ queryKey: ['individual_goals'] });
    };

    const value = useMemo(() => ({
        kpiRecords,
        goals,
        idpItems,
        peerReviews,
        criteria,
        config,
        isLoading,
        saveEvaluation,
        saveSelfEvaluation, 
        addGoal,
        updateGoalActual,
        deleteGoal,
        addIDPItem,    
        updateIDPStatus, 
        toggleIDPSubGoal,
        reorderIDPItems,
        deleteIDPItem,
        sendKudos,
        remainingKudos,
        refreshKPI,
        updateConfig,
        fetchUserStats,
        fetchDisciplineAuditLogs
    }), [
        kpiRecords,
        goals,
        idpItems,
        peerReviews,
        remainingKudos,
        criteria,
        config,
        isLoading,
        saveEvaluation,
        saveSelfEvaluation, 
        addGoal,
        updateGoalActual,
        deleteGoal,
        addIDPItem,    
        updateIDPStatus, 
        toggleIDPSubGoal,
        reorderIDPItems,
        deleteIDPItem,
        sendKudos,
        refreshKPI,
        updateConfig,
        fetchUserStats,
        fetchDisciplineAuditLogs
    ]);

    return (
        <KPIContext.Provider value={value}>
            {children}
        </KPIContext.Provider>
    );
};

export const useKPIContext = () => {
    const context = useContext(KPIContext);
    if (context === undefined) {
        throw new Error('useKPIContext must be used within a KPIProvider');
    }
    return context;
};
