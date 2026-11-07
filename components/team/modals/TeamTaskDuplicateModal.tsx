import React, { useState, useEffect, useRef } from 'react';
import { format, isSameDay, differenceInCalendarDays, addDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { Copy, X, Calendar, Sparkles, CheckCircle2, Layers, User as UserIcon, Tv } from 'lucide-react';
import { Task, User, Channel, MasterOption } from '../../../types';
import BaseModal from '../../common/BaseModal';

export interface TeamTaskDuplicateRequest {
    sourceTask: Task;
    targetUserId: string;
    targetUser?: User;
    startDate: Date;
    endDate: Date;
}

interface TeamTaskDuplicateModalProps {
    isOpen: boolean;
    request: TeamTaskDuplicateRequest | null;
    users?: User[];
    channels?: Channel[];
    masterOptions?: MasterOption[];
    onClose: () => void;
    onConfirm: (duplicatedTask: Task) => Promise<void> | void;
}

export const TeamTaskDuplicateModal: React.FC<TeamTaskDuplicateModalProps> = ({
    isOpen,
    request,
    users = [],
    channels = [],
    masterOptions = [],
    onClose,
    onConfirm,
}) => {
    const [title, setTitle] = useState('');
    const [debouncedTitle, setDebouncedTitle] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [startDateStr, setStartDateStr] = useState<string>('');
    const [endDateStr, setEndDateStr] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastSubmitTimeRef = useRef<number>(0);

    const sourceTask = request?.sourceTask || null;
    const isContent = sourceTask?.type === 'CONTENT';

    // Initialize state and auto-focus/select input when modal opens
    useEffect(() => {
        if (isOpen && request && sourceTask) {
            const initialTitle = sourceTask.title || '';
            setTitle(initialTitle);
            setDebouncedTitle(initialTitle);
            setSelectedUserId(request.targetUserId || sourceTask.assigneeIds?.[0] || '');
            setStartDateStr(format(request.startDate, 'yyyy-MM-dd'));
            setEndDateStr(format(request.endDate, 'yyyy-MM-dd'));
            setIsSubmitting(false);

            const focusTimer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 90);
            return () => clearTimeout(focusTimer);
        }
    }, [isOpen, request, sourceTask]);

    // 250ms Debounce for title updates
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedTitle(title.trim());
        }, 250);
        return () => clearTimeout(handler);
    }, [title]);

    if (!request || !sourceTask) return null;

    const handleStartDateChange = (newStartStr: string) => {
        setStartDateStr(newStartStr);
        if (!newStartStr) return;

        // Preserve original span when start date changes
        const origDuration = Math.max(
            0,
            differenceInCalendarDays(request.endDate, request.startDate)
        );
        const parsedStart = new Date(`${newStartStr}T00:00:00`);
        if (!isNaN(parsedStart.getTime())) {
            const nextEnd = addDays(parsedStart, origDuration);
            setEndDateStr(format(nextEnd, 'yyyy-MM-dd'));
        }
    };

    const activeUsers = users.filter(u => u.isActive !== false);
    const selectedUserObj = activeUsers.find(u => u.id === selectedUserId) || request.targetUser;

    const channel = sourceTask.channelId
        ? channels.find(c => c.id === sourceTask.channelId)
        : null;

    const statusOption = masterOptions.find(
        o => (o.type === 'STATUS' || o.type === 'TASK_STATUS') && o.key === sourceTask.status
    );
    const statusLabel = statusOption
        ? statusOption.label.replace(/^\d+\s*/, '')
        : sourceTask.status;

    const resolvedStartDate = startDateStr ? new Date(`${startDateStr}T00:00:00`) : request.startDate;
    const resolvedEndDate = endDateStr ? new Date(`${endDateStr}T00:00:00`) : request.endDate;
    const finalEndDate = resolvedEndDate < resolvedStartDate ? resolvedStartDate : resolvedEndDate;

    const isSingleDay = isSameDay(resolvedStartDate, finalEndDate);
    const formattedDateRange = isSingleDay
        ? format(resolvedStartDate, 'd MMM yyyy', { locale: th })
        : `${format(resolvedStartDate, 'd MMM', { locale: th })} - ${format(finalEndDate, 'd MMM yyyy', { locale: th })}`;

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Submit debounce guard (prevent double-submit within 400ms)
        const now = Date.now();
        if (now - lastSubmitTimeRef.current < 400) return;

        const finalTitle = (title.trim() || debouncedTitle).trim();
        if (!finalTitle || isSubmitting) return;

        lastSubmitTimeRef.current = now;
        setIsSubmitting(true);

        try {
            const newId = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `dup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

            const finalAssigneeIds = selectedUserId
                ? [selectedUserId]
                : (sourceTask.assigneeIds || []);

            const duplicatedTask: Task = {
                ...sourceTask,
                id: newId,
                title: finalTitle,
                assigneeIds: finalAssigneeIds,
                startDate: resolvedStartDate,
                endDate: finalEndDate,
                isUnscheduled: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                sponsorship: sourceTask.sponsorship
                    ? {
                        ...sourceTask.sponsorship,
                        taskId: newId,
                    }
                    : undefined,
                // Internal flags so handleSaveTask inserts as new record & hydrates 100% of fields from source
                _isNewImport: true,
                _sourceTaskId: sourceTask.id,
            } as Task;

            await onConfirm(duplicatedTask);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            zIndex={10050}
            windowClassName="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl border border-indigo-100/80 overflow-hidden"
        >
            {/* 1. Rigid Header */}
            <div className="flex-shrink-0 px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-50/90 via-indigo-50/70 to-purple-50/80 border-b border-indigo-100/70 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white/90 border border-emerald-200/70 shadow-xs flex items-center justify-center text-emerald-600 shrink-0">
                        <Copy className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                                คัดลอกงานทีม (Duplicate Task)
                            </h3>
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100/80 text-emerald-700 border border-emerald-200/60 shrink-0">
                                Quick Copy
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                            เปลี่ยนชื่องานและมอบหมายให้สมาชิก โดยคงเนื้อหาและสถานะเดิมครบ 100%
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-white/70 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                    aria-label="ปิดหน้าต่าง"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* 2. Scrollable Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-4">
                {/* Source & Target Context Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-500 flex items-center gap-1.5 shrink-0">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            งานต้นฉบับ:
                        </span>
                        <span className="font-bold text-slate-700 truncate max-w-[260px]" title={sourceTask.title}>
                            {sourceTask.title}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                        {/* Target Assignee Pill */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200/60">
                            {selectedUserObj?.avatarUrl ? (
                                <img
                                    src={selectedUserObj.avatarUrl}
                                    alt={selectedUserObj.name}
                                    className="w-4 h-4 rounded-full object-cover border border-white"
                                />
                            ) : (
                                <UserIcon className="w-3.5 h-3.5 text-pink-500" />
                            )}
                            <span>ผู้รับผิดชอบ: {selectedUserObj?.name || 'ยังไม่ระบุ'}</span>
                        </span>

                        {/* Target Date Pill */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span>วันที่: {formattedDateRange}</span>
                        </span>

                        {/* Status Pill */}
                        {statusLabel && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>สถานะ: {statusLabel}</span>
                            </span>
                        )}

                        {/* Channel Pill */}
                        {channel && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                                <Tv className="w-3.5 h-3.5 text-purple-500" />
                                <span>{channel.name}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* New Title Input with Debounced Preview */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="team-duplicate-task-title"
                            className="block text-xs sm:text-sm font-bold text-slate-700"
                        >
                            {isContent ? 'ชื่อคลิป / งานใหม่' : 'ชื่องานใหม่ (Task Title)'}
                            <span className="text-rose-500 ml-1">*</span>
                        </label>
                        {debouncedTitle && (
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                พร้อมบันทึก
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            ref={inputRef}
                            id="team-duplicate-task-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ตั้งชื่องานใหม่..."
                            className="w-full px-4 py-3 text-sm sm:text-base font-semibold text-slate-800 bg-white border-2 border-indigo-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/70 rounded-2xl outline-none transition-all placeholder:text-slate-300"
                            required
                        />
                    </div>
                </div>

                {/* Optional Assignee & Date Adjustments */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {activeUsers.length > 0 && (
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-600">
                                ผู้รับผิดชอบ
                            </label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-300 focus:bg-white outline-none transition-all"
                            >
                                <option value="">-- ไม่ระบุ (Pool) --</option>
                                {activeUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-600">
                            วันเริ่มงาน
                        </label>
                        <input
                            type="date"
                            value={startDateStr}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-300 focus:bg-white outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-600">
                            วันส่งงาน
                        </label>
                        <input
                            type="date"
                            value={endDateStr}
                            min={startDateStr}
                            onChange={(e) => setEndDateStr(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-300 focus:bg-white outline-none transition-all"
                        />
                    </div>
                </div>

                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                        รายละเอียด, ความสำคัญ, ชั่วโมงประเมิน, หมวดหมู่ และเช็กลิสต์ทั้งหมดจะถูกคงไว้เหมือนต้นฉบับ 100%
                    </span>
                </p>
            </form>

            {/* 3. Rigid Sticky Footer */}
            <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50/90 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                    ยกเลิก
                </button>
                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={!title.trim() || isSubmitting}
                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl shadow-md shadow-emerald-200/70 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    <Copy className="w-4 h-4" />
                    <span>{isSubmitting ? 'กำลังคัดลอก...' : 'บันทึกงานที่คัดลอก'}</span>
                </button>
            </div>
        </BaseModal>
    );
};

export default TeamTaskDuplicateModal;
