import React from 'react';
import { CalendarRange, ShieldCheck } from 'lucide-react';

const FixedOvertimeInputs: React.FC = () => {
    return (
        <div className="space-y-4">
            {/* Elegant Fixed OT info box */}
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-indigo-100/50 space-y-4 shadow-sm text-left">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-md">
                        <CalendarRange className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-950 text-sm sm:text-base">คำขอ OT แบบเหมาจ่าย (Lump-sum)</h4>
                        <p className="text-[10px] sm:text-[11px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">ประเภทจ่ายอัตราคงที่รายวัน</p>
                    </div>
                </div>
                
                <p className="text-xs text-indigo-700/90 leading-relaxed font-semibold">
                    สำหรับการปฏิบัติงานล่วงเวลาแบบจ่ายเหมาเป็นรายวันโดยไม่มีการระบุช่วงเวลาเริ่มต้น-สิ้นสุด <br/>
                    • ไม่จำกัดชั่วโมงทำงานล่วงเวลาขั้นต่ำของวันนั้น <br/>
                    • แสดงสถานะเป็น <span className="font-bold text-indigo-900 underline">เหมาจ่าย (Lump-sum)</span> ในรายงานของคุณ <br/>
                    • เหมาะสำหรับเคสพิเศษที่ได้รับมอบหมายเป็นรายวัน
                </p>

                <div className="flex items-center gap-2 p-3 bg-white/70 rounded-xl border border-indigo-100/30 text-[10px] sm:text-xs font-bold text-emerald-600">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>ระบบจะลงเวลาอัตโนมัติ (00:00 - 00:00 น.) เพื่อปฏิบัติตามมาตรฐานฐานข้อมูล</span>
                </div>
            </div>
        </div>
    );
};

export default FixedOvertimeInputs;
