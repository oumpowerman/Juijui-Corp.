
import React from 'react';
import { Terminal, Cpu, Share2 } from 'lucide-react';

const GuideHeader: React.FC = () => {
    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-slate-200 relative overflow-hidden mb-10 group">
            {/* Animated Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rose-600/10 rounded-full blur-[80px] -ml-10 -mb-10 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-end gap-6 mb-6">
                    <div className="p-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-inner w-fit">
                        <Terminal className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                                Developer Documentation
                            </span>
                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                                v2.5.0 (Stable)
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white mb-2">
                            System Logic <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">& Architecture</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
                            คัมภีร์เจาะลึกการทำงานของระบบ Juijui Planner <br/>
                            <span className="text-slate-500 text-base">เข้าใจกลไกเบื้องหลัง เพื่อการบริหารจัดการที่แม่นยำและมีประสิทธิภาพสูงสุด</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
                    <div className="flex items-start gap-3">
                        <Cpu className="w-5 h-5 text-indigo-400 mt-1" />
                        <div>
                            <h4 className="text-sm font-bold text-slate-200">Real-time Engine</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                ระบบทำงานแบบ Event-driven ข้อมูลอัปเดตทันทีเมื่อมีการเปลี่ยนแปลง ไม่ต้อง refresh หน้าจอ
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Share2 className="w-5 h-5 text-rose-400 mt-1" />
                        <div>
                            <h4 className="text-sm font-bold text-slate-200">Shared Context</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                ข้อมูลทั้งหมดเชื่อมโยงกัน (Tasks, Inventory, Users) การแก้ไขที่หนึ่งจะส่งผลกระทบทั้งระบบ
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideHeader;
