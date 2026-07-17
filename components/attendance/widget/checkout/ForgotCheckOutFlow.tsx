import React from 'react';
import { Clock, Send, Loader2, AlertTriangle } from 'lucide-react';

interface ForgotCheckOutFlowProps {
    time: string;
    onOpenTimePicker: () => void;
    reason: string;
    onSetReason: (reason: string) => void;
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onBack?: () => void;
    title?: string;
    description?: string;
}

export const ForgotCheckOutFlow: React.FC<ForgotCheckOutFlowProps> = ({
    time,
    onOpenTimePicker,
    reason,
    onSetReason,
    isSubmitting,
    onSubmit,
    onBack,
    title = "ระบุเวลาออกงานจริง (Forgot Check-out)",
    description = "กรุณากรอกเวลาที่คุณเลิกงานและต้องการลงบันทึกแก้ไขจริงๆ"
}) => {
    return (
        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md border border-amber-100">
                <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            
            <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <p className="text-xs text-gray-500 px-4 leading-relaxed">{description}</p>
            </div>

            {/* Giant Digital Time Clock Box */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-sm max-w-sm mx-auto space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">ระบุเวลากลับจริง</span>
                <button
                    type="button"
                    onClick={onOpenTimePicker}
                    className="flex items-center gap-2 px-6 py-4 bg-white hover:bg-slate-100 border-2 border-indigo-100 hover:border-indigo-300 rounded-2xl font-black text-2xl text-indigo-600 transition-all shadow-sm shadow-indigo-50"
                >
                    <Clock className="w-6 h-6 text-indigo-500" />
                    <span>{time || '--:--'} น.</span>
                </button>
                <span className="text-[10px] text-gray-400">คลิกที่กล่องด้านบนเพื่อแก้ไขเวลา</span>
            </div>

            {/* Input Details */}
            <form onSubmit={onSubmit} className="space-y-4 text-left">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">เหตุผลหรือหมายเหตุประกอบคำขอ (Reason)</label>
                    <textarea
                        value={reason}
                        onChange={e => onSetReason(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 outline-none resize-none"
                        placeholder="เช่น ลืมกดลงเวลาเลิกงานตอนเย็นเนื่องจากรีบเดินทางกลับบ้าน..."
                        rows={3}
                        required
                    />
                </div>

                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 space-y-1">
                    <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                        ⚠️ ข้อควรทราบก่อนบันทึก:
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                        การแก้ไขเวลานี้จะส่งไปให้ <span className="font-bold text-amber-800">ผู้ดูแลระบบตรวจอนุมัติ</span> และโบนัสชั่วโมงล่วงเวลาพิเศษ (OT) จะไม่สามารถคำนวณผ่านช่องทางยื่นลืมลงเวลานี้ได้ครับ
                    </p>
                </div>

                {/* Submit and Back Actions */}
                <div className="space-y-3 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || !reason.trim()}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-base shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        <span>ส่งใบคำร้องขอแก้ไขเวลากลับ</span>
                    </button>

                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="w-full py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                        >
                            ย้อนกลับ
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};
