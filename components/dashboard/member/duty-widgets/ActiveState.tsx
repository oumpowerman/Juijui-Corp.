
import React from 'react';
import { Gamepad2, Sparkles, ArrowRight } from 'lucide-react';
import { Duty, User, ViewMode } from '../../../../types';

interface ActiveStateProps {
    myDuty: Duty;
    onNavigate: (view: ViewMode) => void;
}

const ActiveState: React.FC<ActiveStateProps> = ({ myDuty, onNavigate }) => {
    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 rounded-[2.5rem] p-6 text-white shadow-lg shadow-orange-200 h-full flex flex-col justify-center group border border-white/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner shrink-0 animate-pulse">
                        <Gamepad2 className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center">
                                <Sparkles className="w-3 h-3 mr-1" /> Daily Quest
                            </span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight leading-none mb-1">
                            ภารกิจของคุณ!
                        </h3>
                        <p className="text-orange-50 text-sm opacity-90 truncate max-w-[200px] font-medium">
                            {myDuty.title}
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => onNavigate('DUTY')}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-orange-600 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg hover:bg-orange-50 transition-all active:scale-95 w-full md:w-auto whitespace-nowrap"
                >
                    🚀 ส่งภารกิจ <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ActiveState;
