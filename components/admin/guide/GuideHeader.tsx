
import React from 'react';
import { Terminal } from 'lucide-react';

const GuideHeader: React.FC = () => {
    return (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner">
                        <Terminal className="w-8 h-8 text-cyan-300" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight leading-none">System Logic & Architecture</h1>
                        <p className="text-slate-400 text-xs font-mono mt-1">v2.1.0 • Detailed Documentation</p>
                    </div>
                </div>
                <p className="text-slate-300 max-w-3xl text-lg font-light leading-relaxed">
                    คู่มือเจาะลึกกลไกการทำงานของระบบ (Deep Dive) <br/>
                    อธิบาย Logic เบื้องหลังที่ User ทั่วไปมองไม่เห็น เพื่อให้ Admin บริหารจัดการได้อย่างมีประสิทธิภาพสูงสุด
                </p>
            </div>
        </div>
    );
};

export default GuideHeader;
