
import React, { useState } from 'react';
import { PayrollSlip, PayrollCycle, User } from '../../../types';
import { ArrowLeft, Save, Lock, Wallet, Calculator, Trash2, Plus, UserPlus, Send, CheckCircle2, AlertTriangle, FileText, Upload, Clock } from 'lucide-react';
import { addDays, format } from 'date-fns';
import SlipReviewModal from './SlipReviewModal';

interface PayrollEditorProps {
    cycle: PayrollCycle;
    slips: PayrollSlip[];
    allUsers: User[];
    currentUser: User;
    isSeniorHR: boolean;
    onBack: () => void;
    onUpdateSlip: (id: string, updates: Partial<PayrollSlip>, file?: File) => void;
    onDeleteSlip: (id: string) => void;
    onCreateSlip: (cycleId: string, user: User) => void;
    onFinalize: () => void;
    onSendToReview: (dueDate: Date) => void;
    onRespondToSlip: (id: string, action: 'ACKNOWLEDGE' | 'DISPUTE', reason?: string) => void;
}

const PayrollEditor: React.FC<PayrollEditorProps> = ({ 
    cycle, slips, allUsers, currentUser, isSeniorHR, 
    onBack, onUpdateSlip, onDeleteSlip, onCreateSlip, onFinalize, onSendToReview, onRespondToSlip 
}) => {
    const [isAddMode, setIsAddMode] = useState(false);
    const [viewingSlip, setViewingSlip] = useState<PayrollSlip | null>(null);

    const totalCalc = slips.reduce((sum, s) => sum + s.netTotal, 0);
    const availableUsers = allUsers.filter(u => !slips.some(s => s.userId === u.id));
    
    // Status Counts
    const ackCount = slips.filter(s => s.status === 'ACKNOWLEDGED').length;
    const disputeCount = slips.filter(s => s.status === 'DISPUTED').length;

    // Filter Logic: If not HR, user sees only their slip? No, `usePayroll` filters data already.
    // If user is member, `slips` contains only their slip.
    
    const handleSendReviewClick = () => {
        // Default due date: 3 days from now
        const due = addDays(new Date(), 3);
        if(confirm(`ส่งให้พนักงานตรวจสอบ? กำหนดตอบรับภายใน ${format(due, 'd MMM')}`)) {
            onSendToReview(due);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">Payroll: {cycle.monthKey}</h2>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">{cycle.status}</span>
                             {isSeniorHR && cycle.status === 'WAITING_REVIEW' && (
                                <span className="text-xs text-orange-500 font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3"/> รอตอบรับ: {ackCount}/{slips.length} (แย้ง {disputeCount})
                                </span>
                             )}
                        </div>
                    </div>
                </div>
                
                {isSeniorHR && (
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right mr-4">
                            <p className="text-xs text-gray-400 uppercase font-bold">Total Payout</p>
                            <p className="text-2xl font-black text-indigo-600">฿ {totalCalc.toLocaleString()}</p>
                        </div>
                        
                        {cycle.status === 'DRAFT' && (
                            <button 
                                onClick={handleSendReviewClick}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 text-sm"
                            >
                                <Send className="w-4 h-4" /> ส่งตรวจสอบ
                            </button>
                        )}
                        
                        {(cycle.status === 'WAITING_REVIEW' || cycle.status === 'READY_TO_PAY') && (
                            <button 
                                onClick={onFinalize}
                                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 text-sm"
                            >
                                <Wallet className="w-4 h-4" /> ปิดรอบ/จ่ายเงิน
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Admin Controls: Add User */}
            {isSeniorHR && cycle.status === 'DRAFT' && (
                <div className="flex gap-2 mb-4">
                     <button 
                        onClick={() => setIsAddMode(!isAddMode)}
                        className="text-xs flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
                    >
                        <UserPlus className="w-3 h-3" /> เพิ่มพนักงาน
                    </button>
                    {isAddMode && (
                        <div className="flex flex-wrap gap-2 animate-in slide-in-from-left-2">
                             {availableUsers.map(u => (
                                <button 
                                    key={u.id}
                                    onClick={() => { onCreateSlip(cycle.id, u); setIsAddMode(false); }}
                                    className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all text-xs font-bold text-gray-600"
                                >
                                    <img src={u.avatarUrl} className="w-5 h-5 rounded-full" />
                                    {u.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Table Area */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 sticky left-0 bg-gray-50 z-20">Employee</th>
                                <th className="px-4 py-3 text-right text-blue-600 bg-blue-50/30">Base Salary</th>
                                <th className="px-4 py-3 text-right text-blue-600 bg-blue-50/30">OT (+Bonus)</th>
                                <th className="px-4 py-3 text-right text-red-600 bg-red-50/30">Deductions</th>
                                <th className="px-4 py-3 text-right bg-emerald-50 text-emerald-800 font-black w-[150px]">Net Total</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Slip</th>
                                {isSeniorHR && cycle.status === 'DRAFT' && <th className="px-2 py-3 w-[50px]"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {slips.map(slip => (
                                <tr key={slip.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => setViewingSlip(slip)}>
                                    <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <img src={slip.user?.avatarUrl} className="w-8 h-8 rounded-full bg-gray-200" />
                                            <div>
                                                <p className="font-bold text-gray-800">{slip.user?.name}</p>
                                                <p className="text-[10px] text-gray-400">{slip.user?.position}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">{slip.baseSalary.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-mono text-green-600">
                                        +{(slip.otPay + slip.bonus + slip.allowance + slip.commission).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-red-500">
                                        -{slip.totalDeduction.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right bg-emerald-50/30">
                                        <span className="font-black text-emerald-700">
                                            {slip.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {slip.status === 'ACKNOWLEDGED' && <span className="text-green-600 flex justify-center"><CheckCircle2 className="w-4 h-4"/></span>}
                                        {slip.status === 'DISPUTED' && <span className="text-red-500 flex justify-center"><AlertTriangle className="w-4 h-4"/></span>}
                                        {slip.status === 'PENDING' && <span className="text-gray-300 text-xs">Waiting</span>}
                                        {slip.status === 'PAID' && <span className="text-green-600 font-bold text-xs">PAID</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                         {slip.transferSlipUrl ? (
                                             <FileText className="w-4 h-4 text-blue-500 mx-auto" />
                                         ) : (
                                             <span className="text-gray-300">-</span>
                                         )}
                                    </td>
                                    {isSeniorHR && cycle.status === 'DRAFT' && (
                                        <td className="px-2 py-3 text-center" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => onDeleteSlip(slip.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slip Detail Modal */}
            {viewingSlip && (
                <SlipReviewModal 
                    isOpen={!!viewingSlip}
                    onClose={() => setViewingSlip(null)}
                    slip={viewingSlip}
                    isSeniorHR={isSeniorHR}
                    cycleStatus={cycle.status}
                    onUpdate={onUpdateSlip}
                    onRespond={onRespondToSlip}
                />
            )}
        </div>
    );
};

export default PayrollEditor;
