
import React from 'react';
import { FinanceTransaction } from '../../types';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, FileText, Trash2, LayoutTemplate, Box } from 'lucide-react';
import th from 'date-fns/locale/th';

interface PaginationProps {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalCount: number;
  pageSize: number;
  totalPages: number;
}

interface TransactionListProps {
    transactions: FinanceTransaction[];
    onDelete: (id: string) => Promise<void>;
    pagination: PaginationProps;   // ✅ เพิ่ม
    isLoading: boolean;            // ✅ เพิ่ม
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
    return (
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-700">รายการล่าสุด ({transactions.length})</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">ยังไม่มีรายการ</div>
                ) : (
                    transactions.map(t => (
                        <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${t.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {t.type === 'INCOME' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-gray-800 truncate text-sm">{t.name}</h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.categoryColor}`}>
                                            {t.categoryLabel}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center">
                                            {format(t.date, 'd MMM yy', { locale: th })}
                                        </span>
                                        {t.projectTitle && (
                                            <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded flex items-center max-w-[150px] truncate border border-indigo-100">
                                                <LayoutTemplate className="w-3 h-3 mr-1"/> {t.projectTitle}
                                            </span>
                                        )}
                                        {t.assetType !== 'NONE' && (
                                            <span className="text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded flex items-center border border-orange-100">
                                                <Box className="w-3 h-3 mr-1"/> {t.assetType === 'CONSUMABLE' ? 'วัสดุสิ้นเปลือง' : 'สินทรัพย์ถาวร'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className={`block font-black text-lg ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'}{t.amount.toLocaleString()}
                                    </span>
                                    {t.receiptUrl && (
                                        <a href={t.receiptUrl} target="_blank" className="text-[10px] text-gray-400 hover:text-indigo-600 flex items-center justify-end gap-1 underline">
                                            <FileText className="w-3 h-3"/> ใบเสร็จ
                                        </a>
                                    )}
                                </div>
                                <button 
                                    onClick={() => { if(confirm('ลบรายการนี้?')) onDelete(t.id); }}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TransactionList;
