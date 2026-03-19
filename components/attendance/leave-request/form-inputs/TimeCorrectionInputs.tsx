
import React from 'react';
import { format } from 'date-fns';
import CustomDatePicker from '../../../common/CustomDatePicker';

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
    const selectedDate = date ? new Date(date) : null;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div className={showEndTime ? 'col-span-2' : ''}>
                    <label className="block text-[13px] font-kanit font-medium  text-gray-400 uppercase mb-2 ml-1 tracking-widest">วันที่ (Date)</label>
                    <CustomDatePicker 
                        selected={selectedDate}
                        onChange={(date) => setDate(date ? date.toISOString().split('T')[0] : '')}
                        placeholderText="dd/mm/yyyy"
                    />
                </div>
                <div>
                    <label className="block text-[13px] font-kanit font-medium  text-gray-400 uppercase mb-2 ml-1 tracking-widest">{showEndTime ? 'เวลาเข้างาน' : 'เวลา (Time)'}</label>
                    <CustomDatePicker 
                        selected={time ? new Date(`2000-01-01T${time}`) : null}
                        onChange={(date) => setTime(date ? format(date, 'HH:mm') : '')}
                        showTimeSelect
                        showTimeSelectOnly
                        placeholderText="--:--"
                    />
                </div>
                {showEndTime && setEndTime && (
                    <div>
                        <label className="block text-[13px] font-kanit font-medium  text-gray-400 uppercase mb-2 ml-1 tracking-widest">เวลาออกงาน</label>
                        <CustomDatePicker 
                            selected={endTime ? new Date(`2000-01-01T${endTime}`) : null}
                            onChange={(date) => setEndTime(date ? format(date, 'HH:mm') : '')}
                            showTimeSelect
                            showTimeSelectOnly
                            placeholderText="--:--"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeCorrectionInputs;
