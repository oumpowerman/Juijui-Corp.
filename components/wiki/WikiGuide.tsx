
import React from 'react';
import { BookOpen, Hash, List, Image as ImageIcon, Search, Heart, Sparkles, Pin } from 'lucide-react';

const WikiGuide: React.FC = () => {
    return (
        <div className="space-y-10 font-sans">
            
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white p-8 rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(6,182,212,0.3)] relative overflow-hidden border border-white/20 group">
                <div className="relative z-10">
                    <h4 className="text-2xl font-bold mb-3 flex items-center gap-3">
                        <span className="text-3xl group-hover:scale-125 transition-transform duration-500 inline-block">📚</span> Wiki Library คือไรอ่ะ?
                    </h4>
                    <p className="text-cyan-50 leading-relaxed font-bold opacity-90 text-lg">
                        คลังสมบัติของทีม! ไม่ต้องถามพี่เลี้ยงซ้ำๆ อีกต่อไป <br/>
                        คู่มือรับน้อง, วิธีใช้อุปกรณ์, หรือสูตรลัดต่างๆ รวมอยู่ที่นี่หมดแล้ว <br/>
                        <span className="text-yellow-300 font-bold drop-shadow-sm">"อ่านเอง นักเลงพอ!"</span> 😎
                    </p>
                </div>
                <div className="absolute right-[-30px] bottom-[-30px] opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                    <BookOpen className="w-48 h-48" />
                </div>
            </div>

            {/* Markdown Cheatsheet */}
            <section className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[2.5rem] p-8 relative overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100/80 rounded-xl text-indigo-500 shadow-sm">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-700 text-lg">สูตรโกงการเขียน (Markdown Tips) ✍️</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/80 shadow-sm flex items-center gap-4 hover:bg-white hover:shadow-md transition-all">
                        <div className="w-10 h-10 bg-slate-100/80 rounded-xl flex items-center justify-center text-slate-400 font-mono font-bold border border-white/60 shadow-inner">#</div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">หัวข้อใหญ่ (Header)</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5"># หัวข้อใหญ่มาก<br/>## หัวข้อรองลงมา</p>
                        </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/80 shadow-sm flex items-center gap-4 hover:bg-white hover:shadow-md transition-all">
                        <div className="w-10 h-10 bg-slate-100/80 rounded-xl flex items-center justify-center text-slate-400 font-mono font-bold border border-white/60 shadow-inner">-</div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">รายการ (List)</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">- รายการที่ 1<br/>- รายการที่ 2</p>
                        </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/80 shadow-sm flex items-center gap-4 hover:bg-white hover:shadow-md transition-all">
                        <div className="w-10 h-10 bg-slate-100/80 rounded-xl flex items-center justify-center text-slate-400 font-mono font-bold border border-white/60 shadow-inner">B</div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">ตัวหนา (Bold)</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">**ข้อความตัวหนา**</p>
                        </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/80 shadow-sm flex items-center gap-4 hover:bg-white hover:shadow-md transition-all">
                        <div className="w-10 h-10 bg-slate-100/80 rounded-xl flex items-center justify-center text-slate-400 border border-white/60 shadow-inner">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">รูปภาพ (Image)</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">![คำอธิบาย](URL รูป)</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Navigation Tips */}
            <section className="px-4">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-cyan-100/80 rounded-xl text-cyan-500 shadow-sm">
                        <Search className="w-5 h-5" />
                    </div>
                    เทคนิคการหาของ
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-5 items-start group">
                        <div className="p-3 bg-yellow-100/80 text-yellow-600 rounded-2xl shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all border border-white/60">
                            <Pin className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="font-bold text-slate-700 text-base mb-1">Pinned Articles</h5>
                            <p className="text-xs text-slate-400 font-bold leading-relaxed opacity-80">เรื่องสำคัญๆ แอดมินจะปักหมุดไว้ด้านบนสุดเสมอ สังเกตป้าย Pinned สีเหลืองไว้นะ</p>
                        </div>
                    </div>

                    <div className="flex gap-5 items-start group">
                        <div className="p-3 bg-pink-100/80 text-pink-500 rounded-2xl shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all border border-white/60">
                            <Heart className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="font-bold text-slate-700 text-base mb-1">Helpful Votes</h5>
                            <p className="text-xs text-slate-400 font-bold leading-relaxed opacity-80">บทความไหนดี บทความไหนโดน กดปุ่ม "เป็นประโยชน์" ให้กำลังใจคนเขียนได้นะ</p>
                        </div>
                    </div>

                    <div className="flex gap-5 items-start group">
                        <div className="p-3 bg-indigo-100/80 text-indigo-500 rounded-2xl shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all border border-white/60">
                            <List className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="font-bold text-slate-700 text-base mb-1">Table of Contents</h5>
                            <p className="text-xs text-slate-400 font-bold leading-relaxed opacity-80">บทความยาวเหยียด? ไม่ต้องกลัว! บนจอคอมฯ จะมีสารบัญด้านขวา กดข้ามไปอ่านหัวข้อที่ต้องการได้เลย</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default WikiGuide;
