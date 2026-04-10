
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface ToolbarDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string; preview?: string }[];
    icon?: React.ElementType;
    title?: string;
    className?: string;
    width?: string;
    placeholder?: string;
    variant?: 'light' | 'dark';
}

const ToolbarDropdown: React.FC<ToolbarDropdownProps> = ({ 
    value, 
    onChange, 
    options, 
    icon: Icon, 
    title, 
    className = '',
    width = 'w-32',
    placeholder = 'Select...',
    variant = 'light'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 h-8 px-2.5 ${variant === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50'} rounded-lg shadow-sm 
                    transition-all active:scale-95 ${width}
                `}
                title={title}
                type="button"
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    {Icon && <Icon className="w-3 h-3 text-gray-400 shrink-0" />}
                    <span className={`text-[10px] font-black ${variant === 'dark' ? 'text-white/60' : 'text-gray-600'} truncate`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute top-full left-0 mt-1 ${variant === 'dark' ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-gray-100'} rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px] py-1`}
                    >
                        <div className="max-h-60 overflow-y-auto no-scrollbar">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold transition-colors
                                        ${value === option.value 
                                            ? (variant === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                                            : (variant === 'dark' ? 'text-white/60 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50')}
                                    `}
                                    type="button"
                                >
                                    <span style={option.preview ? { fontFamily: option.preview } : {}}>
                                        {option.label}
                                    </span>
                                    {value === option.value && <Check className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ToolbarDropdown;
