import React from 'react';
import { 
    ParsedInternItemPreview, 
    INTERN_STATUS_META, 
    GENDER_META 
} from '../../../../../services/internImportValidator';
import { 
    AlertCircle, 
    AlertTriangle, 
    CheckCircle2, 
    Calendar, 
    GraduationCap, 
    Briefcase, 
    Pencil, 
    Phone, 
    Mail, 
    ExternalLink 
} from 'lucide-react';

interface InternImportDataRowProps {
    item: ParsedInternItemPreview;
    onEdit: (item: ParsedInternItemPreview) => void;
}

export const InternImportDataRow: React.FC<InternImportDataRowProps> = ({ item, onEdit }) => {
    const statusMeta = INTERN_STATUS_META[item.status] || {
        label: item.status,
        color: 'bg-slate-100 text-slate-700 border-slate-200'
    };

    const genderMeta = GENDER_META[item.gender] || {
        label: item.gender,
        color: 'bg-slate-100 text-slate-700 border-slate-200'
    };

    return (
        <tr
            className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-xs ${
                !item.isValid ? 'bg-rose-50/30' : item.warnings.length > 0 ? 'bg-amber-50/20' : ''
            }`}
        >
            {/* Status / Validity Indicator */}
            <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                <div className="flex items-center justify-center">
                    {!item.isValid ? (
                        <div
                            className="group relative cursor-help"
                            title={item.errors.join(' • ')}
                        >
                            <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
                        </div>
                    ) : item.warnings.length > 0 ? (
                        <div
                            className="group relative cursor-help"
                            title={item.warnings.join(' • ')}
                        >
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                    ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                </div>
            </td>

            {/* Row Number */}
            <td className="py-3 px-2 text-slate-400 font-mono text-[11px] text-center align-middle">
                #{item.index}
            </td>

            {/* Candidate Name, Nickname & Gender */}
            <td className="py-3 px-3 align-middle">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                        {item.fullName ? item.fullName.charAt(0) : '?'}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-800 truncate">
                                {item.fullName || <span className="text-rose-500 font-normal italic">[ไม่ได้ระบุชื่อ]</span>}
                            </span>
                            {item.nickname && (
                                <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[10px] border border-indigo-200">
                                    ({item.nickname})
                                </span>
                            )}
                            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-medium border ${genderMeta.color}`}>
                                {genderMeta.label}
                            </span>
                        </div>

                        {/* Contact details */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 truncate">
                            {item.email && (
                                <span className="flex items-center gap-1 truncate" title={item.email}>
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{item.email}</span>
                                </span>
                            )}
                            {item.phoneNumber && (
                                <span className="flex items-center gap-1 shrink-0" title={item.phoneNumber}>
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{item.phoneNumber}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>

            {/* Position */}
            <td className="py-3 px-3 align-middle whitespace-nowrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200">
                    <Briefcase className="w-3 h-3 text-slate-500" />
                    <span>{item.position}</span>
                </div>
            </td>

            {/* University & Faculty */}
            <td className="py-3 px-3 align-middle">
                <div className="min-w-0">
                    <div className="flex items-center gap-1 text-slate-800 font-medium truncate">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.university}</span>
                    </div>
                    {(item.faculty || item.academicYear) && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5 pl-4.5">
                            {item.faculty}{item.faculty && item.academicYear ? ' • ' : ''}{item.academicYear}
                        </div>
                    )}
                </div>
            </td>

            {/* Internship Period */}
            <td className="py-3 px-3 align-middle whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                        {item.startDateStr} ถึง {item.endDateStr}
                    </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 pl-5">
                    รวมระยะเวลา ~{item.durationDays} วัน
                </div>
            </td>

            {/* Status Badge */}
            <td className="py-3 px-3 align-middle whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.color}`}>
                    {statusMeta.label}
                </span>
            </td>

            {/* Validation Diagnostic / Remarks */}
            <td className="py-3 px-3 align-middle max-w-[200px]">
                {!item.isValid ? (
                    <div className="text-[11px] text-rose-600 font-medium leading-snug">
                        {item.errors.map((err, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                                <span className="text-rose-500 shrink-0">•</span>
                                <span>{err}</span>
                            </div>
                        ))}
                    </div>
                ) : item.warnings.length > 0 ? (
                    <div className="text-[11px] text-amber-600 font-normal leading-snug">
                        {item.warnings.map((warn, idx) => (
                            <div key={idx} className="flex items-start gap-1 truncate">
                                <span className="text-amber-500 shrink-0">•</span>
                                <span className="truncate">{warn}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-[11px] text-emerald-600">พร้อมนำเข้า</span>
                )}
            </td>

            {/* Actions: Edit */}
            <td className="py-3 px-3 text-right align-middle whitespace-nowrap">
                <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-200 cursor-pointer"
                    title="แก้ไขข้อมูลแถวนี้"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};
