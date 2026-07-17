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
                    ส่งคำขออนุมัติ & เลิกงานทันที
                </button>
            </form>
        </div>
    );
};
