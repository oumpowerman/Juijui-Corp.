
import React from 'react';
import { FileText, Lock, Share2 } from 'lucide-react';

const GuideScript: React.FC = () => {
    return (
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
    );
};

export default GuideScript;
