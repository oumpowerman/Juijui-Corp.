
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckSquare, Square, ChevronDown } from 'lucide-react';

interface FormatMultiSelectProps { 
    options: { key: string, label: string }[];
    selectedKeys: string[];
    onChange: (keys: string[]) => void;
}

const FormatMultiSelect: React.FC<FormatMultiSelectProps> = ({ 
    options, 
    selectedKeys = [], 
    onChange 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number, left: number, width: number } | null>(null);

    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
        }
    };

    const toggleOpen = () => {
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const toggleSelection = (key: string) => {
        if (selectedKeys.includes(key)) {
            onChange(selectedKeys.filter(k => k !== key));
        } else {
            onChange([...selectedKeys, key]);
        }
    };

    const displayText = selectedKeys.length === 0 
        ? '(ทุกรูปแบบ)' 
        : selectedKeys.length === 1 
            ? options.find(o => o.key === selectedKeys[0])?.label || selectedKeys[0]
            : `${selectedKeys.length} รูปแบบ`;

    return (
        <div className="relative w-full" ref={containerRef}>
            <button 
                type="button"
                onClick={toggleOpen}
                className={`w-full border-b-2 border-indigo-200 px-1 py-1 text-xs font-bold flex justify-between items-center bg-transparent ${isOpen ? 'border-indigo-400' : ''}`}
            >
                <span className={`truncate ${selectedKeys.length > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {displayText}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400 ml-1 shrink-0" />
            </button>
            
            {isOpen && position && createPortal(
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                    <div 
                        className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 max-h-[200px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            top: position.top,
                            left: position.left,
                            width: position.width
                        }}
                    >
                        {options.map(opt => {
                            const isSelected = selectedKeys.includes(opt.key);
                            return (
                                <div 
                                    key={opt.key}
                                    onClick={() => toggleSelection(opt.key)}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'}`}
                                >
                                    {isSelected 
                                        ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> 
                                        : <Square className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                    }
                                    <span className="truncate">{opt.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default FormatMultiSelect;
