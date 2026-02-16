
import React from 'react';
import { differenceInDays } from 'date-fns';

interface Props {
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
}

const StandardLeaveInputs: React.FC<Props> = ({ startDate, setStartDate, endDate, setEndDate }) => {
    const daysCount = startDate && endDate ? differenceInDays(new Date(endDate), new Date(startDate)) + 1 : 0;

    return (
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex justify-between">
                <span>ช่วงเวลาที่ลา (Period)</span>
                <span className="text-indigo-500 font-bold">{daysCount > 0 ? daysCount : 0} วัน</span>
            </label>
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => { 
                        setStartDate(e.target.value); 
                        if(endDate && e.target.value > endDate) setEndDate(e.target.value); 
                    }} 
                    className="flex-1 bg-white px-3 py-2 rounded-xl text-sm font-bold text-gray-700 outline-none shadow-sm cursor-pointer" 
                />
                <span className="text-gray-400 font-bold">→</span>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="flex-1 bg-white px-3 py-2 rounded-xl text-sm font-bold text-gray-700 outline-none shadow-sm cursor-pointer" 
                    min={startDate} 
                />
            </div>
        </div>
    );
};

export default StandardLeaveInputs;
