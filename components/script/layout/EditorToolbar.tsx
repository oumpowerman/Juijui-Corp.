
import React, { useState } from 'react';
import { ArrowLeft, Save, Check, Printer, Clock, Wand2, PlayCircle, LayoutTemplate, Settings, User as UserIcon, Users, MessageSquare, ChevronDown } from 'lucide-react';
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
    { label: 'TikTok Viral (Hook-Value-CTA)', content: "<h2>Hook (3s)</h2><p>[หยุดคนดูด้วยภาพหรือคำพูดแรงๆ]</p><h2>Value (15-45s)</h2><p>[เนื้อหาหลัก/เคล็ดลับ/เรื่องเล่า]</p><ol><li>...</li><li>...</li><li>...</li></ol><h2>CTA (5s)</h2><p>ถ้าชอบฝากกดหัวใจ กดติดตามด้วยนะครับ</p>" },
    { label: 'Vlog (Cinematic)', content: "<p><strong>Scene 1: Intro (B-Roll)</strong></p><p>[ภาพบรรยากาศสวยๆ เพลงประกอบขึ้น]</p><p>Voice over: วันนี้จะพามา...</p><p><strong>Scene 2: Talking Head</strong></p><p>สวัสดีครับทุกคน วันนี้เราอยู่ที่...</p><p><strong>Scene 3: Montage</strong></p><p>[ตัดสลับภาพกิจกรรมรัวๆ]</p><p><strong>Scene 4: Conclusion</strong></p><p>สรุปความประทับใจ...</p>" },
];

const EditorToolbar: React.FC = () => {
    const { 
        title, setTitle, content, status, setStatus, 
        scriptType, setScriptType,
        isSaving, lastSaved,
        onClose,
        setIsAIOpen, setIsTeleprompterOpen,
        isChatPreviewOpen, setIsChatPreviewOpen,
        setContent,
        users, ideaOwnerId
    } = useScriptContext();

    const [showTemplates, setShowTemplates] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showConfig, setShowConfig] = useState(false);

    // Simple estimation for HTML content (stripping tags)
    const textContent = content.replace(/<[^>]*>?/gm, '');
    const estimatedSeconds = Math.ceil(textContent.length / 12); 
    const formattedDuration = `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`;

    // Find Owner
    const owner = users.find(u => u.id === ideaOwnerId);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title} - Juijui Script</title>
                    <style>
                        @page { margin: 2cm; size: A4; }
                        body { 
                            font-family: 'Sarabun', 'Courier Prime', sans-serif; 
                            padding: 20px; 
                            max-width: 800px; 
                            margin: 0 auto; 
                            line-height: 1.6; 
                            color: #000;
                        }
                        h1.script-title { 
                            text-align: center; 
                            font-size: 24px; 
                            text-transform: uppercase; 
                            border-bottom: 2px solid #000; 
                            padding-bottom: 10px; 
                            margin-bottom: 20px; 
                        }
                        .meta {
                            font-size: 12px;
                            color: #666;
                            margin-bottom: 30px;
                            text-align: center;
                            font-family: monospace;
                            border: 1px solid #ddd;
                            padding: 10px;
                            border-radius: 8px;
                        }
                        .content { 
                            font-size: 14pt;
                        }
                        ul { list-style-type: disc; padding-left: 20px; }
                        ol { list-style-type: decimal; padding-left: 20px; }
                        p { margin-bottom: 1rem; }
                        strong { font-weight: bold; }
                        
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                </head>
                <body>
                    <h1 class="script-title">${title}</h1>
                    <div class="meta">
                        OWNER: ${owner?.name || 'Unknown'} | EST: ${formattedDuration} | STATUS: ${status} | DATE: ${new Date().toLocaleDateString('th-TH')}
                    </div>
                    <div class="content">
                        ${content}
                    </div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <>
            {/* Backdrop for closing menus */}
            {(showStatusMenu || showTemplates) && (
                <div className="fixed inset-0 z-[40]" onClick={() => { setShowStatusMenu(false); setShowTemplates(false); }}></div>
            )}

            {/* Main Toolbar - Removed overflow-x-auto to prevent dropdown clipping */}
            <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between shrink-0 z-20 shadow-sm gap-4 relative">
                
                {/* Left: Title & Back */}
                <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col min-w-0 flex-1">
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="font-black text-gray-800 text-xl outline-none bg-transparent placeholder:text-gray-300 w-full md:w-80 truncate"
                            placeholder="Untitled Script"
                        />
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-1 overflow-x-auto scrollbar-hide">
                            {/* Author Info */}
                            {owner && (
                                <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-1.5 py-0.5 rounded-full">
                                    <img src={owner.avatarUrl} className="w-4 h-4 rounded-full object-cover" alt={owner.name} />
                                    <span className="font-bold text-gray-600">{owner.name.split(' ')[0]}</span>
                                </div>
                            )}
                            
                            <span className="text-gray-300">|</span>
                            
                            {isSaving ? (
                                <span className="flex items-center text-indigo-500 shrink-0"><Save className="w-3 h-3 mr-1 animate-pulse" /> Saving...</span>
                            ) : (
                                <span className="flex items-center shrink-0"><Check className="w-3 h-3 mr-1" /> Saved {format(lastSaved, 'HH:mm')}</span>
                            )}
                            
                            <span className="text-gray-300">|</span>
                            
                            <span className="flex items-center shrink-0" title="Estimated Reading Time">
                                <Clock className="w-3 h-3 mr-1" /> ~{formattedDuration}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Controls - Flex wrap on mobile */}
                <div className="flex items-center gap-2 shrink-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
                    
                    {/* Status (Click Toggle) */}
                    <div className="relative mr-2">
                        <button 
                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${STATUS_CONFIG[status].color} hover:opacity-80 active:scale-95 whitespace-nowrap`}
                        >
                            {STATUS_CONFIG[status].label}
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                        {showStatusMenu && (
                            <div className="absolute right-0 md:left-auto left-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 animate-in fade-in zoom-in-95">
                                {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                                    <button 
                                        key={key} 
                                        onClick={() => { setStatus(key as ScriptStatus); setShowStatusMenu(false); }} 
                                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-gray-50 flex items-center justify-between ${status === key ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
                                    >
                                        {conf.label}
                                        {status === key && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mode Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200 shrink-0">
                        <button onClick={() => setScriptType('MONOLOGUE')} className={`p-1.5 rounded transition-all ${scriptType === 'MONOLOGUE' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`} title="Monologue"><UserIcon className="w-4 h-4" /></button>
                        <button onClick={() => setScriptType('DIALOGUE')} className={`p-1.5 rounded transition-all ${scriptType === 'DIALOGUE' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`} title="Dialogue"><Users className="w-4 h-4" /></button>
                    </div>
                    
                    {/* Chat Preview Button (Only Dialogue) */}
                    {scriptType === 'DIALOGUE' && (
                        <button 
                            onClick={() => setIsChatPreviewOpen(!isChatPreviewOpen)}
                            className={`p-2 rounded-lg transition-colors border shrink-0 ${isChatPreviewOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            title={isChatPreviewOpen ? "ปิดตัวอย่างแชท" : "ดูตัวอย่างแชท (Preview)"}
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>
                    )}

                    {/* Character Manager Config */}
                    <button 
                        onClick={() => setShowConfig(true)} 
                        className={`p-2 rounded-lg transition-colors border shrink-0 ${showConfig ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`} 
                        title="จัดการตัวละคร"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>

                    {/* Tools */}
                    <button onClick={() => setIsAIOpen(true)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 shrink-0" title="AI Assistant"><Wand2 className="w-5 h-5" /></button>
                    <button onClick={() => setIsTeleprompterOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shrink-0" title="Teleprompter"><PlayCircle className="w-5 h-5" /></button>
                    
                    {/* Templates */}
                    <div className="relative shrink-0">
                        <button onClick={() => setShowTemplates(!showTemplates)} className={`p-2 rounded-lg transition-colors border ${showTemplates ? 'bg-gray-100 border-gray-300 text-gray-800' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`} title="Templates"><LayoutTemplate className="w-5 h-5" /></button>
                        {showTemplates && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 animate-in fade-in zoom-in-95">
                                <p className="text-xs font-bold text-gray-400 uppercase px-2 py-1">เลือก Template</p>
                                {TEMPLATES.map((tpl, i) => (
                                    <button key={i} onClick={() => { if(confirm("แทนที่เนื้อหาเดิมทั้งหมด?")) { setContent(tpl.content); setShowTemplates(false); }}} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors truncate">{tpl.label}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={handlePrint} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors hidden md:block shrink-0" title="Print / Export PDF"><Printer className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Character Manager rendered outside the overflow container */}
            {showConfig && <CharacterManager onClose={() => setShowConfig(false)} />}
        </>
    );
};

export default EditorToolbar;
