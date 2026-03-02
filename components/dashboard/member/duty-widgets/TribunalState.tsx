
import React from 'react';
import { Scale, AlertTriangle, ArrowRight } from 'lucide-react';
import { ViewMode } from '../../../../types';

interface TribunalStateProps {
    onNavigate: (view: ViewMode) => void;
}

const TribunalState: React.FC<TribunalStateProps> = ({ onNavigate }) => {
    return (
        <div className="relative overflow-hidden bg-[#FFFBEB] rounded-[2.5rem] p-6 text-amber-900 shadow-sm border border-amber-100 h-full flex flex-col justify-center group transition-all hover:shadow-md">
            {/* Subtle Decorative Element */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                        <Scale className="w-7 h-7 text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center border border-amber-200/50">
                                <AlertTriangle className="w-3 h-3 mr-1" /> TRIBUNAL
                            </span>
                        </div>
                        <h3 className="text-xl font-bold tracking-tight leading-none mb-1 text-amber-900">
                            โอกาสสุดท้าย <span className="text-amber-500">⚖️</span>
                        </h3>
                        <p className="text-amber-700/70 text-sm truncate max-w-[200px] font-medium">
                            รีบแก้ตัวก่อนจะสายเกินไป
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => onNavigate('DUTY')}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-semibold text-sm shadow-sm hover:shadow-md hover:bg-amber-600 transition-all active:scale-95 w-full md:w-auto whitespace-nowrap"
                >
                    🙏 ไปแก้ตัวเดี๋ยวนี้
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default TribunalState;
