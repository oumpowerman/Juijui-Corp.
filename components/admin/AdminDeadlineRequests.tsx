import React, { useEffect, useState } from 'react';
import { DeadlineRequest, User } from '../../types';
import { useDeadlineRequests } from '../../hooks/useDeadlineRequests';
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useNotificationContext } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminDeadlineRequestsProps {
    currentUser: User;
}

const AdminDeadlineRequests: React.FC<AdminDeadlineRequestsProps> = ({ currentUser }) => {
    const { resolveRequest } = useDeadlineRequests(currentUser);
    const { deadlineRequests: requests, isLoading: isFetching } = useNotificationContext();
    const { showToast } = useToast();
    
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);

    // Filter out any selected IDs that are no longer in the active requests list (e.g. resolved elsewhere or by other actions)
    useEffect(() => {
        setSelectedIds(prev => prev.filter(id => requests.some(r => r.id === id)));
    }, [requests]);

    const handleResolve = async (requestId: string, taskId: string, isApproved: boolean, newDate: Date) => {
        // Background API Call
        const { success, error } = await resolveRequest(requestId, taskId, isApproved, newDate);
        
        if (success) {
            showToast(isApproved ? 'อนุมัติการเลื่อน Deadline แล้ว' : 'ปฏิเสธคำขอแล้ว', 'success');
        } else {
            showToast('เกิดข้อผิดพลาด: ' + error, 'error');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id) 
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === requests.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(requests.map(r => r.id));
        }
    };

    const handleBatchResolve = async (isApproved: boolean) => {
        if (selectedIds.length === 0) return;
        setIsProcessingBatch(true);
        let successCount = 0;
        let failCount = 0;

        // Collect matching requests
        const selectedRequests = requests.filter(r => selectedIds.includes(r.id));

        // Let's resolve concurrently with Promise.all to make it blazing fast!
        try {
            const results = await Promise.all(
                selectedRequests.map(async (req) => {
                    const { success } = await resolveRequest(req.id, req.taskId, isApproved, req.newDeadline);
                    return success;
                })
            );
            successCount = results.filter(r => r === true).length;
            failCount = results.length - successCount;
        } catch (e) {
            console.error("Batch processing error:", e);
            failCount = selectedRequests.length;
        }

        setIsProcessingBatch(false);
        setSelectedIds([]);

        if (successCount > 0) {
            showToast(isApproved 
                ? `อนุมัติคำขอสำเร็จแล้ว ${successCount} รายการ` 
                : `ปฏิเสธคำขอสำเร็จแล้ว ${successCount} รายการ`, 'success');
        }
        if (failCount > 0) {
            showToast(`เกิดข้อผิดพลาด ${failCount} รายการ`, 'error');
        }
    };

    if (currentUser.role !== 'ADMIN') return null;

    if (isFetching && requests.length === 0) {
        return <div className="p-4 text-center text-gray-500 text-sm animate-pulse">กำลังโหลดคำขอ...</div>;
    }

    if (requests.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">ไม่มีคำขอเลื่อน Deadline</h3>
                <p className="text-xs text-gray-500 mt-1">ทีมงานทำงานได้ตามกำหนดเวลาทั้งหมด</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative pb-16">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    คำขอเลื่อน Deadline
                    <span className="bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {requests.length}
                    </span>
                </h2>
            </div>

            {/* Selection Toolbar */}
            <div className="flex items-center justify-between bg-indigo-50/50 px-4 py-2.5 rounded-xl border border-indigo-100/40 text-xs animate-fadeIn">
                <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-1.5 text-indigo-700 font-semibold hover:text-indigo-950 transition-colors focus:outline-none"
                >
                    {selectedIds.length === requests.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                        <Square className="w-4 h-4 text-indigo-400" />
                    )}
                    {selectedIds.length === requests.length ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกคำขอทั้งหมด'}
                </button>
                <span className="text-gray-500 font-medium">เลือกแล้ว {selectedIds.length} จาก {requests.length} รายการ</span>
            </div>

            <div className="grid gap-4">
                {requests.map((req) => {
                    const isSelected = selectedIds.includes(req.id);
                    return (
                        <div 
                            key={req.id} 
                            className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
                                isSelected ? 'border-indigo-400 ring-2 ring-indigo-50 bg-indigo-50/10' : 'border-indigo-100'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    {/* Inline Checkbox */}
                                    <button 
                                        onClick={() => toggleSelect(req.id)}
                                        className="mt-1 shrink-0 text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                        )}
                                    </button>

                                    {req.user?.avatarUrl ? (
                                        <img src={req.user.avatarUrl} alt={req.user.name} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-50 shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                                            {req.user?.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 truncate">
                                            {req.user?.name || 'Unknown User'} <span className="text-gray-500 font-normal">ขอเลื่อนงาน</span>
                                        </h4>
                                        <p className="text-sm text-indigo-600 font-semibold mt-0.5 truncate">
                                            {(req as any).taskTitle || 'Unknown Task'}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            <span>ขอเลื่อนเป็น: <strong className="text-rose-600">{req.newDeadline.toLocaleDateString('th-TH')}</strong></span>
                                        </div>
                                        
                                        <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-700 italic break-words">"{req.reason}"</p>
                                        </div>
                                        
                                        <div className="mt-2 text-[10px] text-gray-400">
                                            ส่งคำขอเมื่อ: {req.createdAt.toLocaleString('th-TH')}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col gap-2 shrink-0 sm:self-start">
                                    <button 
                                        onClick={() => handleResolve(req.id, req.taskId, true, req.newDeadline)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4" /> อนุมัติ
                                    </button>
                                    <button 
                                        onClick={() => handleResolve(req.id, req.taskId, false, req.newDeadline)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" /> ปฏิเสธ
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating Action Drawer for Bulk Actions */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0, x: '-50%' }}
                        animate={{ y: 0, opacity: 1, x: '-50%' }}
                        exit={{ y: 80, opacity: 0, x: '-50%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="fixed bottom-6 left-1/2 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-50 w-[95%] max-w-xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-400 text-sm">
                                {selectedIds.length}
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">จัดการข้อมูลร่วมกัน</h4>
                                <p className="text-[10px] text-slate-400">สำหรับคำขอเลื่อน Deadline {selectedIds.length} รายการที่เลือก</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 justify-end">
                            <button
                                disabled={isProcessingBatch}
                                onClick={() => handleBatchResolve(false)}
                                className="flex items-center justify-center gap-1.5 px-4 b-2 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-400 border border-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                <XCircle className="w-4 h-4" /> ปฏิเสธทั้งหมด
                            </button>
                            <button
                                disabled={isProcessingBatch}
                                onClick={() => handleBatchResolve(true)}
                                className="flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                            >
                                <CheckCircle className="w-4 h-4" /> อนุมัติทั้งหมด
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDeadlineRequests;
