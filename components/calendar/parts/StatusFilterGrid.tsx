import React from 'react';
import { motion } from 'framer-motion';
import { Check, Pin } from 'lucide-react';
import { MasterOption, ChipConfig } from '../../../types';
import { getHexFromColorClass } from '../../../utils/color';

interface StatusFilterGridProps {
    statusOptions: MasterOption[];
    tempStatuses: string[];
    toggleStatus: (key: string) => void;
    customChips?: ChipConfig[];
    onSaveChip?: (chip: ChipConfig) => void;
    onDeleteChip?: (id: string) => void;
}

const StatusFilterGrid: React.FC<StatusFilterGridProps> = ({
    statusOptions = [],
    tempStatuses = [],
    toggleStatus,
    customChips = [],
    onSaveChip,
    onDeleteChip
}) => {
    if (statusOptions.length === 0) {
        return (
            <div className="py-16 text-center text-stone-400 font-medium">
                ไม่พบข้อมูลสถานะในขณะนี้
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5"
        >
            {statusOptions.map(option => {
                const isSelected = tempStatuses.includes(option.key);
                const color = getHexFromColorClass(option.color);
                const isPinned = customChips.some(c => c.type === 'STATUS' && c.value === option.key);

                return (
                    <div
                        key={option.key}
                        onClick={() => toggleStatus(option.key)}
                        className={`relative p-4 rounded-2xl border-2 cursor-pointer select-none flex flex-col justify-between transition-all duration-250 min-h-[110px] ${
                            isSelected
                                ? 'border-stone-800 bg-stone-100/75 shadow-md shadow-stone-800/5'
                                : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                        }`}
                        style={{
                            boxShadow: isSelected 
                                ? `0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px ${color}20` 
                                : undefined
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-[10px] font-bold text-stone-500 uppercase font-mono tracking-wider">
                                    {option.key}
                                </span>
                            </div>

                            {isSelected && (
                                <div className="bg-stone-800 text-stone-50 rounded-full p-0.5 shadow-sm">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                            )}
                        </div>

                        <div className="mt-4 relative pr-7">
                            <h4 className="text-sm font-extrabold text-stone-800 truncate">
                                {option.label}
                            </h4>
                            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 leading-relaxed" title={option.description || `งานขั้นตอน ${option.label}`}>
                                {option.description || `งานขั้นตอน ${option.label}`}
                            </p>

                            {/* Pin Button */}
                            {onSaveChip && onDeleteChip && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const existing = customChips.find(c => c.type === 'STATUS' && c.value === option.key);
                                        if (existing) {
                                            onDeleteChip(existing.id);
                                        } else {
                                            onSaveChip({
                                                id: `chip_sts_${option.key}`,
                                                label: option.label,
                                                type: 'STATUS',
                                                value: option.key,
                                                colorTheme: color,
                                                scope: 'CONTENT',
                                                mode: 'INCLUDE'
                                            });
                                        }
                                    }}
                                    className={`absolute bottom-0 right-0 p-1.5 rounded-lg border transition-all ${
                                        isPinned 
                                            ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm' 
                                            : 'bg-white border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-50 hover:border-stone-300'
                                    }`}
                                    title={isPinned ? 'ถอนการปักหมุดแถบด่วน' : 'ปักหมุดลงแถบด่วน'}
                                >
                                    <Pin className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </motion.div>
    );
};

export default StatusFilterGrid;
