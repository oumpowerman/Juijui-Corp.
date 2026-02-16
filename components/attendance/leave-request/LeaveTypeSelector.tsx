
import React from 'react';
import { MasterOption } from '../../../types';
import { LEAVE_THEMES } from './constants';
import { Clock, Moon, Home } from 'lucide-react';

interface Props {
    masterOptions: MasterOption[];
    onSelect: (key: string) => void;
}

const LeaveTypeSelector: React.FC<Props> = ({ masterOptions, onSelect }) => {
    // Standard Types from DB (Filter out WFH because we have a special button for it)
    const standardTypes = masterOptions.filter(o => o.type === 'LEAVE_TYPE' && o.isActive && o.key !== 'WFH');

    return (
        <div className="grid grid-cols-2 gap-3 pb-4">
            {/* Special Type: WFH (Top Priority) - Compact Header */}
            <button 
                onClick={() => onSelect('WFH')} 
                className="col-span-2 flex flex-row items-center justify-between p-4 rounded-2xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-200 hover:shadow-md transition-all group active:scale-95"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-sm">
                        <Home className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <span className="font-black text-blue-800 text-sm block">Work From Home</span>
                        <span className="text-[10px] text-blue-600 font-medium">ขออนุญาตทำงานที่บ้าน</span>
                    </div>
                </div>
            </button>

            {standardTypes.map(opt => {
                const th = LEAVE_THEMES[opt.key] || LEAVE_THEMES['DEFAULT'];
                const Icon = th.icon;
                return (
                    <button 
                        key={opt.key}
                        onClick={() => onSelect(opt.key)}
                        className={`
                            flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group active:scale-95
                            bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5
                        `}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${th.bg} ${th.text}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-gray-700 text-xs group-hover:text-indigo-600 text-center leading-tight">{opt.label}</span>
                    </button>
                );
            })}

            {/* Special Types */}
            <button onClick={() => onSelect('LATE_ENTRY')} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 bg-white hover:border-amber-200 hover:shadow-md hover:-translate-y-0.5 transition-all group active:scale-95">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                    <Clock className="w-6 h-6" />
                </div>
                <span className="font-bold text-gray-700 text-xs group-hover:text-amber-600">แจ้งเข้าสาย</span>
            </button>
            
            <button onClick={() => onSelect('OVERTIME')} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all group active:scale-95">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <Moon className="w-6 h-6" />
                </div>
                <span className="font-bold text-gray-700 text-xs group-hover:text-indigo-600">ขอทำ OT</span>
            </button>
        </div>
    );
};

export default LeaveTypeSelector;
