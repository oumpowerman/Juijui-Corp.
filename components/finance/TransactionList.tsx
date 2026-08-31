
import React from 'react';
import { FinanceTransaction } from '../../types';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, FileText, Trash2, LayoutTemplate, Box, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import th from 'date-fns/locale/th';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

export interface PaginationProps {
  page: number;
  setPage: (page: number) => void;
  totalCount: number;
  pageSize: number;
  totalPages: number;
}

interface TransactionListProps {
    transactions: FinanceTransaction[];
    onDelete: (id: string) => Promise<void>;
    pagination?: PaginationProps;
    isLoading?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, pagination, isLoading = false }) => {
    const { showConfirm } = useGlobalDialog();
    return (
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-700">รายการล่าสุด ({pagination ? pagination.totalCount : transactions.length})</h3>
                    {isLoading && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                </div>
                {pagination && pagination.totalPages > 1 && (
                    <span className="text-xs text-gray-400 font-medium">
                        หน้า {pagination.page} จาก {pagination.totalPages}
                    </span>
                )}
            </div>
            
            <div className="divide-y divide-gray-100">
                {isLoading ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center space-y-2 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        <span className="text-xs">กำลังโหลดรายการ...</span>
                    </div>
                ) : transactions.length === 0 ? (
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
                                        <a href={t.receiptUrl} target="_blank" rel="noreferrer" className="text-[10px] text-gray-400 hover:text-indigo-600 flex items-center justify-end gap-1 underline">
                                            <FileText className="w-3 h-3"/> ใบเสร็จ
                                        </a>
                                    )}
                                </div>
                                <button 
                                    onClick={async () => { if(await showConfirm('ลบรายการนี้?')) onDelete(t.id); }}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        แสดง {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.totalCount)} - {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} จากทั้งหมด {pagination.totalCount} รายการ
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => pagination.setPage(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page <= 1 || isLoading}
                            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => pagination.setPage(Math.min(pagination.totalPages, pagination.page + 1))}
                            disabled={pagination.page >= pagination.totalPages || isLoading}
                            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionList;
