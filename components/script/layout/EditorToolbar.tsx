
import React, { useState } from 'react';
import { ArrowLeft, Save, Check, Printer, Clock, Wand2, PlayCircle, LayoutTemplate, Settings, User as UserIcon, Users, Lightbulb, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ScriptStatus } from '../../../types';
import { useScriptContext } from '../core/ScriptContext';
import CharacterManager from '../tools/config/CharacterManager';

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

const EditorToolbar: React.FC = () => {
    const { 
        title, setTitle, content, status, setStatus, 
        scriptType, setScriptType, ideaOwnerId, setIdeaOwnerId,
        isSaving, lastSaved,
        users, onClose,
        setIsAIOpen, setIsTeleprompterOpen,
        isChatPreviewOpen, setIsChatPreviewOpen,
        setContent
    } = useScriptContext();

    const [showTemplates, setShowTemplates] = useState(false);
    const [showConfig, setShowConfig] = useState(false);

    const estimatedSeconds = Math.ceil(content.length / 12); 
    const formattedDuration = `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`;

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
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0 z-20 shadow-sm">
            {/* Left: Title & Back */}
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

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
                {/* Idea Owner */}
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

                {/* Status */}
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

                {/* Character Manager Popover */}
                <div className="relative">
                    <button onClick={() => setShowConfig(!showConfig)} className={`p-2 rounded-lg transition-colors border ${showConfig ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`} title="จัดการตัวละคร">
                        <Settings className="w-5 h-5" />
                    </button>
                    {showConfig && <CharacterManager />}
                </div>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                {/* Tools */}
                <button onClick={() => setIsAIOpen(true)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200" title="AI Assistant"><Wand2 className="w-5 h-5" /></button>
                <button onClick={() => setIsTeleprompterOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200" title="Teleprompter"><PlayCircle className="w-5 h-5" /></button>
                
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
    );
};

export default EditorToolbar;
