
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { KPIRecord, MasterOption, User } from '../types';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

export const useKPI = () => {
    const [kpiRecords, setKpiRecords] = useState<KPIRecord[]>([]);
    const [criteria, setCriteria] = useState<MasterOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchKPI = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Criteria
            const { data: criteriaData } = await supabase
                .from('master_options')
                .select('*')
                .eq('type', 'KPI_CRITERIA')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });
            
            if (criteriaData) {
                setCriteria(criteriaData.map((c: any) => ({
                    id: c.id,
                    type: c.type,
                    key: c.key,
                    label: c.label,
                    color: c.color,
                    sortOrder: c.sort_order,
                    isActive: c.is_active
                })));
            }

            // 2. Fetch Records
            const { data: recordData, error } = await supabase
                .from('kpi_records')
                .select('*');

            if (error) throw error;

            if (recordData) {
                setKpiRecords(recordData.map((r: any) => ({
                    id: r.id,
                    userId: r.user_id,
                    evaluatorId: r.evaluator_id,
                    monthKey: r.month_key,
                    scores: r.scores || {},
                    feedback: r.feedback || '',
                    status: r.status,
                    totalScore: r.total_score,
                    maxScore: r.max_score,
                    updatedAt: new Date(r.updated_at)
                })));
            }

        } catch (err: any) {
            console.error("Fetch KPI Error", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Realtime
    useEffect(() => {
        fetchKPI();
        const channel = supabase.channel('realtime-kpi')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_records' }, () => fetchKPI())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const saveEvaluation = async (
        userId: string, 
        monthKey: string, 
        scores: Record<string, number>, 
        feedback: string, 
        status: 'DRAFT' | 'FINAL' | 'PAID',
        evaluatorId: string
    ) => {
        try {
            const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
            const maxScore = criteria.length * 5; // Assuming 5 is max score per item

            const payload = {
                user_id: userId,
                month_key: monthKey,
                scores,
                feedback,
                status,
                evaluator_id: evaluatorId,
                total_score: totalScore,
                max_score: maxScore,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('kpi_records')
                .upsert(payload, { onConflict: 'user_id, month_key' });

            if (error) throw error;

            showToast('บันทึกผลประเมินแล้ว ✅', 'success');
        } catch (err: any) {
            console.error(err);
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    return {
        kpiRecords,
        criteria,
        isLoading,
        saveEvaluation,
        refreshKPI: fetchKPI
    };
};
