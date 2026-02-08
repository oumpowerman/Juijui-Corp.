
import React from 'react';
import { TransactionType } from '../../../types';
import { DollarSign, ArrowRightLeft } from 'lucide-react';

interface Props {
    type: TransactionType;
    setType: (t: TransactionType) => void;
    onResetCategory: () => void;
    onClose: () => void;
}

const TransactionTypeSelector: React.FC<Props> = ({ type, setType, onResetCategory, onClose }) => {
    return (
        <div className={`px-8 py-6 border-b transition-colors flex flex-col gap-4 ${type === 'INCOME' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex justify-between items-center">
                <h3 className={`text-2xl font-black flex items-center gap-2 ${type === 'INCOME' ? 'text-green-800' : 'text-red-800'}`}>
                    {type === 'INCOME' ? <DollarSign className="w-8 h-8" /> : <ArrowRightLeft className="w-8 h-8" />}
                    {type === 'INCOME' ? 'บันทึกรายรับ' : 'บันทึกรายจ่าย'}
                </h3>
                <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors font-bold text-gray-500">
                    ESC
                </button>
            </div>

            <div className="flex bg-white/60 p-1 rounded-xl">
                <button 
                    onClick={() => { setType('INCOME'); onResetCategory(); }} 
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'INCOME' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:bg-white'}`}
                >
                    รายรับ (Income)
                </button>
                <button 
                    onClick={() => { setType('EXPENSE'); onResetCategory(); }} 
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'EXPENSE' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-white'}`}
                >
                    รายจ่าย (Expense)
                </button>
            </div>
        </div>
    );
};

export default TransactionTypeSelector;
