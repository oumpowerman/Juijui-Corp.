
import React from 'react';
import { PayrollCycle } from '../../../types';
import { Calendar, ChevronRight, Lock, CheckCircle2, CircleDashed, Trash2, Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface PayrollCycleListProps {
    cycles: PayrollCycle[];
    onSelect: (cycle: PayrollCycle) => void;
    onCreate: () => void;
    onDelete: (id: string) => void;
    canCreate: boolean;
}

const PayrollCycleList: React.FC<PayrollCycleListProps> = ({ cycles, onSelect, onCreate, onDelete, canCreate }) => {
    
    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'DRAFT': return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-bold flex items-center"><CircleDashed className="w-3 h-3 mr-1"/> Draft</span>;
            case 'WAITING_REVIEW': return <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-bold flex items-center"><Clock className="w-3 h-3 mr-1"/> Waiting Review</span>;
            case 'READY_TO_PAY': return <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Ready</span>;
            case 'PAID': return <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold flex items-center"><Lock className="w-3 h-3 mr-1"/> Paid</span>;
            default: return null;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Card */}
            {canCreate && (
                <div 
                    onClick={onCreate}
                    className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all min-h-[180px] group"
                >
                    <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform shadow-sm">
                        <Calendar className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-gray-700 text-lg">เปิดรอบบัญชีใหม่</h3>
                    <p className="text-gray-400 text-sm">Create New Cycle</p>
                </div>
            )}

            {/* Cycles List */}
            {cycles.map(cycle => (
                <div 
                    key={cycle.id}
                    onClick={() => onSelect(cycle)}
                    className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                >
                    <div className="absolute top-4 right-4">
                        {getStatusBadge(cycle.status)}
                    </div>

                    <div className="mb-4 mt-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Period</p>
                        <h3 className="text-2xl font-black text-gray-800">
                            {format(new Date(cycle.monthKey + '-01'), 'MMMM yyyy', { locale: th })}
                        </h3>
                        {cycle.dueDate && (
                             <p className="text-xs text-orange-500 mt-1">Due: {format(cycle.dueDate, 'd MMM')}</p>
                        )}
                    </div>

                    <div className="flex justify-between items-end border-t border-gray-100 pt-4 relative z-10">
                        <div>
                            <p className="text-xs text-gray-500 font-bold mb-1">Total Payout</p>
                            <p className={`text-xl font-bold ${cycle.status === 'PAID' ? 'text-green-600' : 'text-indigo-600'}`}>
                                ฿ {cycle.totalPayout.toLocaleString()}
                            </p>
                        </div>
                        <div className="flex gap-2">
                             {cycle.status === 'DRAFT' && canCreate && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(confirm('ต้องการลบรอบบัญชีนี้? ข้อมูลภายในจะหายหมด')) onDelete(cycle.id); }}
                                    className="bg-red-50 p-2 rounded-full text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                                    title="ลบรอบบัญชี"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                             )}
                            <div className="bg-gray-50 p-2 rounded-full text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Eye className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PayrollCycleList;
