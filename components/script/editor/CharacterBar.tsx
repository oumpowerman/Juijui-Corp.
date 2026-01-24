
import React from 'react';
import { Plus } from 'lucide-react';
import { useScriptContext } from '../core/ScriptContext';
import CharacterManager from '../tools/config/CharacterManager';

// Note: CharacterManager import here is just a placeholder if we want to open it from here too, 
// but for now the Plus button can just trigger a state in context if we wanted, 
// or simply stay as is. However, to keep it clean, we might need a way to open config.

const CharacterBar: React.FC = () => {
    const { scriptType, isChatPreviewOpen, characters, handleInsertCharacter } = useScriptContext();
    // We don't have direct access to setShowConfig from here easily unless we expose it in Context.
    // For now, let's skip the "+" button action or implement a basic prompt if needed, 
    // BUT BETTER: Let's assume the user uses the toolbar gear icon for full management.
    // OR we modify context to allow toggling config.

    if (scriptType !== 'DIALOGUE' || isChatPreviewOpen) return null;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-white/90 backdrop-blur border border-gray-200 p-1.5 rounded-full shadow-md animate-in slide-in-from-top-4">
            {characters.map((char, idx) => (
                <button 
                    key={idx} 
                    onClick={() => handleInsertCharacter(char)} 
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-colors border hover:shadow-sm ${idx % 2 === 0 ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                >
                    {char}
                </button>
            ))}
        </div>
    );
};

export default CharacterBar;
