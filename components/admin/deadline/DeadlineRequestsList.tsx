import React from 'react';
import { DeadlineRequest, Task, User } from '../../../types';
import { CheckSquare, Square, Inbox, Calendar, ChevronRight } from 'lucide-react';
import { formatDisplayDate } from '../../ui/DatePickerModal';

interface DeadlineRequestsListProps {
    filteredRequests: DeadlineRequest[];
    selectedIds: string[];
    selectedReq: DeadlineRequest | null;
    isFetching: boolean;
    tasks: Task[];
    toggleSelect: (id: string, e: React.MouseEvent) => void;
    handleSelectAll: () => void;
    setSelectedReq: (req: DeadlineRequest | null) => void;
    currentUser?: User;
    duplicateCounts?: Map<string, number>;
}

const DeadlineRequestsList: React.FC<DeadlineRequestsListProps> = ({
    filteredRequests,
    selectedIds,
    selectedReq,
    isFetching,
    tasks,
    toggleSelect,
    handleSelectAll,
    setSelectedReq,
    currentUser,
    duplicateCounts
}) => {
    const allSelected = selectedIds.length === filteredRequests.length && filteredRequests.length > 0;

    return (
        <div className="lg:col-span-5 lg:border-r border-slate-200/80 flex flex-col min-h-0 bg-white h-full">
            {/* Selector control header */}
            <div className="bg-slate-50/70 border-b border-slate-200/70 px-4 py-2.5 flex items-center justify-between text-xs shrink-0">
                <button
                    type="button"
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 focus:outline-none font-semibold"
                >
                    {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 fill-indigo-50" />
                    ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                    )}
                    {allSelected ? 'ล้างที่เลือกไว้' : 'เลือกทั้งหมด'}
                </button>
                <span className="text-slate-500 font-medium tabular-nums">
                    เลือกอยู่ {selectedIds.length} รายการ
                </span>
            </div>

            {/* List Feed core body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2.5 pb-20 lg:pb-6">
                {isFetching && filteredRequests.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-xs">
                        กำลังโหลดรายการคำขอเลื่อนกำหนดส่ง...
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-3">
                            <Inbox className="w-6 h-6 text-slate-300" />
                        </div>
                        <h4 className="text-sm text-slate-700 font-bold">ไม่มีคำขอที่ตรงตามเงื่อนไข</h4>
                        <p className="text-xs text-slate-400 mt-1">
                            คำขอทั้งหมดได้รับการจัดการแล้ว หรือลองเปลี่ยนตัวกรองด้านบน
                        </p>
                    </div>
                ) : (
                    filteredRequests.map((req) => {
                        const isSelectedBatch = selectedIds.includes(req.id);
                        const isInspected = selectedReq?.id === req.id;

                        const origTask = tasks.find((t) => t.id === req.taskId);
                        const origDate = req.originalDeadline || origTask?.endDate;
                        const origDateStr = origDate ? formatDisplayDate(origDate) : '-';
                        const newDateStr = formatDisplayDate(req.newDeadline);

                        const targetKey = `${req.requestType || 'TASK'}:${req.taskId}`;
                        const dupCount = duplicateCounts?.get(targetKey) || 1;

                        const approverLabel = req.approverId
                            ? req.approverId === currentUser?.id
                                ? 'ส่งถึงคุณ'
                                : `ถึง: ${req.approver?.name || 'Admin ท่านอื่น'}`
                            : 'ส่งถึงทีม Admin';

                        return (
                            <div
                                key={req.id}
                                onClick={() => setSelectedReq(req)}
                                className={`group relative text-left rounded-2xl p-3.5 border transition-all cursor-pointer ${
                                    isInspected
                                        ? 'border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-500/10'
                                        : isSelectedBatch
                                            ? 'border-indigo-200 bg-indigo-50/20'
                                            : 'border-slate-200/80 bg-white hover:border-indigo-200 hover:bg-slate-50/50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Select checkbox */}
                                    <button
                                        type="button"
                                        onClick={(e) => toggleSelect(req.id, e)}
                                        className="mt-0.5 shrink-0 text-slate-300 hover:text-indigo-600 focus:outline-none p-0.5"
                                        aria-label="เลือกรายการ"
                                    >
                                        {isSelectedBatch ? (
                                            <CheckSquare className="w-4 h-4 text-indigo-600 fill-indigo-50" />
                                        ) : (
                                            <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                                        )}
                                    </button>

                                    {/* Profile Avatar */}
                                    {req.user?.avatarUrl ? (
                                        <img
                                            src={req.user.avatarUrl}
                                            alt={req.user.name || 'ผู้ขอ'}
                                            referrerPolicy="no-referrer"
                                            className="w-9 h-9 rounded-full object-cover border border-slate-200/80 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-700 text-xs shrink-0 font-bold">
                                            {req.user?.name?.charAt(0) || '?'}
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1 text-left">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-xs text-slate-800 truncate font-bold">
                                                {req.user?.name || 'พนักงาน'}
                                            </h4>
                                            <span className="text-[11px] text-slate-400 font-medium tabular-nums shrink-0">
                                                {new Date(req.createdAt).toLocaleDateString('th-TH', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        <p className="text-xs text-indigo-700 mt-0.5 truncate font-semibold">
                                            {req.taskTitle || 'ไม่พบชื่องาน'}
                                        </p>

                                        {/* Clean unboxed metadata */}
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-slate-500 tabular-nums">
                                            <span className="inline-flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                                {origDateStr} →{' '}
                                                <strong className="text-indigo-700 font-bold">{newDateStr}</strong>
                                            </span>
                                            <span aria-hidden="true">·</span>
                                            <span
                                                className={
                                                    req.approverId === currentUser?.id
                                                        ? 'text-emerald-700 font-semibold'
                                                        : 'text-slate-500'
                                                }
                                            >
                                                {approverLabel}
                                            </span>
                                            {dupCount > 1 && (
                                                <>
                                                    <span aria-hidden="true">·</span>
                                                    <span className="text-amber-700 font-semibold">
                                                        คำขอซ้ำ {dupCount} ใบ
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1 italic">
                                            "{req.reason || 'ไม่ได้ระบุเหตุผล'}"
                                        </p>
                                    </div>

                                    <div className="self-center shrink-0 text-slate-300 group-hover:text-indigo-500 transition-colors">
                                        <ChevronRight className="w-4 h-4" />
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
