
import React, { useState, useEffect } from 'react';
import { PlayCircle, StopCircle, RefreshCw } from 'lucide-react';

const MeetingTimer: React.FC = () => {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: any;
        if (isRunning) {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTimer = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
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
