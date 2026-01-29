
import React from 'react';
import { Brain, Sparkles, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';

const KEYWORD_LIST = [
    { word: 'DONE', desc: 'จบงานสมบูรณ์ (Standard)' },
    { word: 'APPROVE', desc: 'อนุมัติแล้ว (Standard)' },
    { word: 'PASSED', desc: 'ผ่านการตรวจ (Standard)' },
    { word: 'COMPLETE', desc: 'เสร็จสิ้น (Fuzzy)' },
    { word: 'SUCCESS', desc: 'สำเร็จ (Fuzzy)' },
    { word: 'PUBLISH', desc: 'เผยแพร่แล้ว (Fuzzy)' },
    { word: 'POSTED', desc: 'โพสต์แล้ว (Fuzzy)' },
    { word: 'FINISH', desc: 'เสร็จ (Fuzzy)' },
    { word: 'CLOSED', desc: 'ปิดงาน (Fuzzy)' },
    { word: 'ARCHIVE', desc: 'เก็บเข้ากรุ (Fuzzy)' },
    { word: 'FINAL', desc: 'ไฟนอล (Fuzzy)' },
];

const GuideKeywords: React.FC = () => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Concept */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pink-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Brain className="w-48 h-48" /></div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center">
                            <Sparkles className="w-6 h-6 mr-2 text-pink-500" /> 
                            Smart Status Detection
                        </h2>
                        <p className="text-slate-600 leading-relaxed mb-6 text-lg">
                            ระบบไม่ได้ดูแค่ ID ของสถานะ แต่ใช้การ <b>"สแกนคำ (Keyword Scanning)"</b> <br/>
                            เพื่อให้ยืดหยุ่นต่อการตั้งชื่อของคุณ ไม่ว่าคุณจะตั้งชื่อ Status ว่าอะไร <br/>
                            ขอแค่มีคำเหล่านี้ผสมอยู่ ระบบจะรู้ทันทีว่างานนั้น <u>จบแล้ว</u> (Completed)
                        </p>
                        
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Magic Keywords (คำศักดิ์สิทธิ์)</h4>
                            <div className="flex flex-wrap gap-2">
                                {KEYWORD_LIST.map(k => (
                                    <div key={k.word} className="group relative">
                                        <span className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-black shadow-sm flex items-center cursor-help hover:border-pink-300 transition-colors">
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-500" /> {k.word}
                                        </span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            {k.desc}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                            <h3 className="font-bold text-green-800 mb-3 flex items-center"><CheckCircle2 className="w-5 h-5 mr-2"/> ตัวอย่างที่ "ผ่าน"</h3>
                            <ul className="space-y-2 text-sm text-green-700">
                                <li>✅ "Posted (FB)" -▶ เจอคำว่า <b>POSTED</b></li>
                                <li>✅ "Final File Sent" -▶  เจอคำว่า <b>FINAL</b></li>
                                <li>✅ "Archive 2023" -▶  เจอคำว่า <b>ARCHIVE</b></li>
                            </ul>
                        </div>
                        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                            <h3 className="font-bold text-red-800 mb-3 flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> ระวัง "False Positive"</h3>
                            <p className="text-xs text-red-600 mb-2">ห้ามใช้คำ Keyword ถ้างานยังไม่จบจริง!</p>
                            <ul className="space-y-2 text-sm text-red-700">
                                <li>❌ "Final Review" (กำลังตรวจ) -▶  ระบบนึกว่าเสร็จเพราะมี <b>FINAL</b></li>
                                <li>❌ "Check Complete" (ตรวจเสร็จแล้วรอแก้) -▶  ระบบนึกว่าเสร็จเพราะมี <b>COMPLETE</b></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right: Logic Flow */}
                <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex flex-col justify-center relative shadow-xl">
                    <h3 className="font-bold text-lg mb-6 text-center text-slate-200">Logic Flowchart</h3>
                    <div className="space-y-4 relative z-10">
                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center">
                            <p className="text-xs text-slate-400 mb-1">1. User Changes Status</p>
                            <p className="font-bold text-yellow-400">"Waiting for Final"</p>
                        </div>
                        <div className="flex justify-center"><ChevronDown className="w-6 h-6 text-slate-600" /></div>
                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                            <p className="text-xs text-slate-400 mb-1">2. System Scans</p>
                            <p className="text-sm">Contains "FINAL"? <span className="text-green-400 font-bold">YES</span></p>
                        </div>
                        <div className="flex justify-center"><ChevronDown className="w-6 h-6 text-slate-600" /></div>
                        <div className="bg-green-900/40 p-4 rounded-2xl border border-green-500/30 text-center">
                            <p className="text-xs text-green-300 mb-1">3. Result</p>
                            <p className="font-bold text-white">Mark as DONE ✅</p>
                            <p className="text-[10px] text-slate-400 mt-1">(Stop Overdue Timer)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideKeywords;
