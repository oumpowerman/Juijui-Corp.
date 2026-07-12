import React from 'react';
import { AlertTriangle, RefreshCw, Lock, Clock, Loader2, Send } from 'lucide-react';
import { ProofUploadZone } from './ProofUploadZone';
import { format } from 'date-fns';

interface OutOfRangeFlowProps {
    distance: number;
    matchedLocationName?: string;
    checkLocation: () => void;
    isEarlyLeave: boolean;
    earlyLeaveInterval: number;
    earlyLeaveRate: number;
    missingMinutes?: number;
    time: string;
    reason: string;
    onSetReason: (reason: string) => void;
    isSubmitting: boolean;
    onSubmitRequest: (e: React.FormEvent) => void;
    selectedFile: File | null;
    previewUrl: string;
    onFileSelect: (file: File | null, url: string) => void;
    onOpenLightbox: () => void;
    onEditTime?: () => void;
    requiredEndTime?: Date;
}

export const OutOfRangeFlow: React.FC<OutOfRangeFlowProps> = ({
    distance,
    matchedLocationName,
    checkLocation,
    isEarlyLeave,
    earlyLeaveInterval,
    earlyLeaveRate,
    missingMinutes = 0,
    time,
    reason,
    onSetReason,
    isSubmitting,
    onSubmitRequest,
    selectedFile,
    previewUrl,
    onFileSelect,
    onOpenLightbox,
    onEditTime,
    requiredEndTime
}) => {
    const penaltyHP = Math.round(missingMinutes * ((earlyLeaveRate || 10) / (earlyLeaveInterval || 10)));

    return (
        <div>
            {/* 1. กล่องสีส้ม (อยู่นอกพื้นที่) */}
            <div className="mb-4 p-4 rounded-xl border border-orange-100 bg-orange-50/50 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 text-left">
                <div className="p-2 rounded-full shrink-0 bg-orange-100 text-orange-600">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-orange-800 text-sm">อยู่นอกพื้นที่ ({distance.toFixed(0)}m)</h4>
                    <p className="text-[11px] text-orange-700 mt-1 leading-relaxed">
                        คุณอยู่ห่างจาก {matchedLocationName || 'Office'} เกินกำหนด
                    </p>
                    <button 
                        type="button"
                        onClick={checkLocation} 
                        className="text-[10px] font-bold text-orange-600 hover:text-orange-700 underline mt-2.5 flex items-center gap-1 cursor-pointer"
                    >
                        <RefreshCw className="w-3 h-3"/> ลองใหม่
                    </button>
                </div>
            </div>

            {/* 2. กล่องสรุปเวลาปฏิบัติงาน (แสดงเมื่อเข้างานไม่ครบ) */}
            {isEarlyLeave && (
                <div className="mb-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2.5 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 font-bold border-b border-gray-100 pb-1.5">
                        <span>เกณฑ์เวลาเลิกงานปกติ:</span>
                        <span className="text-gray-800">{requiredEndTime ? format(requiredEndTime, 'HH:mm') : '--:--'} น.</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
                        <span>เวลา Check-out ปัจจุบัน:</span>
                        <span className="text-gray-800">{time} น.</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-dashed border-gray-200 pt-2 font-bold text-rose-600">
                        <span>เวลาปฏิบัติงานคงเหลือที่ขาด:</span>
                        <span>{missingMinutes} นาที</span>
                    </div>
                </div>
            )}

            {/* 3. กล่องสรุปผลกระทบด้านคะแนน (HP Penalty) (แสดงเมื่อเข้างานไม่ครบ) */}
            {isEarlyLeave && (
                <div className="mb-4 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-left space-y-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-bold text-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> ผลกระทบด้านคะแนน (HP Penalty) หากไม่ได้รับการอนุมัติ
                    </p>
                    <div className="flex items-center justify-between border-t border-rose-200/50 pt-2">
                        <span className="text-xs text-rose-700">คุณอาจถูกหักคะแนนชีวิต (HP):</span>
                        <span className="text-sm font-bold text-rose-600">-{penaltyHP} HP</span>
                    </div>
                    <p className="text-[10px] text-rose-500 font-medium leading-relaxed">
                        *คำนวณจากเกณฑ์: หัก {earlyLeaveRate} HP ทุก ๆ {earlyLeaveInterval} นาทีที่กลับก่อนเวลา
                    </p>
                </div>
            )}

            <form onSubmit={onSubmitRequest} className="space-y-4" noValidate>
                <p className="text-sm font-bold text-gray-700 text-left">กรุณาส่งคำขอ Check-out นอกสถานที่</p>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 text-left">เหตุผล (Reason)</label>
                    <textarea 
                        value={reason} 
                        onChange={e => onSetReason(e.target.value)} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none" 
                        placeholder={isEarlyLeave ? "เช่น มีนัดพบแพทย์ด่วน, ป่วยไข้ตัวร้อน..." : "เช่น ออกมาหาลูกค้าแล้วกลับบ้านเลย..."} 
                        rows={3}
                    />
                </div>

                <div className="text-left">
                    <ProofUploadZone
                        selectedFile={selectedFile}
                        previewUrl={previewUrl}
                        onFileSelect={onFileSelect}
                        onOpenLightbox={onOpenLightbox}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                    ส่งคำขออนุมัติ
                </button>
            </form>
        </div>
    );
};
