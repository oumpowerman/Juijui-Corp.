
import React from 'react';
import { useScriptContext } from '../core/ScriptContext';
import RichTextEditor from '../../ui/RichTextEditor';

const ScriptTextArea: React.FC = () => {
    const { content, setContent, scriptType, isChatPreviewOpen, isReadOnly, setEditorInstance } = useScriptContext();

    return (
        <div 
            className={`flex-1 flex flex-col bg-white overflow-hidden ${isChatPreviewOpen && scriptType === 'DIALOGUE' ? 'hidden md:flex md:w-1/2' : 'w-full'}`} 
        >
            {/* The RichTextEditor handles scrolling internally */}
            <RichTextEditor 
                content={content}
                onChange={setContent}
                readOnly={isReadOnly}
                onEditorReady={setEditorInstance}
                placeholder={scriptType === 'DIALOGUE' ? "เลือกชื่อตัวละครด้านบน หรือพิมพ์เอง..." : "Start typing your script here... (Highlight text to format)"}
                className="max-w-4xl mx-auto py-8" 
                minHeight="calc(100vh - 200px)"
            />
        </div>
    );
};

export default ScriptTextArea;
