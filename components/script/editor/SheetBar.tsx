
import React, { useState } from 'react';
import { useScriptContext } from '../core/ScriptContext';
import { Plus, X, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SheetBar: React.FC = () => {
    const { 
        sheets, activeSheetId, setActiveSheetId, addSheet, deleteSheet, renameSheet,
        isReadOnly
    } = useScriptContext();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleStartEdit = (id: string, title: string) => {
        if (isReadOnly) return;
        setEditingId(id);
        setEditValue(title);
    };

    const handleSaveEdit = (id: string) => {
        if (editValue.trim()) {
            renameSheet(id, editValue.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="flex items-center bg-gray-100 border-t border-gray-200 px-2 h-10 overflow-x-auto no-scrollbar shrink-0">
            {/* Main Sheet */}
            <button
                onClick={() => setActiveSheetId('main')}
                className={`flex items-center px-4 h-full text-sm font-medium transition-colors border-r border-gray-200 whitespace-nowrap ${
                    activeSheetId === 'main' 
                    ? 'bg-white text-indigo-600 border-t-2 border-t-indigo-600' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
                หน้าหลัก
            </button>

            {/* Sub Sheets */}
            <AnimatePresence>
                {sheets.map((sheet) => (
                    <motion.div
                        key={sheet.id}
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className={`flex items-center h-full border-r border-gray-200 group whitespace-nowrap ${
                            activeSheetId === sheet.id 
                            ? 'bg-white border-t-2 border-t-indigo-600' 
                            : 'bg-gray-50 hover:bg-gray-200'
                        }`}
                    >
                        {editingId === sheet.id ? (
                            <div className="flex items-center px-2">
                                <input
                                    autoFocus
                                    className="text-sm px-1 py-0.5 border border-indigo-300 rounded outline-none w-24"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => handleSaveEdit(sheet.id)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(sheet.id)}
                                />
                                <Check size={14} className="ml-1 text-green-600 cursor-pointer" onClick={() => handleSaveEdit(sheet.id)} />
                            </div>
                        ) : (
                            <div 
                                className="flex items-center h-full"
                                onClick={() => setActiveSheetId(sheet.id)}
                            >
                                <span className={`px-4 text-sm cursor-pointer ${activeSheetId === sheet.id ? 'text-indigo-600 font-medium' : 'text-gray-600'}`}>
                                    {sheet.title}
                                </span>
                                {!isReadOnly && (
                                    <div className="flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 
                                            size={12} 
                                            className="text-gray-400 hover:text-indigo-600 cursor-pointer mr-1" 
                                            onClick={(e) => { e.stopPropagation(); handleStartEdit(sheet.id, sheet.title); }}
                                        />
                                        <X 
                                            size={12} 
                                            className="text-gray-400 hover:text-red-500 cursor-pointer" 
                                            onClick={(e) => { e.stopPropagation(); deleteSheet(sheet.id); }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Add Button */}
            {!isReadOnly && (
                <button
                    onClick={addSheet}
                    className="flex items-center justify-center w-10 h-full text-gray-400 hover:text-indigo-600 hover:bg-gray-200 transition-colors shrink-0"
                    title="เพิ่มหน้าใหม่"
                >
                    <Plus size={18} />
                </button>
            )}
        </div>
    );
};

export default SheetBar;
