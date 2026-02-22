
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption {
    key: string;
    label: string;
    icon?: string;
}

interface FilterDropdownProps {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
    icon?: React.ReactNode;
    activeColorClass?: string; // e.g., 'bg-pink-50 border-pink-200 text-pink-700'
    placeholder?: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
    label,
    value,
    options,
    onChange,
    icon,
    activeColorClass = 'bg-indigo-50 border-indigo-200 text-indigo-700',
    placeholder = 'ทั้งหมด'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.key === value);
    const isActive = value !== 'ALL';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                title={isActive ? selectedOption?.label : label}
                className={`
                    flex items-center justify-between px-4 py-3 border rounded-2xl text-sm font-bold transition-all active:scale-95
                    ${isActive ? `${activeColorClass} shadow-sm ring-2 ring-offset-1 ring-transparent` : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}
                `}
            >
                <div className="flex items-center gap-2 truncate max-w-[120px]">
                    {icon && <span className={isActive ? '' : 'text-gray-400'}>{icon}</span>}
                    <span className="truncate">
                        {isActive ? selectedOption?.label : `${label}`}
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
                        className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-2 overflow-hidden origin-top-left"
                    >
                        <div className="text-[10px] font-black text-gray-400 px-3 py-2 mb-1 uppercase tracking-widest bg-gray-50/50 rounded-xl">
                            เลือก {label}
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                            <button
                                onClick={() => { onChange('ALL'); setIsOpen(false); }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 mb-1 rounded-xl transition-all ${value === 'ALL' ? 'bg-gray-100 text-gray-900 font-black' : 'hover:bg-gray-50 text-gray-500'}`}
                            >
                                <span className="text-sm">ทั้งหมด</span>
                                {value === 'ALL' && <Check className="w-4 h-4" />}
                            </button>

                            {options.map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => { onChange(opt.key); setIsOpen(false); }}
                                    className={`w-full flex items-start justify-between px-3 py-2.5 mb-1 rounded-xl transition-all text-left ${value === opt.key ? 'bg-indigo-50 text-indigo-700 font-black' : 'hover:bg-gray-50 text-gray-600'}`}
                                >
                                    <div className="flex items-start gap-2">
                                        {opt.icon && <span className="mt-0.5">{opt.icon}</span>}
                                        <span className="text-sm leading-tight">{opt.label}</span>
                                    </div>
                                    {value === opt.key && <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FilterDropdown;
