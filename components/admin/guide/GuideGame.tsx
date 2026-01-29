
import React from 'react';
import { Trophy, Target, Heart, ScanEye, ArrowRight } from 'lucide-react';

const GuideGame: React.FC = () => {
    return (
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
    );
};

export default GuideGame;
