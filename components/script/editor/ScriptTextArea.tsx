
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
            <CharacterBar />

            {/* Dot Grid Pattern Background */}
            <div className="absolute inset-0 opacity-[0.3] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Paper Container */}
            <div className="flex-1 overflow-y-auto cursor-text p-4 md:p-8 flex justify-center scrollbar-thin scrollbar-thumb-indigo-100 relative z-0">
                <div className="w-full max-w-4xl bg-white min-h-[90%] shadow-xl shadow-indigo-100/50 rounded-[2rem] border border-gray-100 relative overflow-hidden">
                     {/* Top Accent Line */}
                     <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
                     
                     <div className="p-6 md:p-10 lg:p-12">
                        <RichTextEditor 
                            content={content}
                            onChange={setContent}
                            readOnly={isReadOnly}
                            onEditorReady={setEditorInstance}
                            placeholder={scriptType === 'DIALOGUE' ? "คลิกเลือกตัวละครด้านบน หรือพิมพ์เอง..." : "เริ่มเขียนบทของคุณที่นี่..."}
                            className="prose prose-lg md:prose-xl max-w-none focus:outline-none" 
                            minHeight="400px"
                        />
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ScriptTextArea;
