
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AppNotification } from '../../types';

interface NegligenceLockModalProps {
    notification: AppNotification | undefined;
    onAcknowledge: (id: string) => void;
}

const NegligenceLockModal: React.FC<NegligenceLockModalProps> = ({ notification, onAcknowledge }) => {
    const [canClose, setCanClose] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (notification) {
            setCanClose(false);
            setCountdown(5);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanClose(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [notification]);

    if (!notification) return null;

    const penaltyHP = notification.metadata?.hp || -20;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-red-500/30 w-full max-w-md rounded-[2.5rem] shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden relative flex flex-col items-center text-center p-8 animate-in zoom-in-95 duration-500">
                
                {/* Background Animation */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#7f1d1d_10px,#7f1d1d_20px)] opacity-5 pointer-events-none"></div>
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-500 rounded-full blur-[80px] opacity-20 animate-pulse"></div>

                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border-2 border-red-500/50 relative">
                    <Lock className="w-10 h-10 text-red-500" />
                    <div className="absolute -bottom-2 -right-2 bg-red-600 text-white p-1.5 rounded-full border-4 border-slate-900">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">
                    ระบบลงทัณฑ์ทำงาน!
                </h2>
                <p className="text-red-400 font-bold text-sm mb-6 uppercase tracking-widest">
                    Negligence Protocol Activated
                </p>

                <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/10 mb-8 w-full backdrop-blur-sm">
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        {notification.message}
                    </p>
                    <div className="flex justify-center gap-4">
                        <div className="bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/30">
                            <p className="text-[10px] text-red-300 font-bold uppercase">HP Penalty</p>
                            <p className="text-2xl font-black text-red-500">{penaltyHP}</p>
                        </div>
                        <div className="bg-slate-700/50 px-4 py-2 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                            <p className="text-lg font-bold text-white">System Cleared</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => canClose && onAcknowledge(notification.id)}
                    disabled={!canClose}
                    className={`
                        w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2
                        ${canClose 
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50 cursor-pointer active:scale-95' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}
                    `}
                >
                    {canClose ? (
                        <>
                            <CheckCircle2 className="w-5 h-5" /> รับทราบและจะปรับปรุงตัว
                        </>
                    ) : (
                        <>
                            <ShieldAlert className="w-5 h-5 animate-pulse" /> กรุณารอ {countdown} วินาที...
                        </>
                    )}
                </button>
            </div>
        </div>,
        document.body
    );
};

export default NegligenceLockModal;
