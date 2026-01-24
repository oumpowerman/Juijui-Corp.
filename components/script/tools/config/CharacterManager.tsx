
import React from 'react';
import { Users, Trash2, Plus } from 'lucide-react';
import { useScriptContext } from '../../core/ScriptContext';

const CharacterManager: React.FC = () => {
    const { characters, setCharacters } = useScriptContext();

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
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95">
            <h4 className="font-bold text-gray-700 mb-2 flex items-center text-sm"><Users className="w-4 h-4 mr-2" /> จัดการตัวละคร</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-2">
                {characters.map((char, idx) => (
                    <div key={idx} className="flex gap-2">
                        <input type="text" className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none" value={char} onChange={(e) => handleUpdateCharacter(idx, e.target.value)} />
                        <button onClick={() => handleRemoveCharacter(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
            <button onClick={handleAddCharacter} className="w-full py-2 bg-gray-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 flex items-center justify-center border border-dashed border-gray-300"><Plus className="w-3 h-3 mr-1" /> เพิ่มตัวละคร</button>
        </div>
    );
};

export default CharacterManager;
