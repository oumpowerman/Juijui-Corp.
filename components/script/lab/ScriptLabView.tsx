
import React, { useState, useMemo, useCallback } from 'react';
import { User, Script, Channel, MasterOption, ScriptSummary, LabSequenceItem } from '../../../types';
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
    scriptsApi: any; // Use the type from useScripts if possible, but any for now
    sequence: LabSequenceItem[];
    setSequence: React.Dispatch<React.SetStateAction<LabSequenceItem[]>>;
    labTitle: string;
    setLabTitle: (title: string) => void;
}

const ScriptLabView: React.FC<ScriptLabViewProps> = ({ 
    currentUser, users, channels, masterOptions, onClose, scriptsApi,
    sequence, setSequence, labTitle, setLabTitle
}) => {
    const { createScript, getScriptById, updateScript } = scriptsApi;
    const { showConfirm, showAlert } = useGlobalDialog();

    // State
    const [isSaving, setIsSaving] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [pendingMergedContent, setPendingMergedContent] = useState('');
    const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
    
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
                content: fullScript.content || '',
                activeSheetId: 'main',
                sheets: fullScript.sheets || []
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

    const handleUpdateItemSheet = async (id: string, sheetId: string) => {
        const item = sequence.find(i => i.id === id);
        if (!item || !item.scriptId) return;

        const fullScript = await getScriptById(item.scriptId);
        if (!fullScript) return;

        let newContent = '';
        if (sheetId === 'main') {
            newContent = fullScript.content || '';
        } else {
            const sheet = fullScript.sheets?.find(s => s.id === sheetId);
            newContent = sheet?.content || '';
        }

        setSequence(prev => prev.map(i => i.id === id ? { ...i, activeSheetId: sheetId, content: newContent } : i));
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
                // --- NEW: Update source scripts to mark them as used ---
                const uniqueSourceIds = Array.from(new Set(
                    sequence
                        .filter(item => item.type === 'SCRIPT' && item.scriptId)
                        .map(item => item.scriptId as string)
                ));

                for (const sourceId of uniqueSourceIds) {
                    try {
                        const original = await getScriptById(sourceId);
                        if (original) {
                            const usedSuffix = '(Used in Lab)';
                            const newTitle = original.title.includes(usedSuffix) 
                                ? original.title 
                                : `${original.title} ${usedSuffix}`;
                            
                            const newTags = Array.from(new Set([...(original.tags || []), 'UsedInLab']));
                            
                            await updateScript(sourceId, {
                                title: newTitle,
                                tags: newTags
                            });
                        }
                    } catch (updateErr) {
                        console.error(`Failed to update source script ${sourceId}:`, updateErr);
                        // Don't block the whole process if one update fails
                    }
                }

                // Trigger sidebar refresh
                setSidebarRefreshKey(prev => prev + 1);

                showAlert("บันทึกสคริปต์ใหม่เรียบร้อยแล้ว! และอัปเดตสถานะสคริปต์ต้นฉบับให้แล้ว", "สำเร็จ");
                // Removed auto-close to let user see the "Used" badges in sidebar
                // if (onClose) onClose(); 
            }
        } catch (error) {
            console.error('Error creating script from lab:', error);
            showAlert("เกิดข้อผิดพลาดในการบันทึกสคริปต์", "ผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 1.05, filter: 'blur(15px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(15px)' }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-[100] bg-[#0a0a0f] text-white flex flex-col overflow-hidden font-kanit font-bold"
        >
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
                                    refreshTrigger={sidebarRefreshKey}
                                    scriptsApi={scriptsApi}
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
                            onUpdateItemSheet={handleUpdateItemSheet}
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
        </motion.div>
    );
};

export default ScriptLabView;
