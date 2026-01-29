
import React from 'react';
import { Coffee, ChevronRight, ArrowRightLeft, Camera, Shuffle, Users } from 'lucide-react';

const GuideDuty: React.FC = () => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Coffee className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">Duty System Logic</h2>
                        <p className="text-sm text-gray-500 font-medium">กลไกการจัดเวร, การแลกเวร และการส่งงาน</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    
                    {/* 1. Randomizer Logic */}
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 relative overflow-hidden group hover:border-indigo-200 transition-colors">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <Shuffle className="w-32 h-32" />
                        </div>
                        <h4 className="font-bold text-indigo-800 text-lg mb-3 flex items-center">
                            <span className="bg-indigo-100 p-1.5 rounded-lg mr-2"><Users className="w-5 h-5"/></span>
                            Randomizer Algorithm (การสุ่ม)
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <h6 className="font-bold text-indigo-700 text-sm">🔄 แบบ Rotation (วนจนครบ) - *แนะนำ*</h6>
                                <p className="text-xs text-indigo-600/80 mt-1 leading-relaxed">
                                    ระบบสร้าง "กองการ์ด" (Deck) ของพนักงานทุกคน แล้วแจกจ่ายเวรเรียงตามคิว <br/>
                                    เมื่อแจกครบทุกคนแล้ว ถึงจะเริ่มสับไพ่กองใหม่ (Reshuffle) <br/>
                                    <u>ข้อดี:</u> การันตีความยุติธรรม ระยะยาวทุกคนจะได้ทำเวรจำนวนเท่ากันเป๊ะๆ
                                </p>
                            </div>
                            <div className="w-full h-px bg-indigo-100"></div>
                            <div>
                                <h6 className="font-bold text-indigo-700 text-sm">🎲 แบบ Duration (สุ่มอิสระ)</h6>
                                <p className="text-xs text-indigo-600/80 mt-1 leading-relaxed">
                                    สุ่มโดยใช้วันที่กำหนดเป็นหลัก (เช่น เฉพาะสัปดาห์นี้) ไม่สนใจประวัติเก่า <br/>
                                    <u>ข้อควรระวัง:</u> อาจมีคนดวงซวยได้ทำเวรซ้ำ หรือบางคนรอดตัวไปเลย
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Swap System */}
                    <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 group hover:border-orange-200 transition-colors">
                         <h4 className="font-bold text-orange-800 text-lg mb-3 flex items-center">
                            <span className="bg-orange-100 p-1.5 rounded-lg mr-2"><ArrowRightLeft className="w-5 h-5"/></span>
                            Swap Logic (ระบบแลกเวร)
                        </h4>
                        <p className="text-sm text-orange-700 mt-1 mb-4">
                            การแลกเวรจะไม่เกิดขึ้นทันที เพื่อป้องกันความสับสน ระบบใช้ <b>State Machine</b> ดังนี้:
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-bold text-orange-600 bg-white/60 p-3 rounded-xl border border-orange-100 shadow-sm">
                            <span className="px-2 py-1 bg-white rounded border border-orange-200">1. Request (Pending)</span>
                            <ChevronRight className="w-3 h-3 text-orange-400" />
                            <span className="px-2 py-1 bg-white rounded border border-orange-200">2. Inbox (Target Approve)</span>
                            <ChevronRight className="w-3 h-3 text-orange-400" />
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded border border-green-200">3. Database Swap</span>
                        </div>
                        <p className="text-[10px] text-orange-500 mt-2 italic">
                            * เมื่อแลกสำเร็จ ชื่อเจ้าของเวรใน Database จะสลับกันทันที และสถานะจะเปลี่ยนเป็น Approved
                        </p>
                    </div>

                    {/* 3. Photo Proof */}
                    <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex flex-col sm:flex-row items-center gap-5 hover:border-emerald-200 transition-colors">
                         <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full shadow-inner shrink-0">
                             <Camera className="w-8 h-8" />
                         </div>
                         <div>
                            <h4 className="font-bold text-emerald-800 text-lg">Photo Proof (หลักฐาน)</h4>
                            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                ระบบบังคับ <b>"ถ่ายรูป"</b> ก่อนกดจบงาน (Done) เพื่อ: <br/>
                                1. ยืนยันว่าทำจริง (Proof of Work) <br/>
                                2. รูปจะถูกส่งเข้าห้องแชททีมโดยอัตโนมัติ (Bot Report) ให้ทุกคนรับรู้ <br/>
                                3. ป้องกันการลักไก่กด Done โดยไม่ทำความสะอาด
                            </p>
                         </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default GuideDuty;
