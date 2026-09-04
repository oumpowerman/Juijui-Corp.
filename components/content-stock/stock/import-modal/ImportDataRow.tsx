import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Calendar, Tv, User, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { ParsedStockItemPreview } from '../../../../services/stockImportValidator';

interface ImportDataRowProps {
    item: ParsedStockItemPreview;
    onEdit: (item: ParsedStockItemPreview) => void;
}

export const ImportDataRow: React.FC<ImportDataRowProps> = ({ item, onEdit }) => {
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
                        <span className="font-black text-[10px]">พร้อมลง</span>
                    </div>
                )}
            </td>

            {/* Title & Errors/Warnings info */}
            <td className="py-3 px-4">
                <div className="space-y-1.5 max-w-lg">
                    <p className={`font-bold text-slate-900 leading-snug line-clamp-2 ${!item.title ? 'text-rose-500 italic' : ''}`}>
                        {item.title || '(ไม่มีชื่อหัวข้อ Topic)'}
                    </p>
                    {item.idea && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            Idea: {item.idea}
                        </p>
                    )}

                    {/* Error Messages */}
                    {item.errors.map((err, errIdx) => (
                        <p
                            key={errIdx}
                            className="text-[10px] text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-lg border border-rose-100"
                        >
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{err}</span>
                        </p>
                    ))}

                    {/* Warning Messages */}
                    {item.warnings.map((warn, warnIdx) => (
                        <p
                            key={warnIdx}
                            className="text-[10px] text-amber-800 font-medium flex items-center gap-1.5 bg-amber-50/90 p-1.5 rounded-lg border border-amber-200/60"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                            <span>{warn}</span>
                        </p>
                    ))}
                </div>
            </td>

            {/* Channel */}
            <td className="py-3 px-3">
                {item.channelName ? (
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100 flex items-center gap-1 w-fit">
                        <Tv className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[90px]">{item.channelName}</span>
                    </span>
                ) : item.rawChannelName ? (
                    <span className="text-[10px] text-amber-700 italic font-medium">
                        {item.rawChannelName} (ไม่พบ)
                    </span>
                ) : (
                    <span className="text-[10px] text-slate-400">-</span>
                )}
            </td>

            {/* Format / Pillar */}
            <td className="py-3 px-3 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-700 truncate">
                    {item.format || item.rawFormat || '-'}
                </div>
                {item.pillar && (
                    <div className="text-[9px] text-slate-400 font-medium truncate">
                        {item.pillar}
                    </div>
                )}
            </td>

            {/* Status */}
            <td className="py-3 px-3 whitespace-nowrap">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-black text-[10px] border border-slate-200">
                    {item.statusLabel}
                </span>
            </td>

            {/* Members (Owner, Edit, Sub) */}
            <td className="py-3 px-3 space-y-0.5 max-w-[140px]">
                {item.ownerNames.length > 0 ? (
                    <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1 truncate">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.ownerNames.join(', ')}</span>
                    </div>
                ) : item.rawOwner ? (
                    <div className="text-[10px] text-amber-700 italic truncate">
                        {item.rawOwner}
                    </div>
                ) : (
                    <span className="text-[10px] text-slate-400">-</span>
                )}
                {item.editorNames.length > 0 && (
                    <div className="text-[9px] text-indigo-600 font-medium truncate">
                        Edit: {item.editorNames.join(', ')}
                    </div>
                )}
            </td>

            {/* Publish Date */}
            <td className="py-3 px-3 whitespace-nowrap">
                {item.publishDate && !item.isUnscheduled ? (
                    <div className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{format(item.publishDate, 'd MMM yyyy', { locale: th })}</span>
                    </div>
                ) : (
                    <span className="text-[10px] text-slate-400 italic">Unscheduled</span>
                )}
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
