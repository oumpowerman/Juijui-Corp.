
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { format, addMonths } from 'date-fns';

export const useMaintenance = () => {
    const { showToast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [hasBackedUp, setHasBackedUp] = useState(false);
    const [backupData, setBackupData] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{chatCount: number, taskCount: number} | null>(null);
    const [isCleaning, setIsCleaning] = useState(false);

    const prepareBackup = async () => {
        setIsExporting(true);
        try {
            const { data: tasks } = await supabase.from('tasks').select('*');
            const { data: contents } = await supabase.from('contents').select('*');
            const { data: chats } = await supabase.from('team_messages').select('*');
            const { data: profiles } = await supabase.from('profiles').select('*');

            const dataToBackup = {
                exportedAt: new Date().toISOString(),
                tasks: tasks || [],
                contents: contents || [],
                chats: chats || [],
                profiles: profiles || []
            };
            
            setBackupData(dataToBackup);
            return dataToBackup;
        } catch (err: any) {
            showToast('เตรียมไฟล์ Backup ล้มเหลว', 'error');
            return null;
        } finally {
            setIsExporting(false);
        }
    };

    const downloadBackupFile = (data: any) => {
        if (!data) return;
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `juijui_backup_${format(new Date(), 'yyyy-MM-dd')}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            setHasBackedUp(true);
            showToast('ดาวน์โหลดเรียบร้อย', 'success');
        } catch (err) {
            showToast('ดาวน์โหลดล้มเหลว', 'error');
        }
    };

    const analyzeOldData = async (months: number, targetStatuses: string[]) => {
        setIsAnalyzing(true);
        try {
            const cutoffDate = addMonths(new Date(), -months).toISOString();

            const { count: chatCount } = await supabase
                .from('team_messages')
                .select('*', { count: 'exact', head: true })
                .lt('created_at', cutoffDate);
            
            const { count: taskCount } = await supabase
                .from('contents')
                .select('*', { count: 'exact', head: true })
                .lt('end_date', cutoffDate)
                .in('status', targetStatuses); 

            setAnalysisResult({
                chatCount: chatCount || 0,
                taskCount: taskCount || 0
            });
            return true;
        } catch (err: any) {
            showToast('สแกนข้อมูลไม่สำเร็จ', 'error');
            return false;
        } finally {
            setIsAnalyzing(false);
        }
    };

    const performCleanup = async (months: number, targetStatuses: string[]) => {
        setIsCleaning(true);
        try {
            const cutoffDate = addMonths(new Date(), -months).toISOString();
            await supabase.from('team_messages').delete().lt('created_at', cutoffDate);
            await supabase.from('contents').delete().lt('end_date', cutoffDate).in('status', targetStatuses);
            showToast(`ล้างข้อมูลสำเร็จ!`, 'success');
            setAnalysisResult(null);
            return true;
        } catch (err: any) {
            showToast('ล้างข้อมูลล้มเหลว', 'error');
            return false;
        } finally {
            setIsCleaning(false);
        }
    };

    const resetAnalysis = () => {
        setAnalysisResult(null);
    }

    return {
        isExporting, hasBackedUp, backupData, setBackupData,
        isAnalyzing, analysisResult, setAnalysisResult,
        isCleaning,
        prepareBackup, downloadBackupFile, analyzeOldData, performCleanup, resetAnalysis
    };
};
