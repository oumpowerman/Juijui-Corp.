
import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, StopCircle, RefreshCw } from 'lucide-react';

interface MeetingTimerProps {
    meetingId?: string;
}

const MeetingTimer: React.FC<MeetingTimerProps> = ({ meetingId = 'global' }) => {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const lastTickRef = useRef<number>(Date.now());

    // 1. Load state safely from localStorage on mount/meetingId transition
    useEffect(() => {
        let savedSecsStr: string | null = null;
        let savedRunningStr: string | null = null;
        let savedLastTickStr: string | null = null;

        try {
            savedSecsStr = localStorage.getItem(`juijui_timer_secs_${meetingId}`);
            savedRunningStr = localStorage.getItem(`juijui_timer_running_${meetingId}`);
            savedLastTickStr = localStorage.getItem(`juijui_timer_last_tick_${meetingId}`);
        } catch (e) {
            console.warn("localStorage access denied:", e);
        }

        let initialSecs = 0;
        let initialRunning = false;

        if (savedSecsStr !== null) {
            initialSecs = parseInt(savedSecsStr, 10) || 0;
        }
        if (savedRunningStr !== null) {
            initialRunning = savedRunningStr === 'true';
        }

        if (initialRunning && savedLastTickStr !== null) {
            const savedLastTick = parseInt(savedLastTickStr, 10) || Date.now();
            const elapsed = Math.floor((Date.now() - savedLastTick) / 1000);
            if (elapsed > 0) {
                initialSecs += elapsed;
            }
        }

        setSeconds(initialSecs);
        setIsRunning(initialRunning);
        lastTickRef.current = Date.now();
    }, [meetingId]);

    // 2. Persist state safely on change
    useEffect(() => {
        try {
            localStorage.setItem(`juijui_timer_secs_${meetingId}`, seconds.toString());
            localStorage.setItem(`juijui_timer_running_${meetingId}`, isRunning.toString());
            localStorage.setItem(`juijui_timer_last_tick_${meetingId}`, lastTickRef.current.toString());
        } catch (e) {
            console.warn("Failed to save to localStorage:", e);
        }
    }, [seconds, isRunning, meetingId]);

    // 3. Ticking effect
    useEffect(() => {
        let interval: any;
        if (isRunning) {
            lastTickRef.current = Date.now();
            interval = setInterval(() => {
                const now = Date.now();
                const passed = Math.floor((now - lastTickRef.current) / 1000);
                if (passed >= 1) {
                    setSeconds(prev => prev + passed);
                    lastTickRef.current = now;
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTimer = (secs: number) => {
        const hrs = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        const remainingSecs = secs % 60;
        
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2 pb-2">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isRunning ? 'bg-red-50 border-red-100 text-red-500 animate-pulse shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                 <span className="font-mono font-black tracking-widest text-sm font-hand">{formatTimer(seconds)}</span>
             </div>
             <button onClick={() => setIsRunning(!isRunning)} className="p-1.5 rounded-full hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors">
                 {isRunning ? <StopCircle className="w-5 h-5 fill-current" /> : <PlayCircle className="w-5 h-5 fill-current" />}
             </button>
             <button onClick={() => { setIsRunning(false); setSeconds(0); }} className="p-1.5 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                 <RefreshCw className="w-4 h-4" />
             </button>
        </div>
    );
};

export default MeetingTimer;
