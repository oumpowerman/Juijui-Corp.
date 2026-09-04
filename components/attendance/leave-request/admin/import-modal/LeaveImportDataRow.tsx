import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Calendar, User, Clock, Edit3, MessageSquare } from 'lucide-react';
import { ParsedLeaveItemPreview } from '../../../../../services/leaveImportValidator';

interface LeaveImportDataRowProps {
    item: ParsedLeaveItemPreview;
    onEdit: (item: ParsedLeaveItemPreview) => void;
}

export const LeaveImportDataRow: React.FC<LeaveImportDataRowProps> = ({ item, onEdit }) => {
    const rowBg = !item.isValid
        ? 'bg-rose-50/30 hover:bg-rose-50/60'
        : item.warnings.length > 0
        ? 'bg-amber-50/30 hover:bg-amber-50/60'
        : 'hover:bg-slate-50/80';

    return (
        <tr
            className={`transition-colors group ${rowBg}`}
            onDoubleClick={() => onEdit(item)}
        >
            {/* Row Index */}
            <td className="py-3 px-3 text-center font-bold text-slate-400 text-[11px] select-none">
                {item.index}
            </td>

            {/* Validation Badge */}
            <td className="py-3 px-3 whitespace-nowrap">
                {!item.isValid ? (
                    <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg w-fit border border-rose-100">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-black text-[10px]">Error</span>
                    </div>
                ) : item.warnings.length > 0 ? (
                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg w-fit border border-amber-100">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-black text-[10px]">Warning</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg w-fit border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-black text-[10px]">พร้อมบันทึก</span>
                    </div>
                )}
            </td>

            {/* Employee Info */}
            <td className="py-3 px-4">
                <div className="space-y-1 max-w-xs">
                    {item.userId ? (
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden border border-blue-200">
                                {item.userAvatarUrl ? (
                                    <img
                                        src={item.userAvatarUrl}
                                        alt={item.userName || ''}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <span>{item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs truncate">
                                    {item.userName}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium truncate">
                                    {item.userEmail} {item.userPosition ? `• ${item.userPosition}` : ''}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-rose-600">
                            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                                <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-xs text-rose-600 truncate">
                                    ไม่พบพนักงาน
                                </p>
                                <p className="text-[10px] text-rose-400 font-mono truncate">
                                    {item.rawEmail || '(ไม่ได้ระบุอีเมล)'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Messages */}
                    {item.errors.map((err, idx) => (
                        <p
                            key={idx}
                            className="text-[10px] text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-lg border border-rose-100"
                        >
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{err}</span>
                        </p>
                    ))}

                    {/* Warning Messages */}
                    {item.warnings.map((warn, idx) => (
                        <p
                            key={idx}
                            className="text-[10px] text-amber-800 font-medium flex items-center gap-1.5 bg-amber-50/90 p-1.5 rounded-lg border border-amber-200/60"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                            <span>{warn}</span>
                        </p>
                    ))}
                </div>
            </td>

            {/* Leave Type Badge */}
            <td className="py-3 px-3 whitespace-nowrap">
                <span className={`px-2.5 py-1 rounded-xl font-bold text-[11px] border ${item.leaveTypeColor}`}>
                    {item.leaveTypeLabel}
                </span>
            </td>

            {/* Date Range & Half-day */}
            <td className="py-3 px-3 space-y-0.5 whitespace-nowrap">
                <div className="flex items-center gap-1 text-slate-800 font-bold text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>
                        {item.startDate} {item.endDate && item.endDate !== item.startDate ? `ถึง ${item.endDate}` : ''}
                    </span>
                </div>
                {item.isHalfDay && (
                    <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>ครึ่งวัน ({item.halfDaySession === 'AM' ? 'ช่วงเช้า' : 'ช่วงบ่าย'})</span>
                    </div>
                )}
            </td>

            {/* Calculated Days */}
            <td className="py-3 px-3 whitespace-nowrap">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-100">
                    {item.durationDays} วัน
                </span>
            </td>

            {/* Reason */}
            <td className="py-3 px-3 max-w-[200px]">
                <p className="text-[11px] text-slate-600 line-clamp-2 font-medium" title={item.reason}>
                    {item.rawReason || item.reason.replace('[MIGRATED] ประวัติการลาย้อนหลัง: ', '') || '-'}
                </p>
            </td>

            {/* Actions: Edit Button */}
            <td className="py-3 px-3 text-right whitespace-nowrap">
                <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ml-auto cursor-pointer shadow-2xs active:scale-95 ${
                        !item.isValid
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                            : item.warnings.length > 0
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                    title="แก้ไขข้อมูลแถวนี้"
                >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                </button>
            </td>
        </tr>
    );
};
