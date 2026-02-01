
import React, { useState } from 'react';
import { useLeaveRequests } from '../../hooks/useLeaveRequests';
import { CheckCircle2, XCircle, FileText, Calendar, ExternalLink, Clock, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

interface LeaveApprovalListProps {
    currentUser: any;
}

const LeaveApprovalList: React.FC<LeaveApprovalListProps> = ({ currentUser }) => {
    const { requests, isLoading, approveRequest, rejectRequest } = useLeaveRequests(currentUser);
    const [filterStatus, setFilterStatus] = useState<'PENDING' | 'HISTORY'>('PENDING');

    const filteredRequests = requests.filter(r => 
        filterStatus === 'PENDING' ? r.status === 'PENDING' : r.status !== 'PENDING'
    );

    const getTypeBadge = (type: string) => {
        const styles: any = {
            SICK: 'bg-red-100 text-red-700 border-red-200',
            VACATION: 'bg-blue-100 text-blue-700 border-blue-200',
            PERSONAL: 'bg-gray-100 text-gray-700 border-gray-200',
            EMERGENCY: 'bg-orange-100 text-orange-700 border-orange-200',
            LATE_ENTRY: 'bg-purple-100 text-purple-700 border-purple-200',
            OVERTIME: 'bg-indigo-100 text-indigo-700 border-indigo-200'
        };
        
        let label = type;
        let icon = null;
        
        if (type === 'LATE_ENTRY') { label = 'ขอเข้าสาย'; icon = <Clock className="w-3 h-3 mr-1"/>; }
        else if (type === 'OVERTIME') { label = 'แจ้ง OT'; icon = <Briefcase className="w-3 h-3 mr-1"/>; }

        return (
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border flex items-center ${styles[type] || 'bg-gray-100'}`}>
                {icon} {label}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 w-fit">
                <button 
                    onClick={() => setFilterStatus('PENDING')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'PENDING' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    รออนุมัติ ({requests.filter(r => r.status === 'PENDING').length})
                </button>
                <button 
                    onClick={() => setFilterStatus('HISTORY')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'HISTORY' ? 'bg-gray-100 text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    ประวัติย้อนหลัง
                </button>
            </div>

            {/* List */}
            <div className="grid gap-3">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>ไม่มีรายการคำขอ</p>
                    </div>
                ) : (
                    filteredRequests.map((req) => (
                        <div key={req.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            {req.status === 'APPROVED' && <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>}
                            {req.status === 'REJECTED' && <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>}
                            {req.status === 'PENDING' && <div className="absolute top-0 right-0 w-2 h-full bg-orange-400 animate-pulse"></div>}

                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        {req.user?.avatarUrl ? (
                                            <img src={req.user.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                                {req.user?.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-gray-800">{req.user?.name || 'Unknown'}</h4>
                                            {getTypeBadge(req.type)}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-mono">
                                            <span>ส่งเมื่อ: {format(req.createdAt, 'd MMM HH:mm')}</span>
                                        </div>
                                        
                                        <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg w-fit mb-2 ${req.type === 'LATE_ENTRY' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-700'}`}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(req.startDate, 'd MMM')} 
                                            {req.startDate.getTime() !== req.endDate.getTime() && ` - ${format(req.endDate, 'd MMM yyyy')}`}
                                        </div>

                                        <p className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 italic">
                                            "{req.reason}"
                                        </p>
                                        
                                        {req.attachmentUrl && (
                                            <a href={req.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 font-bold mt-2 hover:underline">
                                                <ExternalLink className="w-3 h-3" /> ดูหลักฐานแนบ
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {req.status === 'PENDING' && (
                                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0">
                                        <button 
                                            onClick={() => { if(confirm('อนุมัติคำขอนี้?')) approveRequest(req); }}
                                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> อนุมัติ
                                        </button>
                                        <button 
                                            onClick={() => { if(confirm('ปฏิเสธคำขอนี้?')) rejectRequest(req.id); }}
                                            className="flex-1 px-4 py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
                                        >
                                            <XCircle className="w-4 h-4" /> ปฏิเสธ
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LeaveApprovalList;
