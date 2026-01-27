
import React from 'react';
import { useScriptContext } from '../core/ScriptContext';
import RichTextEditor from '../../ui/RichTextEditor';
import CharacterBar from './CharacterBar';

const ScriptTextArea: React.FC = () => {
    const { content, setContent, scriptType, isChatPreviewOpen, isReadOnly, setEditorInstance } = useScriptContext();

    return (
        <div 
            className={`
                flex-1 flex flex-col bg-[#f8fafc] overflow-hidden relative
                ${isChatPreviewOpen && scriptType === 'DIALOGUE' ? 'hidden md:flex md:w-1/2' : 'w-full'}
            `} 
        >
            {/* Character Bar (Fixed at top) */}
            <CharacterBar />

            {/* Dot Grid Pattern Background (Fixed behind) */}
            <div className="absolute inset-0 opacity-[0.3] pointer-events-none z-0" 
                 style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Main Scrollable Area */}
            <div className="flex-1 overflow-y-auto cursor-text relative z-0 scrollbar-thin scrollbar-thumb-indigo-100">
                <div className="flex justify-center p-4 md:p-8 min-h-full">
                    
                    {/* Paper Container - Removed overflow-hidden to allow sticky toolbar */}
                    <div className="w-full max-w-4xl bg-white shadow-xl shadow-indigo-100/50 rounded-[2rem] border border-gray-100 relative flex flex-col">
                        
                        {/* Top Accent Line (Rounded top only) */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-t-[2rem]"></div>
                        
                        {/* Content Area */}
                        <div className="p-6 md:p-10 lg:p-12 flex-1">
                            <RichTextEditor 
                                content={content}
                                onChange={setContent}
                                readOnly={isReadOnly}
                                onEditorReady={setEditorInstance}
                                placeholder={scriptType === 'DIALOGUE' ? "คลิกเลือกตัวละครด้านบน หรือพิมพ์เอง..." : "เริ่มเขียนบทของคุณที่นี่..."}
                                className="prose prose-lg md:prose-xl max-w-none focus:outline-none" 
                                minHeight="500px"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ScriptTextArea;
