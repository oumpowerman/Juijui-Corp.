
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { format, addMonths } from 'date-fns';
import { BackupOptions, StorageStats } from '../types';

const STORAGE_LIMIT = 1073741824; // 1 GB in Bytes

export const useMaintenance = () => {
    const { showToast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [hasBackedUp, setHasBackedUp] = useState(false);
    const [backupData, setBackupData] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{chatCount: number, taskCount: number} | null>(null);
    const [isCleaning, setIsCleaning] = useState(false);
    
    // Storage States
    const [storageStats, setStorageStats] = useState<StorageStats>({ usedBytes: 0, fileCount: 0, limitBytes: STORAGE_LIMIT });
    const [isCalculatingStorage, setIsCalculatingStorage] = useState(false);

    const prepareBackup = async (options: BackupOptions) => {
        setIsExporting(true);
        try {
            const dataToBackup: any = {
                exportedAt: new Date().toISOString(),
                meta: {
                    version: '1.0',
                    included: Object.keys(options).filter(k => options[k as keyof BackupOptions])
                }
            };

            const promises = [];

            if (options.tasks) {
                promises.push(supabase.from('tasks').select('*').then(res => dataToBackup.tasks = res.data || []));
            }
            if (options.contents) {
                promises.push(supabase.from('contents').select('*').then(res => dataToBackup.contents = res.data || []));
            }
            if (options.chats) {
                promises.push(supabase.from('team_messages').select('*').then(res => dataToBackup.chats = res.data || []));
            }
            if (options.profiles) {
                promises.push(supabase.from('profiles').select('*').then(res => dataToBackup.profiles = res.data || []));
            }

            await Promise.all(promises);
            
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
            
            // Re-calculate storage after cleanup (approx)
            // fetchStorageStats(); // Optional
            return true;
        } catch (err: any) {
            showToast('ล้างข้อมูลล้มเหลว', 'error');
            return false;
        } finally {
            setIsCleaning(false);
        }
    };

    // Calculate approximate storage usage
    // Note: Supabase doesn't provide a direct API for bucket size via client sdk efficiently for thousands of files.
    // This function samples or lists files to sum up size. It might be slow for huge buckets.
    const fetchStorageStats = async () => {
        setIsCalculatingStorage(true);
        try {
            let totalBytes = 0;
            let totalFiles = 0;

            // Check 'chat-files'
            const { data: chatFiles } = await supabase.storage.from('chat-files').list('', { limit: 1000 });
            if (chatFiles) {
                totalFiles += chatFiles.length;
                totalBytes += chatFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
            }

            // Check 'avatars'
            const { data: avatars } = await supabase.storage.from('avatars').list('', { limit: 1000 });
            if (avatars) {
                totalFiles += avatars.length;
                totalBytes += avatars.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
            }

            setStorageStats({
                usedBytes: totalBytes,
                fileCount: totalFiles,
                limitBytes: STORAGE_LIMIT
            });
        } catch (err) {
            console.error("Storage check failed", err);
        } finally {
            setIsCalculatingStorage(false);
        }
    };

    const resetAnalysis = () => {
        setAnalysisResult(null);
    }

    return {
        isExporting, hasBackedUp, backupData, setBackupData,
        isAnalyzing, analysisResult, setAnalysisResult,
        isCleaning,
        storageStats, isCalculatingStorage,
        prepareBackup, downloadBackupFile, analyzeOldData, performCleanup, resetAnalysis, fetchStorageStats
    };
};
