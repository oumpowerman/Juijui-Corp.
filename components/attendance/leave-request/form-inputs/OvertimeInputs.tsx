
import React from 'react';

interface Props {
    date: string;
    setDate: (val: string) => void;
    hours: number;
    setHours: (val: number) => void;
}

const OvertimeInputs: React.FC<Props> = ({ date, setDate, hours, setHours }) => {
    return (
        <div className="flex gap-4">
            <div className="flex-[2]">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">วันที่ทำ OT</label>
                <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100" 
                />
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">ชั่วโมง</label>
                <input 
                    type="number" 
                    min={0.5} 
                    step={0.5} 
                    value={hours} 
                    onChange={e => setHours(Number(e.target.value))} 
                    className="w-full px-4 py-3 bg-white border-2 border-indigo-100 rounded-xl font-black text-indigo-600 text-center outline-none" 
                />
            </div>
        </div>
    );
};

export default OvertimeInputs;
