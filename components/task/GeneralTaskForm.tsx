
import React, { useState } from 'react';
import { Task, User, MasterOption, Script, Channel } from '../../types';
import GeneralTaskInputs from './GeneralTaskInputs';
import ScriptEditor from '../script/ScriptEditor';
import { useScripts } from '../../hooks/useScripts';
import { Loader2 } from 'lucide-react';

interface GeneralTaskFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    users: User[];
    masterOptions: MasterOption[];
    currentUser?: User; 
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
    projects?: Task[]; 
    channels?: Channel[]; // Add optional channels prop
}

const GeneralTaskForm: React.FC<GeneralTaskFormProps> = (props) => {
    // State for Overlay Mode
    const [editorScript, setEditorScript] = useState<Script | null>(null);
    const [isLoadingScript, setIsLoadingScript] = useState(false);
    
    // Script Hook for Fetching
    const { getScriptById, updateScript, generateScriptWithAI } = useScripts(props.currentUser || { id: '', name: '', role: 'MEMBER' } as User);

    // --- Actions ---

    // 1. Open Editor (Called from Inputs when "Open Script" is clicked)
    const handleOpenEditor = async (scriptId: string) => {
        setIsLoadingScript(true);
        try {
            const script = await getScriptById(scriptId);
            if (script) {
                setEditorScript(script);
            } else {
                alert("ไม่สามารถโหลดข้อมูลสคริปต์ได้");
            }
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาดในการโหลดสคริปต์");
        } finally {
            setIsLoadingScript(false);
        }
    };

    // 2. Close Editor (Return to Form)
    const handleCloseEditor = () => {
        setEditorScript(null);
    };

    // --- RENDER ---

    // Loading Overlay
    if (isLoadingScript) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500 font-bold">กำลังโหลดสคริปต์...</p>
            </div>
        );
    }

    // Editor Overlay Mode
    if (editorScript && props.currentUser) {
        return (
            <div className="absolute inset-0 z-50 bg-white animate-in zoom-in-95 duration-200">
                <ScriptEditor 
                    script={editorScript}
                    users={props.users}
                    channels={props.channels || []} // Pass channels (fallback to empty)
                    masterOptions={props.masterOptions}
                    currentUser={props.currentUser}
                    onClose={handleCloseEditor}
                    onSave={updateScript}
                    onGenerateAI={generateScriptWithAI}
                    onPromote={() => {}} // General Tasks usually don't promote to content directly here
                />
            </div>
        );
    }

    // Default: Form Inputs
    return (
        <GeneralTaskInputs 
            {...props}
            onEditScript={handleOpenEditor}
        />
    );
};

export default GeneralTaskForm;
