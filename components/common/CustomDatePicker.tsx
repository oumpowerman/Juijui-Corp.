import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Clock } from 'lucide-react';

interface Props {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholderText?: string;
    showTimeSelect?: boolean;
    showTimeSelectOnly?: boolean;
    dateFormat?: string;
    portalId?: string;
}

const CustomDatePicker: React.FC<Props> = ({ 
    selected, 
    onChange, 
    placeholderText, 
    showTimeSelect = false,
    showTimeSelectOnly = false,
    dateFormat = showTimeSelectOnly ? "h:mm aa" : (showTimeSelect ? "dd/MM/yyyy h:mm aa" : "dd/MM/yyyy"),
    portalId
}) => {
    return (
        <div className="relative group w-full">
            <DatePicker
                selected={selected}
                onChange={onChange}
                dateFormat={dateFormat}
                showTimeSelect={showTimeSelect}
                showTimeSelectOnly={showTimeSelectOnly}
                placeholderText={placeholderText}
                wrapperClassName="w-full"
                className="w-full px-5 py-4 bg-white/80 border-2 border-indigo-50 rounded-3xl outline-none font-bold text-indigo-900 transition-all text-sm shadow-[0_4px_12px_rgba(99,102,241,0.1),inset_0_2px_4px_rgba(255,255,255,0.5)] focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 pl-12 placeholder:text-indigo-200"
                calendarClassName="custom-calendar !border-none !rounded-3xl !shadow-2xl !bg-white !z-[9999]"
                timeFormat="HH:mm"
                timeCaption="เวลา"
                timeIntervals={30}
                popperPlacement="bottom-start"
                popperClassName="!z-[9999]"
                portalId={portalId}
            />
            {showTimeSelect ? (
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-500 transition-colors" />
            ) : (
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-500 transition-colors" />
            )}
        </div>
    );
};

export default CustomDatePicker;
