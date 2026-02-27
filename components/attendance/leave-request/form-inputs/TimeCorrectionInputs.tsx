
import React from 'react';

interface Props {
    date: string;
    setDate: (val: string) => void;
    time: string;
    setTime: (val: string) => void;
    endTime?: string;
    setEndTime?: (val: string) => void;
    isFixedDate?: boolean;
    showEndTime?: boolean;
}

const TimeCorrectionInputs: React.FC<Props> = ({ date, setDate, time, setTime, endTime, setEndTime, isFixedDate, showEndTime }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className={showEndTime ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">วันที่ (Date)</label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-xl outline-none font-bold text-gray-700 transition-all text-sm"
                        disabled={isFixedDate}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{showEndTime ? 'เข้างาน' : 'เวลา (Time)'}</label>
                    <input 
                        type="time" 
                        value={time} 
                        onChange={e => setTime(e.target.value)} 
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none font-black text-indigo-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-center" 
                    />
                </div>
                {showEndTime && setEndTime && (
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">ออกงาน</label>
                        <input 
                            type="time" 
                            value={endTime} 
                            onChange={e => setEndTime(e.target.value)} 
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none font-black text-rose-600 focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all text-center" 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeCorrectionInputs;
