
import React from 'react';
import { FileText, Lock, Share2, Globe, Clock, Edit3 } from 'lucide-react';

const GuideScript: React.FC = () => {
    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-rose-100 flex items-center gap-6">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 shadow-inner">
                    <FileText className="w-10 h-10" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Script Architecture</h2>
                    <p className="text-slate-500 font-medium mt-1">
                        ระบบเขียนบทแบบ Real-time Collab (คล้าย Google Docs)
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Locking Mechanism */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[50%] pointer-events-none transition-transform group-hover:scale-110"></div>
                    
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center">
                        <Lock className="w-6 h-6 mr-3 text-indigo-500" />
                        Concurrency Lock 🔒
                    </h3>
                    
                    <div className="space-y-4 relative z-10">
                        <p className="text-slate-600 text-sm font-medium leading-relaxed">
                            เพื่อป้องกันปัญหา "แย่งกันแก้" (Race Condition) ระบบใช้ตรรกะดังนี้:
                        </p>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-xs text-slate-600">
                                    <span className="font-bold text-indigo-600 min-w-[20px]">1.</span>
                                    <span>ทันทีที่มีคนเปิดหน้าแก้ไข ระบบจะ <b>Lock</b> บทนั้นให้คนนั้นทันที</span>
                                </li>
                                <li className="flex gap-3 text-xs text-slate-600">
                                    <span className="font-bold text-indigo-600 min-w-[20px]">2.</span>
                                    <span>คนอื่นที่เข้ามาทีหลังจะเห็นเป็นโหมด <b>Read-Only</b> (อ่านได้อย่างเดียว)</span>
                                </li>
                                <li className="flex gap-3 text-xs text-slate-600">
                                    <span className="font-bold text-indigo-600 min-w-[20px]">3.</span>
                                    <span>Lock จะหลุดเมื่อ: กดบันทึก, ปิดหน้าต่าง, หรือไม่มีการเคลื่อนไหวเกิน 5 นาที (Heartbeat Timeout)</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-bold bg-indigo-50 w-fit px-3 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> Auto-Unlock after 5 mins inactivity
                        </div>
                    </div>
                </div>

                {/* 2. Magic Link */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-cyan-200 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-bl-[50%] pointer-events-none transition-transform group-hover:scale-110"></div>
                    
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center">
                        <Share2 className="w-6 h-6 mr-3 text-cyan-500" />
                        Magic Link (Public View) 🔗
                    </h3>
                    
                    <div className="space-y-4 relative z-10">
                        <p className="text-slate-600 text-sm font-medium leading-relaxed">
                            แชร์บทให้นักแสดงหรือลูกค้าดูได้ โดย<b>ไม่ต้องล็อกอิน</b>
                        </p>

                        <div className="bg-cyan-50/50 p-5 rounded-2xl border border-cyan-100 flex flex-col gap-3 text-center">
                            <Globe className="w-8 h-8 text-cyan-400 mx-auto" />
                            <div className="bg-white p-2 rounded-lg border border-cyan-200 text-[10px] font-mono text-cyan-700 truncate shadow-sm">
                                https://app.juijui.com/s/7x9s8d...
                            </div>
                            <p className="text-[10px] text-cyan-600 font-bold">
                                * ลิงก์นี้ดูได้ตลอด จนกว่าจะกดปิด "Public" ในหน้าแก้ไข
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Lifecycle */}
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                <h3 className="text-lg font-black text-slate-700 mb-6 uppercase tracking-wider text-center">
                    Script Lifecycle
                </h3>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
                    {/* Line */}
                    <div className="absolute top-1/2 left-10 right-10 h-1 bg-slate-200 -z-10 hidden md:block"></div>

                    {[
                        { step: '1', title: 'Draft', desc: 'ร่างไอเดีย / เขียนบท', icon: Edit3, color: 'bg-slate-200 text-slate-500' },
                        { step: '2', title: 'Review', desc: 'ส่งตรวจ / รออนุมัติ', icon: Share2, color: 'bg-yellow-100 text-yellow-600' },
                        { step: '3', title: 'Final', desc: 'บทนิ่งแล้ว พร้อมถ่าย', icon: Lock, color: 'bg-green-100 text-green-600' },
                    ].map((s) => (
                        <div key={s.step} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 w-full md:w-64 text-center group hover:-translate-y-1 transition-transform">
                            <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center mx-auto mb-3 shadow-inner`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-slate-800">{s.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default GuideScript;
