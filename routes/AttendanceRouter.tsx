
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import AttendanceWidget from '../components/attendance/AttendanceWidget';
import AttendanceHistory from '../components/attendance/AttendanceHistory'; 
import AdminAttendanceDashboard from '../components/attendance/AdminAttendanceDashboard'; 
import AdminWeeklyTimesheet from '../components/attendance/AdminWeeklyTimesheet'; 
import LeaveApprovalList from '../components/attendance/LeaveApprovalList'; 
import LeaveQuotaModal from '../components/attendance/LeaveQuotaModal'; 
import AttendanceInfoCard from '../components/attendance/AttendanceInfoCard'; 
import { useAttendance } from '../hooks/useAttendance'; 
import { useLeaveRequests } from '../hooks/useLeaveRequests'; 
import MentorTip from '../components/MentorTip';
import { Clock, Calendar, PieChart, FileCheck, TableProperties } from 'lucide-react';

interface AttendanceRouterProps {
    currentUser: User;
    users: User[]; 
}

type AttendanceTab = 'CHECK_IN' | 'HISTORY' | 'TIMESHEET' | 'REPORT' | 'APPROVALS';

const AttendanceRouter: React.FC<AttendanceRouterProps> = ({ currentUser, users }) => {
    const [currentTab, setCurrentTab] = useState<AttendanceTab>('CHECK_IN');
    const [isQuotaOpen, setIsQuotaOpen] = useState(false); 
    
    // Hooks
    const { stats } = useAttendance(currentUser.id);
    // Lift state up: Fetch all requests here so we can pass actions to child
    const { requests, leaveUsage, isLoading: isRequestsLoading, approveRequest, rejectRequest } = useLeaveRequests(currentUser);
    
    // Admin pending count (for approval list badge)
    const adminPendingCount = useMemo(() => requests.filter(r => r.status === 'PENDING').length, [requests]);
    
    // My personal pending count (for history badge)
    const myPendingCount = useMemo(() => 
        requests.filter(r => r.userId === currentUser.id && r.status === 'PENDING').length, 
    [requests, currentUser.id]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="blue" messages={[
                "อย่าลืมกด Check-in เมื่อเริ่มงาน และ Check-out ก่อนกลับบ้านนะ!",
                "เช็คโควตาวันลาคงเหลือได้ที่ปุ่ม 'โควต้า' ด้านบน",
                "ถ้าป่วยหรือมีเหตุฉุกเฉิน แจ้งผ่านปุ่ม 'แจ้งลา' ได้เลย"
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center tracking-tight">
                        <span className="text-4xl mr-2">⏱️</span>
                        ระบบลงเวลา (Time Tracking)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">บันทึกเวลาเข้า-ออกงาน และตรวจสอบประวัติ</p>
                </div>
            </div>

            {/* Navigation Tabs & Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex p-1 bg-white rounded-xl border border-gray-200 w-fit overflow-x-auto scrollbar-hide">
                    <button 
                        onClick={() => setCurrentTab('CHECK_IN')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'CHECK_IN' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Clock className="w-4 h-4" /> ลงเวลา
                    </button>
                    
                    <button 
                        onClick={() => setCurrentTab('HISTORY')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap relative ${currentTab === 'HISTORY' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Calendar className="w-4 h-4" /> ประวัติ
                        {myPendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce shadow-sm ring-2 ring-white">
                                {myPendingCount}
                            </span>
                        )}
                    </button>

                    {/* Only Admin see these tabs */}
                    {currentUser.role === 'ADMIN' && (
                        <>
                            <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                            <button 
                                onClick={() => setCurrentTab('TIMESHEET')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'TIMESHEET' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <TableProperties className="w-4 h-4" /> ตรวจสอบทีม
                            </button>
                            <button 
                                onClick={() => setCurrentTab('APPROVALS')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap relative ${currentTab === 'APPROVALS' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FileCheck className="w-4 h-4" /> คำขออนุมัติ
                                {adminPendingCount > 0 && (
                                    <span className="ml-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                                        {adminPendingCount}
                                    </span>
                                )}
                            </button>
                            <button 
                                onClick={() => setCurrentTab('REPORT')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'REPORT' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <PieChart className="w-4 h-4" /> สรุปผลรายเดือน
                            </button>
                        </>
                    )}
                </div>

                {/* Quota Button (Trigger) */}
                <button
                    onClick={() => setIsQuotaOpen(true)}
                    className="ml-auto md:ml-0 px-4 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 text-gray-500 hover:text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                    <PieChart className="w-4 h-4" /> เช็คโควต้า (My Quota)
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {currentTab === 'CHECK_IN' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                         {/* Left: Action Card */}
                         <div className="space-y-6">
                             <AttendanceWidget user={currentUser} />
                         </div>

                         {/* Right: Info */}
                         <div className="space-y-6 hidden xl:block">
                             <AttendanceInfoCard />
                         </div>
                    </div>
                )}

                {currentTab === 'HISTORY' && (
                    <AttendanceHistory 
                        userId={currentUser.id}
                    />
                )}

                {currentTab === 'TIMESHEET' && currentUser.role === 'ADMIN' && (
                    <AdminWeeklyTimesheet users={users} />
                )}
                
                {currentTab === 'APPROVALS' && currentUser.role === 'ADMIN' && (
                    <LeaveApprovalList 
                        requests={requests}
                        isLoading={isRequestsLoading}
                        onApprove={approveRequest}
                        onReject={rejectRequest}
                    />
                )}

                {currentTab === 'REPORT' && currentUser.role === 'ADMIN' && (
                    <AdminAttendanceDashboard users={users} />
                )}
            </div>

            {/* Quota Modal */}
            <LeaveQuotaModal 
                isOpen={isQuotaOpen}
                onClose={() => setIsQuotaOpen(false)}
                leaveUsage={leaveUsage}
                onHistoryClick={() => {
                    setCurrentTab('HISTORY');
                    setIsQuotaOpen(false);
                }}
            />
        </div>
    );
};

export default AttendanceRouter;
