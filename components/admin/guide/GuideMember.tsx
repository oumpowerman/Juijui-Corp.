
import React from 'react';
import { Kanban, PlayCircle, CheckCircle2, Target, AlertTriangle } from 'lucide-react';

const GuideMember: React.FC = () => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            
            {/* 1. My Work Board Logic */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                        <Kanban className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800">My Work Board Logic</h2>
                </div>

                <p className="text-slate-600 mb-6">
                    ระบบจะจัดกลุ่มงานในหน้า <b>"งานของฉัน"</b> ตาม <span className="font-mono bg-gray-100 text-indigo-600 px-1 rounded">Status Key</span> ใน Master Data ดังนี้:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                        <h4 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-3">1. Ready to Start</h4>
                        <div className="space-y-2">
                            {['TODO', 'IDEA', 'SCRIPT'].map(s => (
                                <span key={s} className="block text-xs font-bold text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">{s}</span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 bg-indigo-100/50 rounded-bl-full opacity-50"></div>
                        <h4 className="font-bold text-indigo-600 uppercase tracking-widest text-xs mb-3 flex items-center"><PlayCircle className="w-3 h-3 mr-1"/> 2. In Progress (Active)</h4>
                        <div className="space-y-2 relative z-10">
                            <span className="block text-xs font-bold text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">* Everything Else *</span>
                            <p className="text-[10px] text-indigo-500 mt-2 leading-relaxed">
                                สถานะอื่นๆ ที่ไม่ใช่ Todo และ Done (เช่น Shooting, Editing, Feedback) จะมารวมอยู่ที่นี่หมด เพื่อให้รู้ว่า "ต้องทำ"
                            </p>
                        </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                        <h4 className="font-bold text-emerald-600 uppercase tracking-widest text-xs mb-3 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> 3. Recently Done</h4>
                        <div className="space-y-2">
                            {['DONE', 'APPROVE', 'PASSED'].map(s => (
                                <span key={s} className="block text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">{s}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Weekly Quest Logic */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                        <Target className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800">Quest Progress Count</h2>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-700 mb-4 text-lg">เงื่อนไขการนับแต้ม (Auto Quest)</h4>
                        <ul className="space-y-4">
                            <li className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">1</div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Date Range (ช่วงเวลา)</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        ระบบจะนับเฉพาะงานที่มี <b>"วันจบ (End Date)"</b> อยู่ในช่วงเวลาของเควสนั้นๆ
                                        <br/> (Stock Item ที่ไม่มีวันที่ จะไม่ถูกนับ)
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">2</div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Status (สถานะ)</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        งานต้องมีสถานะตรงกับที่ตั้งไว้ในเควส (Default: <b>DONE</b>)
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">3</div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Platform & Format</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        ถ้าเควสระบุ Platform (เช่น TikTok) หรือ Format (เช่น Reels) งานนั้นต้องมีค่าตรงกันเป๊ะๆ ถึงจะนับ
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="w-full md:w-80 bg-orange-50 p-6 rounded-3xl border border-orange-100">
                        <h4 className="font-bold text-orange-800 mb-3 flex items-center"><AlertTriangle className="w-4 h-4 mr-2"/> จุดที่มักเข้าใจผิด</h4>
                        <ul className="space-y-3 text-xs text-orange-800 font-medium">
                            <li>❌ "ทำไมงาน Stock ไม่ขึ้น?" <br/> <span className="opacity-70">-▶ เพราะไม่มีวันที่ครับ ต้องใส่วันที่ก่อน</span></li>
                            <li>❌ "ทำไมหลอดทีมไม่ขยับ?" <br/> <span className="opacity-70">-▶ เช็คดูว่า Platform/Format ตรงกับโจทย์เควสไหม</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideMember;
