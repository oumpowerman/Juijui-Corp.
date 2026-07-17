import React from 'react';
import { Clock, RefreshCw, Send, MessageSquare, Sparkles, Hourglass, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface OvertimeFlowProps {
    step: 'PROMPT' | 'REASON' | 'FORGET_TIME';
    checkInTime: Date;
    requiredEndTime: Date;
    otStartTime: string;
    otEndTime: string;
    otReason: string;
    isSubmitting: boolean;
    otDetails: { minutes: number; hours: string; calculatedJP: number };
    onSetStep: (step: 'NONE' | 'PROMPT' | 'REASON' | 'FORGET_TIME') => void;
    onSetOtReason: (reason: string) => void;
    onSetTimePicker: (type: 'START' | 'END' | 'FORGET' | null) => void;
    onForgetfulSubmit: (customTime?: string) => Promise<void>;
    onOvertimeSubmit: () => Promise<void>;
    forgetCheckOutTime: string;
    onSetForgetCheckOutTime: (time: string) => void;
}

export const OvertimeFlow: React.FC<OvertimeFlowProps> = ({
    step,
    checkInTime,
    requiredEndTime,
    otStartTime,
    otEndTime,
    otReason,
    isSubmitting,
    otDetails,
    onSetStep,
    onSetOtReason,
    onSetTimePicker,
    onForgetfulSubmit,
    onOvertimeSubmit,
    forgetCheckOutTime,
    onSetForgetCheckOutTime
}) => {
    if (step === 'FORGET_TIME') {
        return (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md border border-amber-100">
                    <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-800 font-kanit">ระบุเวลาออกงานจริง</h3>
                    <p className="text-xs text-gray-500 font-sarabun">กรุณากรอกเวลาที่คุณเลิกงานและต้องการลงบันทึกจริงๆ</p>
                </div>

                {/* Giant Digital Time Clock Box */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-sm max-w-sm mx-auto space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">ระบุเวลากลับจริง (ลืมลงเวลา)</span>
                    <button
                        type="button"
                        onClick={() => onSetTimePicker('FORGET')}
                        className="flex items-center gap-2 px-6 py-4 bg-white hover:bg-slate-100 border-2 border-indigo-100 hover:border-indigo-300 rounded-2xl font-black text-2xl text-indigo-600 transition-all shadow-sm shadow-indigo-50"
                    >
                        <Clock className="w-6 h-6 text-indigo-500" />
                        <span>{forgetCheckOutTime || '--:--'} น.</span>
                    </button>
                    <span className="text-[10px] text-gray-400">คลิกที่กล่องเพื่อเปลี่ยนเวลา</span>
                </div>

                {/* Info / Warning Box */}
                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 text-left space-y-1 mx-2">
                    <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                        ⚠️ ข้อควรทราบก่อนบันทึก:
                    </p>
                    <p className="text-[11px] text-slate-600 font-sarabun leading-relaxed">
                        การลงบันทึกนี้เป็นกรณี <span className="font-bold text-amber-700">ลืมลงเวลาปกติ</span> เท่านั้น โดยเวลาส่วนเกินจากเวลาเลิกงานปกติจะไม่นำมาคำนวณแต้มโบนัสหรือคะแนนชั่วโมงล่วงเวลา (OT) ใดๆ
                    </p>
                </div>

                {/* Submit and Back Actions */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => onForgetfulSubmit(forgetCheckOutTime)}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-base shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        <span>ยืนยันบันทึกเวลาออกจริง</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onSetStep('PROMPT')}
                        className="w-full py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                    >
                        ย้อนกลับ
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'PROMPT') {
        return (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse shadow-lg shadow-violet-100">
                    <Clock className="w-8 h-8 text-violet-600" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-violet-800">ยืนยันการบันทึก OT</h3>
                    <p className="text-xs text-gray-500">คุณเลิกงานเกินเวลาเลิกงานมาตรฐานมามากกว่า 2 ชั่วโมง</p>
                </div>

                <p className="text-sm font-bold text-gray-700">คุณทำงานล่วงเวลา (OT) ใช่หรือไม่?</p>

                <div className="space-y-3">
                    <button 
                        onClick={() => onSetStep('FORGET_TIME')}
                        disabled={isSubmitting}
                        className="w-full p-4 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/20 rounded-2xl text-left transition-all active:scale-98 flex items-start gap-3 group"
                    >
                        <div className="p-2 bg-gray-100 rounded-xl text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 shrink-0">
                            <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">ไม่ใช่ ฉันแค่ลืมลงเวลา</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">ระบบจะบันทึกเวลาเลิกงานของคุณเป็นแบบมาตรฐาน ({format(requiredEndTime, 'HH:mm')} น.)</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => onSetStep('REASON')}
                        className="w-full p-4 border-2 border-violet-200 hover:border-violet-300 bg-gradient-to-br from-violet-50/60 to-fuchsia-50/60 rounded-2xl text-left transition-all active:scale-98 flex items-start gap-3 shadow-lg shadow-violet-100/50 hover:shadow-violet-200/50 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-300/10 via-fuchsia-300/10 to-indigo-300/10 animate-pulse pointer-events-none" />
                        <div className="p-2 bg-violet-100 rounded-xl text-violet-600 group-hover:bg-violet-200 shrink-0 relative z-10">
                            <Send className="w-4 h-4" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-violet-900 flex items-center gap-1.5">
                                ใช่ ฉันทำงานล่วงเวลาจริง 
                                <span className="text-[10px] bg-violet-200/60 text-violet-700 px-1.5 py-0.5 rounded-full font-bold">OT ✨</span>
                            </p>
                            <p className="text-[11px] text-violet-700/80 mt-0.5">บันทึกเวลาออกงานปัจจุบัน และส่งคำขออนุมัติชั่วโมง OT ล่วงเวลาอย่างเป็นทางการ</p>
                        </div>
                    </button>
                </div>

                <button 
                    onClick={() => onSetStep('NONE')}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                    ย้อนกลับ
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                <MessageSquare className="w-8 h-8 text-violet-600" />
            </div>
            <div className="space-y-1">
                <h3 className="text-xl font-bold text-violet-800">ระบุรายละเอียดงาน OT</h3>
                <p className="text-xs text-gray-500">กรุณากรอกเหตุผลหรือรายละเอียดการทำงานล่วงเวลา</p>
            </div>

            {/* JP Prediction Card */}
            {otDetails && otDetails.minutes > 0 && (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-4 rounded-2xl text-left space-y-1.5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Sparkles className="w-12 h-12 text-violet-600" />
                    </div>
                    <p className="text-[11px] font-bold text-violet-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" /> แต้มรางวัลคาดการณ์ (Projected Rewards)
                    </p>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                        หากคำขอนี้ได้รับการอนุมัติ คุณจะได้รับโบนัสประมาณ <span className="font-bold text-violet-700 text-sm">+{otDetails.calculatedJP} JP</span> (คำนวณจาก <span className="font-bold text-gray-800">{otDetails.hours} ชม.</span> x อัตรา JP พื้นฐาน 10 JP/ชม.)
                    </p>
                </div>
            )}

            {/* TIME PICKER INPUTS FOR OT */}
            <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">เวลาเริ่มต้น OT</label>
                    <button
                        type="button"
                        onClick={() => onSetTimePicker('START')}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-300 rounded-2xl font-bold text-gray-700 transition-all text-sm"
                    >
                        <Clock className="w-4 h-4 text-indigo-500 animate-pulse" />
                        {otStartTime || '--:--'}
                    </button>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">เวลาสิ้นสุด OT</label>
                    <button
                        type="button"
                        onClick={() => onSetTimePicker('END')}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 hover:border-rose-300 rounded-2xl font-bold text-gray-700 transition-all text-sm"
                    >
                        <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
                        {otEndTime || '--:--'}
                    </button>
                </div>
            </div>

            {/* สรุปชั่วโมง OT รวม */}
            {otDetails && (
                <div className="flex items-center justify-between p-3.5 px-4 bg-violet-50/50 border border-violet-100 rounded-2xl text-xs transition-all animate-in fade-in slide-in-from-top-2 shadow-sm shadow-violet-100/30">
                    <span className="text-violet-700 font-bold flex items-center gap-1.5">
                        <Hourglass className="w-3.5 h-3.5 text-violet-500 animate-spin-slow" /> รวมเวลา OT:
                    </span>
                    <span className="font-bold text-violet-700 bg-white border border-violet-200/60 px-2.5 py-1 rounded-lg shadow-sm">
                        {otDetails.hours} ชั่วโมง <span className="text-violet-400 font-normal">({otDetails.minutes} นาที)</span>
                    </span>
                </div>
            )}

            <div className="text-left space-y-2">
                <label className="text-xs font-bold text-gray-500">รายละเอียดงานที่ทำล่วงเวลา (Required)</label>
                <textarea
                    value={otReason}
                    onChange={e => onSetOtReason(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-violet-100 focus:border-violet-300 outline-none resize-none"
                    placeholder="เช่น ประชุมวางแผนโปรเจกต์ใหม่, แก้ไขข้อผิดพลาดบนระบบเซิร์ฟเวอร์..."
                    rows={4}
                    required
                />
            </div>

            <div className="space-y-2">
                <button
                    type="button"
                    onClick={onOvertimeSubmit}
                    disabled={isSubmitting || !otReason.trim() || otDetails.minutes <= 0}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    ส่งคำขอและเลิกงาน
                </button>

                <button
                    type="button"
                    onClick={() => onSetStep('PROMPT')}
                    className="w-full py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                    ย้อนกลับ
                </button>
            </div>
        </div>
    );
};
