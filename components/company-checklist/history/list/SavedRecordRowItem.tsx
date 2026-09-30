import React, { useMemo } from 'react';
import { Clock, UserCheck, Eye, Trash2 } from 'lucide-react';
import { SavedChecklistRecord } from '../../../../types';

interface SavedRecordRowItemProps {
    record: SavedChecklistRecord;
    onInspectRecord: (recordId: string) => void;
    onDeleteRecord: (record: SavedChecklistRecord) => Promise<void>;
}

export const SavedRecordRowItem: React.FC<SavedRecordRowItemProps> = ({
    record,
    onInspectRecord,
    onDeleteRecord
}) => {
    const percent =
        record.totalCount > 0
            ? Math.round((record.checkedCount / record.totalCount) * 100)
            : 0;
    const isComplete =
        record.totalCount > 0 && record.checkedCount >= record.totalCount;

    const snapshotCheckers = useMemo(() => {
        const checkers = new Set<string>();
        record.snapshotSections?.forEach(sec =>
            sec.items.forEach(it => {
                if (it.isChecked && it.checkedByName) {
                    checkers.add(it.checkedByName);
                }
            })
        );
        return Array.from(checkers);
    }, [record.snapshotSections]);

    return (
        <div
            onClick={() => onInspectRecord(record.id)}
            className="px-4 sm:px-5 py-3.5 hover:bg-slate-50/90 transition-colors cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-3"
        >
            <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                {/* Completion Percentage Badge */}
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs tabular-nums ${
                        isComplete
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                    }`}
                >
                    {percent}%
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            {record.caseTitle}
                        </h3>
                        <span className="text-xs text-slate-500">
                            · {record.checklistTitle}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                                {new Date(record.submittedAt).toLocaleString('th-TH', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}{' '}
                                น.
                            </span>
                        </span>

                        <span>·</span>

                        <span className="inline-flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                                ผู้บันทึก:{' '}
                                <strong className="text-slate-800">
                                    {record.submittedByName}
                                </strong>
                            </span>
                        </span>

                        {snapshotCheckers.length > 0 && (
                            <>
                                <span>·</span>
                                <span className="truncate max-w-xs">
                                    ผู้ร่วมติ๊ก:{' '}
                                    <strong className="text-slate-700">
                                        {snapshotCheckers.join(', ')}
                                    </strong>
                                </span>
                            </>
                        )}
                    </div>

                    {record.summaryNote && (
                        <p className="text-xs text-slate-600 mt-1 truncate max-w-2xl">
                            หมายเหตุ: {record.summaryNote}
                        </p>
                    )}
                </div>
            </div>

            {/* Right Actions: Item Count + View Modal Button + Delete */}
            <div className="flex items-center justify-between lg:justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-left lg:text-right mr-1">
                    <div className="text-xs font-bold text-slate-900 tabular-nums">
                        เช็คครบ {record.checkedCount}/{record.totalCount} ข้อ
                    </div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                        {record.snapshotSections?.length || 0} หมวดหมู่
                    </div>
                </div>

                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onInspectRecord(record.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูรายละเอียด</span>
                </button>

                <button
                    type="button"
                    onClick={async e => {
                        e.stopPropagation();
                        await onDeleteRecord(record);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="ลบใบประวัตินี้"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
