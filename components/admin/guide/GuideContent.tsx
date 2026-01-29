
import React, { useState } from 'react';
import { LayoutTemplate, CheckCircle2, Target, AlertTriangle, Zap, Database, ChevronDown, ChevronRight } from 'lucide-react';

const GuideContent: React.FC = () => {
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedItem(expandedItem === id ? null : id);
    };

    return (
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
    );
};

export default GuideContent;
