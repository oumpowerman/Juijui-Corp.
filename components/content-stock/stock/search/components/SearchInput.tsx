import React from 'react';
import { Search, X, Hash } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (val: string) => void;
    onFocus: () => void;
    showSuggestions: boolean;
    onHashClick: (e: React.MouseEvent) => void;
    onClear: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    onFocus,
    showSuggestions,
    onHashClick,
    onClear
}) => {
    return (
        <>
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors ${showSuggestions ? 'z-[102]' : ''}`} />
            <input 
                type="text" 
                placeholder="ชื่อ, หมายเหตุ หรือพิมพ์ # ตามด้วยแท็ก..." 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                className={`w-full h-full pl-11 pr-20 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 focus:bg-white outline-none text-sm font-bold text-gray-700 transition-all placeholder:font-normal placeholder:text-gray-400 min-h-[50px] ${showSuggestions ? 'relative z-[102] bg-white border-indigo-300 shadow-sm' : ''}`}
            />
            
            {/* Minimalist Action Buttons inside input container */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {value && (
                    <button 
                        type="button"
                        onClick={onClear} 
                        className={`text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors ${showSuggestions ? 'z-[102]' : ''}`}
                        title="ล้างคำค้นหา"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={onHashClick}
                    className={`
                        p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center active:scale-95 min-h-[30px] min-w-[30px]
                        ${value.startsWith('#')
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-gray-700 hover:bg-gray-100'}
                        ${showSuggestions ? 'z-[102]' : ''}
                    `}
                    title="กรอกเครื่องหมาย # ด่วน"
                >
                    <Hash className="w-3.5 h-3.5" />
                </button>
            </div>
        </>
    );
};
