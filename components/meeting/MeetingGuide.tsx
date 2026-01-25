
import React from 'react';
import { Presentation, ListTodo, Zap, Copy, AlertCircle, RefreshCw, CheckSquare } from 'lucide-react';

const MeetingGuide: React.FC = () => {
    return (
        <div className="space-y-8 font-sans">
            
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-xl font-black mb-2 flex items-center">
                        🗣️ Meeting Room คือไรอ่ะ?
                    </h4>
                    <p className="text-blue-100 leading-relaxed font-medium">
                        ห้องประชุมที่ไม่ใช่แค่จดบันทึก แต่มันคือ <span className="text-yellow-300 font-bold">"ฐานบัญชาการ"</span> <br/>
                        ที่ช่วยเปลี่ยนสิ่งที่คุยกัน ให้กลายเป็น **งานจริง** บนบอร์ดทันที (Actionable Items) <br/>
                        เลิกประชุมปุ๊บ งานเดินปั๊บ ไม่ต้องมานั่งรื้อฟื้นความจำทีหลัง!
                    </p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                    <Presentation className="w-32 h-32" />
                </div>
            </div>

            {/* Feature Highlights */}
            <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" /> ฟีเจอร์เด็ด (Cool Stuff)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-3">
                            <ListTodo className="w-6 h-6" />
                        </div>
                        <h5 className="font-bold text-gray-800">เสกงานเข้าบอร์ด (Action Module)</h5>
                        <p className="text-xs text-gray-500 mt-1">
                            ไม่ต้องสลับหน้าจอ! กดสั่งงาน (New Task) จากหน้าประชุมได้เลย ระบุคนรับผิดชอบปุ๊บ งานเด้งไปหาเขาปั๊บ
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-3">
                            <Copy className="w-6 h-6" />
                        </div>
                        <h5 className="font-bold text-gray-800">สรุปจบ ครบในคลิกเดียว</h5>
                        <p className="text-xs text-gray-500 mt-1">
                            กดปุ่ม <span className="bg-gray-100 px-1 rounded border">Copy Summary</span> ปุ๊บ ระบบจะรวมวาระ, มติ และลิงก์ต่างๆ ให้เป็นข้อความสวยๆ พร้อมแปะลง Line กลุ่มทันที
                        </p>
                    </div>
                </div>
            </section>

            {/* Workflow Steps */}
            <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-500" /> Flow การประชุม (How to Use)
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                            <div className="w-0.5 h-full bg-gray-100 my-1"></div>
                        </div>
                        <div className="pb-4">
                            <h6 className="font-bold text-gray-800">ตั้งวง & กำหนดวาระ (Pre-Meeting)</h6>
                            <p className="text-sm text-gray-600">
                                สร้างห้องใหม่ ใส่ชื่อเรื่อง แล้วไปที่แท็บ <span className="bg-gray-100 px-1 rounded text-xs font-bold text-blue-600">Agenda</span> เพื่อลิสต์หัวข้อที่จะคุย จะได้ไม่คุยออกทะเลนะจ๊ะ
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                            <div className="w-0.5 h-full bg-gray-100 my-1"></div>
                        </div>
                        <div className="pb-4">
                            <h6 className="font-bold text-gray-800">จด & สั่ง (During Meeting)</h6>
                            <p className="text-sm text-gray-600">
                                <ul>
                                    <li>- จดบันทึกในช่อง <b>Notes</b> (พิมพ์ Markdown ได้นิดหน่อย)</li>
                                    <li>- ถ้าคุยแล้วเกิดงาน ให้กดแท็บ <span className="bg-orange-100 text-orange-600 px-1 rounded text-xs font-bold">Actions</span> ด้านล่าง แล้วกดสร้าง Task ทันที</li>
                                    <li>- ติ๊กถูก Agenda ที่คุยจบแล้ว</li>
                                </ul>
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                        </div>
                        <div>
                            <h6 className="font-bold text-gray-800">สรุปมติ (Post-Meeting)</h6>
                            <p className="text-sm text-gray-600">
                                ไปที่แท็บ <span className="bg-green-100 text-green-600 px-1 rounded text-xs font-bold">Decisions</span> สรุปสั้นๆ ว่าตกลงเอาไงต่อ แล้วกด Copy Summary ส่งให้ทุกคนทราบ
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Warnings */}
            <section className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center uppercase tracking-wide">
                    <AlertCircle className="w-4 h-4 mr-2" /> ข้อควรระวัง (Warning)
                </h3>
                <ul className="space-y-2 text-xs text-amber-700 font-medium">
                    <li className="flex gap-2 items-start">
                        <CheckSquare className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                            <b>Project Tag:</b> ถ้าอยากดึงงานเก่ามาตาม (Follow-up) ให้ใส่ <b>Project Tag</b> (เช่น #VlogJapan) ให้ตรงกัน งานที่ยังไม่เสร็จจะโผล่มาให้เห็นเอง
                        </span>
                    </li>
                    <li className="flex gap-2 items-start">
                        <CheckSquare className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                            <b>Auto-Save:</b> ระบบบันทึกอัตโนมัติเมื่อพิมพ์เสร็จ (หยุดพิมพ์ 2 วินาที) หรือเมื่อเปลี่ยนช่อง อย่าพึ่งรีบปิดหน้าต่างทันทีที่พิมพ์จบนะ
                        </span>
                    </li>
                </ul>
            </section>

        </div>
    );
};

export default MeetingGuide;
