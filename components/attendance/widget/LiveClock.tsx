
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, BookOpen   } from 'lucide-react';

const LiveClock: React.FC<{ onOpenRules: () => void }> = ({ onOpenRules }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    ลงเวลาทำงาน
                
                    <button
                        onClick={onOpenRules}
                        className="
                        ml-2 w-7 h-7
                        flex items-center justify-center
                        rounded-full

                        text-indigo-500
                        bg-indigo-50

                        transition-all duration-200 ease-out

                        hover:bg-indigo-600 hover:text-white
                        hover:scale-110

                        active:scale-95

                        relative group
                        "
                        title="กฎการลงเวลา"
                    >
                        <span className="
                            absolute inset-0 rounded-full
                            ring-2 ring-indigo-400/0
                            transition-all duration-300
                            group-hover:ring-indigo-400/40
                        " />

                        <BookOpen   className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
                    </button>
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
