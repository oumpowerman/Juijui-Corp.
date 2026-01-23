
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBackOnline, setShowBackOnline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowBackOnline(true);
            // Hide the "Back Online" message after 3 seconds
            setTimeout(() => setShowBackOnline(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBackOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline && !showBackOnline) return null;

    return (
        <div className={`fixed bottom-6 left-6 z-[100] transition-all duration-500 transform ${isOnline && !showBackOnline ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
            <div className={`
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md font-bold text-sm
                ${isOnline 
                    ? 'bg-emerald-500/90 text-white border-emerald-400' 
                    : 'bg-slate-800/90 text-white border-slate-700 animate-pulse'
                }
            `}>
                {isOnline ? (
                    <>
                        <Wifi className="w-5 h-5" />
                        <span>กลับมาออนไลน์แล้ว (Back Online)</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-5 h-5 text-red-400" />
                        <div className="flex flex-col">
                            <span>ขาดการเชื่อมต่อ (Offline)</span>
                            <span className="text-[10px] font-normal opacity-80">กรุณาอย่าเพิ่งบันทึกข้อมูล</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConnectionStatus;
