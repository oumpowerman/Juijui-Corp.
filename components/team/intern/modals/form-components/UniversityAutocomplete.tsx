
import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UniversityAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    suggestions: string[];
}

const UniversityAutocomplete: React.FC<UniversityAutocompleteProps> = ({ value, onChange, suggestions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filtered, setFiltered] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value.trim() === '') {
            setFiltered(suggestions.slice(0, 5));
        } else {
            const matches = suggestions.filter(s => 
                s.toLowerCase().includes(value.toLowerCase())
            );
            setFiltered(matches.slice(0, 5));
        }
    }, [value, suggestions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                    required
                    type="text"
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-200 rounded-2xl text-base font-kanit font-medium outline-none transition-all shadow-sm"
                    value={value}
                    onChange={e => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="ชื่อมหาวิทยาลัย"
                />
            </div>

            <AnimatePresence>
                {isOpen && filtered.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden p-1"
                    >
                        {filtered.map((s, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                    onChange(s);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-base font-bold text-gray-700 transition-colors flex items-center gap-3 rounded-xl mb-1 last:mb-0"
                            >
                                <Search className="w-4 h-4 text-indigo-400" />
                                {s}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UniversityAutocomplete;
