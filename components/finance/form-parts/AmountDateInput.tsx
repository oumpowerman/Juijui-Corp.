
import React from 'react';
import { Calendar } from 'lucide-react';

interface Props {
    amount: string;
    setAmount: (val: string) => void;
    date: string;
    setDate: (val: string) => void;
    netAmount?: number;
    showNet?: boolean;
}

const AmountDateInput: React.FC<Props> = ({ amount, setAmount, date, setDate, netAmount, showNet }) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">จำนวนเงิน (Base Amount)</label>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">฿</span>
                    <input 
                        type="number" step="0.01" 
                        className="w-full pl-8 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl outline-none text-xl font-black text-gray-800 focus:border-indigo-400 transition-all"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        autoFocus
                    />
                </div>
                {showNet && netAmount !== undefined && (
                    <div className="mt-1 text-right">
                        <span className="text-[10px] font-bold text-gray-400 mr-1">ยอดสุทธิ (Net):</span>
                        <span className="text-sm font-black text-indigo-600">฿{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                )}
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">วันที่ (Date)</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="date" 
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl outline-none text-sm font-bold text-gray-700 focus:border-indigo-400 transition-all cursor-pointer"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default AmountDateInput;
