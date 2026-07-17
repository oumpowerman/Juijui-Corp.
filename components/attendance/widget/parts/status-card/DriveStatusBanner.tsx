import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CloudOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DriveStatusBannerProps {
    isSelfieEnabled: boolean;
    isDriveReady: boolean;
    isTimeout: boolean;
    loadingTime: number;
    isAuthenticated: boolean;
    onConnectDrive?: () => void;
    onRetryDrive?: () => void;
}

export const DriveStatusBanner: React.FC<DriveStatusBannerProps> = ({
    isSelfieEnabled,
    isDriveReady,
    isTimeout,
    loadingTime,
    isAuthenticated,
    onConnectDrive,
    onRetryDrive
}) => {
    if (!isSelfieEnabled) return null;

    return (
        <div className="mb-2 animate-in fade-in slide-in-from-top-1 duration-500">
            {!isDriveReady ? (
                <div className={`p-3 rounded-2xl border transition-all ${isTimeout ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                    {isTimeout ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-rose-100 p-2 rounded-full text-rose-500">
                                    <CloudOff className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-bold text-rose-800">Drive Connection Timeout</p>
                                    <p className="text-[9px] text-rose-600">การเชื่อมต่อล้มเหลว กรุณาลองใหม่</p>
                                </div>
                            </div>
                            <button 
                                onClick={onRetryDrive} 
                                className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-rose-600 transition-colors shadow-sm"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                            <div className="flex-1">
                                <p className="text-[11px] font-medium text-slate-500">กำลังเตรียมระบบ Google Drive...</p>
                                <div className="mt-1.5 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-400 transition-all duration-1000 ease-linear" 
                                        style={{ width: `${(loadingTime / 20) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : !isAuthenticated ? (
                <motion.div 
                    animate={{ 
                        backgroundColor: ["rgba(255, 241, 242, 0.5)", "rgba(255, 228, 230, 0.8)", "rgba(255, 241, 242, 0.5)"],
                        borderColor: ["rgba(251, 113, 133, 0.2)", "rgba(251, 113, 133, 0.5)", "rgba(251, 113, 133, 0.2)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="border rounded-2xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden"
                >
                    {/* Urgent Background Pulse */}
                    <motion.div 
                        animate={{ opacity: [0, 0.1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-red-500 pointer-events-none"
                    />

                    <div className="flex items-center gap-3 relative z-10">
                        <motion.div 
                            animate={{ rotate: [-10, 10, -10] }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                            className="bg-white p-2 rounded-full text-rose-500 shadow-sm border border-rose-100"
                        >
                            <AlertTriangle className="w-5 h-5" />
                        </motion.div>
                        <div className="text-left">
                            <p className="text-[11px] font-bold text-rose-900 uppercase tracking-tight flex items-center gap-1">
                                Backup System Disabled
                            </p>
                            <p className="text-[9px] text-rose-600 font-bold leading-tight">
                                เสี่ยงข้อมูลสูญหาย! กรุณาเชื่อมต่อ Drive ทันที
                            </p>
                        </div>
                    </div>
                    <motion.button 
                        onClick={onConnectDrive}
                        animate={{ 
                            scale: [1, 1.1, 1],
                            boxShadow: [
                                "0 0 0px rgba(225, 29, 72, 0)",
                                "0 0 20px rgba(225, 29, 72, 0.5)",
                                "0 0 0px rgba(225, 29, 72, 0)"
                            ]
                        }}
                        transition={{ 
                            duration: 1, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        whileHover={{ scale: 1.15, boxShadow: "0 0 25px rgba(225, 29, 72, 0.7)" }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[14px] font-kanit font-medium uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all relative z-10"
                    >
                        เชื่อมต่อตอนนี้!
                    </motion.button>
                </motion.div>
            ) : (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-2.5 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Google Drive Connected</span>
                </div>
            )}
        </div>
    );
};
