
import React from 'react';
import { useScriptContext } from '../core/ScriptContext';
import { Plus, Users } from 'lucide-react';

const CharacterBar: React.FC = () => {
    const { scriptType, isChatPreviewOpen, characters, handleInsertCharacter } = useScriptContext();

    if (scriptType !== 'DIALOGUE' || isChatPreviewOpen) return null;

    // Pre-defined vibrant but soft colors for characters
    const CHAR_COLORS = [
        'bg-rose-100 text-rose-600 border-rose-200 hover:bg-rose-200 hover:border-rose-300',
        'bg-sky-100 text-sky-600 border-sky-200 hover:bg-sky-200 hover:border-sky-300',
        'bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-emerald-200 hover:border-emerald-300',
        'bg-amber-100 text-amber-600 border-amber-200 hover:bg-amber-200 hover:border-amber-300',
        'bg-violet-100 text-violet-600 border-violet-200 hover:bg-violet-200 hover:border-violet-300',
    ];

    return (
        <div className="w-full bg-white/50 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide z-10 shrink-0 shadow-sm relative">
            <div className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-wider mr-2 shrink-0 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                <Users className="w-3.5 h-3.5" /> Characters
            </div>
            
            {characters.map((char, idx) => {
                const colorClass = CHAR_COLORS[idx % CHAR_COLORS.length];
                return (
                    <button 
                        key={idx} 
                        onMouseDown={(e) => {
                            e.preventDefault(); 
                            handleInsertCharacter(char);
                        }}
                        className={`
                            group relative px-4 py-2 text-xs font-black rounded-2xl transition-all duration-300 border-2 shadow-sm
                            ${colorClass}
                            hover:scale-105 active:scale-95 active:rotate-2
                        `}
                    >
                        {char}
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-50 group-hover:animate-ping"></span>
                    </button>
                );
            })}
            
            {/* Visual separator/adder hint (Functional via Config) */}
             <div className="w-px h-6 bg-gray-200 mx-1 shrink-0"></div>
             <span className="text-[10px] text-gray-300 font-medium italic shrink-0">
                Manage in <span className="font-bold">Settings ⚙️</span>
             </span>
        </div>
    );
};

export default CharacterBar;
