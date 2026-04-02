import React, { useEffect, useState } from 'react';
import { DeadlineRequest, User } from '../../types';
import { useDeadlineRequests } from '../../hooks/useDeadlineRequests';
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useNotificationContext } from '../../context/NotificationContext';

interface AdminDeadlineRequestsProps {
    currentUser: User;
}

const AdminDeadlineRequests: React.FC<AdminDeadlineRequestsProps> = ({ currentUser }) => {
    const { resolveRequest } = useDeadlineRequests(currentUser);
    const { deadlineRequests: requests, isLoading: isFetching } = useNotificationContext();
    const { showToast } = useToast();

    const handleResolve = async (requestId: string, taskId: string, isApproved: boolean, newDate: Date) => {
        // Background API Call
        const { success, error } = await resolveRequest(requestId, taskId, isApproved, newDate);
        
        if (success) {
            showToast(isApproved ? 'อนุมัติการเลื่อน Deadline แล้ว' : 'ปฏิเสธคำขอแล้ว', 'success');
        } else {
            showToast('เกิดข้อผิดพลาด: ' + error, 'error');
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    คำขอเลื่อน Deadline
                    <span className="bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {requests.length}
                    </span>
                </h2>
            </div>

            <div className="grid gap-4">
                {requests.map((req) => (
                    <div key={req.id} className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                {req.user?.avatarUrl ? (
                                    <img src={req.user.avatarUrl} alt={req.user.name} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-50" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                        {req.user?.name?.charAt(0) || '?'}
                                    </div>
                                )}
                                
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">
                                        {req.user?.name || 'Unknown User'} <span className="text-gray-500 font-normal">ขอเลื่อนงาน</span>
                                    </h4>
                                    <p className="text-sm text-indigo-600 font-semibold mt-0.5">
                                        {(req as any).taskTitle || 'Unknown Task'}
                                    </p>
                                    
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        <span>ขอเลื่อนเป็น: <strong className="text-rose-600">{req.newDeadline.toLocaleDateString('th-TH')}</strong></span>
                                    </div>
                                    
                                    <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-700 italic">"{req.reason}"</p>
                                    </div>
                                    
                                    <div className="mt-2 text-[10px] text-gray-400">
                                        ส่งคำขอเมื่อ: {req.createdAt.toLocaleString('th-TH')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex sm:flex-col gap-2 shrink-0">
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
                ))}
            </div>
        </div>
    );
};

export default AdminDeadlineRequests;
