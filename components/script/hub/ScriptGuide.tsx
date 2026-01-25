
import React from 'react';
import { PenTool, Sparkles, MonitorPlay, Lock, Users, AlertTriangle, Layers, Save } from 'lucide-react';

const ScriptGuide: React.FC = () => {
    return (
        <div className="space-y-8 font-sans">
            
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-xl font-black mb-2 flex items-center">
                        📝 Script Hub คือไรอ่ะ?
                    </h4>
                    <p className="text-rose-100 leading-relaxed font-medium">
                        นี่คือ <span className="text-yellow-300 font-bold">"ครัวกลาง"</span> ของทีม Creative! <br/>
                        ที่เอาไว้ปรุงไอเดียให้กลายเป็นบท พร้อมเสิร์ฟให้ทีม Production ถ่ายทำ <br/>
                        มี AI ช่วยคิด มี Teleprompter ช่วยอ่าน ครบจบในที่เดียว ไม่ต้องสลับแอปไปมา!
                    </p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                    <PenTool className="w-32 h-32" />
                </div>
            </div>

            {/* Feature Highlights */}
            <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-rose-500" /> ฟีเจอร์ตัวตึง (Key Features)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-3">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h5 className="font-bold text-gray-800">AI ผู้ช่วยเสกบท</h5>
                        <p className="text-xs text-gray-500 mt-1">
                            คิดไม่ออกบอก AI! กดปุ่มไม้กายสิทธิ์ ให้มันช่วยคิด Hook ปังๆ หรือวางโครงเรื่อง (Outline) ให้ใน 3 วิ
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-3">
                            <MonitorPlay className="w-6 h-6" />
                        </div>
                        <h5 className="font-bold text-gray-800">Teleprompter</h5>
                        <p className="text-xs text-gray-500 mt-1">
                            เปลี่ยนบทเป็นเครื่องช่วยอ่าน! ปรับความเร็วตัวหนังสือวิ่งได้ ไม่ต้องจำบทให้สมองบวม
                        </p>
                    </div>
                </div>
            </section>

            {/* Workflow Steps */}
            <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-rose-500" /> สเต็ปการใช้งาน (Workflow)
                </h3>
                <div className="space-y-3">
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                            <div className="w-0.5 h-full bg-gray-100 my-1"></div>
                        </div>
                        <div className="pb-4">
                            <h6 className="font-bold text-gray-800">สร้าง & เขียนบท (Library)</h6>
                            <p className="text-sm text-gray-600">
                                เริ่มต้นที่แท็บ <span className="bg-gray-100 px-1 rounded text-xs font-bold">Library</span> กดสร้างใหม่ เลือกประเภท (Monologue/Dialogue) แล้วลุยเลย
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                            <div className="w-0.5 h-full bg-gray-100 my-1"></div>
                        </div>
                        <div className="pb-4">
                            <h6 className="font-bold text-gray-800">ส่งเข้าคิวถ่าย (Queue)</h6>
                            <p className="text-sm text-gray-600">
                                เมื่อบทนิ่งแล้ว กดปุ่ม <span className="text-indigo-600 font-bold">"เข้าคิวถ่าย"</span> บทจะย้ายไปอยู่แท็บ <span className="bg-gray-100 px-1 rounded text-xs font-bold">Queue</span> เพื่อรอวันถ่ายทำ
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                        </div>
                        <div>
                            <h6 className="font-bold text-gray-800">ถ่ายเสร็จเก็บเข้ากรุ (History)</h6>
                            <p className="text-sm text-gray-600">
                                ถ่ายจบปุ๊บ กด <span className="text-emerald-600 font-bold">"เสร็จแล้ว"</span> บทจะถูกเก็บเข้า <span className="bg-gray-100 px-1 rounded text-xs font-bold">History</span> เป็นตำนานสืบไป
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Warnings */}
            <section className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 mr-2" /> ข้อควรระวัง (Warning)
                </h3>
                <ul className="space-y-2 text-xs text-orange-700">
                    <li className="flex gap-2">
                        <Lock className="w-4 h-4 shrink-0" />
                        <span>
                            <b>ระบบ Lock อัตโนมัติ:</b> ถ้ามีคนกำลังแก้บทนี้อยู่ คนอื่นจะแก้ไม่ได้ (เห็นเป็น Read-Only) เพื่อป้องกันการเซฟทับกันจนงานหาย!
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <Save className="w-4 h-4 shrink-0" />
                        <span>
                            <b>Auto-Save:</b> ระบบบันทึกให้อัตโนมัติทุก 3 วินาทีที่หยุดพิมพ์ แต่ก่อนปิดหน้าต่าง กด Save อีกทีเพื่อความชัวร์นะจ๊ะ
                        </span>
                    </li>
                    <li className="flex gap-2">
                        <Users className="w-4 h-4 shrink-0" />
                        <span>
                            <b>Dialogue Mode:</b> ถ้าเลือกแบบบทสนทนา ให้พิมพ์ชื่อตัวละคร แล้วตามด้วยข้อความ (เช่น "A: สวัสดี") ระบบจะจัดหน้าให้อัตโนมัติ
                        </span>
                    </li>
                </ul>
            </section>

        </div>
    );
};

export default ScriptGuide;
