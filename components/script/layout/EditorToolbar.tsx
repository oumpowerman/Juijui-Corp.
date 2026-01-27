
import React, { useState } from 'react';
import { ArrowLeft, Save, Check, Printer, Clock, Wand2, PlayCircle, LayoutTemplate, Settings, User as UserIcon, Users, MessageSquare, ChevronDown, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ScriptStatus } from '../../../types';
import { useScriptContext } from '../core/ScriptContext';
import CharacterManager from '../tools/config/CharacterManager';

const STATUS_CONFIG: Record<ScriptStatus, { label: string, color: string, icon: string }> = {
    DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '📝' },
    REVIEW: { label: 'In Review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: '👀' },
    FINAL: { label: 'Final', color: 'bg-green-50 text-green-700 border-green-200', icon: '✅' },
    SHOOTING: { label: 'Shooting', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🎬' },
    DONE: { label: 'Done', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🏁' }
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

    const textContent = content.replace(/<[^>]*>?/gm, '');
    const estimatedSeconds = Math.ceil(textContent.length / 12); 
    const formattedDuration = `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`;
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
                        body { font-family: 'Sarabun', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #000; }
                        h1.script-title { text-align: center; font-size: 24px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                        .meta { font-size: 12px; color: #666; margin-bottom: 30px; text-align: center; border: 1px solid #ddd; padding: 10px; border-radius: 8px; }
                        .content { font-size: 14pt; }
                        ul { list-style-type: disc; padding-left: 20px; }
                        ol { list-style-type: decimal; padding-left: 20px; }
                    </style>
                    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                </head>
                <body>
                    <h1 class="script-title">${title}</h1>
                    <div class="meta">OWNER: ${owner?.name || 'Unknown'} | EST: ${formattedDuration} | STATUS: ${status}</div>
                    <div class="content">${content}</div>
                    <script>window.onload = function() { window.print(); }</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <>
            {(showStatusMenu || showTemplates) && (
                <div className="fixed inset-0 z-[40]" onClick={() => { setShowStatusMenu(false); setShowTemplates(false); }}></div>
            )}

            {/* Main Toolbar - More Padding, Rounder, Glass effect */}
            <div className="bg-white/80 backdrop-blur-md border-b border-indigo-50 px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between shrink-0 z-20 shadow-sm gap-4 relative transition-all">
                
                {/* Left: Back & Title */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={onClose} 
                        className="group p-2.5 bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 rounded-2xl transition-all duration-300 hover:-rotate-12 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                    </button>
                    
                    <div className="flex flex-col min-w-0 flex-1">
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="font-black text-gray-800 text-xl outline-none bg-transparent placeholder:text-gray-300 w-full md:w-80 truncate focus:scale-[1.02] transition-transform origin-left"
                            placeholder="Untitled Script ✨"
                        />
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold mt-1 overflow-x-auto scrollbar-hide">
                            {owner && (
                                <div className="flex items-center gap-1.5 shrink-0 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                    <img src={owner.avatarUrl} className="w-4 h-4 rounded-full object-cover ring-2 ring-white" alt={owner.name} />
                                    <span className="text-indigo-600">{owner.name.split(' ')[0]}</span>
                                </div>
                            )}
                            
                            <span className="flex items-center shrink-0">
                                {isSaving ? <Save className="w-3 h-3 mr-1 animate-spin text-indigo-400" /> : <Check className="w-3 h-3 mr-1 text-green-500" />} 
                                {isSaving ? 'Saving...' : `Saved ${format(lastSaved, 'HH:mm')}`}
                            </span>
                            
                            <span className="flex items-center shrink-0" title="Estimated Reading Time">
                                <Clock className="w-3 h-3 mr-1 text-orange-400" /> {formattedDuration}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2 shrink-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide w-full md:w-auto pl-1">
                    
                    {/* Status Pill */}
                    <div className="relative mr-2">
                        <button 
                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                            className={`
                                h-10 px-4 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border shadow-sm active:scale-95
                                ${STATUS_CONFIG[status].color} hover:shadow-md
                            `}
                        >
                            <span className="text-lg">{STATUS_CONFIG[status].icon}</span>
                            {STATUS_CONFIG[status].label}
                            <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                        </button>
                        {showStatusMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-indigo-50 p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                                    <button 
                                        key={key} 
                                        onClick={() => { setStatus(key as ScriptStatus); setShowStatusMenu(false); }} 
                                        className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl flex items-center justify-between transition-colors mb-1 ${status === key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <span className="flex items-center gap-2"><span className="text-lg">{conf.icon}</span> {conf.label}</span>
                                        {status === key && <Check className="w-3 h-3 text-indigo-600" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mode Toggle (Pill Switch) */}
                    <div className="bg-gray-100 p-1 rounded-xl flex border border-gray-200 shrink-0 h-10 items-center">
                        <button onClick={() => setScriptType('MONOLOGUE')} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${scriptType === 'MONOLOGUE' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`} title="Monologue"><UserIcon className="w-3.5 h-3.5" /> Mono</button>
                        <button onClick={() => setScriptType('DIALOGUE')} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${scriptType === 'DIALOGUE' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`} title="Dialogue"><Users className="w-3.5 h-3.5" /> Dial</button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>
                    
                    {/* Action Buttons (Square-ish with soft corners) */}
                    {scriptType === 'DIALOGUE' && (
                        <button 
                            onClick={() => setIsChatPreviewOpen(!isChatPreviewOpen)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border shadow-sm hover:-translate-y-0.5 active:translate-y-0 ${isChatPreviewOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                            title="Chat Preview"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>
                    )}

                    <button 
                        onClick={() => setShowConfig(true)} 
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border shadow-sm hover:-translate-y-0.5 active:translate-y-0 ${showConfig ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                        title="Character Manager"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    {/* Magic AI Button */}
                    <button onClick={() => setIsAIOpen(true)} className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl shadow-lg shadow-purple-200 transition-all hover:scale-110 active:scale-95 border-2 border-white/20" title="AI Magic">
                        <Wand2 className="w-5 h-5" />
                    </button>
                    
                    <button onClick={() => setIsTeleprompterOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 hover:bg-green-50 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0" title="Teleprompter">
                        <PlayCircle className="w-5 h-5" />
                    </button>
                    
                    {/* Templates Dropdown */}
                    <div className="relative shrink-0">
                        <button onClick={() => setShowTemplates(!showTemplates)} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0" title="Templates">
                            <LayoutTemplate className="w-5 h-5" />
                        </button>
                        {showTemplates && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-orange-100 p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                <p className="text-[10px] font-black text-orange-400 uppercase px-3 py-1.5 flex items-center"><Sparkles className="w-3 h-3 mr-1"/> เลือก Template</p>
                                {TEMPLATES.map((tpl, i) => (
                                    <button key={i} onClick={() => { if(confirm("แทนที่เนื้อหาเดิมทั้งหมด?")) { setContent(tpl.content); setShowTemplates(false); }}} className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors truncate mb-1">
                                        {tpl.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={handlePrint} className="w-10 h-10 hidden md:flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0" title="Print">
                        <Printer className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Character Manager rendered outside the overflow container */}
            {showConfig && <CharacterManager onClose={() => setShowConfig(false)} />}
        </>
    );
};

export default EditorToolbar;
