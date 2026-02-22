
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckSquare, Square, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption {
    key: string;
    label: string;
    icon?: string;
}

interface MultiSelectFilterProps {
    label: string;
    values: string[];
    options: FilterOption[];
    onChange: (values: string[]) => void;
    icon?: React.ReactNode;
    activeColorClass?: string;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
    label,
    values,
    options,
    onChange,
    icon,
    activeColorClass = 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-100 ring-offset-1'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isActive = values.length > 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (key: string) => {
        if (values.includes(key)) {
            onChange(values.filter(v => v !== key));
        } else {
            onChange([...values, key]);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                title={isActive ? values.map(v => options.find(o => o.key === v)?.label).join(', ') : label}
                className={`
                    flex items-center justify-between px-4 py-3 border rounded-2xl text-sm font-bold transition-all active:scale-95
                    ${isActive ? activeColorClass : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}
                `}
            >
                <div className="flex items-center gap-2 truncate max-w-[140px]">
                    {icon && <span className={isActive ? '' : 'text-gray-400'}>{icon}</span>}
                    <span className="truncate">
                        {isActive ? (
                            <span className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    {values.length}
                                </span>
                                {label}
                            </span>
                        ) : (
                            label
                        )}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isActive ? '' : 'text-gray-400'}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-2 overflow-hidden origin-top-left"
                    >
                        <div className="flex justify-between items-center px-3 py-2 mb-1 bg-gray-50/50 rounded-xl">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                กรองตาม {label}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onChange(options.map(o => o.key))}
                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                                >
                                    เลือกทั้งหมด
                                </button>
                                {isActive && (
                                    <>
                                        <span className="text-gray-300 text-[10px]">|</span>
                                        <button 
                                            onClick={() => onChange([])}
                                            className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            ล้าง
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                            {options.map((opt) => {
                                const isSelected = values.includes(opt.key);
                                return (
                                    <button
                                        key={opt.key}
                                        onClick={() => toggleOption(opt.key)}
                                        className={`w-full flex items-start px-3 py-2.5 mb-1 rounded-xl transition-all text-left ${isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        <div className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 flex items-center justify-center rounded-lg border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 scale-110' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className="text-sm leading-tight">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {options.length === 0 && (
                            <div className="p-4 text-center text-xs text-gray-400 italic">
                                ไม่พบตัวเลือก
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MultiSelectFilter;
