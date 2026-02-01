
import React from 'react';
import { Trophy, Target, Heart, ScanEye, ArrowRight, Zap, Coins, Calculator } from 'lucide-react';

const GuideGame: React.FC = () => {
    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Header / Intro */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-purple-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[50%] pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                        <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gamification Engine</h2>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            เปลี่ยนการทำงานให้เป็นเกม! สะสมแต้ม แลกของรางวัล และรักษาวินัย
                        </p>
                    </div>
                </div>
            </div>

            {/* XP Calculator Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-[2.5rem] border border-yellow-200 shadow-sm relative overflow-hidden">
                    <h3 className="text-xl font-black text-yellow-800 mb-6 flex items-center">
                        <Calculator className="w-6 h-6 mr-2" /> XP Formula
                    </h3>
                    
                    {/* Visual Equation */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white/80 p-4 rounded-2xl border border-yellow-200 flex justify-between items-center shadow-sm">
                            <div>
                                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">Base Difficulty</span>
                                <p className="text-sm font-medium text-slate-600 mt-1">ความยากง่ายของงาน</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-black text-yellow-500">100</span>
                                <span className="text-[10px] text-slate-400">XP (Medium)</span>
                            </div>
                        </div>

                        <div className="flex justify-center text-yellow-400"><span className="text-2xl font-black">+</span></div>

                        <div className="bg-white/80 p-4 rounded-2xl border border-yellow-200 flex justify-between items-center shadow-sm">
                            <div>
                                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">Time Effort</span>
                                <p className="text-sm font-medium text-slate-600 mt-1">ชั่วโมงทำงาน x 20</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-black text-yellow-500">40</span>
                                <span className="text-[10px] text-slate-400">XP (2 Hrs)</span>
                            </div>
                        </div>

                        <div className="flex justify-center text-yellow-400"><span className="text-2xl font-black">+</span></div>

                        <div className="bg-white/80 p-4 rounded-2xl border border-yellow-200 flex justify-between items-center shadow-sm">
                            <div>
                                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">Bonus</span>
                                <p className="text-sm font-medium text-slate-600 mt-1">ส่งก่อนกำหนด / งานคุณภาพ</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-black text-yellow-500">50</span>
                                <span className="text-[10px] text-slate-400">XP</span>
                            </div>
                        </div>
                        
                        <div className="border-t-2 border-yellow-300 border-dashed my-2"></div>
                        
                        <div className="flex justify-between items-center px-4">
                            <span className="font-black text-xl text-yellow-800">Total Reward</span>
                            <span className="font-black text-4xl text-yellow-600 shadow-yellow-200 drop-shadow-sm">190 XP</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* HP Mechanics */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                            <Heart className="w-6 h-6 mr-2 text-red-500 fill-red-500" /> 
                            Health Points (HP) Logic
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                            ระบบ "The Judge" (AI) จะทำงานทุกเที่ยงคืน เพื่อตรวจสอบความผิดปกติ
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                <span className="text-sm font-bold text-red-700">ส่งงานช้า (Overdue)</span>
                                <span className="text-sm font-black text-red-600">-5 HP / วัน</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                <span className="text-sm font-bold text-red-700">โดดเวร (Missed Duty)</span>
                                <span className="text-sm font-black text-red-600">-10 HP ทันที</span>
                            </div>
                        </div>
                    </div>

                    {/* Leveling */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                            <Zap className="w-6 h-6 mr-2 text-indigo-500 fill-indigo-500" /> 
                            Level Up & Coins
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 w-3/4 h-full rounded-full"></div>
                            </div>
                            <span className="text-xs font-bold text-slate-500">750/1000 XP</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                            ทุกๆ 1,000 XP จะเลื่อนระดับ (Level Up) <br/>
                            <span className="text-indigo-600 font-bold">Bonus:</span> รับทันที <Coins className="w-3 h-3 inline text-yellow-500 mx-1"/> 500 Coins เมื่ออัปเลเวล
                        </p>
                    </div>
                </div>
            </div>

            {/* Workflow Diagram */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center">
                    <ScanEye className="w-6 h-6 mr-2 text-slate-600" />
                    Quality Gate Flow
                </h3>
                
                <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 px-4 md:px-10">
                    {/* Line Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 hidden md:block"></div>

                    {/* Step 1 */}
                    <div className="flex flex-col items-center bg-white p-2">
                        <div className="w-12 h-12 bg-white border-4 border-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold mb-2 z-10">1</div>
                        <span className="text-sm font-bold text-slate-700">Submit</span>
                        <span className="text-xs text-slate-400">ส่งงานเข้า QC</span>
                    </div>

                    <ArrowRight className="w-6 h-6 text-slate-300 md:hidden" />

                    {/* Step 2 */}
                    <div className="flex flex-col items-center bg-white p-2">
                        <div className="w-12 h-12 bg-white border-4 border-orange-200 rounded-full flex items-center justify-center text-orange-500 font-bold mb-2 z-10">2</div>
                        <span className="text-sm font-bold text-orange-600">Review</span>
                        <span className="text-xs text-slate-400">หัวหน้าตรวจ</span>
                    </div>

                    <ArrowRight className="w-6 h-6 text-slate-300 md:hidden" />

                    {/* Step 3 */}
                    <div className="flex flex-col items-center bg-white p-2">
                        <div className="w-12 h-12 bg-green-500 border-4 border-green-200 rounded-full flex items-center justify-center text-white font-bold mb-2 z-10 shadow-lg shadow-green-200">3</div>
                        <span className="text-sm font-bold text-green-600">Pass!</span>
                        <span className="text-xs text-slate-400">รับ XP ทันที</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default GuideGame;
