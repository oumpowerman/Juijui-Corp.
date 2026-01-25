
import React from 'react';
import { ScanEye, CheckCircle2, XCircle, Zap, Coins, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

const QualityGuide: React.FC = () => {
    return (
        <div className="space-y-8 font-sans">
            
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-xl font-black mb-2 flex items-center">
                        🔍 Quality Gate คือไรอ่ะ?
                    </h4>
                    <p className="text-purple-100 leading-relaxed font-medium">
                        นี่คือ <span className="text-yellow-300 font-bold">"ด่านตรวจคนเข้าเมือง"</span> ของชิ้นงาน! <br/>
                        ก่อนจะโพสต์ลงโซเชียล งานต้องผ่านด่านนี้ก่อน เพื่อเช็คความเรียบร้อย <br/>
                        ป้องกันงานหลุด QC และช่วยให้ทีมได้รับ XP เมื่อทำผลงานดีเยี่ยม!
                    </p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                    <ScanEye className="w-32 h-32" />
                </div>
            </div>

            {/* The Process */}
            <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-500" /> ขั้นตอนการตรวจ (The Flow)
                </h3>
                
                <div className="relative pl-6 border-l-2 border-gray-100 space-y-6">
                    {/* Step 1 */}
                    <div className="relative">
                        <div className="absolute -left-[33px] top-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-gray-500">1</div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <h5 className="font-bold text-gray-800 text-sm">ส่งงานเข้า QC</h5>
                            <p className="text-xs text-gray-500 mt-1">
                                เมื่อ Editor ตัดต่อเสร็จในหน้า Task ให้กดปุ่ม <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 font-bold">ส่งตรวจ (Send to QC)</span> งานจะเด้งมาโผล่ที่หน้านี้ทันที (สถานะ: Pending)
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative">
                        <div className="absolute -left-[33px] top-0 w-8 h-8 bg-purple-100 border-2 border-purple-300 text-purple-700 rounded-full flex items-center justify-center font-bold text-xs">2</div>
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 shadow-sm">
                            <h5 className="font-bold text-purple-900 text-sm flex items-center">
                                <ShieldCheck className="w-4 h-4 mr-2" /> หัวหน้า/ลูกค้า ตรวจงาน
                            </h5>
                            <p className="text-xs text-purple-700 mt-1">
                                คนตรวจจะเข้ามาดูคลิป ดูสิ่งที่ต้องระวัง (Caution) และสิ่งที่เน้นย้ำ (Key Point) แล้วตัดสินใจ...
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative">
                        <div className="absolute -left-[33px] top-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-gray-500">3</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-green-50 p-3 rounded-xl border border-green-200 text-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                <h6 className="font-bold text-green-800 text-sm">ผ่าน (Pass) ✅</h6>
                                <p className="text-[10px] text-green-600 mt-1">งานจบ! เปลี่ยนสถานะเป็น Done และแจก XP ให้ทีมทันที</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-center">
                                <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                                <h6 className="font-bold text-red-800 text-sm">แก้ (Revise) 🛠️</h6>
                                <p className="text-[10px] text-red-600 mt-1">ส่งกลับไปแก้ พร้อม Feedback สถานะจะเปลี่ยนกลับเป็น Doing</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gamification Info */}
            <section className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-100 rounded-bl-full opacity-50 pointer-events-none"></div>
                
                <h3 className="text-sm font-bold text-yellow-800 mb-3 flex items-center uppercase tracking-wide relative z-10">
                    <Coins className="w-4 h-4 mr-2" /> ระบบ XP & Rewards
                </h3>
                <div className="text-xs text-yellow-800 space-y-2 relative z-10 font-medium">
                    <p>
                        ✨ <b>การแจกแต้ม:</b> เมื่อกดปุ่ม "ผ่าน (Pass)" ระบบจะคำนวณ XP จากความยาก (Difficulty) และชั่วโมงการทำงาน (Hours) แจกให้ทุกคนที่มีชื่อในงานนั้นๆ
                    </p>
                    <p>
                        🚀 <b>โบนัส:</b> ถ้าส่งงานก่อนกำหนด (Early) ระบบอาจจะมีโบนัสแถมให้ด้วยนะ!
                    </p>
                    <div className="mt-3 p-2 bg-white/60 rounded-lg border border-yellow-200 text-yellow-900 inline-block">
                        * ถ้างานโดนแก้ (Revise) บ่อยๆ อาจจะไม่ได้โบนัสนะจ๊ะ ตั้งใจทำดีๆ ล่ะ!
                    </div>
                </div>
            </section>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <AlertTriangle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-500">
                    <span className="font-bold text-gray-700">คำเตือน:</span> อย่าลืมแนบลิงก์ไฟล์งานล่าสุดไว้ในช่อง Assets เสมอ! คนตรวจจะได้ไม่ต้องตามหาไฟล์ให้วุ่นวาย
                </div>
            </div>

        </div>
    );
};

export default QualityGuide;
