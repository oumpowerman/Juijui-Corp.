
import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Upload, AlertTriangle, Send, Loader2, Siren, HeartPulse, Palmtree, User, Clock, Briefcase, Moon, History } from 'lucide-react';
import { LeaveType } from '../../types/attendance';
import { differenceInDays, format } from 'date-fns';
import { MasterOption } from '../../types';

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>;
    masterOptions?: MasterOption[]; // New prop
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, onClose, onSubmit, masterOptions = [] }) => {
    // Dynamic Leave Types
    const leaveTypes = useMemo(() => {
        const types = masterOptions
            .filter(o => o.type === 'LEAVE_TYPE' && o.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
            
        // Fallback if no master data
        if (types.length === 0) {
            return [
                { key: 'SICK', label: 'ลาป่วย', color: 'bg-red-50 text-red-700' },
                { key: 'VACATION', label: 'พักร้อน', color: 'bg-blue-50 text-blue-700' },
                { key: 'PERSONAL', label: 'ลากิจ', color: 'bg-gray-50 text-gray-700' },
                { key: 'LATE_ENTRY', label: 'ขอเข้าสาย', color: 'bg-purple-50 text-purple-700' },
                { key: 'EMERGENCY', label: 'ฉุกเฉิน', color: 'bg-orange-50 text-orange-700' },
                { key: 'OVERTIME', label: 'แจ้ง OT', color: 'bg-indigo-50 text-indigo-700' }
            ];
        }
        return types;
    }, [masterOptions]);

    const [type, setType] = useState<string>(leaveTypes[0]?.key || 'SICK');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [reason, setReason] = useState('');
    const [file, setFile] = useState<File | null>(null);
    
    // New State for Flexible Time / Correction
    const [targetTime, setTargetTime] = useState('09:00'); // Used for Late, Forgot In, Forgot Out
    const [otHours, setOtHours] = useState(2);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const daysCount = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    const isSickMoreThan2Days = type === 'SICK' && daysCount > 2;
    const isEmergency = type === 'EMERGENCY';
    const isTimeSpecific = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT'].includes(type);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            alert('กรุณาระบุเหตุผล');
            return;
        }
        if (isSickMoreThan2Days && !file) {
            alert('ลาป่วยเกิน 2 วัน ต้องแนบใบรับรองแพทย์ครับ');
            return;
        }

        setIsSubmitting(true);
        
        // Metadata Injection for Time Requests
        let finalReason = reason;
        let finalEndDate = endDate;

        if (type === 'LATE_ENTRY') {
            finalReason = `[TIME:${targetTime}] ${reason}`;
            finalEndDate = startDate; 
        } else if (type === 'OVERTIME') {
            finalReason = `[OT:${otHours}hr] ${reason}`;
            finalEndDate = startDate;
        } else if (type === 'FORGOT_CHECKIN') {
             finalReason = `[TIME:${targetTime}] (Forgot In) ${reason}`;
             finalEndDate = startDate;
        } else if (type === 'FORGOT_CHECKOUT') {
             finalReason = `[TIME:${targetTime}] (Forgot Out) ${reason}`;
             finalEndDate = startDate;
        }

        const success = await onSubmit(
            type as LeaveType, 
            new Date(startDate), 
            new Date(finalEndDate), 
            finalReason, 
            file || undefined
        );
        
        setIsSubmitting(false);
        if (success) onClose();
    };

    const getTypeIcon = (t: string) => {
        switch(t) {
            case 'SICK': return <HeartPulse className="w-5 h-5" />;
            case 'VACATION': return <Palmtree className="w-5 h-5" />;
            case 'EMERGENCY': return <Siren className="w-5 h-5" />;
            case 'LATE_ENTRY': return <Clock className="w-5 h-5" />;
            case 'OVERTIME': return <Moon className="w-5 h-5" />;
            case 'FORGOT_CHECKIN': 
            case 'FORGOT_CHECKOUT': return <History className="w-5 h-5" />;
            default: return <User className="w-5 h-5" />;
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 border-indigo-50">
                <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {isTimeSpecific ? <History className="w-5 h-5 text-yellow-300" /> : <FileText className="w-5 h-5 text-yellow-300" />}
                        {isTimeSpecific ? 'Time Correction (แก้ไขเวลา)' : 'แบบฟอร์มขอลาหยุด'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
                    
                    {/* Type Selector (Dynamic) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">1. ประเภทคำขอ</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {leaveTypes.map(item => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setType(item.key)}
                                    className={`
                                        flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all min-h-[70px] justify-center
                                        ${type === item.key 
                                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' 
                                            : 'border-gray-100 bg-white hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <div className={`p-1.5 rounded-full shadow-sm ${type === item.key ? 'bg-white' : 'bg-gray-50'}`}>
                                        <span className={type === item.key ? 'text-indigo-600' : 'text-gray-400'}>
                                            {getTypeIcon(item.key)}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold text-center leading-tight truncate w-full ${type === item.key ? 'text-indigo-700' : 'text-gray-600'}`}>
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Inputs based on Type */}
                    {isTimeSpecific ? (
                         <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in slide-in-from-top-2">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-purple-700 mb-1">วันที่ (Date)</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 rounded-lg border border-purple-200 text-sm font-bold text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-purple-700 mb-1">เวลา (Time)</label>
                                    <input type="time" value={targetTime} onChange={e => setTargetTime(e.target.value)} className="w-full p-2 rounded-lg border border-purple-200 text-sm font-bold text-indigo-600" />
                                </div>
                            </div>
                            <p className="text-[10px] text-purple-600 mt-2">* ระบบจะบันทึกเวลานี้ให้หลังจากได้รับอนุมัติ</p>
                         </div>
                    ) : type === 'OVERTIME' ? (
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in slide-in-from-top-2">
                            <div className="flex gap-4">
                                <div className="flex-[2]">
                                    <label className="block text-xs font-bold text-indigo-700 mb-1">วันที่ทำ OT</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 rounded-lg border border-indigo-200 text-sm font-bold text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-indigo-700 mb-1">จำนวน (ชม.)</label>
                                    <input type="number" min={0.5} step={0.5} value={otHours} onChange={e => setOtHours(Number(e.target.value))} className="w-full p-2 rounded-lg border border-indigo-200 text-sm font-bold text-indigo-600 text-center" />
                                </div>
                            </div>
                         </div>
                    ) : (
                        // Standard Date Range for other leaves
                        <div>
                             <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">2. วันที่ลา ({daysCount} วัน)</label>
                             <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
                                 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 bg-white p-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700" />
                                 <span className="text-gray-400">ถึง</span>
                                 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 bg-white p-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700" />
                             </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">3. เหตุผล / รายละเอียด</label>
                        <textarea 
                            value={reason} 
                            onChange={e => setReason(e.target.value)}
                            placeholder={
                                type === 'LATE_ENTRY' ? "เช่น เมื่อคืนตัดต่องานลูกค้า A เสร็จตี 4..." : 
                                type === 'OVERTIME' ? "ระบุโปรเจกต์ที่ทำ เช่น เร่งปิดงานลูกค้า B..." : 
                                type === 'FORGOT_CHECKIN' ? "เช่น แบตหมด, รีบเข้าประชุม..." :
                                "ระบุอาการ หรือเหตุผลการลา..."
                            }
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm resize-none h-24"
                        />
                    </div>

                    {/* File Upload (Only show if needed or generic) */}
                    <div className={`p-4 rounded-xl border-2 border-dashed transition-all ${isSickMoreThan2Days || isEmergency ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-2">
                             <label className={`text-xs font-bold uppercase flex items-center gap-1 ${isSickMoreThan2Days ? 'text-red-600' : 'text-gray-500'}`}>
                                 {isSickMoreThan2Days ? <AlertTriangle className="w-4 h-4"/> : <Upload className="w-4 h-4"/>} 
                                 หลักฐาน / ใบรับรองแพทย์ {isSickMoreThan2Days && '(จำเป็น)'}
                             </label>
                             {file && <button type="button" onClick={() => setFile(null)} className="text-red-500 text-xs underline">ลบไฟล์</button>}
                        </div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={e => setFile(e.target.files?.[0] || null)} 
                            accept="image/*,.pdf"
                        />
                        
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center justify-center gap-2"
                        >
                            {file ? (
                                <span className="text-green-600 font-bold">{file.name}</span>
                            ) : (
                                <span>คลิกเพื่ออัปโหลดรูปภาพ/PDF</span>
                            )}
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                        ส่งคำขอ
                    </button>

                </form>
            </div>
        </div>,
        document.body
    );
};

export default LeaveRequestModal;
