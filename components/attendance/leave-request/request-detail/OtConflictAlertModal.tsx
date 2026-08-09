import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { LeaveRequest } from '../../../../types/attendance';

export interface OtAlertModalData {
    type: 'NO_LOG' | 'NO_CHECKOUT' | 'CHECKOUT_BEFORE_START' | 'CHECKOUT_BEFORE_END';
    checkoutTime?: string;
    requestedHours: number;
    calculatedHours: number;
    reqStartStr: string;
    reqEndStr: string;
    onConfirmFull: () => void;
    onConfirmCalculated?: () => void;
    onCancel: () => void;
}

interface OtConflictAlertModalProps {
    isOpen: boolean;
    data: OtAlertModalData | null;
    request: LeaveRequest | null;
}

export const OtConflictAlertModal: React.FC<OtConflictAlertModalProps> = ({
    isOpen,
    data,
    request
}) => {
    return (
        <AnimatePresence>
            {isOpen && data && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
                    id="ot-warning-modal-backdrop"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
                        id="ot-warning-modal-container"
                    >
                        {/* Header Accent Bar (Amber Theme) */}
                        <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 w-full" />

                        <div className="p-6 md:p-8 space-y-6">
                            {/* Title and Icon */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-500 shadow-sm shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-amber-600 animate-bounce" style={{ animationDuration: '3s' }} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">
                                        {data.type === 'NO_LOG' && '⚠️ ไม่พบประวัติลงเวลาของพนักงาน'}
                                        {data.type === 'NO_CHECKOUT' && '⚠️ ไม่พบข้อมูลเวลาเลิกงาน'}
                                        {data.type === 'CHECKOUT_BEFORE_START' && '⚠️ เวลาสแกนออกไม่เข้าเกณฑ์เริ่ม OT'}
                                        {data.type === 'CHECKOUT_BEFORE_END' && '⚠️ สแกนเลิกงานก่อนกำหนดเวลาขอ OT'}
                                    </h3>
                                    <p className="text-xs text-amber-600 font-bold tracking-wider uppercase mt-1">
                                        Overtime Attendance Alignment Conflict
                                    </p>
                                </div>
                            </div>

                            {/* Warning Content Card */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 text-sm text-slate-600 leading-relaxed shadow-xs">
                                {data.type === 'NO_LOG' && (
                                    <p>
                                        ไม่พบประวัติการสแกนเวลาเข้างานหรือเลิกงานของ 
                                        <strong className="text-slate-800 font-extrabold mx-1">{request?.user?.name || 'พนักงาน'}</strong> 
                                        ในวันที่ลงทำ OT นี้ (พนักงานอาจจะไม่ได้มาทำงาน หรือลืมสแกนเวลาทั้งหมด)
                                    </p>
                                )}
                                {data.type === 'NO_CHECKOUT' && (
                                    <p>
                                        พบเฉพาะบันทึกเข้างาน แต่ไม่พบข้อมูลการสแกนเลิกงาน (Check-out) ของ 
                                        <strong className="text-slate-800 font-extrabold mx-1">{request?.user?.name || 'พนักงาน'}</strong> 
                                        ในวันดังกล่าว (พนักงานอาจจะกำลังทำงานอยู่ หรือลืมสแกนนิ้ว/สแกนบัตรออกงาน)
                                    </p>
                                )}
                                {data.type === 'CHECKOUT_BEFORE_START' && (
                                    <p>
                                        พนักงานท่านนี้ลงเวลาเช็คเอาท์ออกงานแล้วเมื่อ 
                                        <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-md mx-1">{data.checkoutTime} น.</span> 
                                        ซึ่งเป็นเวลาที่ <strong className="text-red-600 font-extrabold">ออกก่อน</strong> ช่วงเวลาเริ่มปฏิบัติงานล่วงเวลาที่ระบุไว้ในคำขอ ({data.reqStartStr} น.) ระบบคำนวณชั่วโมง OT ได้เป็น 
                                        <strong className="text-slate-800 font-extrabold mx-1">0 ชั่วโมง</strong>
                                    </p>
                                )}
                                {data.type === 'CHECKOUT_BEFORE_END' && (
                                    <p>
                                        พนักงานท่านนี้สแกนเช็คเอาท์ออกงานแล้วเมื่อเวลา 
                                        <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-md mx-1">{data.checkoutTime} น.</span> 
                                        ซึ่งเป็นช่วงเวลาที่ <strong className="text-amber-700 font-extrabold">กลับก่อน</strong> กำหนดสิ้นสุดการทำ OT ({data.reqEndStr} น.)
                                    </p>
                                )}

                                {/* Action description / options explanation */}
                                <div className="pt-3 border-t border-dashed border-slate-200 text-xs text-slate-500 space-y-2 font-medium">
                                    <div className="flex items-start gap-1.5">
                                        <span className="text-sm">📌</span>
                                        <span>
                                            หากคุณกดเลือกอนุมัติชั่วโมงเต็ม ระบบจะมอบแต้มและบันทึกเวลาทำงาน 
                                            <strong className="text-slate-700 font-bold mx-0.5">{data.requestedHours} ชม.</strong> 
                                            ตามที่ส่งขอทันทีโดยไม่สนประวัติเวลาจริง
                                        </span>
                                    </div>
                                    {data.type === 'CHECKOUT_BEFORE_END' && (
                                        <div className="flex items-start gap-1.5">
                                            <span className="text-sm">🕒</span>
                                            <span>
                                                หากคุณเลือกอนุมัติตามเวลาทำจริง พนักงานจะได้รับสิทธิ์ชั่วโมง OT ลดลงเหลือเพียง 
                                                <strong className="text-amber-600 font-bold mx-0.5">{data.calculatedHours} ชม.</strong> 
                                                ตามสถิติระบบบันทึกเวลาจริง
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Buttons Layout */}
                            <div className="flex flex-col gap-2.5">
                                {/* Primary Button: Force Full Hours */}
                                <button
                                    type="button"
                                    onClick={data.onConfirmFull}
                                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-500"
                                    id="ot-warning-confirm-full-btn"
                                >
                                    <span>✅</span>
                                    <span>อนุมัติและให้ชั่วโมงเต็มทันที ({data.requestedHours} ชม.)</span>
                                </button>

                                {/* Option button for calculated/actual hours (Only for Case D) */}
                                {data.type === 'CHECKOUT_BEFORE_END' && data.onConfirmCalculated && (
                                    <button
                                        type="button"
                                        onClick={data.onConfirmCalculated}
                                        className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-sm font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400"
                                        id="ot-warning-confirm-actual-btn"
                                    >
                                        <span>🕒</span>
                                        <span>อนุมัติเฉพาะเวลาปฏิบัติงานจริง ({data.calculatedHours} ชม.)</span>
                                    </button>
                                )}

                                {/* Secondary Cancel Button */}
                                <button
                                    type="button"
                                    onClick={data.onCancel}
                                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-sm font-bold rounded-2xl border border-slate-200/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    id="ot-warning-cancel-btn"
                                >
                                    <span>⏳</span>
                                    <span>รอตรวจสอบภายหลัง (ปิดหน้านี้)</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
