
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { MasterOption } from '../../types';

interface OptionSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    options: MasterOption[];
    selectedKey: string;
    onSelect: (key: string) => void;
    colorTheme: 'pink' | 'blue' | 'emerald';
}

const OptionSelectionModal: React.FC<OptionSelectionModalProps> = ({ 
    isOpen, onClose, title, options, selectedKey, onSelect, colorTheme 
}) => {
    if (!isOpen) return null;

    // Theme mapping
    const themeStyles = {
        pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', activeRing: 'ring-pink-400', activeBg: 'bg-pink-100', icon: 'text-pink-500' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', activeRing: 'ring-blue-400', activeBg: 'bg-blue-100', icon: 'text-blue-500' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', activeRing: 'ring-emerald-400', activeBg: 'bg-emerald-100', icon: 'text-emerald-500' },
    };
    const theme = themeStyles[colorTheme];

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 relative border-4 border-white">
                
                {/* Header */}
                <div className={`px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0 ${theme.bg}`}>
                    <div>
                        <h3 className={`text-2xl font-black tracking-tight ${theme.text}`}>{title}</h3>
                        <p className="text-gray-500 text-sm font-medium opacity-80">เลือกรายการที่ต้องการ</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-500 shadow-sm">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Grid */}
                <div className="p-6 overflow-y-auto bg-[#f8fafc] scrollbar-thin scrollbar-thumb-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {options.map(option => {
                            const isSelected = selectedKey === option.key;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => { onSelect(option.key); onClose(); }}
                                    className={`
                                        relative flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all duration-200 group
                                        ${isSelected 
                                            ? `bg-white ${theme.border} ${theme.activeRing} ring-2 shadow-lg scale-[1.02] z-10` 
                                            : 'bg-white border-transparent shadow-sm hover:border-gray-200 hover:shadow-md hover:-translate-y-1'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between w-full items-start mb-2">
                                        <div className={`w-3 h-3 rounded-full ${option.color.split(' ')[0].replace('text-', 'bg-') || 'bg-gray-200'}`}></div>
                                        {isSelected && <div className={`p-1 rounded-full ${theme.activeBg} ${theme.text}`}><Check className="w-3 h-3 stroke-[4px]" /></div>}
                                    </div>
                                    
                                    <h4 className={`font-black text-lg leading-tight mb-1 ${isSelected ? theme.text : 'text-gray-700'}`}>
                                        {option.label}
                                    </h4>
                                    
                                    {option.description && (
                                        <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-3">
                                            {option.description}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OptionSelectionModal;
