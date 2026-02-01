
import React, { useState } from 'react';
import { LayoutTemplate, CheckCircle2, Target, AlertTriangle, Zap, Database, ChevronDown, ChevronRight, Filter, SortAsc } from 'lucide-react';

const GuideContent: React.FC = () => {
    const [expandedItem, setExpandedItem] = useState<string | null>('overdue');

    const toggleExpand = (id: string) => {
        setExpandedItem(expandedItem === id ? null : id);
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Entity Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-indigo-100 hover:border-indigo-300 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <LayoutTemplate className="w-7 h-7" />
                        </div>
                        <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">Type A</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Content (คอนเทนต์)</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">
                        งานหลักของทีม Production มี Process ที่ซับซ้อน (Pre-Pro-Post) และต้องการข้อมูล Metadata เยอะ
                    </p>
                    <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase mb-2">Unique Fields:</p>
                        <div className="flex flex-wrap gap-2">
                            {['Platform', 'Pillar', 'Format', 'Script', 'Shoot Date'].map(tag => (
                                <span key={tag} className="text-[10px] bg-white px-2 py-1 rounded-md text-slate-600 shadow-sm border border-indigo-50">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-100 hover:border-emerald-300 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <span className="text-xs font-black text-emerald-300 uppercase tracking-widest">Type B</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Task (งานทั่วไป)</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">
                        งานธุรการ งานย่อย หรือ To-Do list ส่วนตัว ที่เน้นความคล่องตัว (Agile) และจบไว
                    </p>
                    <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase mb-2">Features:</p>
                        <div className="flex flex-wrap gap-2">
                            {['Simple Flow', 'No Script', 'Personal Board', 'Quick Add'].map(tag => (
                                <span key={tag} className="text-[10px] bg-white px-2 py-1 rounded-md text-slate-600 shadow-sm border border-emerald-50">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Focus Zone Algorithm - Deep Dive */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden relative">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <Target className="w-8 h-8 text-red-500" />
                            Focus Zone Algorithm
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 font-medium">
                            ตรรกะการคัดกรองงานขึ้นหน้าแรก (Dashboard Priority)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 flex items-center">
                            <Filter className="w-3 h-3 mr-1" /> Multi-Stage Filtering
                        </div>
                        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 flex items-center">
                            <SortAsc className="w-3 h-3 mr-1" /> Auto Sorting
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-4 bg-white relative z-10">
                    
                    {/* 1. Overdue Logic */}
                    <div 
                        className={`
                            border-2 rounded-3xl overflow-hidden transition-all duration-300
                            ${expandedItem === 'overdue' ? 'border-red-200 bg-red-50/30 shadow-md' : 'border-slate-100 hover:border-red-100 cursor-pointer'}
                        `}
                    >
                        <div className="p-5 flex justify-between items-center" onClick={() => toggleExpand('overdue')}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${expandedItem === 'overdue' ? 'bg-red-500' : 'bg-slate-200'}`}>1</div>
                                <h4 className={`text-lg font-bold ${expandedItem === 'overdue' ? 'text-red-700' : 'text-slate-600'}`}>
                                    Overdue Logic (งานแดง)
                                </h4>
                            </div>
                            {expandedItem === 'overdue' ? <ChevronDown className="text-red-400"/> : <ChevronRight className="text-slate-300"/>}
                        </div>
                        
                        {expandedItem === 'overdue' && (
                            <div className="px-5 pb-6 pl-[4.5rem] animate-in slide-in-from-top-2">
                                <p className="text-sm text-slate-600 mb-3 font-medium">
                                    ระบบจะเช็คเงื่อนไข 3 ข้อ ถ้าตรงทั้งหมด -▶ <span className="text-red-600 font-bold">ขึ้นสีแดงทันที</span>
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-sm bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                        <span><b>Date Check:</b> วันปัจจุบัน {'>'} End Date (เลยกำหนดส่ง)</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                        <span><b>Status Check:</b> สถานะยังไม่เป็น DONE / APPROVE (เช็คด้วย Keyword)</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                        <span><b>Type Check:</b> ไม่ใช่ Stock Content (isUnscheduled = false)</span>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* 2. Urgent Logic */}
                    <div 
                        className={`
                            border-2 rounded-3xl overflow-hidden transition-all duration-300
                            ${expandedItem === 'urgent' ? 'border-orange-200 bg-orange-50/30 shadow-md' : 'border-slate-100 hover:border-orange-100 cursor-pointer'}
                        `}
                    >
                        <div className="p-5 flex justify-between items-center" onClick={() => toggleExpand('urgent')}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${expandedItem === 'urgent' ? 'bg-orange-500' : 'bg-slate-200'}`}>2</div>
                                <h4 className={`text-lg font-bold ${expandedItem === 'urgent' ? 'text-orange-700' : 'text-slate-600'}`}>
                                    Urgent Logic (งานส้ม)
                                </h4>
                            </div>
                            {expandedItem === 'urgent' ? <ChevronDown className="text-orange-400"/> : <ChevronRight className="text-slate-300"/>}
                        </div>
                        
                        {expandedItem === 'urgent' && (
                            <div className="px-5 pb-6 pl-[4.5rem] animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-orange-100">
                                        <h6 className="font-bold text-orange-600 mb-2 flex items-center"><Zap className="w-4 h-4 mr-2"/> Priority Flag</h6>
                                        <p className="text-xs text-slate-500">
                                            งานที่ตั้งค่าความสำคัญเป็น <span className="bg-red-100 text-red-600 px-1 rounded font-bold">URGENT</span> จะถูกดึงมาแสดงเสมอ แม้ยังไม่ถึงกำหนดส่ง
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-orange-100">
                                        <h6 className="font-bold text-orange-600 mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-2"/> Proximity</h6>
                                        <p className="text-xs text-slate-500">
                                            งานที่กำหนดส่ง <span className="font-bold text-orange-500">ภายใน 48 ชั่วโมง</span> (วันนี้ หรือ พรุ่งนี้) จะถูกดันขึ้นมาเตือน
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Stock Logic */}
                    <div 
                        className={`
                            border-2 rounded-3xl overflow-hidden transition-all duration-300
                            ${expandedItem === 'stock' ? 'border-indigo-200 bg-indigo-50/30 shadow-md' : 'border-slate-100 hover:border-indigo-100 cursor-pointer'}
                        `}
                    >
                        <div className="p-5 flex justify-between items-center" onClick={() => toggleExpand('stock')}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${expandedItem === 'stock' ? 'bg-indigo-500' : 'bg-slate-200'}`}>3</div>
                                <h4 className={`text-lg font-bold ${expandedItem === 'stock' ? 'text-indigo-700' : 'text-slate-600'}`}>
                                    Stock Content (งานดอง)
                                </h4>
                            </div>
                            {expandedItem === 'stock' ? <ChevronDown className="text-indigo-400"/> : <ChevronRight className="text-slate-300"/>}
                        </div>
                        
                        {expandedItem === 'stock' && (
                            <div className="px-5 pb-6 pl-[4.5rem] animate-in slide-in-from-top-2">
                                <p className="text-sm text-slate-600 mb-3 font-medium">
                                    เมื่อติ๊กช่อง "Stock / Unscheduled":
                                </p>
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    <div className="min-w-[200px] bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                        <Database className="w-5 h-5 text-indigo-400 mb-2" />
                                        <p className="text-xs font-bold text-indigo-700">Date Ignored</p>
                                        <p className="text-[10px] text-slate-500 mt-1">วันที่ใน DB จะถูกซ่อน และไม่นำมาคำนวณ Overdue</p>
                                    </div>
                                    <div className="min-w-[200px] bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                        <Database className="w-5 h-5 text-indigo-400 mb-2" />
                                        <p className="text-xs font-bold text-indigo-700">Hidden from Dash</p>
                                        <p className="text-[10px] text-slate-500 mt-1">จะไม่โผล่ในหน้า Dashboard หลัก จนกว่าจะกด Schedule</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideContent;
