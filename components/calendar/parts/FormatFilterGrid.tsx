import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { MasterOption } from '../../../types/task';

interface FormatFilterGridProps {
    formatOptions: MasterOption[];
    tempFormats: string[];
    toggleFormat: (key: string) => void;
}

const FormatFilterGrid: React.FC<FormatFilterGridProps> = ({
    formatOptions = [],
    tempFormats = [],
    toggleFormat
}) => {
    if (formatOptions.length === 0) {
        return (
            <div className="py-16 text-center text-stone-400 font-medium">
                ไม่พบรูปแบบเนื้อหาในระบบ
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
            {formatOptions.map(option => {
                const isSelected = tempFormats.includes(option.key);
                const color = option.color || '#a8a29e'; // Default soft Stone color

                return (
                    <div
                        key={option.key}
                        onClick={() => toggleFormat(option.key)}
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
                            <span
                                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all"
                                style={{
                                    borderColor: isSelected ? 'transparent' : `${color}40`,
                                    backgroundColor: isSelected ? `${color}25` : `${color}15`,
                                    color: isSelected ? '#1c1917' : color // Warm Stone-950 for text when active
                                }}
                            >
                                {option.key}
                            </span>

                            {isSelected && (
                                <div className="bg-stone-800 text-stone-50 rounded-full p-0.5 shadow-sm">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <h4 className="text-sm font-extrabold text-stone-800">
                                {option.label}
                            </h4>
                            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 leading-relaxed">
                                {option.description || `รูปแบบงาน ${option.label}`}
                            </p>
                        </div>
                    </div>
                );
            })}
        </motion.div>
    );
};

export default FormatFilterGrid;
