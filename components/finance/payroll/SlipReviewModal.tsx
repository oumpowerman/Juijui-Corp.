
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, AlertTriangle, Upload, FileText, Download, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { PayrollSlip, CycleStatus } from '../../../types';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface SlipReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    slip: PayrollSlip;
    isSeniorHR: boolean;
    cycleStatus: CycleStatus;
    onUpdate: (id: string, updates: Partial<PayrollSlip>, file?: File) => void;
    onRespond: (id: string, action: 'ACKNOWLEDGE' | 'DISPUTE', reason?: string) => void;
}

const SlipReviewModal: React.FC<SlipReviewModalProps> = ({ 
    isOpen, onClose, slip, isSeniorHR, cycleStatus, onUpdate, onRespond 
}) => {
    const [disputeReason, setDisputeReason] = useState('');
    const [showDisputeInput, setShowDisputeInput] = useState(false);
    const [showDeductionDetails, setShowDeductionDetails] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // HR Edit State
    const [editData, setEditData] = useState(slip);
    const [isEditing, setIsEditing] = useState(false);

    if (!isOpen) return null;

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            onUpdate(slip.id, {}, e.target.files[0]);
        }
    };

    const handleSaveEdit = () => {
        onUpdate(slip.id, {
            baseSalary: editData.baseSalary,
            otPay: editData.otPay,
            bonus: editData.bonus,
            allowance: editData.allowance,
            tax: editData.tax,
            sso: editData.sso,
            lateDeduction: editData.lateDeduction
        });
        setIsEditing(false);
    };

    const isInteractive = cycleStatus === 'WAITING_REVIEW';
    const hasDeductions = slip.deductionSnapshot && slip.deductionSnapshot.length > 0;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 border-white">
                
                {/* Header */}
                <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold">รายละเอียดสลิปเงินเดือน</h3>
                        <p className="text-xs text-slate-400">{slip.user?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-1 bg-white/10 hover:bg-white/20 rounded-full"><X className="w-5 h-5"/></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Amounts Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-3">
                            <h4 className="font-bold text-green-600 border-b pb-1">รายรับ (Income)</h4>
                            <div className="flex justify-between"><span>เงินเดือน</span> <span className="font-mono">{isEditing ? <input type="number" className="w-16 border rounded text-right" value={editData.baseSalary} onChange={e=>setEditData({...editData, baseSalary: Number(e.target.value)})} /> : slip.baseSalary.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>OT</span> <span className="font-mono">{isEditing ? <input type="number" className="w-16 border rounded text-right" value={editData.otPay} onChange={e=>setEditData({...editData, otPay: Number(e.target.value)})} /> : slip.otPay.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>โบนัส</span> <span className="font-mono">{isEditing ? <input type="number" className="w-16 border rounded text-right" value={editData.bonus} onChange={e=>setEditData({...editData, bonus: Number(e.target.value)})} /> : slip.bonus.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>อื่นๆ</span> <span className="font-mono">{isEditing ? <input type="number" className="w-16 border rounded text-right" value={editData.allowance} onChange={e=>setEditData({...editData, allowance: Number(e.target.value)})} /> : slip.allowance.toLocaleString()}</span></div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-bold text-red-500 border-b pb-1">รายจ่าย (Deduction)</h4>
                            <div className="flex justify-between"><span>ภาษี (3%)</span> <span className="font-mono">{isEditing ? <input type="number" className="w-16 border rounded text-right" value={editData.tax} onChange={e=>setEditData({...editData, tax: Number(e.target.value)})} /> : slip.tax.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>ประกันสังคม</span> <span className="font-mono">{isEditing ? <input type="number" className="w-16 border rounded text-right" value={editData.sso} onChange={e=>setEditData({...editData, sso: Number(e.target.value)})} /> : slip.sso.toLocaleString()}</span></div>
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-1">ขาด/ลา/สาย {hasDeductions && <AlertCircle className="w-3 h-3 text-orange-500" />}</span> 
                                <span className="font-mono">{isEditing ? <input type="number" className="w-16 border rounded text-right" value={editData.lateDeduction} onChange={e=>setEditData({...editData, lateDeduction: Number(e.target.value)})} /> : (slip.leaveDeduction + slip.lateDeduction).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Deduction Breakdown Section */}
                    {hasDeductions && !isEditing && (
                        <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                             <button 
                                onClick={() => setShowDeductionDetails(!showDeductionDetails)}
                                className="w-full flex justify-between items-center text-xs font-bold text-orange-700 mb-1"
                             >
                                 <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3"/> ดูรายละเอียดการหักเงิน ({slip.deductionSnapshot?.length} รายการ)</span>
                                 {showDeductionDetails ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                             </button>
                             
                             {showDeductionDetails && (
                                 <div className="mt-2 space-y-2 animate-in slide-in-from-top-2">
                                     {slip.deductionSnapshot?.map((item, idx) => (
                                         <div key={idx} className="flex justify-between items-center text-[10px] bg-white p-2 rounded-lg border border-orange-100">
                                             <div>
                                                 <p className="font-bold text-gray-700">{format(new Date(item.date), 'd MMM', { locale: th })} - {item.type}</p>
                                                 <p className="text-gray-500">{item.details}</p>
                                             </div>
                                             <span className="font-mono text-red-500 font-bold">-{item.amount}</span>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    )}

                    <div className="bg-gray-100 p-4 rounded-xl flex justify-between items-center">
                        <span className="font-bold text-gray-600">ยอดสุทธิ (Net Total)</span>
                        <span className="text-2xl font-black text-indigo-700">฿{slip.netTotal.toLocaleString()}</span>
                    </div>

                    {/* Dispute Info */}
                    {slip.status === 'DISPUTED' && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-700">
                            <strong>⚠️ มีข้อโต้แย้ง:</strong> {slip.disputeReason}
                        </div>
                    )}

                    {/* Attachments (HR Only or View) */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold text-gray-500 uppercase">หลักฐานการโอน (Transfer Slip)</span>
                             {isSeniorHR && (
                                 <button onClick={() => fileInputRef.current?.click()} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                     <Upload className="w-3 h-3"/> อัปโหลด
                                 </button>
                             )}
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleUpload} />
                        </div>
                        {slip.transferSlipUrl ? (
                            <a href={slip.transferSlipUrl} target="_blank" className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors">
                                <FileText className="w-5 h-5"/> ดูไฟล์แนบ
                            </a>
                        ) : (
                            <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-xs text-gray-400">ยังไม่มีหลักฐานการโอน</div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    {isSeniorHR ? (
                         <div className="flex gap-2">
                             {isEditing ? (
                                 <>
                                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-bold">ยกเลิก</button>
                                    <button onClick={handleSaveEdit} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">บันทึก</button>
                                 </>
                             ) : (
                                <button onClick={() => setIsEditing(true)} className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50">แก้ไขยอดเงิน</button>
                             )}
                         </div>
                    ) : (
                        // Employee View Actions
                        isInteractive && slip.status === 'PENDING' ? (
                            showDisputeInput ? (
                                <div className="space-y-2">
                                    <textarea 
                                        className="w-full p-2 border rounded-lg text-sm" 
                                        placeholder="ระบุเหตุผลที่ข้อมูลไม่ถูกต้อง..." 
                                        value={disputeReason}
                                        onChange={e => setDisputeReason(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowDisputeInput(false)} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold">ยกเลิก</button>
                                        <button onClick={() => { onRespond(slip.id, 'DISPUTE', disputeReason); onClose(); }} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold">ส่งคำแย้ง</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowDisputeInput(true)}
                                        className="flex-1 py-3 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm flex justify-center items-center gap-2"
                                    >
                                        <AlertTriangle className="w-4 h-4"/> แย้งข้อมูล
                                    </button>
                                    <button 
                                        onClick={() => { onRespond(slip.id, 'ACKNOWLEDGE'); onClose(); }}
                                        className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg shadow-green-200"
                                    >
                                        <Check className="w-4 h-4"/> ยืนยันความถูกต้อง
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="text-center text-xs text-gray-400 font-medium">
                                {slip.status === 'ACKNOWLEDGED' ? 'คุณยืนยันข้อมูลแล้ว รอเงินเข้านะครับ' : 'สถานะ: ' + slip.status}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SlipReviewModal;
