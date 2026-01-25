
import React from 'react';
import { Target, Zap, Calendar, Search, MousePointerClick, CheckCircle2 } from 'lucide-react';

const QuestGuide: React.FC = () => {
    return (
        <div className="space-y-8 font-sans">
            
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-xl font-black mb-2 flex items-center">
                        🎯 Weekly Quests คือไรอ่ะ?
                    </h4>
                    <p className="text-indigo-100 leading-relaxed font-medium">
                        คิดซะว่ามันคือ <span className="text-yellow-300 font-bold">Battle Pass</span> ของการทำงาน! <br/>
                        เราตั้งเป้าหมายประจำสัปดาห์ (Quests) ไว้ แล้วช่วยกันทำให้ครบหลอด <br/>
                        ไม่ต้องมานั่งจำว่าต้องลงคลิปกี่ตัว ระบบนับให้เองแบบ Real-time!
                    </p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                    <Target className="w-32 h-32" />
                </div>
            </div>

            {/* Step 1: Setup */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg">1</div>
                    <h3 className="text-xl font-bold text-gray-800">เปิดตี้ ตั้งเควส (Setup Phase)</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <p className="text-gray-600">
                        Admin หรือหัวหน้าทีม กดปุ่ม <span className="font-bold text-indigo-600">"สร้างแผนใหม่"</span> เพื่อเริ่มตั้งโจทย์ โดยมี 2 แบบให้เลือกผสมกันได้:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-5 h-5 text-blue-600" />
                                <span className="font-black text-blue-800">แบบ Auto (แนะนำ!)</span>
                            </div>
                            <p className="text-sm text-blue-700 mb-2">ระบบนับให้เอง ไม่ต้องกดอะไรเพิ่ม</p>
                            <div className="bg-white p-2 rounded-lg text-xs text-gray-500 font-mono border border-blue-100">
                                ตัวอย่าง: ตั้งเป้า "ลง TikTok 3 คลิป"<br/>
                                👉 เมื่อน้อง Editor เปลี่ยนสถานะงานในบอร์ดเป็น "Done" และ Platform ตรงกัน -▶ ยอดขึ้นทันที!
                            </div>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <div className="flex items-center gap-2 mb-2">
                                <MousePointerClick className="w-5 h-5 text-orange-600" />
                                <span className="font-black text-orange-800">แบบ Manual (มือ)</span>
                            </div>
                            <p className="text-sm text-orange-700 mb-2">สำหรับงานนอกกระดาน ต้องมากดบวกเอง</p>
                            <div className="bg-white p-2 rounded-lg text-xs text-gray-500 font-mono border border-orange-100">
                                ตัวอย่าง: "ทำความสะอาดสตู", "ประชุมครบ 3 ครั้ง"<br/>
                                👉 ทำเสร็จแล้วก็มาจิ้มปุ่ม (+) ในการ์ดเอาเองนะจ๊ะ
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Step 2: Running */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg">2</div>
                    <h3 className="text-xl font-bold text-gray-800">ระบบทำงานยังไง? (The Logic)</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                        <div>
                            <h5 className="font-bold text-gray-700">ระบบ Overlap (ยืดหยุ่นสุดๆ)</h5>
                            <p className="text-sm text-gray-500">
                                ไม่จำเป็นต้องเริ่มวันจันทร์! เควสของคุณเริ่มวันไหนก็ได้ (นับไป 7 วัน) <br/>
                                ถ้าช่วงเวลาของเควส <span className="text-indigo-600 font-bold">"คาบเกี่ยว"</span> กับสัปดาห์ที่คุณดูอยู่ เควสนั้นจะโผล่มาให้เห็นเอง
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                        <Search className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                        <div>
                            <h5 className="font-bold text-gray-700">การนับยอด Auto</h5>
                            <p className="text-sm text-gray-500">
                                ระบบจะกวาดหางานทั้งหมดในระบบ ที่มี <span className="bg-gray-100 px-1 rounded font-bold">วันที่จบงาน (End Date)</span> อยู่ในช่วงเวลาของเควส และมีเงื่อนไขตรงกัน (เช่น Platform, Format)
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Step 3: Drill Down */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg">3</div>
                    <h3 className="text-xl font-bold text-gray-800">เช็ครายละเอียด (Drill Down)</h3>
                </div>
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-start gap-4">
                    <div className="p-3 bg-white rounded-full text-emerald-500 shadow-sm">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h5 className="font-black text-emerald-800 text-lg">อยากรู้ว่านับคลิปไหนไปบ้าง?</h5>
                        <p className="text-sm text-emerald-700 mb-2">
                            แค่กดที่การ์ดเควส ▶ กดลูกศรลง (Expand) <br/>
                            ระบบจะกางรายชื่อคลิปทั้งหมดที่ถูกนับรวมออกมาให้ดูเลย โปร่งใสสุดๆ!
                        </p>
                        <div className="text-xs font-bold bg-white/60 text-emerald-600 px-3 py-1.5 rounded-lg inline-block">
                            * ถ้าหลอดเต็ม 100% จะเปลี่ยนเป็นสีเขียว ฟินมากบอกเลย!
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default QuestGuide;
