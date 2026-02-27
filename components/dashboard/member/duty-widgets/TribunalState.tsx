
import React from 'react';
import { Scale, AlertTriangle, ArrowRight } from 'lucide-react';
import { ViewMode } from '../../../../types';

interface TribunalStateProps {
    onNavigate: (view: ViewMode) => void;
}

const TribunalState: React.FC<TribunalStateProps> = ({ onNavigate }) => {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2.5rem] p-6 text-white shadow-lg shadow-yellow-200 h-full flex flex-col justify-center group border-4 border-yellow-200 animate-pulse-slow">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-inner shrink-0 animate-bounce">
                        <Scale className="w-9 h-9 text-white drop-shadow-md" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-white text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" /> TRIBUNAL
                            </span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight leading-none mb-1 text-white">
                            โอกาสสุดท้าย! ⚖️
                        </h3>
                        <p className="text-orange-50 text-sm opacity-90 truncate max-w-[200px] font-medium">
                            รีบแก้ตัวก่อนจะสายเกินไป
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => onNavigate('DUTY')}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-orange-600 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:bg-orange-50 transition-all active:scale-95 w-full md:w-auto whitespace-nowrap border-b-4 border-orange-200"
                >
                    🙏 ไปแก้ตัวเดี๋ยวนี้
                </button>
            </div>
        </div>
    );
};

export default TribunalState;
