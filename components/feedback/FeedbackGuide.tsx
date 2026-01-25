
import React from 'react';
import { Megaphone, Ghost, Heart, Lightbulb, ShieldAlert, Lock, ThumbsUp } from 'lucide-react';

const FeedbackGuide: React.FC = () => {
    return (
        <div className="space-y-8 font-sans">
            
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-xl font-black mb-2 flex items-center">
                        📣 Voice of Team คือไรอ่ะ?
                    </h4>
                    <p className="text-pink-100 leading-relaxed font-medium">
                        พื้นที่ปล่อยของ! ระบายความในใจ! หรือส่งกำลังใจให้เพื่อน! <br/>
                        ไม่ต้องเก็บไว้คนเดียว ที่นี่คือ <span className="text-yellow-300 font-bold">"Safe Zone"</span> ของทุกคน <br/>
                        อยากบอกอะไร แต่ไม่กล้าบอกตรงๆ ก็ใช้โหมดนินจาได้เลย! 🥷
                    </p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                    <Megaphone className="w-32 h-32" />
                </div>
            </div>

            {/* Privacy Feature (Highlight) */}
            <section className="bg-gray-800 text-white p-5 rounded-2xl border border-gray-700 shadow-sm relative overflow-hidden">
                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-gray-700 rounded-2xl shrink-0 text-white shadow-inner">
                        <Ghost className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-100 mb-1 flex items-center gap-2">
                            โหมดนินจา (Anonymous) 🥷
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            ถ้าติ๊กเลือกปุ่ม <span className="bg-white text-gray-800 px-1.5 rounded font-bold text-xs">Anonymous</span> ชื่อของคุณจะถูกซ่อนทันที! <br/>
                            บนหน้าบอร์ดจะขึ้นว่า "Anonymous (นินจา)" ไม่มีใครรู้ว่าเป็นคุณแน่นอน <br/>
                            <span className="text-xs text-gray-400 mt-1 block">* ยกเว้น Admin ระบบที่อาจจะเห็นเพื่อความปลอดภัยนะจ๊ะ</span>
                        </p>
                    </div>
                </div>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gray-700 rounded-full opacity-50 blur-xl"></div>
            </section>

            {/* 3 Types */}
            <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-pink-500" /> เลือกส่งแบบไหนดี?
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    
                    {/* IDEA */}
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                            <Lightbulb className="w-6 h-6" />
                        </div>
                        <div>
                            <h5 className="font-bold text-amber-800">เสนอไอเดีย (Idea)</h5>
                            <p className="text-xs text-amber-700">มีคอนเทนต์เจ๋งๆ? อยากเปลี่ยนวิธีทำงาน? เสนอมาโลด!</p>
                        </div>
                    </div>

                    {/* SHOUTOUT */}
                    <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-pink-500 shadow-sm shrink-0">
                            <Heart className="w-6 h-6" />
                        </div>
                        <div>
                            <h5 className="font-bold text-pink-800">ชมเพื่อน (Shoutout)</h5>
                            <p className="text-xs text-pink-700">ใครทำดีต้องอวย! ส่งกำลังใจให้เพื่อนรู้ว่าเราเห็นนะ</p>
                        </div>
                    </div>

                    {/* ISSUE */}
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm shrink-0">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <h5 className="font-bold text-red-800 flex items-center gap-2">
                                แจ้งปัญหา (Issue) <span className="bg-red-200 text-red-800 text-[9px] px-1.5 py-0.5 rounded border border-red-300">Private</span>
                            </h5>
                            <p className="text-xs text-red-700">
                                เรื่องอึดอัดใจ แอร์ไม่เย็น เพื่อนร่วมงาน toxic <br/>
                                <b>*แบบนี้จะส่งตรงถึง Admin เท่านั้น ไม่ขึ้นบอร์ดรวม*</b>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Workflow */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm text-gray-500">
                <Lock className="w-5 h-5 shrink-0" />
                <p>
                    <b>Admin Moderation:</b> ทุกข้อความ (ยกเว้น Issue) จะต้องผ่านการกด Approve จาก Admin ก่อน ถึงจะโชว์บนบอร์ดนะจ๊ะ กันดราม่า! 😉
                </p>
            </div>

        </div>
    );
};

export default FeedbackGuide;
