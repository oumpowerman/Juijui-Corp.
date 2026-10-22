import React from 'react';
import {
    CheckCircle2,
    Clock,
    Trash2,
    Play,
    Eye,
    PackageCheck,
    Truck,
    ArchiveRestore,
    Calendar,
    Layout
} from 'lucide-react';
import { ShootTripRecord, ShootRoundKey } from '../../../types';
import { SHOOT_ROUND_META } from '../../../context/checklist/types';
import { ROUND_ORDER, formatDateTime, formatTimeOnly } from './historyUtils';

export interface TripHistoryCardProps {
    trip: ShootTripRecord;
    isCurrentlyActive: boolean;
    onResumeTrip: (trip: ShootTripRecord) => Promise<void>;
    onOpenDetail: (trip: ShootTripRecord, initialRound?: ShootRoundKey) => void;
    onDeleteTrip: (tripId: string) => Promise<void>;
}

export const TripHistoryCard: React.FC<TripHistoryCardProps> = ({
    trip,
    isCurrentlyActive,
    onResumeTrip,
    onOpenDetail,
    onDeleteTrip
}) => {
    const isAllDone = Boolean(
        trip.rounds?.PACK_OUT &&
            trip.rounds?.PACK_BACK &&
            trip.rounds?.RETURN_STORAGE
    );

    const nextPendingRound: ShootRoundKey | null = !trip.rounds?.PACK_OUT
        ? 'PACK_OUT'
        : !trip.rounds?.PACK_BACK
          ? 'PACK_BACK'
          : !trip.rounds?.RETURN_STORAGE
            ? 'RETURN_STORAGE'
            : null;

    const getRoundIcon = (rk: ShootRoundKey) => {
        switch (rk) {
            case 'PACK_OUT':
                return <PackageCheck className="w-4 h-4" />;
            case 'PACK_BACK':
                return <Truck className="w-4 h-4" />;
            case 'RETURN_STORAGE':
                return <ArchiveRestore className="w-4 h-4" />;
        }
    };

    return (
        <div
            className={`bg-white/70 backdrop-blur-xl backdrop-saturate-150 rounded-2xl border transition-all overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] hover:shadow-lg ${
                isCurrentlyActive
                    ? 'border-indigo-400 ring-2 ring-indigo-200/60'
                    : 'border-white/80 ring-1 ring-slate-900/[0.04]'
            }`}
        >
            {/* Top Card Header */}
            <div className="p-4 sm:p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                            {trip.title}
                        </h3>
                        {isAllDone ? (
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                ครบทั้ง 3 รอบ
                            </span>
                        ) : (
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                รอ
                                {nextPendingRound
                                    ? SHOOT_ROUND_META[nextPendingRound].label
                                    : 'ดำเนินการ'}
                            </span>
                        )}
                        {isCurrentlyActive && (
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                                คิวปัจจุบัน
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        {trip.presetName && (
                            <span className="flex items-center gap-1 font-semibold text-gray-600">
                                <Layout className="w-3.5 h-3.5 text-indigo-500" />
                                ชุด: {trip.presetName}
                            </span>
                        )}
                        <span className="flex items-center gap-1 tabular-nums">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            อัปเดตล่าสุด {formatDateTime(trip.updatedAt)}
                        </span>
                    </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isAllDone && nextPendingRound && (
                        <button
                            type="button"
                            onClick={() => onResumeTrip(trip)}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 min-h-[40px]"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>
                                ทำต่อ: {SHOOT_ROUND_META[nextPendingRound].shortLabel}
                            </span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onOpenDetail(trip)}
                        className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 min-h-[40px]"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูรายงาน</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeleteTrip(trip.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                        title="ลบประวัตินี้"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 3-Round Progress Strip */}
            <div className="p-3 sm:p-4 bg-gray-50/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {ROUND_ORDER.map(roundKey => {
                    const meta = SHOOT_ROUND_META[roundKey];
                    const rep = trip.rounds?.[roundKey];
                    const isComplete =
                        rep &&
                        rep.totalCount > 0 &&
                        rep.checkedCount === rep.totalCount;

                    return (
                        <button
                            key={roundKey}
                            type="button"
                            onClick={() => onOpenDetail(trip, roundKey)}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                                rep
                                    ? isComplete
                                        ? 'bg-white border-emerald-200 hover:border-emerald-300 shadow-sm'
                                        : 'bg-white border-amber-200 hover:border-amber-300 shadow-sm'
                                    : 'bg-gray-100/70 border-dashed border-gray-200 text-gray-400 hover:bg-gray-100'
                            }`}
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                    <span
                                        className={
                                            rep
                                                ? isComplete
                                                    ? 'text-emerald-600'
                                                    : 'text-amber-600'
                                                : 'text-gray-400'
                                        }
                                    >
                                        {getRoundIcon(roundKey)}
                                    </span>
                                    <span className="truncate">{meta.shortLabel}</span>
                                </div>
                                {rep ? (
                                    <div className="text-[11px] text-gray-500 mt-1 truncate">
                                        ส่งโดย{' '}
                                        <span className="font-semibold text-gray-700">
                                            {rep.submittedByName}
                                        </span>{' '}
                                        •{' '}
                                        <span className="tabular-nums">
                                            {formatTimeOnly(rep.submittedAt)} น.
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-[11px] text-gray-400 mt-1">
                                        ยังไม่ได้ส่งรายงานรอบนี้
                                    </div>
                                )}
                            </div>

                            {rep ? (
                                <div className="shrink-0 text-right">
                                    <span
                                        className={`px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums ${
                                            isComplete
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-amber-50 text-amber-700'
                                        }`}
                                    >
                                        {rep.checkedCount}/{rep.totalCount}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-[11px] font-semibold text-gray-400 shrink-0">
                                    รอเช็ค
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
