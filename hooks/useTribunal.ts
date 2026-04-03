
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TribunalReport, ReportStatus, User } from '../types';
import { googleDriveService } from '../services/googleDriveService';
import { useGamification } from './useGamification';
import { useGameConfig } from '../context/GameConfigContext';

export const useTribunal = (currentUser: User | null = null) => {
    const [isLoading, setIsLoading] = useState(false);
    const { handleAction } = useGamification(currentUser);
    const { config } = useGameConfig();

    const submitReport = useCallback(async (reportData: Partial<TribunalReport>, file?: File) => {
        if (!currentUser) throw new Error('User not authenticated');
        
        setIsLoading(true);
        try {
            let evidenceFileId = '';
            let evidenceUrl = '';

            if (file) {
                const uploadResult = await googleDriveService.uploadFile(file);
                evidenceFileId = uploadResult.id;
                evidenceUrl = uploadResult.url;
            }

            const { data, error } = await supabase
                .from('tribunal_reports')
                .insert({
                    reporter_id: currentUser.id,
                    target_id: reportData.target_id,
                    category: reportData.category,
                    description: reportData.description,
                    evidence_file_id: evidenceFileId,
                    evidence_url: evidenceUrl,
                    status: 'PENDING',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error submitting report:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    const resolveReport = useCallback(async (reportId: string, decision: 'APPROVE' | 'REJECT', feedback: string) => {
        if (!currentUser || currentUser.role !== 'ADMIN') throw new Error('Unauthorized');

        setIsLoading(true);
        try {
            // 1. Fetch report details
            const { data: report, error: fetchError } = await supabase
                .from('tribunal_reports')
                .select('*')
                .eq('id', reportId)
                .single();

            if (fetchError || !report) throw fetchError || new Error('Report not found');

            const tribunalCfg = config.TRIBUNAL_CONFIG;
            const status: ReportStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';

            // 2. Update report status
            const { error: updateError } = await supabase
                .from('tribunal_reports')
                .update({
                    status,
                    admin_feedback: feedback,
                    resolved_at: new Date().toISOString(),
                    resolved_by: currentUser.id
                })
                .eq('id', reportId);

            if (updateError) throw updateError;

            // 3. Apply Gamification Logic
            if (decision === 'APPROVE') {
                // Reward Reporter
                await handleAction(report.reporter_id, 'TRIBUNAL_REWARD', {
                    category: report.category,
                    reason: feedback
                });

                // Penalty Target (if exists)
                if (report.target_id) {
                    await handleAction(report.target_id, 'TRIBUNAL_PENALTY', {
                        category: report.category,
                        reason: feedback,
                        isFalseReport: false
                    });
                }
            } else {
                // Penalty Reporter for false report
                await handleAction(report.reporter_id, 'TRIBUNAL_PENALTY', {
                    category: report.category,
                    reason: feedback,
                    isFalseReport: true
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Error resolving report:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, config, handleAction]);

    const getReports = useCallback(async (filter: 'ALL' | 'PENDING' | 'MY_REPORTS' = 'ALL') => {
        try {
            let query = supabase.from('tribunal_reports').select('*, reporter:profiles!reporter_id(name, avatar_url), target:profiles!target_id(name, avatar_url)');

            if (filter === 'PENDING') {
                query = query.eq('status', 'PENDING');
            } else if (filter === 'MY_REPORTS' && currentUser) {
                query = query.eq('reporter_id', currentUser.id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching reports:', error);
            return [];
        }
    }, [currentUser]);

    return {
        submitReport,
        resolveReport,
        getReports,
        isLoading
    };
};
