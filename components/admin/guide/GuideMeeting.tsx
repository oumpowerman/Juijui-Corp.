
import React from 'react';
import { MessageSquare } from 'lucide-react';

const GuideMeeting: React.FC = () => {
    return (
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
    );
};

export default GuideMeeting;
