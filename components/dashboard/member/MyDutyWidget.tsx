
import React from 'react';
import { User, Duty } from '../../../types';
import { Coffee, CheckCircle2, Camera, Sparkles } from 'lucide-react';
import { isSameDay } from 'date-fns';

interface MyDutyWidgetProps {
    duties: Duty[];
    currentUser: User;
}

const MyDutyWidget: React.FC<MyDutyWidgetProps> = ({ duties, currentUser }) => {
    const today = new Date();
    const myDutiesToday = duties.filter(d => 
        d.assigneeId === currentUser.id && 
        isSameDay(new Date(d.date), today)
    );

    if (myDutiesToday.length === 0) return null;

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 rounded-[2rem] p-6 text-white shadow-lg shadow-orange-200 mb-8 group">
            
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400 opacity-20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Left: Mission Info */}
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                        <Coffee className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                Daily Quest
                            </span>
                            <span className="text-orange-100 text-xs font-bold flex items-center">
                                <Sparkles className="w-3 h-3 mr-1" /> +20 XP
                            </span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight leading-none">
                            ภารกิจเวรวันนี้
                        </h3>
                        <p className="text-orange-100 text-sm mt-1 opacity-90">
                            อย่าลืมทำความสะอาดและส่งหลักฐานนะ!
                        </p>
                    </div>
                </div>

                {/* Right: Tasks List */}
                <div className="flex flex-wrap gap-3 w-full md:w-auto justify-center md:justify-end">
                    {myDutiesToday.map(duty => (
                        <div 
                            key={duty.id} 
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all
                                ${duty.isDone 
                                    ? 'bg-white/90 border-transparent text-green-700 shadow-md' 
                                    : 'bg-black/20 border-white/30 text-white backdrop-blur-sm'
                                }
                            `}
                        >
                            {duty.isDone ? (
                                <div className="bg-green-100 p-1 rounded-full">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>
                            ) : (
                                <div className="bg-white/20 p-1.5 rounded-full animate-pulse">
                                    <Camera className="w-4 h-4 text-white" />
                                </div>
                            )}
                            
                            <div className="flex flex-col">
                                <span className={`text-xs font-bold leading-tight ${duty.isDone ? 'line-through opacity-70' : ''}`}>
                                    {duty.title}
                                </span>
                                <span className="text-[10px] opacity-70 font-medium">
                                    {duty.isDone ? 'Mission Complete' : 'Tap in Calendar to submit'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyDutyWidget;
