import React from 'react';
import { Building2, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompanyHeaderBannerProps {
    activeCount: number;
    totalCount: number;
    onOpenAdd: () => void;
}

export const CompanyHeaderBanner: React.FC<CompanyHeaderBannerProps> = ({
    activeCount,
    totalCount,
    onOpenAdd,
}) => {
    const isMultiCompany = activeCount > 1;

    return (
        <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200"
        >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold text-gray-800">จัดการบริษัทในเครือ (Affiliated Companies)</h2>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">
                                SaaS Multi-Company
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            กำหนดรายชื่อบริษัท, รหัสย่อ (Badge Code), และธีมสีสำหรับแสดงผลในระบบเข้างาน Timesheet และสิทธิ์ใบลา
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onOpenAdd}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มบริษัทใหม่</span>
                </button>
            </div>

            {/* Smart Mode Status Banner */}
            <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`mt-5 p-4 rounded-2xl border transition-all ${
                    isMultiCompany 
                        ? 'bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/80 border-indigo-200/80 text-indigo-900' 
                        : 'bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-slate-200 text-slate-700'
                }`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                            isMultiCompany ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-current shadow-xs">
                                    {isMultiCompany ? '🌐 Multi-Company Mode (เปิดใช้งานหลายบริษัท)' : '🏢 Single Company Mode (บริษัทเดี่ยว)'}
                                </span>
                                <span className="text-xs font-bold text-gray-500">
                                    • มีบริษัทที่เปิดใช้งาน {activeCount} จาก {totalCount} บริษัท
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                {isMultiCompany 
                                    ? 'ระบบจะแสดง Badge สังกัดบริษัท, ตัวกรองบริษัทใน Timesheet / Dashboard / ใบลา และตัวเลือกในหน้าสมัครสมาชิกโดยอัตโนมัติ' 
                                    : 'ระบบจะซ่อน Badge และตัวกรองบริษัททั้งหมดโดยอัตโนมัติ เพื่อ UI ที่คลีน เรียบง่าย สำหรับองค์กรเดี่ยว (หากเพิ่มหรือเปิดใช้งานมากกว่า 1 บริษัท ระบบจะเปิด Multi-Company ให้ทันที)'}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CompanyHeaderBanner;
