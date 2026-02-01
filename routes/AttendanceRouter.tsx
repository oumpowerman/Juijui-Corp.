
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import AttendanceWidget from '../components/attendance/AttendanceWidget';
import AttendanceHistory from '../components/attendance/AttendanceHistory'; 
import AdminAttendanceDashboard from '../components/attendance/AdminAttendanceDashboard'; 
import LeaveApprovalList from '../components/attendance/LeaveApprovalList'; 
import { useAttendance } from '../hooks/useAttendance'; 
import { useLeaveRequests } from '../hooks/useLeaveRequests'; // Import hook to get count
import MentorTip from '../components/MentorTip';
import { Clock, Calendar, PieChart, FileCheck } from 'lucide-react';

interface AttendanceRouterProps {
    currentUser: User;
    users: User[]; 
}

type AttendanceTab = 'CHECK_IN' | 'HISTORY' | 'REPORT' | 'APPROVALS';

const AttendanceRouter: React.FC<AttendanceRouterProps> = ({ currentUser, users }) => {
    const [currentTab, setCurrentTab] = useState<AttendanceTab>('CHECK_IN');
    
    // Hooks
    const { stats } = useAttendance(currentUser.id);
    // Use this to get pending count for badge
    const { requests } = useLeaveRequests(currentUser);
    
    const pendingCount = requests.filter(r => r.status === 'PENDING').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="blue" messages={[
                "อย่าลืมกด Check-in เมื่อเริ่มงาน และ Check-out ก่อนกลับบ้านนะ!",
                "ระบบจะบันทึก Location และเวลาโดยอัตโนมัติ",
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

            {/* Navigation Tabs (Local Router) */}
            <div className="flex p-1 bg-white rounded-xl border border-gray-200 w-fit overflow-x-auto">
                <button 
                    onClick={() => setCurrentTab('CHECK_IN')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'CHECK_IN' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Clock className="w-4 h-4" /> ลงเวลา (Check-in)
                </button>
                <button 
                    onClick={() => setCurrentTab('HISTORY')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'HISTORY' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Calendar className="w-4 h-4" /> ประวัติ (History)
                </button>
                {/* Only Admin or HR might see this */}
                {currentUser.role === 'ADMIN' && (
                    <>
                        <button 
                            onClick={() => setCurrentTab('APPROVALS')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap relative ${currentTab === 'APPROVALS' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FileCheck className="w-4 h-4" /> คำขออนุมัติ
                            {pendingCount > 0 && (
                                <span className="ml-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setCurrentTab('REPORT')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === 'REPORT' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <PieChart className="w-4 h-4" /> สรุปผล (Reports)
                        </button>
                    </>
                )}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {currentTab === 'CHECK_IN' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-6">
                             {/* Reusing the Widget here as the main component for this tab */}
                             <AttendanceWidget user={currentUser} />
                             
                             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                 <h3 className="font-bold text-gray-800 mb-2">สถานะวันนี้</h3>
                                 <p className="text-sm text-gray-500">
                                     อย่าลืมถ่ายรูปบรรยากาศการทำงานมาฝากเพื่อนๆ ด้วยนะครับ 📸
                                 </p>
                             </div>
                         </div>
                         <div className="hidden md:block bg-indigo-50/50 rounded-3xl border border-indigo-100 p-8 flex flex-col items-center justify-center text-center">
                             <img src="https://cdni.iconscout.com/illustration/premium/thumb/time-management-4560797-3788737.png" alt="Time" className="w-48 mb-4 opacity-80 mix-blend-multiply" />
                             <h4 className="font-bold text-indigo-900 text-lg">ตรงต่อเวลา = มืออาชีพ</h4>
                             <p className="text-sm text-indigo-600 mt-2 max-w-xs">
                                 การลงเวลาที่ถูกต้องช่วยให้การคำนวณเบี้ยขยันและประเมินผล KPI แม่นยำขึ้นนะครับ
                             </p>
                         </div>
                    </div>
                )}

                {currentTab === 'HISTORY' && (
                    <AttendanceHistory 
                        userId={currentUser.id}
                    />
                )}
                
                {currentTab === 'APPROVALS' && currentUser.role === 'ADMIN' && (
                    <LeaveApprovalList currentUser={currentUser} />
                )}

                {currentTab === 'REPORT' && currentUser.role === 'ADMIN' && (
                    <AdminAttendanceDashboard users={users} />
                )}
            </div>
        </div>
    );
};

export default AttendanceRouter;
