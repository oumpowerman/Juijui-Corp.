
import React, { useState, useMemo, useCallback } from 'react';
import { User, Script, Channel, MasterOption, ScriptSummary } from '../../../types';
import { useScripts } from '../../../hooks/useScripts';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import LabSidebar from './LabSidebar';
import LabMixer from './LabMixer';
import LabPreview from './LabPreview';
import CreateScriptModal from '../hub/CreateScriptModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, Save, X, ArrowRight, Wand2, Plus, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

interface ScriptLabViewProps {
    currentUser: User;
    users: User[];
    channels: Channel[];
    masterOptions: MasterOption[];
    onClose?: () => void;
}

export interface LabSequenceItem {
    id: string; // Unique ID for DnD
    scriptId?: string; // Original script ID if it's a script block
    type: 'SCRIPT' | 'BRIDGE';
    title: string;
    content: string;
}

const ScriptLabView: React.FC<ScriptLabViewProps> = ({ 
    currentUser, users, channels, masterOptions, onClose 
}) => {
    const { createScript, getScriptById } = useScripts(currentUser);
    const { showConfirm, showAlert } = useGlobalDialog();

    // State
    const [sequence, setSequence] = useState<LabSequenceItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [labTitle, setLabTitle] = useState(`Lab Mix - ${new Date().toLocaleDateString()}`);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [pendingMergedContent, setPendingMergedContent] = useState('');
    
    // Panel visibility
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isPreviewVisible, setIsPreviewVisible] = useState(true);

    // Handlers
    const handleAddScript = async (scriptSummary: ScriptSummary) => {
        const fullScript = await getScriptById(scriptSummary.id);
        if (fullScript) {
            const newItem: LabSequenceItem = {
                id: `lab_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                scriptId: fullScript.id,
                type: 'SCRIPT',
                title: fullScript.title,
                content: fullScript.content || ''
            };
            setSequence(prev => [...prev, newItem]);
        }
    };

    const handleAddBridge = () => {
        const newItem: LabSequenceItem = {
            id: `lab_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'BRIDGE',
            title: 'Bridge / Transition',
            content: ''
        };
        setSequence(prev => [...prev, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        setSequence(prev => prev.filter(item => item.id !== id));
    };

    const handleUpdateItemContent = (id: string, newContent: string) => {
        setSequence(prev => prev.map(item => item.id === id ? { ...item, content: newContent } : item));
    };

    const handleUpdateItemTitle = (id: string, newTitle: string) => {
        setSequence(prev => prev.map(item => item.id === id ? { ...item, title: newTitle } : item));
    };

    const handleSaveAsNew = async () => {
        if (sequence.length === 0) {
            showAlert("กรุณาเพิ่มสคริปต์อย่างน้อย 1 รายการก่อนบันทึก", "ข้อมูลไม่ครบ");
            return;
        }

        const mergedContent = sequence.map(item => {
            if (item.type === 'BRIDGE') {
                return `\n\n--- ${item.title} ---\n${item.content}\n\n`;
            }
            return item.content;
        }).join('\n\n');

        setPendingMergedContent(mergedContent);
        setIsCreateModalOpen(true);
    };

    const handleModalSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            const newScriptId = await createScript({
                ...data,
                status: 'DRAFT',
                isPersonal: true
            });

            if (newScriptId) {
                showAlert("บันทึกสคริปต์ใหม่เรียบร้อยแล้ว! คุณสามารถดูได้ที่หน้า Studio", "สำเร็จ");
                if (onClose) onClose();
            }
        } catch (error) {
            console.error('Error creating script from lab:', error);
            showAlert("เกิดข้อผิดพลาดในการบันทึกสคริปต์", "ผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0f] text-white flex flex-col overflow-hidden font-kanit font-bold">
            {/* Header */}
            <header className="h-20 border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                        <Beaker className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <input 
                            type="text"
                            value={labTitle}
                            onChange={e => setLabTitle(e.target.value)}
                            className="bg-transparent border-none outline-none text-xl font-black text-white placeholder:text-white/20 w-64 focus:ring-0 font-kanit font-bold"
                            placeholder="ตั้งชื่อโปรเจกต์ Lab..."
                        />
                        <p className="text-[10px] text-indigo-400 font-black tracking-widest uppercase">Script Mixer Lab v1.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10">
                        <button 
                            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                            className={`p-2 rounded-xl transition-all ${isSidebarVisible ? 'bg-indigo-500 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            <PanelLeftClose className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                            className={`p-2 rounded-xl transition-all ${isPreviewVisible ? 'bg-indigo-500 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            <PanelRightClose className="w-5 h-5" />
                        </button>
                    </div>

                    <button 
                        onClick={handleSaveAsNew}
                        disabled={isSaving || sequence.length === 0}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl font-semibold text-base tracking-wide text-white drop-shadow-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:grayscale font-kanit"
                    >
                        {isSaving ? <Wand2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        บันทึกเป็นสคริปต์ใหม่
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-white/10 rounded-2xl transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Main Content with Resizable Panels */}
            <main className="flex-1 overflow-hidden">
                <PanelGroup direction="horizontal">
                    {/* Sidebar Panel */}
                    {isSidebarVisible && (
                        <>
                            <Panel defaultSize={20} minSize={15} maxSize={30}>
                                <LabSidebar 
                                    currentUser={currentUser}
                                    users={users}
                                    channels={channels}
                                    masterOptions={masterOptions}
                                    onAddScript={handleAddScript}
                                />
                            </Panel>
                            <PanelResizeHandle className="w-1 bg-white/5 hover:bg-indigo-500/50 transition-colors cursor-col-resize" />
                        </>
                    )}

                    {/* Mixer Panel (Center) */}
                    <Panel minSize={30}>
                        <LabMixer 
                            sequence={sequence}
                            setSequence={setSequence}
                            onRemoveItem={handleRemoveItem}
                            onUpdateItemContent={handleUpdateItemContent}
                            onUpdateItemTitle={handleUpdateItemTitle}
                            onAddBridge={handleAddBridge}
                        />
                    </Panel>

                    {/* Preview Panel */}
                    {isPreviewVisible && (
                        <>
                            <PanelResizeHandle className="w-1 bg-white/5 hover:bg-indigo-500/50 transition-colors cursor-col-resize" />
                            <Panel defaultSize={35} minSize={25} maxSize={50}>
                                <LabPreview 
                                    sequence={sequence}
                                    labTitle={labTitle}
                                />
                            </Panel>
                        </>
                    )}
                </PanelGroup>
            </main>

            {/* Create Script Modal */}
            <CreateScriptModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleModalSubmit}
                channels={channels}
                masterOptions={masterOptions}
                users={users}
                currentUser={currentUser}
                mode="STUDIO"
                initialTitle={labTitle}
                initialContent={pendingMergedContent}
            />
        </div>
    );
};

export default ScriptLabView;
