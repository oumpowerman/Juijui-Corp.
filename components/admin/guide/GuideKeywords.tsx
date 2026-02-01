
import React from 'react';
import { Brain, Sparkles, CheckCircle2, AlertTriangle, ChevronDown, Search, XCircle, Code } from 'lucide-react';

const KEYWORD_GROUPS = [
    {
        title: 'Core Completion (จบงาน)',
        color: 'green',
        items: [
            { word: 'DONE', desc: 'จบงานสมบูรณ์ (Standard)' },
            { word: 'APPROVE', desc: 'อนุมัติแล้ว (ใช้กับ QC)' },
            { word: 'PASSED', desc: 'ผ่านการตรวจ (ใช้กับ QC)' },
        ]
    },
    {
        title: 'Publishing (เผยแพร่)',
        color: 'blue',
        items: [
            { word: 'PUBLISH', desc: 'กด Publish แล้ว' },
            { word: 'POSTED', desc: 'โพสต์ลงโซเชียลแล้ว' },
            { word: 'ONLINE', desc: 'งานออนไลน์แล้ว' },
        ]
    },
    {
        title: 'Finalizing (ขั้นตอนสุดท้าย)',
        color: 'purple',
        items: [
            { word: 'COMPLETE', desc: 'เสร็จสิ้นกระบวนการ' },
            { word: 'SUCCESS', desc: 'สำเร็จ' },
            { word: 'FINAL', desc: 'ไฟล์ Final (ระวัง! ใช้เมื่อจบจริงเท่านั้น)' },
            { word: 'ARCHIVE', desc: 'เก็บเข้ากรุ' },
        ]
    }
];

const GuideKeywords: React.FC = () => {
    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Concept Section */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <Brain className="w-64 h-64" />
                </div>
                
                <div className="relative z-10 max-w-4xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Smart Status Detection</h2>
                    </div>
                    
                    <p className="text-slate-600 text-lg leading-relaxed font-medium mb-8">
                        ระบบใช้เทคโนโลยี <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">Keyword Scanning</span> ในการตรวจสอบสถานะงาน <br/>
                        ทำให้คุณสามารถตั้งชื่อ Status ว่าอะไรก็ได้ (เช่น "ส่งลูกค้าแล้วจ้า", "โพสต์แล้วนะ") <br/>
                        ขอแค่มี <span className="text-pink-600 font-bold">Magic Words</span> เหล่านี้ผสมอยู่ ระบบจะรู้ทันทีว่างานนั้น <u>เสร็จสมบูรณ์</u>
                    </p>

                    {/* Keywords Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {KEYWORD_GROUPS.map(group => (
                            <div key={group.title} className={`bg-${group.color}-50/50 rounded-3xl p-5 border border-${group.color}-100`}>
                                <h4 className={`text-xs font-black uppercase tracking-widest mb-4 text-${group.color}-700 flex items-center`}>
                                    <span className={`w-2 h-2 rounded-full bg-${group.color}-500 mr-2`}></span> {group.title}
                                </h4>
                                <div className="space-y-2">
                                    {group.items.map(k => (
                                        <div key={k.word} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col group hover:shadow-md transition-all">
                                            <span className="font-black text-slate-700 font-mono text-sm tracking-wide group-hover:text-indigo-600">{k.word}</span>
                                            <span className="text-[10px] text-slate-400 mt-1 font-medium">{k.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logic Flow & Rules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* How it works */}
                <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                    
                    <h3 className="text-xl font-black mb-6 flex items-center">
                        <Code className="w-5 h-5 mr-3 text-cyan-400" />
                        Algorithm Logic
                    </h3>

                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">1</div>
                            <div className="flex-1 bg-slate-800 p-3 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Input Status</p>
                                <p className="font-mono text-yellow-300">"Waiting for Final Review"</p>
                            </div>
                        </div>

                        <div className="pl-4">
                            <div className="w-0.5 h-6 bg-slate-700"></div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm animate-pulse">2</div>
                            <div className="flex-1 bg-indigo-900/50 p-3 rounded-xl border border-indigo-500/30">
                                <p className="text-xs text-indigo-300 uppercase font-bold mb-1">Processing</p>
                                <div className="flex items-center gap-2">
                                    <Search className="w-4 h-4 text-indigo-400" />
                                    <p className="text-sm">Found keyword: <span className="font-bold text-white bg-indigo-600 px-1 rounded">FINAL</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="pl-4">
                            <div className="w-0.5 h-6 bg-slate-700"></div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-sm">3</div>
                            <div className="flex-1 bg-green-900/30 p-3 rounded-xl border border-green-500/30">
                                <p className="text-xs text-green-400 uppercase font-bold mb-1">Result</p>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-bold text-green-300">Mark as COMPLETED</p>
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">+ Stop Timer / + Award XP</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Common Mistakes */}
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-red-100 shadow-sm flex flex-col justify-center">
                    <h3 className="text-xl font-black text-red-700 mb-6 flex items-center">
                        <AlertTriangle className="w-6 h-6 mr-3" />
                        Common Pitfalls (จุดที่พลาดยาก)
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-slate-700 text-sm">False Positive (เสร็จทิพย์)</p>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    ห้ามใช้คำว่า <span className="font-mono text-red-500 bg-red-50 px-1 rounded">Final</span> ในขั้นตอนที่ยังไม่จบจริง <br/>
                                    เช่น "Waiting for Final" -▶ ระบบจะนึกว่าจบแล้วเพราะมีคำว่า Final
                                </p>
                                <p className="text-xs font-bold text-green-600 mt-2">✅ แนะนำ: ใช้ "Waiting Review" หรือ "Checking"</p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-red-50"></div>

                        <div className="flex gap-4 items-start">
                            <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Spelling (สะกดผิด)</p>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    ระบบรองรับแค่ภาษาอังกฤษ (Case-insensitive) <br/>
                                    "เสร็จแล้ว", "เรียบร้อย" -▶ <span className="text-red-500">ใช้ไม่ได้</span>
                                </p>
                                <p className="text-xs font-bold text-green-600 mt-2">✅ แนะนำ: "เสร็จแล้ว (Done)", "ส่งงาน (Posted)"</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GuideKeywords;
