
import React from 'react';
import { differenceInDays } from 'date-fns';
import CustomDatePicker from '../../../common/CustomDatePicker';

interface Props {
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
}

const StandardLeaveInputs: React.FC<Props> = ({ startDate, setStartDate, endDate, setEndDate }) => {
    const daysCount = startDate && endDate ? differenceInDays(new Date(endDate), new Date(startDate)) + 1 : 0;
    const selectedStartDate = startDate ? new Date(startDate) : null;
    const selectedEndDate = endDate ? new Date(endDate) : null;

    return (
        <div className="space-y-3">
            <label className="block text-[13px] font-kanit font-medium text-gray-400 uppercase mb-2 ml-1 tracking-widest flex justify-between">
                <span>ช่วงเวลาที่ลา (Period)</span>
                {daysCount > 0 && <span className="text-indigo-500 font-bold">{daysCount} วัน</span>}
            </label>
            <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-[2rem] border border-gray-100 shadow-inner">
                <div className="flex-1">
                    <CustomDatePicker 
                        selected={selectedStartDate}
                        onChange={(date) => {
                            const dateStr = date ? date.toISOString().split('T')[0] : '';
                            setStartDate(dateStr);
                            if(endDate && dateStr > endDate) setEndDate(dateStr);
                        }}
                        placeholderText="dd/mm/yyyy"
                    />
                </div>
                <div className="bg-white p-1.5 rounded-full shadow-sm">
                    <span className="text-gray-300 font-bold text-xs">→</span>
                </div>
                <div className="flex-1">
                    <CustomDatePicker 
                        selected={selectedEndDate}
                        onChange={(date) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
                        placeholderText="dd/mm/yyyy"
                    />
                </div>
            </div>
        </div>
    );
};

export default StandardLeaveInputs;
