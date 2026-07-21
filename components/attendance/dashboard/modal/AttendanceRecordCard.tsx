import React from 'react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { Clock, ArrowRight } from 'lucide-react';
import { parseReason } from '../../leave-request/request-detail/utils';

export type RecordVariant = 'on-time' | 'late' | 'absent' | 'leave' | 'appeal';

interface AttendanceRecordCardProps {
    date: Date;
    variant: RecordVariant;
    timeLabel?: string;
    badgeText?: string;
    note?: string;
    onClick?: () => void;
}

export const AttendanceRecordCard: React.FC<AttendanceRecordCardProps> = ({
    date,
    variant,
    timeLabel,
    badgeText,
    note,
    onClick
}) => {
    const parsed = parseReason(note || '');
    const isProvisionalWfh = parsed.isProvisionalWfh;
    const isProvisionalOnsite = parsed.isProvisionalOnsite;
    const isProvisionalForgotCheckin = parsed.isProvisionalForgotCheckin;
    const isProvisionalCheckout = parsed.isProvisionalCheckout;
    const isProvisionalLate = parsed.cleanReason.includes('[APPEAL_PENDING]') || note?.includes('[APPEAL_PENDING]') || note?.includes('[PROVISIONAL_LATE_ENTRY]');
    const isProvisional = isProvisionalWfh || isProvisionalOnsite || isProvisionalForgotCheckin || isProvisionalCheckout || isProvisionalLate;

    // Style configuration based on variant
    const config = {
        'on-time': {
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            textPrimary: 'text-emerald-600',
            textSecondary: 'text-emerald-400',
            hoverShadow: 'hover:shadow-emerald-100/50',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-600',
            iconColor: 'text-emerald-400'
        },
        'late': {
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            textPrimary: 'text-amber-600',
            textSecondary: 'text-amber-400',
            hoverShadow: 'hover:shadow-amber-100/50',
            badgeBg: 'bg-amber-100',
            badgeText: 'text-amber-600',
            iconColor: 'text-amber-400'
        },
        'appeal': {
            bg: 'bg-violet-50',
            border: 'border-violet-100',
            textPrimary: 'text-violet-600',
            textSecondary: 'text-violet-400',
            hoverShadow: 'hover:shadow-violet-100/50',
            badgeBg: 'bg-violet-100',
            badgeText: 'text-violet-600',
            iconColor: 'text-violet-400'
        },
        'absent': {
            bg: 'bg-rose-50',
            border: 'border-rose-100',
            textPrimary: 'text-rose-600',
            textSecondary: 'text-rose-400',
            hoverShadow: 'hover:shadow-rose-100/50',
            badgeBg: 'bg-rose-600',
            badgeText: 'text-white',
            iconColor: 'text-rose-400'
        },
        'leave': {
            bg: 'bg-sky-50',
            border: 'border-sky-100',
            textPrimary: 'text-sky-600',
            textSecondary: 'text-sky-400',
            hoverShadow: 'hover:shadow-sky-100/50',
            badgeBg: 'bg-sky-100',
            badgeText: 'text-sky-600',
            iconColor: 'text-sky-400'
        }
    }[variant];

    return (
        <div 
            onClick={onClick}
            className={`flex flex-col gap-2.5 p-4 bg-white rounded-[2rem] border ${config.border} group hover:shadow-lg ${config.hoverShadow} ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-indigo-200' : ''} transition-all`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${config.bg} rounded-2xl flex flex-col items-center justify-center border ${config.border} shrink-0`}>
                        <span className={`text-[10px] font-bold ${config.textSecondary} uppercase`}>
                            {format(date, 'EEE')}
                        </span>
                        <span className={`text-lg font-bold ${config.textPrimary}`}>
                            {format(date, 'd')}
                        </span>
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-slate-700">
                            {format(date, 'MMMM yyyy', { locale: th })}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`px-2 py-0.5 ${config.badgeBg} ${config.badgeText} rounded-lg text-[9px] font-bold uppercase shrink-0`}>
                                {badgeText || variant.toUpperCase()}
                            </span>
                            {isProvisionalWfh && (
                                <span className="px-2 py-0.5 bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 animate-pulse shrink-0">
                                    ⚠️ WFH แบบจำลอง
                                </span>
                            )}
                            {isProvisionalOnsite && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 animate-pulse shrink-0">
                                    ⚠️ On-site แบบจำลอง
                                </span>
                            )}
                            {isProvisionalForgotCheckin && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 animate-pulse shrink-0">
                                    ⚠️ ลืมลงเวลาแบบจำลอง
                                </span>
                            )}
                            {isProvisionalCheckout && (
                                <span className="px-2 py-0.5 bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 animate-pulse shrink-0">
                                    ⚠️ เช็คเอาท์แบบจำลอง
                                </span>
                            )}
                            {isProvisionalLate && (
                                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 animate-pulse shrink-0">
                                    ⚠️ อยู่ระหว่างการอุทธรณ์
                                </span>
                            )}
                            {variant === 'absent' ? (
                                <p className="text-[10px] font-bold text-rose-400 ml-1">
                                    {timeLabel || 'No record found'}
                                </p>
                            ) : variant === 'leave' ? (
                                <p className="text-[10px] font-bold text-slate-400 italic truncate max-w-[150px] ml-1">
                                    "{parsed.cleanReason || 'No reason'}"
                                </p>
                            ) : (
                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 ml-1">
                                    <Clock className="w-3 h-3" /> {timeLabel || '--:--'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center ${config.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Display clean reasons or provisional descriptions beautifully */}
            {(isProvisional || (note && variant !== 'leave' && variant !== 'absent')) && (
                <p className="text-[10px] text-slate-500 italic bg-slate-50 border border-slate-100/60 rounded-xl px-3 py-1.5 line-clamp-2 leading-relaxed">
                    "{parsed.cleanReason || 'ลงเวลางานโดยไม่มีใบคำขออนุมัติล่วงหน้า (ระบบสร้างใบคำขอให้อัตโนมัติ)'}"
                </p>
            )}
        </div>
    );
};
