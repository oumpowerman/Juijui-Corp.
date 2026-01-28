
import React, { useState } from 'react';
import { 
    Brain, Sparkles, CheckCircle2, AlertTriangle, 
    FileText, Calendar, Coffee, ScanEye, Database, 
    LayoutTemplate, MessageSquare, Terminal, 
    Zap, Lock, Share2, Target, Trophy, Heart, ShieldAlert,
    ChevronDown, ChevronRight, HelpCircle, ArrowRight
} from 'lucide-react';

const SystemLogicGuide: React.FC = () => {
    const [activeSection, setActiveSection] = useState('KEYWORDS');
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedItem(expandedItem === id ? null : id);
    };

    const SECTIONS = [
        { id: 'KEYWORDS', label: '🧠 The Brain (Keywords)', icon: Brain, color: 'text-pink-500' },
        { id: 'CONTENT', label: '🎬 Content & Tasks', icon: LayoutTemplate, color: 'text-indigo-500' },
        { id: 'SCRIPT', label: '📝 Script Hub', icon: FileText, color: 'text-rose-500' },
        { id: 'MEETING', label: '🗣️ Meeting Room', icon: MessageSquare, color: 'text-blue-500' },
        { id: 'DUTY', label: '🧹 Duty & Swaps', icon: Coffee, color: 'text-amber-500' },
        { id: 'GAME', label: '🎮 Gamification', icon: Trophy, color: 'text-purple-500' },
    ];

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

    const renderHeader = () => (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner">
                        <Terminal className="w-8 h-8 text-cyan-300" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight leading-none">System Logic & Architecture</h1>
                        <p className="text-slate-400 text-xs font-mono mt-1">v2.0.0 • Updated for Production</p>
                    </div>
                </div>
                <p className="text-slate-300 max-w-3xl text-lg font-light leading-relaxed">
                    คู่มือเจาะลึกกลไกการทำงานของระบบ (Deep Dive) <br/>
                    อธิบาย Logic เบื้องหลังที่ User ทั่วไปมองไม่เห็น เพื่อให้ Admin บริหารจัดการได้อย่างมีประสิทธิภาพสูงสุด
                </p>
            </div>
        </div>
    );

    return (
        <div className="pb-24 animate-in fade-in duration-500 font-sans">
            {renderHeader()}

            {/* Navigation Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
                {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`
                                flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold whitespace-nowrap transition-all border-2
                                ${isActive 
                                    ? 'bg-white text-slate-800 border-indigo-600 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50 transform -translate-y-1' 
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'}
                            `}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? section.color : 'text-slate-400'}`} />
                            {section.label}
                        </button>
                    );
                })}
            </div>

            {/* --- SECTION 1: KEYWORDS (THE BRAIN) --- */}
            {activeSection === 'KEYWORDS' && (
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
                                        <li>✅ "Final File Sent" -▶ เจอคำว่า <b>FINAL</b></li>
                                        <li>✅ "Archive 2023" -▶ เจอคำว่า <b>ARCHIVE</b></li>
                                    </ul>
                                </div>
                                <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                                    <h3 className="font-bold text-red-800 mb-3 flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> ระวัง "False Positive"</h3>
                                    <p className="text-xs text-red-600 mb-2">ห้ามใช้คำ Keyword ถ้างานยังไม่จบจริง!</p>
                                    <ul className="space-y-2 text-sm text-red-700">
                                        <li>❌ "Final Review" (กำลังตรวจ) -▶ ระบบนึกว่าเสร็จเพราะมี <b>FINAL</b></li>
                                        <li>❌ "Check Complete" (ตรวจเสร็จแล้วรอแก้) -▶ ระบบนึกว่าเสร็จเพราะมี <b>COMPLETE</b></li>
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
            )}

            {/* --- SECTION 2: CONTENT & TASKS --- */}
            {activeSection === 'CONTENT' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    
                    {/* Definitions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100 hover:border-indigo-300 transition-colors">
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                                <LayoutTemplate className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-2">Content (คอนเทนต์)</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                งานผลิตสื่อที่มี Process ชัดเจน (Pre-Pro-Post) <br/>
                                <span className="text-indigo-600 font-bold">• มีฟิลด์พิเศษ:</span> Platform, Pillar, Format, Script, Shoot Date
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 hover:border-emerald-300 transition-colors">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-2">Task (งานทั่วไป)</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                งานธุรการ หรืองานย่อยที่ไม่ใช่การผลิตสื่อ <br/>
                                <span className="text-emerald-600 font-bold">• เน้นความคล่องตัว:</span> มีแค่ Title, Status, Assignee, Due Date
                            </p>
                        </div>
                    </div>

                    {/* Focus Zone Algorithm */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-200">
                        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
                            <Target className="w-6 h-6 mr-2 text-red-500" />
                            Focus Zone Algorithm
                        </h3>
                        <div className="space-y-4">
                            <div 
                                className="border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-all"
                                onClick={() => toggleExpand('overdue')}
                            >
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-red-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-2"/> 1. Overdue (งานแดง)</h4>
                                    {expandedItem === 'overdue' ? <ChevronDown className="w-5 h-5 text-gray-400"/> : <ChevronRight className="w-5 h-5 text-gray-400"/>}
                                </div>
                                {expandedItem === 'overdue' && (
                                    <div className="mt-3 text-sm text-gray-600 pl-6 border-l-2 border-red-100 animate-in slide-in-from-top-2">
                                        <p>เงื่อนไขที่จะขึ้นแดง:</p>
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li>เลยกำหนดส่ง (End Date {'<'} Today)</li>
                                            <li>สถานะยังไม่เป็น Done (Keyword Check)</li>
                                            <li><b>ไม่ใช่</b> งาน Stock (isUnscheduled = false)</li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div 
                                className="border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-all"
                                onClick={() => toggleExpand('urgent')}
                            >
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-orange-500 flex items-center"><Zap className="w-4 h-4 mr-2"/> 2. Urgent (งานด่วน)</h4>
                                    {expandedItem === 'urgent' ? <ChevronDown className="w-5 h-5 text-gray-400"/> : <ChevronRight className="w-5 h-5 text-gray-400"/>}
                                </div>
                                {expandedItem === 'urgent' && (
                                    <div className="mt-3 text-sm text-gray-600 pl-6 border-l-2 border-orange-100 animate-in slide-in-from-top-2">
                                        <p>เงื่อนไขที่จะขึ้นในโซนนี้:</p>
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li>Priority ถูกตั้งเป็น <span className="text-red-500 font-bold">URGENT</span></li>
                                            <li>หรือ ครบกำหนดส่ง วันนี้/พรุ่งนี้</li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div 
                                className="border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-all"
                                onClick={() => toggleExpand('stock')}
                            >
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-gray-600 flex items-center"><Database className="w-4 h-4 mr-2"/> 3. Stock Mode (งานดอง)</h4>
                                    {expandedItem === 'stock' ? <ChevronDown className="w-5 h-5 text-gray-400"/> : <ChevronRight className="w-5 h-5 text-gray-400"/>}
                                </div>
                                {expandedItem === 'stock' && (
                                    <div className="mt-3 text-sm text-gray-600 pl-6 border-l-2 border-gray-200 animate-in slide-in-from-top-2">
                                        <p>เมื่อติ๊กช่อง "Stock / Unscheduled":</p>
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li>วันที่ในระบบจะถูกเซ็ตเป็น "1970-01-01" หรือวันที่สร้าง (แต่ซ่อนไว้)</li>
                                            <li><b>จะไม่ถูกนำไปคำนวณ</b> ว่า Overdue (เพื่อไม่ให้รกหน้า Dashboard)</li>
                                            <li>เหมาะสำหรับ: ไอเดียที่จดไว้ก่อน, คอนเทนต์สำรอง</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SECTION 3: SCRIPT HUB --- */}
            {activeSection === 'SCRIPT' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-200">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mr-4">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800">Script Architecture</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                    <h4 className="font-bold text-slate-700 flex items-center mb-2"><Lock className="w-4 h-4 mr-2"/> Locking Mechanism</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        เพื่อป้องกันการ "พิมพ์ชนกัน" (Race Condition) ระบบจะล็อกสคริปต์ทันทีที่มีคนเปิดแก้ไข <br/>
                                        คนอื่นจะเห็นเป็น <b>Read-Only</b> จนกว่าคนที่แก้จะกดออก หรือหมดเวลา (Timeout 5 นาที)
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                    <h4 className="font-bold text-slate-700 flex items-center mb-2"><Share2 className="w-4 h-4 mr-2"/> Magic Link</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        แชร์สคริปต์ให้คนนอก (เช่น นักแสดง, ลูกค้า) ดูได้โดย <b>ไม่ต้องล็อกอิน</b> <br/>
                                        ระบบจะสร้าง URL พิเศษที่มี Token ฝังอยู่ (Public Read Access)
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex flex-col justify-between">
                                <h4 className="font-bold text-rose-800 mb-4">Lifecycle State</h4>
                                <div className="space-y-3 relative">
                                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-rose-200"></div>
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-rose-300 rounded-full flex items-center justify-center text-[10px] font-bold text-rose-500">1</div>
                                        <p className="font-bold text-rose-700 text-sm">Library</p>
                                        <p className="text-xs text-rose-600">ร่างบท / แก้ไข (Draft)</p>
                                    </div>
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1 w-6 h-6 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold text-white">2</div>
                                        <p className="font-bold text-rose-700 text-sm">In Queue</p>
                                        <p className="text-xs text-rose-600">พร้อมถ่าย (Shooting)</p>
                                    </div>
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-rose-300 rounded-full flex items-center justify-center text-[10px] font-bold text-rose-500">3</div>
                                        <p className="font-bold text-rose-700 text-sm">History</p>
                                        <p className="text-xs text-rose-600">ถ่ายจบแล้ว (Done)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SECTION 4: MEETING --- */}
            {activeSection === 'MEETING' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                         <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center">
                            <MessageSquare className="w-8 h-8 mr-3 text-blue-500" /> Action Item Ecosystem
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-slate-700 mb-3 text-lg">Project Tagging (#)</h4>
                                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                    ระบบเชื่อมโยงการประชุมกับงานเก่าด้วย <b>Hash Tag</b> <br/>
                                    หากใส่ Tag ในการประชุมตรงกับ Tag ใน Task (เช่น <code>#VlogJapan</code>) <br/>
                                    ระบบจะดึง Task ที่ยังไม่เสร็จ (Pending) มาแสดงให้ติดตามงานทันที
                                </p>
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-sm text-blue-800">
                                    💡 <b>Use Case:</b> ประชุมอัปเดตงานประจำสัปดาห์ แค่ใส่ Tag เดิม ก็เห็นงานค้างทั้งหมดของทีม
                                </div>
                            </div>
                            
                            <div className="border-l-2 border-slate-100 pl-8">
                                <h4 className="font-bold text-slate-700 mb-3 text-lg">Auto-Generate Task</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    เมื่อกด "สั่งงาน" จากหน้าประชุม ระบบทำ 3 อย่างพร้อมกัน:
                                </p>
                                <ol className="list-decimal pl-5 text-sm text-slate-600 mt-2 space-y-2">
                                    <li>สร้าง Card ใหม่ลงในบอร์ดหลัก</li>
                                    <li>Auto-Tag: <code>Meeting-Action</code> + ลิงก์กลับมาที่ Note นี้</li>
                                    <li>เพิ่ม Log ลงในบันทึกการประชุม (เป็น Text) เพื่อเป็นหลักฐาน</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SECTION 5: DUTY --- */}
            {activeSection === 'DUTY' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                                <Coffee className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800">Roster Algorithm</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4 p-5 border border-gray-100 rounded-3xl bg-gray-50/50">
                                <div className="shrink-0 font-black text-4xl text-gray-200">R</div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">Rotation (Fair Shuffle)</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        ระบบสุ่มจะสร้าง <b>Queue</b> ของพนักงานทุกคน แล้วแจกจ่ายเวรเรียงตามคิว <br/>
                                        เมื่อแจกครบทุกคนแล้ว ถึงจะเริ่มสลับคิวใหม่ (Reshuffle) <br/>
                                        <u>รับประกัน</u> ว่าในระยะยาว ทุกคนจะได้ทำเวรจำนวนเท่ากันเป๊ะๆ
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-5 border border-amber-100 rounded-3xl bg-amber-50">
                                <div className="shrink-0 font-black text-4xl text-amber-200">S</div>
                                <div>
                                    <h4 className="font-bold text-amber-800 text-lg">Swap Logic (State Machine)</h4>
                                    <p className="text-sm text-amber-700 mt-1 mb-2">
                                        การแลกเวรจะไม่เกิดขึ้นทันที แต่ต้องผ่าน State ดังนี้:
                                    </p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-white/50 p-2 rounded-lg w-fit">
                                        <span>Request (Pending)</span>
                                        <ChevronRight className="w-3 h-3" />
                                        <span>Accept</span>
                                        <ChevronRight className="w-3 h-3" />
                                        <span>Database Update (Swap Owner)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

             {/* --- SECTION 6: GAME (New) --- */}
             {activeSection === 'GAME' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-purple-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800">Gamification Formula</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* XP Calculation */}
                            <div className="bg-yellow-50 p-5 rounded-3xl border border-yellow-100">
                                <h4 className="font-bold text-yellow-800 mb-3 flex items-center"><Target className="w-4 h-4 mr-2"/> XP Calculation</h4>
                                <div className="bg-white/80 p-3 rounded-xl border border-yellow-200 font-mono text-xs text-yellow-900 mb-2">
                                    XP = (Base_Difficulty) + (Hours * 20) + Bonus
                                </div>
                                <ul className="text-xs text-yellow-800 space-y-1 ml-1">
                                    <li>• Easy: 50 XP / Medium: 100 XP / Hard: 250 XP</li>
                                    <li>• Early Bonus: +50 XP (ถ้าส่งก่อนกำหนด 24 ชม.)</li>
                                </ul>
                            </div>

                            {/* HP Penalty */}
                            <div className="bg-red-50 p-5 rounded-3xl border border-red-100">
                                <h4 className="font-bold text-red-800 mb-3 flex items-center"><Heart className="w-4 h-4 mr-2"/> The Judge (AI)</h4>
                                <p className="text-xs text-red-700 mb-2">ระบบจะรันทุกเที่ยงคืน หรือเมื่อผู้ใช้ login เข้ามาใหม่</p>
                                <div className="bg-white/80 p-3 rounded-xl border border-red-200 font-mono text-xs text-red-900">
                                    If Task Overdue: HP -5 per day <br/>
                                    If Missed Duty: HP -10 immediately
                                </div>
                            </div>
                        </div>

                        {/* QC Flow */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="font-bold text-gray-700 mb-4 flex items-center"><ScanEye className="w-5 h-5 mr-2 text-indigo-500"/> Quality Gate Workflow</h4>
                            <div className="flex flex-col md:flex-row gap-4 items-center text-center">
                                <div className="flex-1 bg-gray-50 p-4 rounded-2xl w-full">
                                    <span className="font-bold text-gray-700 block mb-1">1. Pending</span>
                                    <span className="text-xs text-gray-500">Editor ส่งงาน</span>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 rotate-90 md:rotate-0" />
                                <div className="flex-1 bg-red-50 p-4 rounded-2xl w-full border border-red-100">
                                    <span className="font-bold text-red-700 block mb-1">2. Revise</span>
                                    <span className="text-xs text-red-600">สถานะงานดีดกลับเป็น Doing</span>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 rotate-90 md:rotate-0" />
                                <div className="flex-1 bg-green-50 p-4 rounded-2xl w-full border border-green-100">
                                    <span className="font-bold text-green-700 block mb-1">3. Pass</span>
                                    <span className="text-xs text-green-600">สถานะเป็น Done + แจก XP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemLogicGuide;
