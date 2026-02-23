
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { format, addMonths } from 'date-fns';
import { BackupOptions, StorageStats } from '../types';

const STORAGE_LIMIT = 1073741824; // 1 GB in Bytes (Quota limit example)

export const useMaintenance = () => {
    const { showToast } = useToast();
    
    // --- STATE ---
    const [isExporting, setIsExporting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [isCalculatingStorage, setIsCalculatingStorage] = useState(false);
    
    const [backupData, setBackupData] = useState<any>(null);
    const [hasBackedUp, setHasBackedUp] = useState(false);

    // Analysis Result
    const [analysisResult, setAnalysisResult] = useState<{
        chatCount: number;
        taskCount: number;
        logCount: number; // Task Logs + Game Logs
        notifCount: number;
        totalItems: number;
    } | null>(null);
    
    // Storage Health
    const [storageStats, setStorageStats] = useState<StorageStats>({ 
        usedBytes: 0, 
        fileBytes: 0,
        dbBytes: 0,
        fileCount: 0, 
        limitBytes: STORAGE_LIMIT 
    });

    // --- 1. STORAGE CALCULATOR ---
    const fetchStorageStats = async () => {
        setIsCalculatingStorage(true);
        try {
            let fileTotalBytes = 0;
            let totalFiles = 0;

            const buckets = ['chat-files', 'avatars', 'proofs']; 
            
            for (const bucket of buckets) {
                const { data } = await supabase.storage.from(bucket).list('', { limit: 1000 });
                if (data) {
                    totalFiles += data.length;
                    fileTotalBytes += data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
                }
            }

            const { count: logRows } = await supabase.from('task_logs').select('id', { count: 'exact', head: true });
            const { count: msgRows } = await supabase.from('team_messages').select('id', { count: 'exact', head: true });
            const estimatedDbBytes = ((logRows || 0) * 500) + ((msgRows || 0) * 1000); 

            setStorageStats({
                usedBytes: fileTotalBytes + estimatedDbBytes,
                fileBytes: fileTotalBytes,
                dbBytes: estimatedDbBytes,
                fileCount: totalFiles,
                limitBytes: STORAGE_LIMIT
            });
        } catch (err) {
            console.error("Storage check failed", err);
        } finally {
            setIsCalculatingStorage(false);
        }
    };

    // --- 2. BACKUP SYSTEM ---
    const prepareBackup = async (options: BackupOptions & { logs?: boolean, finance?: boolean }) => {
        setIsExporting(true);
        try {
            const dataToBackup: any = {
                exportedAt: new Date().toISOString(),
                meta: {
                    version: '2.0',
                    included: Object.keys(options).filter(k => options[k as keyof typeof options])
                },
                data: {}
            };

            const promises = [];

            if (options.tasks) {
                promises.push(supabase.from('tasks').select('*').then(res => dataToBackup.data.tasks = res.data || []));
            }
            if (options.contents) {
                promises.push(supabase.from('contents').select('*').then(res => dataToBackup.data.contents = res.data || []));
            }
            if (options.chats) {
                promises.push(supabase.from('team_messages').select('*').then(res => dataToBackup.data.chats = res.data || []));
            }
            if (options.profiles) {
                promises.push(supabase.from('profiles').select('*').then(res => dataToBackup.data.profiles = res.data || []));
            }
            
            // Added: Logs Backup support
            if (options.logs) {
                 promises.push(supabase.from('task_logs').select('*').then(res => dataToBackup.data.task_logs = res.data || []));
                 promises.push(supabase.from('game_logs').select('*').then(res => dataToBackup.data.game_logs = res.data || []));
                 promises.push(supabase.from('notifications').select('*').then(res => dataToBackup.data.notifications = res.data || []));
            }

            // Always attempt to backup finance if requested (or default safety)
            if (options.finance !== false) {
                 promises.push(supabase.from('finance_transactions').select('*').then(res => dataToBackup.data.finance = res.data || []));
            }

            await Promise.all(promises);
            
            setBackupData(dataToBackup);
            return dataToBackup;
        } catch (err: any) {
            showToast('เตรียมไฟล์ Backup ล้มเหลว: ' + err.message, 'error');
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
            downloadAnchorNode.setAttribute("download", `juijui_full_backup_${format(new Date(), 'yyyy-MM-dd')}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            setHasBackedUp(true);
            showToast('ดาวน์โหลดเรียบร้อย', 'success');
        } catch (err) {
            showToast('ดาวน์โหลดล้มเหลว', 'error');
        }
    };

    // --- 3. CLEANUP SYSTEM ---
    const analyzeOldData = async (months: number, targetStatuses: string[] = ['DONE', 'REJECTED', 'CANCELLED']) => {
        setIsAnalyzing(true);
        try {
            const cutoffDate = addMonths(new Date(), -months).toISOString();

            // 1. Logs
            const { count: taskLogCount } = await supabase.from('task_logs').select('*', { count: 'exact', head: true }).lt('created_at', cutoffDate);
            const { count: gameLogCount } = await supabase.from('game_logs').select('*', { count: 'exact', head: true }).lt('created_at', cutoffDate);
            
            // 2. Notifications
            const { count: notifCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).lt('created_at', cutoffDate);

            // 3. Chats
            const { count: chatCount } = await supabase.from('team_messages').select('*', { count: 'exact', head: true }).lt('created_at', cutoffDate);
            
            // 4. Tasks/Contents
            const { count: contentCount } = await supabase
                .from('contents')
                .select('*', { count: 'exact', head: true })
                .lt('end_date', cutoffDate)
                .in('status', targetStatuses);
            
            // Check Tasks table too if separate
            const { count: taskCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .lt('end_date', cutoffDate)
                .in('status', targetStatuses);

            const totalLogs = (taskLogCount || 0) + (gameLogCount || 0);
            const totalTasks = (contentCount || 0) + (taskCount || 0);

            setAnalysisResult({
                chatCount: chatCount || 0,
                taskCount: totalTasks,
                logCount: totalLogs,
                notifCount: notifCount || 0,
                totalItems: (chatCount || 0) + totalTasks + totalLogs + (notifCount || 0)
            });
            return true;
        } catch (err: any) {
            showToast('สแกนข้อมูลไม่สำเร็จ', 'error');
            return false;
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Updated: Accept `categories` to selectively clean
    const performCleanup = async (
        months: number, 
        targetStatuses: string[], 
        categories: { logs: boolean, chats: boolean, tasks: boolean, notifs: boolean }
    ) => {
        setIsCleaning(true);
        try {
            const cutoffDate = addMonths(new Date(), -months).toISOString();
            
            // 1. Delete Logs (Safe)
            if (categories.logs) {
                await supabase.from('task_logs').delete().lt('created_at', cutoffDate);
                await supabase.from('game_logs').delete().lt('created_at', cutoffDate);
            }

            // 2. Delete Notifications
            if (categories.notifs) {
                await supabase.from('notifications').delete().lt('created_at', cutoffDate);
            }
            
            // 3. Delete Chats
            if (categories.chats) {
                await supabase.from('team_messages').delete().lt('created_at', cutoffDate);
            }

            // 4. Delete Core Data (Tasks/Contents)
            if (categories.tasks) {
                await supabase.from('contents').delete().lt('end_date', cutoffDate).in('status', targetStatuses);
                await supabase.from('tasks').delete().lt('end_date', cutoffDate).in('status', targetStatuses);
            }

            // * SAFEGUARD: Never delete 'finance_transactions' automatically here *

            showToast(`ล้างข้อมูลเก่าเรียบร้อย! พื้นที่ว่างขึ้นเยอะเลย`, 'success');
            setAnalysisResult(null); 
            fetchStorageStats(); 
            
            return true;
        } catch (err: any) {
            showToast('ล้างข้อมูลล้มเหลว: ' + err.message, 'error');
            return false;
        } finally {
            setIsCleaning(false);
        }
    };

    const resetAnalysis = () => {
        setAnalysisResult(null);
    }

    return {
        storageStats, isCalculatingStorage,
        isExporting, hasBackedUp, backupData,
        isAnalyzing, analysisResult,
        isCleaning,
        fetchStorageStats,
        prepareBackup, 
        downloadBackupFile, 
        analyzeOldData, 
        performCleanup, 
        resetAnalysis,
        setBackupData
    };
};
