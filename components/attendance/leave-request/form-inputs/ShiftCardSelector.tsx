import React from 'react';
import { Clock, Check, Sparkles } from 'lucide-react';

interface ShiftCardSelectorProps {
    shifts: string[];
    selectedShift: string | null;
    isCustomMode: boolean;
    onSelectShift: (shiftTime: string) => void;
    onSelectCustom: () => void;
}

const getShiftBadgeLabel = (_timeStr: string, index: number): string => {
    return `กะที่ ${index + 1}`;
};

export const ShiftCardSelector: React.FC<ShiftCardSelectorProps> = ({
    shifts,
    selectedShift,
    isCustomMode,
    onSelectShift,
    onSelectCustom
}) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
                <label className="text-[13px] font-kanit font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    เลือกกะเวลาลงเข้างานในระบบ (System Shifts)
                </label>
                <span className="text-[11px] font-sarabun text-slate-400">
                    เลือกกะตรงตามตาราง
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shifts.map((shift, idx) => {
                    const isSelected = !isCustomMode && selectedShift === shift;
                    const badgeLabel = getShiftBadgeLabel(shift, idx);

                    return (
                        <button
                            key={shift}
                            type="button"
                            onClick={() => onSelectShift(shift)}
                            className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                                isSelected
                                    ? 'bg-gradient-to-br from-indigo-50/90 to-teal-50/80 border-indigo-500 shadow-lg shadow-indigo-100/60 ring-2 ring-indigo-400/20'
                                    : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md'
                            }`}
                        >
                            {isSelected && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </div>
                            )}

                            <div>
                                <span
                                    className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${
                                        isSelected
                                            ? 'bg-indigo-100/80 text-indigo-700 font-semibold'
                                            : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100/50 group-hover:text-indigo-600'
                                    }`}
                                >
                                    {badgeLabel}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span
                                        className={`text-2xl font-semibold tracking-tight font-mono ${
                                            isSelected ? 'text-indigo-900' : 'text-slate-800'
                                        }`}
                                    >
                                        {shift}
                                    </span>
                                    <span
                                        className={`text-xs font-medium ${
                                            isSelected ? 'text-indigo-600' : 'text-slate-400'
                                        }`}
                                    >
                                        น.
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                                <span className={isSelected ? 'text-indigo-600 font-medium' : 'text-slate-400'}>
                                    {isSelected ? 'กะที่เลือก' : 'กดเพื่อเลือก'}
                                </span>
                                {isSelected && (
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-100">
                                        <Sparkles className="w-3 h-3 text-teal-500" />
                                        ตรงกะ
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}

                {/* Custom Time Option Card */}
                <button
                    type="button"
                    onClick={onSelectCustom}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between group ${
                        isCustomMode
                            ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/80 border-amber-500 shadow-lg shadow-amber-100/60 ring-2 ring-amber-400/20'
                            : 'bg-white border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/20'
                    }`}
                >
                    <div>
                        <span
                            className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${
                                isCustomMode
                                    ? 'bg-amber-100 text-amber-800 font-semibold'
                                    : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100/60 group-hover:text-amber-700'
                            }`}
                        >
                            ระบุเอง
                        </span>
                        <div className="flex items-center gap-1.5 text-amber-700">
                            <Clock className={`w-5 h-5 ${isCustomMode ? 'text-amber-600' : 'text-slate-400'}`} />
                            <span
                                className={`text-sm font-semibold ${
                                    isCustomMode ? 'text-amber-900' : 'text-slate-700'
                                }`}
                            >
                                กรอกเวลาเอง
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className={isCustomMode ? 'text-amber-700 font-medium' : 'text-slate-400'}>
                            {isCustomMode ? 'กำลังใช้งาน' : 'เลือกเวลานอกกะ'}
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default ShiftCardSelector;
