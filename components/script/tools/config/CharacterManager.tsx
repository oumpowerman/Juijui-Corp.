
import React, { useRef, useEffect } from 'react';
import { Users, Trash2, Plus, X } from 'lucide-react';
import { useScriptContext } from '../../core/ScriptContext';

interface CharacterManagerProps {
    onClose: () => void;
}

const CharacterManager: React.FC<CharacterManagerProps> = ({ onClose }) => {
    const { characters, setCharacters } = useScriptContext();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpdateCharacter = (index: number, val: string) => {
        const newChars = [...characters];
        newChars[index] = val;
        setCharacters(newChars);
    };

    const handleRemoveCharacter = (index: number) => {
        const newChars = [...characters];
        newChars.splice(index, 1);
        setCharacters(newChars);
    };

    const handleAddCharacter = () => {
        setCharacters([...characters, `ตัวละคร ${characters.length + 1}`]);
        // Focus logic could go here
    };

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <>
            {/* Invisible Backdrop to close on click outside */}
            <div className="fixed inset-0 z-[60]" onClick={onClose}></div>

            {/* Floating Panel - Fixed position relative to viewport to avoid overflow issues */}
            <div className="fixed top-16 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-indigo-100 p-5 z-[70] animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-700 flex items-center text-sm">
                        <Users className="w-4 h-4 mr-2 text-indigo-500" /> จัดการตัวละคร
                    </h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto mb-3 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                    {characters.map((char, idx) => (
                        <div key={idx} className="flex gap-2 group">
                            <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
                                <span className="text-[10px] text-gray-400 font-bold mr-2 w-4">{idx + 1}.</span>
                                <input 
                                    type="text" 
                                    className="flex-1 bg-transparent py-1.5 text-sm font-bold text-gray-700 outline-none" 
                                    value={char} 
                                    onChange={(e) => handleUpdateCharacter(idx, e.target.value)} 
                                />
                            </div>
                            <button 
                                onClick={() => handleRemoveCharacter(idx)} 
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                
                <button 
                    onClick={handleAddCharacter} 
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl flex items-center justify-center border border-indigo-200 transition-colors"
                >
                    <Plus className="w-3 h-3 mr-1.5" /> เพิ่มตัวละครใหม่
                </button>
            </div>
        </>
    );
};

export default CharacterManager;
