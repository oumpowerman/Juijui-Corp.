
import React from 'react';
import CustomDatePicker from '../../../common/CustomDatePicker';

interface Props {
    date: string;
    setDate: (val: string) => void;
    hours: number;
    setHours: (val: number) => void;
}

const OvertimeInputs: React.FC<Props> = ({ date, setDate, hours, setHours }) => {
    const selectedDate = date ? new Date(date) : null;

    return (
        <div className="flex gap-4">
            <div className="flex-[2]">
                <label className="block text-[13px] font-kanit font-medium text-gray-400 uppercase mb-2 ml-1 tracking-widest">วันที่ทำ OT</label>
                <CustomDatePicker 
                    selected={selectedDate}
                    onChange={(date) => setDate(date ? date.toISOString().split('T')[0] : '')}
                    placeholderText="dd/mm/yyyy"
                />
            </div>
            <div className="flex-1">
                <label className="block text-[13px] font-kanit font-medium  text-gray-400 uppercase mb-2 ml-1 tracking-widest text-center">ชั่วโมง</label>
                <input 
                    type="number" 
                    min={0.5} 
                    step={0.5} 
                    value={hours} 
                    onChange={e => setHours(Number(e.target.value))} 
                    className="w-full px-5 py-4 bg-indigo-50/30 border-2 border-indigo-100/50 rounded-3xl outline-none font-bold text-indigo-600 focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-50 transition-all text-center text-lg shadow-sm" 
                />
            </div>
        </div>
    );
};

export default OvertimeInputs;
