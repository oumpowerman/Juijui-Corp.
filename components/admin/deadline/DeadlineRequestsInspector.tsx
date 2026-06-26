import React, { useState } from 'react';
import { DeadlineRequest } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SlidersHorizontal, CalendarDays, AlertCircle, FileText, Sparkles 
} from 'lucide-react';
import DatePickerModal, { formatDisplayDate } from '../../ui/DatePickerModal';

interface DeadlineRequestsInspectorProps {
    selectedReq: DeadlineRequest | null;
    insights: {
        requester: any;
        activeTasks: any[];
        parentTask: any;
        diffDays: number;
        workloadRank: string;
    } | null;
    customDate: string;
    setCustomDate: (val: string) => void;
    isProcessingBatch: boolean;
    rejectionTemplates: string[];
    handleCustomApprove: (req: DeadlineRequest) => void;
    handleRejectWithTemplate: (req: DeadlineRequest, tpl: string) => void;
    setSelectedReq: (req: DeadlineRequest | null) => void;
    handleResolve: (requestId: string, taskId: string, isApproved: boolean, targetDate: Date) => void;
}

const DeadlineRequestsInspector: React.FC<DeadlineRequestsInspectorProps> = ({
    selectedReq,
    insights,
    customDate,
    setCustomDate,
    isProcessingBatch,
    rejectionTemplates,
    handleCustomApprove,
    handleRejectWithTemplate,
    setSelectedReq,
    handleResolve
}) => {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    return (
        <div className="lg:col-span-7 bg-slate-50 p-6 overflow-y-auto flex flex-col justify-between text-left">
            <AnimatePresence mode="wait">
                {!selectedReq ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="flex-1 flex flex-col items-center justify-center text-center p-8 mt-12"
                    >
                        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                            <SlidersHorizontal className="w-6 h-6" />
                        </div>
                        <h3 className="text-xs text-slate-700 font-bold">เลือกคำร้องขอเพื่อถอดสัญญารูปแบบภาระงาน</h3>
                        <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-relaxed">
                            ระบบจะคำนวณเวิร์กโหลดพายโมเดลทันที เพื่อให้แอดมินใช้ดุลยพินิจประกอบเหตุผลการยืดหยุ่นที่เกิดประสิทธิภาพทีมสูงสุด
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={selectedReq.id}
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.12 }}
                        className="flex-1 flex flex-col space-y-5 text-left"
                    >
                        {/* Inspected employee top heading detail */}
                        <div className="flex items-start justify-between gap-4 border-b pb-4 border-slate-200">
                            <div className="flex items-center gap-3">
                                {insights?.requester?.avatarUrl ? (
                                    <img 
                                        src={insights.requester.avatarUrl} 
                                        alt={insights.requester.name} 
                                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-base">
                                        {selectedReq.user?.name?.charAt(0) || '?'}
                                    </div>
                                )}
                                <div className="text-left">
                                    <h3 className="text-xs text-slate-900 font-bold">{selectedReq.user?.name || 'พนักงานในระบบ'}</h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        ระดับผู้มีอิทธิพล: <strong className="text-slate-600">{insights?.requester?.position || 'Creative'}</strong> • เลเวล {insights?.requester?.level || 1} ({insights?.requester?.xp || 0} XP)
                                    </p>
                                </div>
                            </div>

                            <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold ${
                                insights?.diffDays && insights.diffDays >= 7 
                                    ? 'bg-amber-100 text-amber-700' 
                                    : 'bg-indigo-100 text-indigo-700'
                            }`}>
                                <CalendarDays className="w-3.5 h-3.5" /> ยื่นยืดระยะ {insights?.diffDays || 0} วัน
                            </span>
                        </div>

                        {/* Primary and secondary project content panel */}
                        <div className="bg-white border rounded-2xl p-4 space-y-2 shadow-2xs text-left">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded-lg">งานต้นเรื่องคำร้อง</span>
                                <span className="text-slate-400">ปิดกำหนดเดิม: {insights?.parentTask ? new Date(insights.parentTask.endDate).toLocaleDateString('th-TH') : '?'}</span>
                            </div>
                            <h4 className="text-xs text-slate-800 text-left font-bold">{(selectedReq as any).taskTitle || 'ไม่พบคอมโพเนนต์งานคู่ตัว'}</h4>
                            <div className="inline-flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md font-bold">
                                📅 เดดไลน์พนักงานระบุขอ: {selectedReq.newDeadline.toLocaleDateString('th-TH')}
                            </div>
                        </div>

                        {/* Active Workload snapshot */}
                        <div className="bg-white border rounded-2xl p-4 space-y-3.5 shadow-2xs text-left">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[11px] text-slate-800 flex items-center gap-1.5 justify-start font-bold">
                                    <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
                                    การวิเคราะห์ความหนาแน่นภาระพนักงาน (Workload Status)
                                </h4>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                    insights?.activeTasks?.length && insights.activeTasks.length >= 3 
                                        ? 'bg-rose-100 text-rose-700 animate-pulse' 
                                        : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {insights?.workloadRank}
                                </span>
                            </div>

                            {insights?.activeTasks && insights.activeTasks.length > 0 ? (
                                <div className="space-y-2 text-left">
                                    <p className="text-[10px] text-slate-400">กำลังรับผิดชอบงานประเภทอื่นรวมอยู่ <strong className="text-slate-700">{insights.activeTasks.length} รายการ</strong> ในระยะฉายเดี่ยวนี้:</p>
                                    <div className="divide-y divide-slate-100 max-h-[100px] overflow-y-auto pr-1">
                                        {insights.activeTasks.map(t => (
                                            <div key={t.id} className="py-1.5 flex justify-between items-center gap-1.5 text-[9px] text-left">
                                                <span className="text-slate-600 truncate flex-1 font-medium" style={{ fontWeight: 700 }}>📌 {t.title}</span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-150 rounded text-slate-400">{t.status}</span>
                                                    <span className="text-slate-400">{new Date(t.endDate).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] text-slate-400 italic text-left">
                                    ✨ เคลียร์โหลดเสร็จสิ้นหมดแล้ว! ตอนนี้ไม่มีภาระงานย่อยบีบเลื่อนตัวอื่น มีแรงกึ่งงานนี้สูงสุด
                                </p>
                            )}
                        </div>

                        {/* Justification details text block */}
                        <div className="space-y-1.5 text-left">
                            <h4 className="text-[11px] text-slate-500 flex items-center gap-1 font-bold">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                ข้อความชี้แจงพิจารณาจากพนักงาน
                            </h4>
                            <div className="bg-white border rounded-2xl p-4 max-h-[110px] overflow-y-auto shadow-2xs text-left">
                                <blockquote className="text-[11.5px] italic text-slate-600 leading-relaxed font-medium">
                                    "{selectedReq.reason || 'ไม่ได้ระบุเหตุผลค้ำชูในใบคำร้องขอเลื่อน'}"
                                </blockquote>
                            </div>
                        </div>

                        {/* Custom Adjust date block */}
                        <div className="border-t pt-4 space-y-3 border-slate-200 text-left">
                            <div className="bg-indigo-50 hover:bg-indigo-100 p-3 rounded-2xl border border-indigo-200 flex flex-col md:flex-row items-center justify-between gap-2.5 transition-colors">
                                <div className="text-left">
                                    <h5 className="text-[11px] text-indigo-950 flex items-center gap-1 font-bold">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                        ปรับสิทธิยืดระยะทางเลือก
                                    </h5>
                                    <p className="text-[9px] text-indigo-400 mt-0.5">ระบุความเหมาะสมใหม่เป็นกรณีพิเศษ เพื่อความลื่นไหลในโปรดักชัน</p>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end md:justify-start">
                                    <button 
                                        type="button"
                                        onClick={() => setIsDatePickerOpen(true)}
                                        className="px-2.5 py-1.5 border border-indigo-200 rounded-xl text-[11px] bg-white text-indigo-900 font-bold hover:bg-indigo-50/50 transition-all flex items-center justify-between gap-1"
                                    >
                                        <span>{formatDisplayDate(customDate)}</span>
                                        <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                                    </button>

                                    <DatePickerModal
                                        isOpen={isDatePickerOpen}
                                        onClose={() => setIsDatePickerOpen(false)}
                                        selectedDate={customDate ? new Date(customDate) : undefined}
                                        onSelect={(date) => {
                                            if (date) {
                                                setCustomDate(date.toISOString().split('T')[0]);
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={() => handleCustomApprove(selectedReq)}
                                        disabled={isProcessingBatch}
                                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] shrink-0 transition-colors font-bold"
                                    >
                                        ล็อกตัวเลือกดัดแปลงนี้
                                    </button>
                                </div>
                            </div>

                            {/* Fast Reject quick blocks */}
                            <div className="space-y-1.5 text-left">
                                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">แม่พิมพ์ส่งกลับปฏิเสธพร้อมคำอธิบาย (Quick Feedback Rejection)</span>
                                <div className="flex flex-wrap gap-1 text-left">
                                    {rejectionTemplates.map((tpl, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handleRejectWithTemplate(selectedReq, tpl)}
                                            disabled={isProcessingBatch}
                                            className="px-2 py-1 bg-white hover:bg-rose-50 border text-[9px] text-slate-500 hover:text-rose-600 hover:border-rose-100 rounded-lg text-left truncate max-w-xs transition-colors"
                                        >
                                            ❌ {tpl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interactive footer action indicators */}
            {selectedReq && (
                <div className="flex items-center justify-between gap-4 border-t pt-4 mt-4 shrink-0">
                    <button
                        onClick={() => setSelectedReq(null)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] text-slate-500 hover:text-slate-800 transition-colors font-bold"
                    >
                        ย่นการตริตรอง
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleResolve(selectedReq.id, selectedReq.taskId, false, selectedReq.newDeadline)}
                            disabled={isProcessingBatch}
                            className="px-4 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] transition-colors font-bold"
                        >
                            ปฏิเสธคำหลัก
                        </button>
                        <button
                            onClick={() => handleResolve(selectedReq.id, selectedReq.taskId, true, selectedReq.newDeadline)}
                            disabled={isProcessingBatch}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] transition-colors shadow-xs font-bold"
                        >
                            อนุมัติตามเดดไลน์ร้องขอ
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeadlineRequestsInspector;
