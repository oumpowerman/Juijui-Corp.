
import React, { useState, useEffect } from 'react';
import { useMaintenance } from '../../../hooks/useMaintenance';
import { Download, Search, Trash2, HardDrive, Database, Archive, CheckCircle, AlertTriangle, Loader2, RefreshCw, File } from 'lucide-react';
import { BackupOptions } from '../../../types';
import { format, addMonths } from 'date-fns';

const MaintenancePanel: React.FC = () => {
    const { 
        isExporting, hasBackedUp, backupData, prepareBackup, downloadBackupFile,
        isAnalyzing, analysisResult, analyzeOldData, performCleanup,
        storageStats, isCalculatingStorage, fetchStorageStats,
        isCleaning, setAnalysisResult
    } = useMaintenance();

    // Backup State
    const [backupOptions, setBackupOptions] = useState<BackupOptions>({
        tasks: true,
        contents: true,
        chats: true,
        profiles: true
    });

    // Cleanup State
    const [cleanupMonths, setCleanupMonths] = useState(6);
    const [cleanupTargets, setCleanupTargets] = useState<string[]>(['DONE', 'REJECTED']); // Default targets

    useEffect(() => {
        fetchStorageStats();
    }, []);

    const handleBackupClick = async () => {
        const data = await prepareBackup(backupOptions);
        if(data) downloadBackupFile(data);
    };

    // Format Bytes
    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const storagePercentage = (storageStats.usedBytes / storageStats.limitBytes) * 100;
    const dbPercentage = (storageStats.dbBytes / storageStats.limitBytes) * 100;
    const filePercentage = (storageStats.fileBytes / storageStats.limitBytes) * 100;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 1. Storage Health Monitor */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-indigo-600" /> พื้นที่จัดเก็บ (Storage Usage)
                        </h3>
                        <p className="text-sm text-gray-500">ตรวจสอบพื้นที่คงเหลือของระบบ (Quota 1GB)</p>
                    </div>
                    <button onClick={fetchStorageStats} disabled={isCalculatingStorage} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <RefreshCw className={`w-4 h-4 ${isCalculatingStorage ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="mb-2 flex justify-between text-sm font-bold">
                    <span className="text-indigo-600">{formatBytes(storageStats.usedBytes)} Used</span>
                    <span className="text-gray-400">{formatBytes(storageStats.limitBytes)} Total</span>
                </div>
                
                {/* Stacked Progress Bar */}
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200 flex">
                    {/* Database Part */}
                    <div 
                        className="h-full bg-blue-500 transition-all duration-1000" 
                        style={{ width: `${dbPercentage}%` }}
                        title={`Database: ${formatBytes(storageStats.dbBytes)}`}
                    />
                    {/* File Part */}
                    <div 
                        className="h-full bg-cyan-400 transition-all duration-1000" 
                        style={{ width: `${filePercentage}%` }}
                        title={`Files: ${formatBytes(storageStats.fileBytes)}`}
                    />
                </div>
                
                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 font-medium">
                     <div className="flex items-center gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                         <span>Database: <b className="text-gray-700">{formatBytes(storageStats.dbBytes)}</b></span>
                     </div>
                     <div className="flex items-center gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                         <span>Files: <b className="text-gray-700">{formatBytes(storageStats.fileBytes)}</b></span>
                     </div>
                </div>
                
                {storagePercentage > 80 && (
                    <div className="mt-4 bg-red-50 p-3 rounded-xl flex items-center text-red-600 text-sm border border-red-100">
                        <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                        <span>พื้นที่ใกล้เต็มแล้ว! ควรลบไฟล์เก่าหรือแชทเก่าๆ ออกบ้างนะครับ</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 2. Intelligent Backup */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <Download className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Backup ข้อมูล</h3>
                            <p className="text-xs text-gray-500">เลือกส่วนที่ต้องการสำรองข้อมูล</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 mb-6">
                        {Object.keys(backupOptions).map(key => (
                            <label key={key} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                                <span className="capitalize font-bold text-gray-700">{key}</span>
                                <input 
                                    type="checkbox" 
                                    checked={backupOptions[key as keyof BackupOptions]} 
                                    onChange={(e) => setBackupOptions({...backupOptions, [key]: e.target.checked})}
                                    className="w-5 h-5 accent-blue-600 rounded"
                                />
                            </label>
                        ))}
                    </div>

                    <button 
                        onClick={handleBackupClick} 
                        disabled={isExporting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isExporting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Archive className="w-5 h-5 mr-2" />}
                        {isExporting ? 'กำลังเตรียมไฟล์...' : 'ดาวน์โหลด Backup (.json)'}
                    </button>
                </div>

                {/* 3. Deep Cleanup */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-red-100 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 bg-red-50 rounded-bl-full -mr-6 -mt-6 opacity-30 pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">ล้างขยะ (Cleanup)</h3>
                            <p className="text-xs text-gray-500">ลบข้อมูลเก่าเพื่อคืนพื้นที่</p>
                        </div>
                    </div>

                    {!analysisResult ? (
                        <div className="flex-1 space-y-4 mb-6 relative z-10">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">ลบข้อมูลที่เก่ากว่า (Months)</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="range" min="1" max="12" 
                                        value={cleanupMonths} 
                                        onChange={(e) => setCleanupMonths(parseInt(e.target.value))}
                                        className="flex-1 accent-red-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="font-black text-red-600 text-lg w-8 text-center">{cleanupMonths}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 text-right">ตัดรอบ: {format(addMonths(new Date(), -cleanupMonths), 'd MMM yyyy')}</p>
                            </div>

                            <button 
                                onClick={() => analyzeOldData(cleanupMonths, cleanupTargets)} 
                                disabled={isAnalyzing}
                                className="w-full py-3 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all flex items-center justify-center"
                            >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                                สแกนหาไฟล์เก่า
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-center animate-in zoom-in-95 relative z-10">
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-4 text-center">
                                <h4 className="font-bold text-red-800 mb-2">ผลการสแกนพบ</h4>
                                <div className="flex justify-around">
                                    <div>
                                        <p className="text-2xl font-black text-red-600">{analysisResult.chatCount}</p>
                                        <p className="text-xs text-red-400">ข้อความแชท</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-red-600">{analysisResult.taskCount}</p>
                                        <p className="text-xs text-red-400">งานที่จบแล้ว</p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => performCleanup(cleanupMonths, cleanupTargets)}
                                disabled={isCleaning}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center"
                            >
                                {isCleaning ? 'กำลังลบ...' : 'ยืนยันการลบถาวร'}
                            </button>
                            <button 
                                onClick={() => setAnalysisResult(null)}
                                className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline text-center"
                            >
                                ยกเลิก / กลับไปเลือกใหม่
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaintenancePanel;
