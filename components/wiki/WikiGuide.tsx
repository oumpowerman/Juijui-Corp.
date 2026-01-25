
import React from 'react';
import { BookOpen, Hash, List, Image as ImageIcon, Search, Heart, Sparkles, Pin } from 'lucide-react';

const WikiGuide: React.FC = () => {
    return (
        <div className="space-y-8 font-sans">
            
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-xl font-black mb-2 flex items-center">
                        📚 Wiki Library คือไรอ่ะ?
                    </h4>
                    <p className="text-cyan-100 leading-relaxed font-medium">
                        คลังสมบัติของทีม! ไม่ต้องถามพี่เลี้ยงซ้ำๆ อีกต่อไป <br/>
                        คู่มือรับน้อง, วิธีใช้อุปกรณ์, หรือสูตรลัดต่างๆ รวมอยู่ที่นี่หมดแล้ว <br/>
                        <span className="text-yellow-300 font-bold">"อ่านเอง นักเลงพอ!"</span> 😎
                    </p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
                    <BookOpen className="w-32 h-32" />
                </div>
            </div>

            {/* Markdown Cheatsheet */}
            <section className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-slate-700">สูตรโกงการเขียน (Markdown Tips) ✍️</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-mono font-bold">#</div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">หัวข้อใหญ่ (Header)</p>
                            <p className="text-[10px] text-gray-500 font-mono"># หัวข้อใหญ่มาก<br/>## หัวข้อรองลงมา</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-mono font-bold">-</div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">รายการ (List)</p>
                            <p className="text-[10px] text-gray-500 font-mono">- รายการที่ 1<br/>- รายการที่ 2</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-mono font-bold">B</div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">ตัวหนา (Bold)</p>
                            <p className="text-[10px] text-gray-500 font-mono">**ข้อความตัวหนา**</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                            <ImageIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">รูปภาพ (Image)</p>
                            <p className="text-[10px] text-gray-500 font-mono">![คำอธิบาย](URL รูป)</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Navigation Tips */}
            <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-cyan-500" /> เทคนิคการหาของ
                </h3>
                <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg shrink-0">
                            <Pin className="w-4 h-4" />
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-700 text-sm">Pinned Articles</h5>
                            <p className="text-xs text-gray-500">เรื่องสำคัญๆ แอดมินจะปักหมุดไว้ด้านบนสุดเสมอ สังเกตป้าย Pinned สีเหลืองไว้นะ</p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <div className="p-2 bg-pink-100 text-pink-600 rounded-lg shrink-0">
                            <Heart className="w-4 h-4" />
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-700 text-sm">Helpful Votes</h5>
                            <p className="text-xs text-gray-500">บทความไหนดี บทความไหนโดน กดปุ่ม "เป็นประโยชน์" ให้กำลังใจคนเขียนได้นะ</p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                            <List className="w-4 h-4" />
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-700 text-sm">Table of Contents</h5>
                            <p className="text-xs text-gray-500">บทความยาวเหยียด? ไม่ต้องกลัว! บนจอคอมฯ จะมีสารบัญด้านขวา กดข้ามไปอ่านหัวข้อที่ต้องการได้เลย</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default WikiGuide;
