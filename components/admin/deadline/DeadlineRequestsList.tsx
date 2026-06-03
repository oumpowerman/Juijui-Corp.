import React from 'react';
import { DeadlineRequest, Task } from '../../../types';
import { CheckSquare, Square, Inbox, Calendar, ChevronRight } from 'lucide-react';

interface DeadlineRequestsListProps {
    filteredRequests: DeadlineRequest[];
    selectedIds: string[];
    selectedReq: DeadlineRequest | null;
    isFetching: boolean;
    tasks: Task[];
    toggleSelect: (id: string, e: React.MouseEvent) => void;
    handleSelectAll: () => void;
    setSelectedReq: (req: DeadlineRequest | null) => void;
}

const DeadlineRequestsList: React.FC<DeadlineRequestsListProps> = ({
    filteredRequests,
    selectedIds,
    selectedReq,
    isFetching,
    tasks,
    toggleSelect,
    handleSelectAll,
    setSelectedReq
}) => {
    return (
        <div className="lg:col-span-5 border-r border-slate-200 flex flex-col justify-between min-h-0 bg-white">
            {/* Selector control header */}
            <div className="bg-slate-50/50 hover:bg-slate-50 border-b p-3 flex items-center justify-between text-[11px] h-11">
                <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 focus:outline-none font-bold"
                >
                    {selectedIds.length === filteredRequests.length && filteredRequests.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 fill-indigo-50" />
                    ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                    )}
                    {selectedIds.length === filteredRequests.length && filteredRequests.length > 0 ? 'ล้างชุดที่เลือกไว้' : 'ขยายเลือกกองทั้งหมด'}
                </button>
                <span className="text-slate-400 font-bold">เลือกเตรียมปฏิบัติ {selectedIds.length} รายการ</span>
            </div>

            {/* List Feed core body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {isFetching && filteredRequests.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
                        กำลังเช็คสัญญาณทรานแซกชันระบบเดดไลน์...
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <Inbox className="w-10 h-10 text-slate-300 mb-2" />
                        <h4 className="text-xs text-slate-700 font-bold">ไม่มีกล่องกิจกรรมตามเกณฑ์กรอง</h4>
                        <p className="text-[10px] text-slate-400 mt-1">ยอดผู้ค้างขอยื่นอาจเคลียร์หมด หรือปรับเปลี่ยนตัวขีดหาได้</p>
                    </div>
                ) : (
                    filteredRequests.map((req) => {
                        const isSelectedBatch = selectedIds.includes(req.id);
                        const isInspected = selectedReq?.id === req.id;
                        
                        const origTask = tasks.find(t => t.id === req.taskId);
                        const origDateStr = origTask ? new Date(origTask.endDate).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : '?';

                        return (
                            <div 
                                key={req.id}
                                onClick={() => setSelectedReq(req)}
                                className={`group relative text-left bg-white border rounded-2xl p-4 hover:translate-x-1 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer ${
                                    isInspected 
                                        ? 'border-indigo-600 ring-2 ring-indigo-500/15 bg-indigo-50/5 shadow-xs' 
                                        : isSelectedBatch 
                                            ? 'border-indigo-300 bg-indigo-50/10' 
                                            : 'border-slate-200/90 shadow-2xs'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Select button checkbox */}
                                    <button
                                        onClick={(e) => toggleSelect(req.id, e)}
                                        className="mt-0.5 shrink-0 text-slate-300 hover:text-indigo-600 focus:outline-none"
                                    >
                                        {isSelectedBatch ? (
                                            <CheckSquare className="w-4 h-4 text-indigo-600 fill-indigo-50" />
                                        ) : (
                                            <Square className="w-4 h-4 text-slate-200 group-hover:text-slate-300" />
                                        )}
                                    </button>

                                    {/* Profile Avatar */}
                                    {req.user?.avatarUrl ? (
                                        <img 
                                            src={req.user.avatarUrl} 
                                            alt={req.user.name} 
                                            className="w-8 h-8 rounded-full object-cover border border-slate-100 shadow-3xs shrink-0"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs shrink-0 font-bold">
                                            {req.user?.name?.charAt(0) || '?'}
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1 text-left">
                                        <div className="flex items-center justify-between gap-1.5">
                                            <h4 className="text-xs text-slate-800 truncate font-bold">
                                                {req.user?.name || 'พนักงานไม่ได้ระบุ'}
                                            </h4>
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                {new Date(req.createdAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <p className="text-xs text-indigo-600 mt-0.5 truncate font-bold">
                                            {(req as any).taskTitle || 'ไม่ระบุชื่อเด็ดเดี่ยวโครงการ'}
                                        </p>

                                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 text-left">
                                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span>{origDateStr} ➔ <strong className="text-indigo-600 text-left font-bold">{req.newDeadline.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</strong></span>
                                        </div>

                                        <p className="text-[9px] text-slate-400 mt-2 italic bg-slate-50/50 p-1.5 border border-slate-100 rounded-lg line-clamp-1 text-left">
                                            "{req.reason || 'ไม่ได้ระบุสาเหตุคอยหนุน...'}"
                                        </p>
                                    </div>

                                    <div className="self-center pl-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="w-4 h-4 text-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DeadlineRequestsList;
