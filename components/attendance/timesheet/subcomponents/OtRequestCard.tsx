import React from 'react';
import { Clock, Info } from 'lucide-react';

interface OtRequestCardProps {
    otRequest: any;
}

const OtRequestCard: React.FC<OtRequestCardProps> = ({ otRequest }) => {
    return (
        <div className="bg-purple-50/55 p-5 md:p-6 rounded-[2rem] border border-purple-100 shrink-0 text-left">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-600">เวลาปฏิบัติงานล่วงเวลา</span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-700">
                    {otRequest.start_time ? otRequest.start_time.substring(0, 5) : '--:--'} น. - {otRequest.end_time ? otRequest.end_time.substring(0, 5) : '--:--'} น.
                </span>
            </div>
            <div className="h-[1px] bg-purple-100 w-full mb-4"></div>
            
            <div className={`flex items-center justify-between ${otRequest.is_fixed ? 'mb-4' : ''}`}>
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-600">จำนวนชั่วโมงที่ขอ</span>
                </div>
                <span className="text-xs font-bold text-purple-800">
                    {otRequest.duration_hours ? Number(otRequest.duration_hours).toFixed(2) : '0.00'} ชม.
                </span>
            </div>

            {otRequest.is_fixed && (
                <>
                    <div className="h-[1px] bg-purple-100 w-full mb-4"></div>
                    <div className="bg-purple-100/60 border border-purple-200/50 p-3.5 rounded-2xl text-purple-900 flex gap-2.5 items-start">
                        <span className="text-sm">⭐</span>
                        <div className="flex-1">
                            <h6 className="font-bold text-[11px] text-purple-950">รายการทำงานล่วงเวลาแบบเหมาจ่าย (OT Fixed)</h6>
                            <p className="text-[10px] leading-relaxed text-purple-800/90 font-medium">
                                ได้รับการยกเว้นการตรวจสอบสแกนออก ระบบจะคำนวณและประมวลผลให้โดยอัตโนมัติ
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OtRequestCard;
