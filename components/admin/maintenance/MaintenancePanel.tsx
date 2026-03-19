
import React, { useState, useEffect } from 'react';
import { useMaintenance } from '../../../hooks/useMaintenance';
import { Download, Search, Trash2, HardDrive, Archive, AlertTriangle, Loader2, RefreshCw, Database, ShieldCheck, CheckCircle2, FileText, MessageSquare, Info, History } from 'lucide-react';
import { BackupOptions } from '../../../types';
import { format, addMonths } from 'date-fns';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

const MaintenancePanel: React.FC = () => {
    const { 
        storageStats, isCalculatingStorage, fetchStorageStats,
        isExporting, prepareBackup, downloadBackupFile,
        isAnalyzing, analysisResult, analyzeOldData, resetAnalysis,
        isCleaning, performCleanup
    } = useMaintenance();

    const { showConfirm, showAlert } = useGlobalDialog();

    // --- Tab State ---
    const [activeTab, setActiveTab] = useState<'BACKUP' | 'CLEANUP'>('BACKUP');

    // --- Backup State ---
    const [backupOptions, setBackupOptions] = useState<BackupOptions & { logs: boolean }>({
        tasks: true,
        contents: true,
        chats: true,
        profiles: true,
        logs: true // Added Logs
    });

    // --- Cleanup State ---
    const [cleanupMonths, setCleanupMonths] = useState(6);
    const [cleanupTargets, setCleanupTargets] = useState<string[]>(['DONE', 'REJECTED', 'CANCELLED']); 
    
    // Cleanup Selection (What to delete after scan)
    const [cleanupSelection, setCleanupSelection] = useState({
        logs: true,
        notifs: true,
        chats: false, // Safer default
        tasks: false  // Safer default
    });

    useEffect(() => {
        fetchStorageStats();
    }, []);

    // Format Bytes Helper
    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const handleBackup = async () => {
        const data = await prepareBackup(backupOptions);
        if(data) downloadBackupFile(data);
    };

    const handleScan = () => {
        analyzeOldData(cleanupMonths, cleanupTargets);
    };

    const handleCleanupConfirm = async () => {
        if (!analysisResult) return;
        
        // Calculate items to delete based on selection
        let totalToDelete = 0;
        if (cleanupSelection.logs) totalToDelete += analysisResult.logCount;
        if (cleanupSelection.notifs) totalToDelete += analysisResult.notifCount;
        if (cleanupSelection.chats) totalToDelete += analysisResult.chatCount;
        if (cleanupSelection.tasks) totalToDelete += analysisResult.taskCount;

        if (totalToDelete === 0) {
            await showAlert('กรุณาเลือกรายการที่จะลบอย่างน้อย 1 รายการ');
            return;
        }

        const confirmed = await showConfirm(
            `คุณกำลังจะลบข้อมูล ${totalToDelete.toLocaleString()} รายการที่เก่ากว่า ${cleanupMonths} เดือน\n\nการกระทำนี้ไม่สามารถย้อนกลับได้! (ข้อมูลการเงินจะไม่ถูกลบ)`,
            '⚠️ ยืนยันการล้างขยะ (Deep Clean)'
        );

        if (confirmed) {
            performCleanup(cleanupMonths, cleanupTargets, cleanupSelection);
        }
    };

    // Calculate Percentages for Bar
    const totalPercent = Math.min((storageStats.usedBytes / storageStats.limitBytes) * 100, 100);
    const filePercent = (storageStats.fileBytes / storageStats.limitBytes) * 100;
    const dbPercent = (storageStats.dbBytes / storageStats.limitBytes) * 100;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 1. System Health Monitor */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-800">Storage Usage</h3>
                            <p className="text-sm text-gray-500">พื้นที่จัดเก็บข้อมูลระบบ</p>
                        </div>
                    </div>
                    <button onClick={fetchStorageStats} disabled={isCalculatingStorage} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-indigo-600">
                        <RefreshCw className={`w-4 h-4 ${isCalculatingStorage ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Meter */}
                <div className="mb-2 flex justify-between text-sm font-bold">
                    <span className="text-indigo-600">{formatBytes(storageStats.usedBytes)} Used</span>
                    <span className="text-gray-400">{formatBytes(storageStats.limitBytes)} Quota</span>
                </div>
                
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200 flex relative">
                    {/* DB Segment */}
                    <div 
                        className="h-full bg-blue-500 transition-all duration-1000" 
                        style={{ width: `${dbPercent}%` }}
                    />
                    {/* File Segment */}
                    <div 
                        className="h-full bg-cyan-400 transition-all duration-1000" 
                        style={{ width: `${filePercent}%` }}
                    />
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-6 mt-4 text-xs text-gray-500 font-medium">
                     <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                         <span>Database: <b className="text-gray-700">{formatBytes(storageStats.dbBytes)}</b> (Est.)</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                         <span>Files: <b className="text-gray-700">{formatBytes(storageStats.fileBytes)}</b> ({storageStats.fileCount.toLocaleString()} items)</span>
                     </div>
                </div>
            </div>

            {/* 2. Main Action Area */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[400px]">
                
                {/* Sidebar / Tabs */}
                <div className="w-full md:w-64 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-200 p-4 flex flex-row md:flex-col gap-2">
                    <button 
                        onClick={() => setActiveTab('BACKUP')}
                        className={`flex-1 md:flex-none flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'BACKUP' ? 'bg-white shadow-sm text-indigo-700 font-bold border border-indigo-100' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Archive className="w-5 h-5" /> สำรองข้อมูล (Backup)
                    </button>
                    <button 
                        onClick={() => setActiveTab('CLEANUP')}
                        className={`flex-1 md:flex-none flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'CLEANUP' ? 'bg-red-50 shadow-sm text-red-600 font-bold border border-red-100' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Trash2 className="w-5 h-5" /> ล้างขยะ (Cleanup)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-8">
                    
                    {/* --- BACKUP TAB --- */}
                    {activeTab === 'BACKUP' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">Smart Backup</h3>
                                    <p className="text-sm text-gray-500 mt-1">เลือกข้อมูลที่ต้องการ Export เก็บไว้ (.json)</p>
                                </div>
                                <div className="p-2 bg-indigo-50 rounded-full text-indigo-600">
                                    <Database className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.keys(backupOptions).map(key => (
                                    <label key={key} className="flex items-center p-4 rounded-2xl border border-gray-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                                        <input 
                                            type="checkbox" 
                                            checked={backupOptions[key as keyof typeof backupOptions]} 
                                            onChange={(e) => setBackupOptions({...backupOptions, [key]: e.target.checked})}
                                            className="w-5 h-5 accent-indigo-600 rounded mr-3"
                                        />
                                        <span className="capitalize font-bold text-gray-700">{key === 'logs' ? 'System Logs (History)' : key}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
                                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Note:</p>
                                    <p className="text-xs opacity-90 mt-1">ระบบจะ Backup เฉพาะข้อมูล Text และ Link รูปภาพเท่านั้น (ไฟล์รูปจริงต้อง Download จาก Google Drive แยกต่างหาก)</p>
                                </div>
                            </div>

                            <button 
                                onClick={handleBackup} 
                                disabled={isExporting}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isExporting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                                {isExporting ? 'กำลังเตรียมไฟล์...' : 'ดาวน์โหลดไฟล์ Backup'}
                            </button>
                        </div>
                    )}

                    {/* --- CLEANUP TAB --- */}
                    {activeTab === 'CLEANUP' && (
                        <div className="space-y-6 animate-in fade-in">
                             <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800 text-red-600">Deep Cleanup</h3>
                                    <p className="text-sm text-gray-500 mt-1">ลบไฟล์ขยะและประวัติเก่าเพื่อคืนพื้นที่</p>
                                </div>
                                <div className="p-2 bg-red-50 rounded-full text-red-500">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                            </div>

                            {!analysisResult ? (
                                <>
                                    {/* Scan Config */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700">
                                            ลบข้อมูลที่เก่ากว่า (Retention Period)
                                        </label>
                                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                            <input 
                                                type="range" min="1" max="24" 
                                                value={cleanupMonths} 
                                                onChange={(e) => setCleanupMonths(parseInt(e.target.value))}
                                                className="flex-1 accent-red-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <div className="text-center min-w-[80px]">
                                                <span className="block text-2xl font-black text-red-600">{cleanupMonths}</span>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Months</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-right text-gray-400">
                                            * ข้อมูลก่อนวันที่ {format(addMonths(new Date(), -cleanupMonths), 'd MMM yyyy')} จะถูกตรวจสอบ
                                        </p>
                                    </div>

                                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3 text-sm text-orange-800">
                                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold">Safety First:</p>
                                            <p className="text-xs opacity-90 mt-1">
                                                ระบบจะ <u>ไม่ลบ</u> ข้อมูลการเงิน (Finance) โดยเด็ดขาด 
                                                การลบจะเน้นไปที่ Logs, Notifications, แชทเก่า และงานที่เสร็จแล้วเท่านั้น
                                            </p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleScan} 
                                        disabled={isAnalyzing}
                                        className="w-full py-4 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-all flex items-center justify-center"
                                    >
                                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
                                        สแกนหาไฟล์ขยะ (Scan Now)
                                    </button>
                                </>
                            ) : (
                                /* Scan Result View with Selection */
                                <div className="space-y-6 animate-in zoom-in-95">
                                    <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                                        <h4 className="text-lg font-black text-red-800 mb-4 text-center">ผลการสแกน & เลือกสิ่งที่ต้องการลบ</h4>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <label className={`bg-white p-3 rounded-2xl border cursor-pointer transition-all ${cleanupSelection.logs ? 'border-red-400 ring-2 ring-red-100' : 'border-red-100 opacity-70'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="text-xs text-gray-500 flex items-center gap-1"><History className="w-3 h-3"/> Logs & Hist</div>
                                                    <input type="checkbox" checked={cleanupSelection.logs} onChange={e => setCleanupSelection({...cleanupSelection, logs: e.target.checked})} className="accent-red-600" />
                                                </div>
                                                <div className="text-2xl font-black text-red-600">{analysisResult.logCount.toLocaleString()}</div>
                                            </label>

                                            <label className={`bg-white p-3 rounded-2xl border cursor-pointer transition-all ${cleanupSelection.notifs ? 'border-red-400 ring-2 ring-red-100' : 'border-red-100 opacity-70'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="text-xs text-gray-500">Notifications</div>
                                                    <input type="checkbox" checked={cleanupSelection.notifs} onChange={e => setCleanupSelection({...cleanupSelection, notifs: e.target.checked})} className="accent-red-600" />
                                                </div>
                                                <div className="text-2xl font-black text-red-600">{analysisResult.notifCount.toLocaleString()}</div>
                                            </label>

                                            <label className={`bg-white p-3 rounded-2xl border cursor-pointer transition-all ${cleanupSelection.chats ? 'border-red-400 ring-2 ring-red-100' : 'border-red-100 opacity-70'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="text-xs text-gray-500 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Chats</div>
                                                    <input type="checkbox" checked={cleanupSelection.chats} onChange={e => setCleanupSelection({...cleanupSelection, chats: e.target.checked})} className="accent-red-600" />
                                                </div>
                                                <div className="text-2xl font-black text-red-600">{analysisResult.chatCount.toLocaleString()}</div>
                                            </label>

                                            <label className={`bg-white p-3 rounded-2xl border cursor-pointer transition-all ${cleanupSelection.tasks ? 'border-red-400 ring-2 ring-red-100' : 'border-red-100 opacity-70'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="text-xs text-gray-500 flex items-center gap-1"><FileText className="w-3 h-3"/> Done Tasks</div>
                                                    <input type="checkbox" checked={cleanupSelection.tasks} onChange={e => setCleanupSelection({...cleanupSelection, tasks: e.target.checked})} className="accent-red-600" />
                                                </div>
                                                <div className="text-2xl font-black text-red-600">{analysisResult.taskCount.toLocaleString()}</div>
                                            </label>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={resetAnalysis}
                                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button 
                                                onClick={handleCleanupConfirm}
                                                disabled={isCleaning || (!cleanupSelection.logs && !cleanupSelection.notifs && !cleanupSelection.chats && !cleanupSelection.tasks)}
                                                className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isCleaning ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Trash2 className="w-5 h-5 mr-2"/>}
                                                ลบรายการที่เลือก
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MaintenancePanel;
