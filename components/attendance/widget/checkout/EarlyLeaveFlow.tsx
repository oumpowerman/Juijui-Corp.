import React, { useState } from 'react';
import { MapPin, AlertTriangle, MessageSquare, Send, Loader2, CheckCircle2, ShieldAlert, ArrowLeft, Scale, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { LocationDef } from '../../../../types/attendance';
import { ProofUploadZone } from './ProofUploadZone';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { motion, AnimatePresence } from 'framer-motion';

interface EarlyLeaveFlowProps {
    distance: number;
    matchedLocation: LocationDef | undefined;
    statusDetails: any;
    reason: string;
    setReason: (val: string) => void;
    selectedFile: File | null;
    previewUrl: string;
    onFileSelect: (file: File | null, url: string) => void;
    onOpenLightbox: () => void;
    isSubmitting: boolean;
    isUploading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onAcceptPenalty: (reason: string) => Promise<void>;
    earlyLeaveInterval: number;
    earlyLeaveRate: number;
    earlyLeaveStep: 'CHOOSE' | 'FORM';
    setEarlyLeaveStep: (step: 'CHOOSE' | 'FORM') => void;
}

export const EarlyLeaveFlow: React.FC<EarlyLeaveFlowProps> = ({
    distance,
    matchedLocation,
    statusDetails,
    reason,
    setReason,
    selectedFile,
    previewUrl,
    onFileSelect,
    onOpenLightbox,
    isSubmitting,
    isUploading,
    onSubmit,
    onAcceptPenalty,
    earlyLeaveInterval,
    earlyLeaveRate,
    earlyLeaveStep,
    setEarlyLeaveStep,
}) => {
    const missingMinutes = statusDetails ? statusDetails.missingMinutes : 0;
    const penaltyHP = Math.round(missingMinutes * ((earlyLeaveRate || 10) / (earlyLeaveInterval || 10)));
    
    const { showConfirm } = useGlobalDialog();
    const step = earlyLeaveStep;
    const setStep = setEarlyLeaveStep;

    const handleAcceptPenaltyClick = async () => {
        const confirmed = await showConfirm(
            `คุณกำลังจะเช็คเอาท์ออกงานก่อนเวลา และยอมรับการหักคะแนนพฤติกรรมสะสมจำนวน -${penaltyHP} HP ทันที โดยการดำเนินการนี้จะไม่สามารถแก้ไขหรือกู้คืนคะแนนย้อนหลังได้`,
            'ยืนยันยอมรับบทลงโทษ',
            true
        );
        if (confirmed) {
            await onAcceptPenalty('');
        }
    };

    return (
        <AnimatePresence mode="popLayout">
            {step === 'CHOOSE' ? (
                <motion.div
                    key="choose-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 text-left"
                >
                    <div className="text-center py-1">
                        <h3 className="text-sm font-bold text-slate-800">กรุณาเลือกวิธีการลงเวลาออกงาน</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">เนื่องจากขณะนี้ยังไม่ถึงเวลาเลิกงานปกติของคุณ</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Choice 1 (Left): Accept Penalty */}
                        <button
                            type="button"
                            onClick={handleAcceptPenaltyClick}
                            disabled={isSubmitting}
                            className="flex flex-col items-center text-center p-4 bg-white hover:bg-rose-50/40 border-2 border-rose-100 hover:border-rose-400 rounded-[2rem] transition-all hover:shadow-md active:scale-[0.98] cursor-pointer gap-3 min-h-[175px] select-none shadow-sm animate-in fade-in zoom-in-95 duration-200"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 shadow-sm">
                                <Scale className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="text-xs font-bold text-slate-800 leading-tight">ยอมรับบทลงโทษ<br/>หักคะแนน</div>
                                <div>
                                    <div className="text-xs font-bold text-rose-600 mt-1">หัก -{penaltyHP} HP</div>
                                    <div className="text-[10px] text-slate-400 font-inter font-medium leading-tight mt-1">บันทึกเลิกงานทันที<br/>ไม่ต้องรออนุมัติ</div>
                                </div>
                            </div>
                        </button>

                        {/* Choice 2 (Right): Special Reason Appeal */}
                        <button
                            type="button"
                            onClick={() => setStep('FORM')}
                            className="flex flex-col items-center text-center p-4 bg-white hover:bg-indigo-50/40 border-2 border-indigo-100 hover:border-indigo-400 rounded-[2rem] transition-all hover:shadow-md active:scale-[0.98] cursor-pointer gap-3 min-h-[175px] select-none shadow-sm animate-in fade-in zoom-in-95 duration-200"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0 shadow-sm">
                                <Edit3 className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="text-xs font-bold text-slate-800 leading-tight">ยื่นเหตุจำเป็น<br/>กรณีพิเศษ</div>
                                <div>
                                    <div className="text-xs font-bold text-indigo-600 mt-1">ยื่นยกเว้นโทษ</div>
                                    <div className="text-[10px] text-slate-400 font-inter font-medium leading-tight mt-1">ชี้แจงเหตุผลจำเป็น<br/>เพื่อขอสิทธิ์ผ่านหัวหน้า</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </motion.div>
            ) : (
                <motion.form
                    key="form-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={onSubmit}
                    className="space-y-4 text-left"
                >
                    <div className="flex items-center gap-2 pb-1">
                        <button
                            type="button"
                            onClick={() => setStep('CHOOSE')}
                            className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs font-bold cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>กลับไปหน้าเลือก</span>
                        </button>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-1.5 shadow-sm">
                        <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> ยื่นเหตุจำเป็น & บันทึกเวลาจำลอง
                        </p>
                        <p className="text-[11px] leading-relaxed text-blue-700/90 font-medium">
                            บันทึกเวลาเลิกงานแบบจำลอง เพื่อความสะดวกในการทำงานวันถัดไป โดยอยู่ระหว่างรอการพิจารณาตรวจสอบเหตุจำเป็นจากผู้ดูแลระบบ (หากอนุมัติจะไม่โดนหักคะแนน)
                        </p>
                    </div>

                    {/* Textarea Input field */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> ระบุเหตุผลจำเป็นที่ต้องกลับก่อนเวลา <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <textarea 
                            className="w-full p-3.5 border border-slate-200 rounded-2xl text-sm bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all placeholder:text-gray-400 font-medium text-gray-700 shadow-sm" 
                            placeholder="ระบุเหตุผลจำเป็น เช่น ป่วยด่วนมีใบรับรองแพทย์, ติดธุระบริษัท, พบคู่ค้า..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={2}
                            required
                        />
                    </div>

                    {/* File upload zone */}
                    <ProofUploadZone
                        selectedFile={selectedFile}
                        previewUrl={previewUrl}
                        onFileSelect={onFileSelect}
                        onOpenLightbox={onOpenLightbox}
                    />

                    {/* Action buttons */}
                    <div className="pt-2">
                        <button 
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isSubmitting || isUploading ? (
                                <Loader2 className="w-5 h-5 animate-spin"/>
                            ) : (
                                <Send className="w-5 h-5"/>
                            )}
                            <span>ยืนยันส่งขออนุมัติเหตุจำเป็น</span>
                        </button>
                    </div>
                </motion.form>
            )}
        </AnimatePresence>
    );
};
