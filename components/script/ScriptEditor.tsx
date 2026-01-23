
import React, { useState, useEffect, useRef } from 'react';
import { Script, ScriptStatus, ScriptType, User } from '../../types';
import { ArrowLeft, Save, Check, Printer, Clock, Wand2, PlayCircle, Type, LayoutTemplate, Settings, Plus, Trash2, MessageCircle, User as UserIcon, Users, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';

// Import Tools
import TeleprompterModal from './tools/TeleprompterModal';
import AIDialog from './tools/AIDialog';
import ChatPreview from './tools/ChatPreview';

interface ScriptEditorProps {
    script: Script;
    users: User[]; // Received users list
    onClose: () => void;
    onSave: (id: string, updates: Partial<Script>) => Promise<void>;
    onGenerateAI: (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => Promise<string | null>;
}

const STATUS_CONFIG: Record<ScriptStatus, { label: string, color: string }> = {
    DRAFT: { label: '📝 Draft', color: 'bg-gray-100 text-gray-600' },
    REVIEW: { label: '👀 In Review', color: 'bg-yellow-100 text-yellow-700' },
    FINAL: { label: '✅ Final', color: 'bg-green-100 text-green-700' },
    SHOOTING: { label: '🎬 Shooting', color: 'bg-purple-100 text-purple-700' },
    DONE: { label: '🏁 Done', color: 'bg-emerald-100 text-emerald-700' }
};

const TEMPLATES = [
    { label: 'TikTok Viral (Hook-Value-CTA)', content: "## Hook (3s)\n[หยุดคนดูด้วยภาพหรือคำพูดแรงๆ]\n\n## Value (15-45s)\n[เนื้อหาหลัก/เคล็ดลับ/เรื่องเล่า]\n1. ...\n2. ...\n3. ...\n\n## CTA (5s)\nถ้าชอบฝากกดหัวใจ กดติดตามด้วยนะครับ" },
    { label: 'Vlog (Cinematic)', content: "**Scene 1: Intro (B-Roll)**\n[ภาพบรรยากาศสวยๆ เพลงประกอบขึ้น]\nVoice over: วันนี้จะพามา...\n\n**Scene 2: Talking Head**\nสวัสดีครับทุกคน วันนี้เราอยู่ที่...\n\n**Scene 3: Montage**\n[ตัดสลับภาพกิจกรรมรัวๆ]\n\n**Scene 4: Conclusion**\nสรุปความประทับใจ..." },
    { label: 'Interview / Podcast', content: "พิธีกร: สวัสดีครับ ยินดีต้อนรับเข้าสู่...\n\nแขกรับเชิญ: สวัสดีครับ ขอบคุณที่เชิญมานะครับ\n\nพิธีกร: วันนี้เราจะมาคุยเรื่อง...\n\nแขกรับเชิญ: [เล่าเรื่องราว]..." }
];

const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, users, onClose, onSave, onGenerateAI }) => {
    const { showToast } = useToast();
    
    // Core State
    const [content, setContent] = useState(script.content || '');
    const [title, setTitle] = useState(script.title);
    const [status, setStatus] = useState<ScriptStatus>(script.status);
    const [scriptType, setScriptType] = useState<ScriptType>(script.scriptType || 'MONOLOGUE');
    const [characters, setCharacters] = useState<string[]>(script.characters || ['ตัวละคร A', 'ตัวละคร B']);
    const [ideaOwnerId, setIdeaOwnerId] = useState<string | undefined>(script.ideaOwnerId);
    
    // Save State
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date>(new Date());
    
    // UI Toggles
    const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
    const [isChatPreviewOpen, setIsChatPreviewOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    
    // Logic State
    const [isGenerating, setIsGenerating] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Duration
    const estimatedSeconds = Math.ceil(content.length / 12); 
    const formattedDuration = `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`;

    // Autosave
    useEffect(() => {
        const timer = setTimeout(() => {
            if (
                content !== script.content || 
                title !== script.title || 
                status !== script.status ||
                scriptType !== script.scriptType ||
                ideaOwnerId !== script.ideaOwnerId ||
                JSON.stringify(characters) !== JSON.stringify(script.characters)
            ) {
                handleSave(true);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [content, title, status, scriptType, characters, ideaOwnerId]);

    const handleSave = async (silent = false) => {
        setIsSaving(true);
        await onSave(script.id, { 
            title, 
            content, 
            status, 
            estimatedDuration: estimatedSeconds,
            scriptType,
            characters,
            ideaOwnerId
        });
        setLastSaved(new Date());
        setIsSaving(false);
    };

    // --- LOGIC: AI Generator ---
    const handleGenerateAI = async (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => {
        if (!prompt && type !== 'OUTLINE' && !title) {
             alert("กรุณาใส่หัวข้อ หรือสิ่งที่ต้องการให้ AI ช่วย");
             return;
        }
        setIsGenerating(true);
        const result = await onGenerateAI(prompt || title, type);
        if (result) {
            setContent(prev => prev + "\n\n" + result);
            setIsAIOpen(false);
        }
        setIsGenerating(false);
    };

    // --- LOGIC: Character Management ---
    const handleInsertCharacter = (charName: string) => {
        if (!textAreaRef.current) return;
        const start = textAreaRef.current.selectionStart;
        const end = textAreaRef.current.selectionEnd;
        const textToInsert = `\n\n${charName}: `;
        const newContent = content.substring(0, start) + textToInsert + content.substring(end);
        setContent(newContent);
        setTimeout(() => {
            textAreaRef.current?.focus();
            const newPos = start + textToInsert.length;
            textAreaRef.current?.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleAddCharacter = () => {
        setCharacters([...characters, `ตัวละคร ${characters.length + 1}`]);
    };

    const handleUpdateCharacter = (index: number, val: string) => {
        const newChars = [...characters];
        newChars[index] = val;
        setCharacters(newChars);
    };

    const handleRemoveCharacter = (index: number) => {
        const newChars = [...characters];
        newChars.splice(index, 1);
        setCharacters(newChars);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html><head><title>${title}</title>
                <style>body { font-family: 'Courier Prime', monospace; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; } h1 { text-align: center; text-transform: uppercase; text-decoration: underline; margin-bottom: 40px; } .content { white-space: pre-wrap; }</style>
                </head><body><h1>${title}</h1><div class="content">${content}</div></body></html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-white flex flex-col h-screen animate-in slide-in-from-bottom-10">
            
            {/* 1. Toolbar */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col">
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="font-black text-gray-800 text-xl outline-none bg-transparent placeholder:text-gray-300 w-48 md:w-80 truncate"
                            placeholder="Untitled Script"
                        />
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-1">
                            {isSaving ? (
                                <span className="flex items-center text-indigo-500"><Save className="w-3 h-3 mr-1 animate-pulse" /> Saving...</span>
                            ) : (
                                <span className="flex items-center"><Check className="w-3 h-3 mr-1" /> Saved {format(lastSaved, 'HH:mm')}</span>
                            )}
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center" title="Estimated Reading Time">
                                <Clock className="w-3 h-3 mr-1" /> ~{formattedDuration}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Idea Owner Selector */}
                    <div className="hidden md:flex items-center bg-yellow-50 rounded-lg px-2 py-1 border border-yellow-100" title="เจ้าของไอเดีย">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
                        <select 
                            value={ideaOwnerId || ''} 
                            onChange={(e) => setIdeaOwnerId(e.target.value)}
                            className="bg-transparent text-xs font-bold text-yellow-800 outline-none cursor-pointer max-w-[100px]"
                        >
                            <option value="">(ไม่ระบุ)</option>
                            {users.filter(u => u.isActive).map(u => (
                                <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Select */}
                    <div className="relative group mr-2 hidden md:block">
                        <button className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${STATUS_CONFIG[status].color}`}>
                            {STATUS_CONFIG[status].label}
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-1 hidden group-hover:block z-50">
                            {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                                <button key={key} onClick={() => setStatus(key as ScriptStatus)} className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50 ${status === key ? 'text-indigo-600' : 'text-gray-600'}`}>
                                    {conf.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
                        <button onClick={() => setScriptType('MONOLOGUE')} className={`p-1.5 rounded transition-all ${scriptType === 'MONOLOGUE' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`} title="Monologue"><UserIcon className="w-4 h-4" /></button>
                        <button onClick={() => setScriptType('DIALOGUE')} className={`p-1.5 rounded transition-all ${scriptType === 'DIALOGUE' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`} title="Dialogue"><Users className="w-4 h-4" /></button>
                    </div>

                    {/* Config Popover (Characters) */}
                    <div className="relative">
                        <button onClick={() => setShowConfig(!showConfig)} className={`p-2 rounded-lg transition-colors border ${showConfig ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`} title="จัดการตัวละคร">
                            <Settings className="w-5 h-5" />
                        </button>
                        {showConfig && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95">
                                <h4 className="font-bold text-gray-700 mb-2 flex items-center text-sm"><Users className="w-4 h-4 mr-2" /> จัดการตัวละคร</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto mb-2">
                                    {characters.map((char, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input type="text" className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none" value={char} onChange={(e) => handleUpdateCharacter(idx, e.target.value)} />
                                            <button onClick={() => handleRemoveCharacter(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleAddCharacter} className="w-full py-2 bg-gray-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 flex items-center justify-center border border-dashed border-gray-300"><Plus className="w-3 h-3 mr-1" /> เพิ่มตัวละคร</button>
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    {/* Tools */}
                    <button onClick={() => setIsAIOpen(true)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200" title="AI Assistant"><Wand2 className="w-5 h-5" /></button>
                    
                    {/* Teleprompter (Available in ALL modes) */}
                    <button onClick={() => setIsTeleprompterOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200" title="Teleprompter"><PlayCircle className="w-5 h-5" /></button>
                    
                    {/* Chat Preview (Only for Dialogue) */}
                    {scriptType === 'DIALOGUE' && (
                        <button onClick={() => setIsChatPreviewOpen(!isChatPreviewOpen)} className={`p-2 rounded-lg transition-colors border ${isChatPreviewOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-600 bg-white hover:bg-gray-100 border-gray-200'}`} title="Chat Preview"><MessageCircle className="w-5 h-5" /></button>
                    )}

                    {/* Templates */}
                    <div className="relative">
                        <button onClick={() => setShowTemplates(!showTemplates)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200" title="Templates"><LayoutTemplate className="w-5 h-5" /></button>
                        {showTemplates && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 animate-in fade-in zoom-in-95">
                                <p className="text-xs font-bold text-gray-400 uppercase px-2 py-1">เลือก Template</p>
                                {TEMPLATES.map((tpl, i) => (
                                    <button key={i} onClick={() => { if(confirm("แทนที่เนื้อหา?")) { setContent(tpl.content); setShowTemplates(false); }}} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors truncate">{tpl.label}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={handlePrint} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"><Printer className="w-5 h-5" /></button>
                </div>
            </div>

            {/* 2. Editor Workspace */}
            <div className="flex-1 overflow-hidden flex relative bg-white">
                
                {/* Character Bar (Dialogue Mode) */}
                {scriptType === 'DIALOGUE' && !isChatPreviewOpen && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-white/90 backdrop-blur border border-gray-200 p-1.5 rounded-full shadow-md animate-in slide-in-from-top-4">
                        {characters.map((char, idx) => (
                            <button key={idx} onClick={() => handleInsertCharacter(char)} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors border hover:shadow-sm ${idx % 2 === 0 ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}>
                                {char}
                            </button>
                        ))}
                        <button onClick={() => setShowConfig(true)} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><Plus className="w-3 h-3" /></button>
                    </div>
                )}

                {/* Text Area (Pure White Canvas) */}
                <div className={`flex-1 overflow-y-auto flex justify-center cursor-text bg-white ${isChatPreviewOpen ? 'hidden md:flex md:w-1/2' : 'w-full'}`} onClick={() => textAreaRef.current?.focus()}>
                    <div className="w-full max-w-5xl h-full p-6 md:p-12 relative">
                        <textarea 
                            ref={textAreaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full min-h-[calc(100vh-140px)] resize-none outline-none border-none text-slate-900 text-lg leading-relaxed placeholder:text-gray-300 font-mono bg-white"
                            style={{ fontFamily: '"Courier Prime", "Courier New", monospace' }}
                            placeholder={scriptType === 'DIALOGUE' ? "เลือกชื่อตัวละครด้านบน หรือพิมพ์เอง..." : "Start typing your script here..."}
                            spellCheck={false}
                        />
                    </div>
                </div>

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
            </div>

            {/* Teleprompter Modal */}
            {isTeleprompterOpen && (
                <TeleprompterModal content={content} onClose={() => setIsTeleprompterOpen(false)} />
            )}
        </div>
    );
};

export default ScriptEditor;
