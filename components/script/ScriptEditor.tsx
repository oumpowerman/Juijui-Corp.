
import React from 'react';
import { Script, User, Channel, MasterOption } from '../../types';
import { ScriptProvider, useScriptContext } from './core/ScriptContext';
import EditorShell from './layout/EditorShell';
import EditorToolbar from './layout/EditorToolbar';
import ScriptTextArea from './editor/ScriptTextArea';
import CommentSidebar from './editor/CommentSidebar'; // Added

// Tools
import TeleprompterModal from './tools/TeleprompterModal';
import AIDialog from './tools/AIDialog';
import ChatPreview from './tools/ChatPreview';

interface ScriptEditorProps {
    script: Script;
    users: User[];
    channels: Channel[]; // New
    masterOptions: MasterOption[]; // New
    currentUser: User; 
    onClose: () => void;
    onSave: (id: string, updates: Partial<Script>) => Promise<void>;
    onGenerateAI: (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => Promise<string | null>;
    onPromote: (scriptId: string) => void; // Added Prop
}

// Internal component to consume context
const ScriptEditorContent: React.FC = () => {
    const { 
        content, 
        isTeleprompterOpen, setIsTeleprompterOpen,
        isAIOpen, setIsAIOpen,
        isChatPreviewOpen, setIsChatPreviewOpen,
        isGenerating, handleGenerateAI, title,
        scriptType, characters
    } = useScriptContext();

    return (
        <EditorShell>
            <EditorToolbar />
            
            <div className="flex-1 overflow-hidden flex relative bg-white">
                {/* CharacterBar moved inside ScriptTextArea to fix layout */}
                <ScriptTextArea />
                
                {/* Tools Overlay */}
                <AIDialog 
                    isOpen={isAIOpen} 
                    onClose={() => setIsAIOpen(false)} 
                    onGenerate={handleGenerateAI} 
                    isGenerating={isGenerating} 
                    initialTitle={title}
                />
                
                <ChatPreview 
                    content={content} 
                    isOpen={isChatPreviewOpen && scriptType === 'DIALOGUE'} 
                    onClose={() => setIsChatPreviewOpen(false)}
                    characters={characters}
                />

                {/* Comment Sidebar (Right) */}
                <CommentSidebar />
            </div>

            {/* Teleprompter Modal */}
            {isTeleprompterOpen && (
                <TeleprompterModal content={content} onClose={() => setIsTeleprompterOpen(false)} />
            )}
        </EditorShell>
    );
};

// Root Component
const ScriptEditor: React.FC<ScriptEditorProps> = (props) => {
    return (
        <ScriptProvider {...props} onPromote={() => props.onPromote(props.script.id)}>
            <ScriptEditorContent />
        </ScriptProvider>
    );
};

export default ScriptEditor;
