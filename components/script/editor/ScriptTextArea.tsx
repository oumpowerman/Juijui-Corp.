
import React from 'react';
import { useScriptContext } from '../core/ScriptContext';

const ScriptTextArea: React.FC = () => {
    const { content, setContent, textAreaRef, scriptType, isChatPreviewOpen, isReadOnly } = useScriptContext();

    return (
        <>
            <style>{`
                /* Forced Light/White Scrollbar Styling */
                .script-editor-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #ffffff; /* Thumb Track for Firefox */
                }
                
                /* Webkit (Chrome, Safari, Edge) */
                .script-editor-scroll::-webkit-scrollbar {
                    width: 16px;
                    height: 16px;
                    background-color: #ffffff; /* Explicitly White */
                }
                
                .script-editor-scroll::-webkit-scrollbar-track {
                    background-color: #ffffff; /* Explicitly White */
                    border-left: 1px solid #f8fafc;
                }
                
                .script-editor-scroll::-webkit-scrollbar-thumb {
                    background-color: #e2e8f0; /* Slate-200 (Very Light Gray) */
                    border-radius: 20px;
                    border: 5px solid #ffffff; /* White border creates padding effect */
                    min-height: 40px;
                }
                
                .script-editor-scroll::-webkit-scrollbar-thumb:hover {
                    background-color: #cbd5e1; /* Slate-300 on hover */
                }

                .script-editor-scroll::-webkit-scrollbar-corner {
                    background-color: #ffffff;
                }
            `}</style>
            <div 
                className={`script-editor-scroll flex-1 overflow-y-auto flex justify-center cursor-text bg-white ${isChatPreviewOpen && scriptType === 'DIALOGUE' ? 'hidden md:flex md:w-1/2' : 'w-full'}`} 
                onClick={() => !isReadOnly && textAreaRef.current?.focus()}
            >
                <div className="w-full max-w-5xl h-full p-6 md:p-12 relative">
                    <textarea 
                        ref={textAreaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isReadOnly}
                        className="w-full h-full min-h-[calc(100vh-140px)] resize-none outline-none border-none text-slate-900 text-lg leading-relaxed placeholder:text-gray-300 font-mono bg-white disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                        style={{ fontFamily: '"Courier Prime", "Courier New", monospace' }}
                        placeholder={isReadOnly ? "ไม่สามารถแก้ไขได้ในขณะนี้..." : (scriptType === 'DIALOGUE' ? "เลือกชื่อตัวละครด้านบน หรือพิมพ์เอง..." : "Start typing your script here...")}
                        spellCheck={false}
                    />
                </div>
            </div>
        </>
    );
};

export default ScriptTextArea;
