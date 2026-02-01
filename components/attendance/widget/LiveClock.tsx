
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

const LiveClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    ลงเวลาทำงาน
                </h3>
                <p className="text-gray-400 text-xs mt-1 font-mono">
                    {format(time, 'EEEE, d MMM yyyy')}
                </p>
            </div>
            <div className="text-right">
                <p className="text-3xl font-black text-gray-800 tracking-tight font-mono">
                    {format(time, 'HH:mm')}
                    <span className="text-sm text-gray-400 ml-1">{format(time, 'ss')}</span>
                </p>
            </div>
        </div>
    );
};

export default LiveClock;
