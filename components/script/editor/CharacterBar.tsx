
import React from 'react';
import { useScriptContext } from '../core/ScriptContext';

const CharacterBar: React.FC = () => {
    const { scriptType, isChatPreviewOpen, characters, handleInsertCharacter } = useScriptContext();

    if (scriptType !== 'DIALOGUE' || isChatPreviewOpen) return null;

    return (
        <div className="w-full bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide z-10 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2 shrink-0">
                ตัวละคร:
            </span>
            {characters.map((char, idx) => (
                <button 
                    key={idx} 
                    onMouseDown={(e) => {
                        e.preventDefault(); // Prevent button from stealing focus from editor before logic runs
                        handleInsertCharacter(char);
                    }}
                    className={`
                        px-3 py-1.5 text-xs font-bold rounded-lg transition-all border shadow-sm active:scale-95 whitespace-nowrap
                        ${idx % 2 === 0 
                            ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 hover:border-blue-200' 
                            : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100 hover:border-green-200'}
                    `}
                >
                    {char}
                </button>
            ))}
        </div>
    );
};

export default CharacterBar;
