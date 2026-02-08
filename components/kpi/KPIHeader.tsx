
import React from 'react';
import { ChevronLeft, ChevronRight, Settings, Award } from 'lucide-react';

interface KPIHeaderProps {
    monthLabel: string;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onOpenConfig: () => void;
    isAdmin: boolean;
}

const KPIHeader: React.FC<KPIHeaderProps> = ({ monthLabel, onPrevMonth, onNextMonth, onOpenConfig, isAdmin }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <Award className="w-8 h-8 mr-2 text-indigo-500" />
                    Performance Review (360°)
                </h1>
                <p className="text-gray-500 mt-1">ประเมินผลงานแบบรอบด้าน & สรุปผลประจำเดือน</p>
            </div>
            
            <div className="flex items-center gap-3">
                {isAdmin && (
                    <button 
                        onClick={onOpenConfig} 
                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group" 
                        title="ตั้งค่าเกณฑ์"
                    >
                        <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    </button>
                )}
                <div className="flex items-center bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                    <button onClick={onPrevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="px-4 text-center min-w-[140px] font-black text-indigo-600 text-lg">{monthLabel}</div>
                    <button onClick={onNextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
};

export default KPIHeader;
