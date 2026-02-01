
import React from 'react';
import { Coffee, ChevronRight, ArrowRightLeft, Camera, Shuffle, Users, RefreshCw, CheckSquare, ChevronDown } from 'lucide-react';

const GuideDuty: React.FC = () => {
    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 flex items-center gap-6 shadow-sm">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md text-amber-500 shrink-0">
                    <Coffee className="w-10 h-10" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-amber-900 tracking-tight">Duty System Logic</h2>
                    <p className="text-amber-700/80 font-medium mt-1 text-lg">
                        กลไกการจัดเวร, การสุ่มที่ยุติธรรม, และระบบแลกเวรอัจฉริยะ
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Randomizer Logic */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <Shuffle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Randomizer Engine</h3>
                    </div>
                    
                    <div className="space-y-6 flex-1">
                        <div className="relative pl-6 border-l-2 border-indigo-100 pb-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm"></div>
                            <h4 className="font-bold text-indigo-900 text-sm">Mode 1: Rotation (วนรอบ)</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                ระบบใช้ <b>"Deck of Cards" algorithm</b> <br/>
                                เปรียบเหมือนแจกไพ่ให้ทุกคนคนละ 1 ใบ จนกว่าจะหมดกอง ถึงจะเริ่มสับไพ่กองใหม่ <br/>
                                <span className="text-green-600 font-bold text-[10px]">✅ การันตีว่าทุกคนได้ทำเวรเท่ากันเป๊ะๆ ในระยะยาว</span>
                            </p>
                        </div>

                        <div className="relative pl-6 border-l-2 border-slate-100 pb-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
                            <h4 className="font-bold text-slate-700 text-sm">Mode 2: Duration (สุ่มอิสระ)</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                สุ่มแบบ Random 100% ในช่วงวันที่กำหนด <br/>
                                เหมาะสำหรับจัดเวรเฉพาะกิจ เช่น "เวรพิเศษสงกรานต์"
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Swap System Visualized */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                            <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Swap State Machine</h3>
                    </div>

                    <div className="flex flex-col gap-3 justify-center h-full">
                        {/* State 1 */}
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-white border-2 border-orange-200 rounded-xl flex items-center justify-center text-xs font-bold text-orange-500 shadow-sm shrink-0">
                                1
                            </div>
                            <div className="flex-1 bg-orange-50 p-3 rounded-xl border border-orange-100">
                                <p className="text-xs font-bold text-orange-800">Request (Pending)</p>
                                <p className="text-[10px] text-orange-600/80">A กดขอแลกเวร -▶ B ได้รับแจ้งเตือน</p>
                            </div>
                        </div>

                        <div className="flex justify-center"><ChevronDown className="text-slate-300 w-5 h-5" /></div>

                        {/* State 2 */}
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-white border-2 border-green-200 rounded-xl flex items-center justify-center text-xs font-bold text-green-500 shadow-sm shrink-0">
                                2
                            </div>
                            <div className="flex-1 bg-green-50 p-3 rounded-xl border border-green-100">
                                <p className="text-xs font-bold text-green-800">Approved & Swapped</p>
                                <p className="text-[10px] text-green-600/80">B กดตกลง -▶ <span className="font-bold">Database สลับชื่อทันที</span></p>
                            </div>
                        </div>
                        
                        <div className="mt-2 text-center">
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">
                                * ถ้า B ปฏิเสธ สถานะจะกลับเป็น Cancelled
                            </span>
                        </div>
                    </div>
                </div>

            </div>

            {/* 3. Photo Proof Rules */}
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row items-center gap-6">
                <div className="shrink-0 relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border-4 border-white relative z-10">
                        <Camera className="w-10 h-10 text-slate-400" />
                    </div>
                    <div className="absolute top-0 right-0 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center z-20 shadow-sm">
                        <CheckSquare className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="text-lg font-black text-slate-700 mb-2">กฎเหล็ก: No Photo, No Points! 📸</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        ระบบบังคับให้ <b>"ถ่ายรูปหน้างาน"</b> ก่อนกดจบงานเสมอ เพื่อเป็นหลักฐาน (Proof of Work) <br/>
                        รูปจะถูกส่งเข้าห้องแชทรวมอัตโนมัติ ให้ทุกคนรับทราบว่า "เวรวันนี้เสร็จแล้วนะจ๊ะ"
                    </p>
                </div>
            </div>

        </div>
    );
};

export default GuideDuty;
