
import React, { useState } from 'react';
import { ArrowLeft, Save, Check, Printer, Clock, Wand2, PlayCircle, LayoutTemplate, Settings, User as UserIcon, Users, MessageSquare, ChevronDown, Sparkles, Share2, Globe, Copy, X, FileText, Rocket, MessageSquarePlus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ScriptStatus } from '../../../types';
import { useScriptContext } from '../core/ScriptContext';
import CharacterManager from '../tools/config/CharacterManager';
import ScriptMetadataModal from '../tools/ScriptMetadataModal';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

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

const ZOOM_OPTIONS = [50, 75, 100, 125, 150, 200];

const EditorToolbar: React.FC = () => {
    const { 
        title, setTitle, content, status, setStatus, changeStatus,
        scriptType, setScriptType,
        isSaving, lastSaved, handleSave, // Use handleSave from context
        onClose,
        setIsAIOpen, setIsTeleprompterOpen,
        isChatPreviewOpen, setIsChatPreviewOpen,
        setIsMetadataOpen,
        setContent,
        users, ideaOwnerId,
        isPublic, shareToken, handleToggleShare,
        zoomLevel, setZoomLevel,
        contentId, onPromote, 
        isScriptOwner, 
        isCommentsOpen, setIsCommentsOpen, comments
    } = useScriptContext();
    
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const [showTemplates, setShowTemplates] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showZoomMenu, setShowZoomMenu] = useState(false);
    
    // New State for Save Feedback
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const textContent = content.replace(/<[^>]*>?/gm, '');
    const estimatedSeconds = Math.ceil(textContent.length / 12); 
    const formattedDuration = `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`;
    
    // Find Owner for Print logic
    const owner = users.find(u => u.id === ideaOwnerId);
    
    const magicLink = shareToken ? `${window.location.origin}/s/${shareToken}` : '';
    const isAnyMenuOpen = showStatusMenu || showTemplates || showZoomMenu;
    const openCommentCount = comments.filter(c => c.status === 'OPEN').length;

    const handleManualSave = async () => {
        if (isSaving) return;
        
        // Trigger save (false = show toast if implemented in context, but we handle visual here too)
        await handleSave(false);
        
        // Show success state
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
    };

    const handlePrint = () => {
        // Smart Printing Engine
        let printBody = '';

        if (scriptType === 'DIALOGUE') {
             // Simple HTML Parser for Dialogue
             const parser = new DOMParser();
             const doc = parser.parseFromString(content, 'text/html');
             const paragraphs = doc.querySelectorAll('p');
             
             let formattedHtml = '';
             
             paragraphs.forEach(p => {
                 const text = p.innerText;
                 // Match "Name:" or "Name :" at start
                 const match = text.match(/^(.+?):\s*(.*)/);
                 
                 if (match) {
                     // Dialogue Block
                     const char = match[1].trim().toUpperCase();
                     const speech = match[2].trim();
                     formattedHtml += `
                        <div class="dialogue-block">
                            <div class="character">${char}</div>
                            <div class="speech">${speech}</div>
                        </div>
                     `;
                 } else if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
                     // Narrator / Instruction Block
                     formattedHtml += `<div class="action font-bold">${text}</div>`;
                 } else if (text.trim()) {
                     // Action / General Text Block
                     formattedHtml += `<div class="action">${p.innerHTML}</div>`;
                 }
             });
             printBody = formattedHtml || content; // Fallback to content if parsing yields empty
        } else {
            // Monologue: Standard document format
            printBody = `<div class="monologue">${content}</div>`;
        }

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title} - Juijui Script</title>
                    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        @page { margin: 2.5cm; size: A4; }
                        body { 
                            font-family: 'Courier Prime', 'Sarabun', monospace; 
                            line-height: 1.2; 
                            color: #000; 
                            max-width: 210mm;
                            margin: 0 auto;
                            -webkit-print-color-adjust: exact;
                        }
                        .header { text-align: center; margin-bottom: 50px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                        .title { font-size: 24pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-bottom: 10px; }
                        .meta { font-size: 10pt; color: #444; font-family: 'Sarabun', sans-serif; }
                        
                        /* Screenplay Standard Formatting */
                        .action {
                            text-align: left;
                            width: 100%;
                            margin-bottom: 1em;
                        }
                        .dialogue-block {
                            display: table;
                            margin: 0 auto 1.5em auto;
                            width: 70%; /* Center block */
                        }
                        .character {
                            text-align: center;
                            font-weight: bold;
                            margin-bottom: 0.2em;
                            text-transform: uppercase;
                        }
                        .speech {
                            text-align: left;
                        }
                        .font-bold { font-weight: bold; }
                        
                        /* Monologue */
                        .monologue p { margin-bottom: 1em; text-indent: 2em; line-height: 1.6; font-family: 'Sarabun', sans-serif; }
                        .monologue h1, .monologue h2, .monologue h3 { text-align: center; margin-top: 1.5em; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">${title}</div>
                        <div class="meta">
                            Written by: ${owner?.name || 'Unknown'}<br/>
                            Date: ${new Date().toLocaleDateString()}<br/>
                            Type: ${scriptType}<br/>
                            Est. Duration: ${formattedDuration}
                        </div>
                    </div>
                    <div class="script-body">
                        ${printBody}
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

    const handleSelectTemplate = async (tplContent: string) => {
        const confirmed = await showConfirm(
            "เนื้อหาเดิมจะถูกแทนที่ด้วย Template ที่เลือกทั้งหมด", 
            "ยืนยันการเปลี่ยน Template?"
        );
        
        if (confirmed) {
            setContent(tplContent);
            setShowTemplates(false);
            showToast('ใช้ Template เรียบร้อย', 'success');
        }
    };

    return (
        <>
            {isAnyMenuOpen && (
                <div className="fixed inset-0 z-[40]" onClick={() => { setShowStatusMenu(false); setShowTemplates(false); setShowZoomMenu(false); }}></div>
            )}

            {/* Main Toolbar - Responsive Layout */}
            <div className={`bg-white/80 backdrop-blur-md border-b border-indigo-50 px-4 py-3 flex flex-col xl:flex-row xl:items-center justify-between shrink-0 shadow-sm gap-3 xl:gap-6 relative transition-all ${isAnyMenuOpen ? 'z-50' : 'z-20'}`}>
                
                {/* Top Line: Back & Title & Meta */}
                <div className="flex items-center gap-3 w-full xl:w-auto overflow-hidden">
                    <button 
                        onClick={onClose} 
                        className="shrink-0 group p-2 bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 rounded-xl transition-all duration-300 hover:-rotate-12 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                    </button>
                    
                    <div className="flex flex-col min-w-0 flex-1">
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="font-black text-gray-800 text-lg md:text-xl outline-none bg-transparent placeholder:text-gray-300 w-full truncate focus:scale-[1.01] transition-transform origin-left"
                            placeholder="Untitled Script ✨"
                        />
                        <div className="flex items-center gap-2 md:gap-3 text-[10px] text-gray-400 font-bold mt-0.5 overflow-x-auto scrollbar-hide whitespace-nowrap">
                            {owner && (
                                <div className="flex items-center gap-1.5 shrink-0 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                    <img src={owner.avatarUrl} className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-white" alt={owner.name} />
                                    <span className="text-indigo-600">{owner.name.split(' ')[0]}</span>
                                </div>
                            )}
                            
                            {/* Manual Save Button (Replaces passive text) */}
                            <button 
                                onClick={handleManualSave}
                                disabled={isSaving}
                                className={`
                                    flex items-center gap-1.5 px-3 py-0.5 rounded-full border transition-all shrink-0 active:scale-95
                                    ${showSaveSuccess 
                                        ? 'bg-green-50 text-green-600 border-green-200' 
                                        : isSaving 
                                            ? 'bg-indigo-50 text-indigo-400 border-indigo-200 cursor-wait'
                                            : 'bg-white text-gray-500 border-gray-200 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm'
                                    }
                                `}
                                title="คลิกเพื่อบันทึกทันที"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : showSaveSuccess ? (
                                    <Check className="w-3 h-3" />
                                ) : (
                                    <Save className="w-3 h-3" />
                                )}
                                
                                {isSaving 
                                    ? 'Saving...' 
                                    : showSaveSuccess 
                                        ? 'Saved!' 
                                        : `Save (${format(lastSaved, 'HH:mm')})`
                                }
                            </button>
                            
                            <span className="flex items-center shrink-0" title="Estimated Reading Time">
                                <Clock className="w-3 h-3 mr-1 text-orange-400" /> {formattedDuration}
                            </span>
                        </div>
                    </div>

                    {/* Metadata Button */}
                    <button 
                        onClick={() => setIsMetadataOpen(true)}
                        className="p-2 text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-all shrink-0"
                        title="แก้ไขรายละเอียด (Metadata)"
                    >
                        <FileText className="w-5 h-5" />
                    </button>
                    
                    {/* Promote to Content Button */}
                    {!contentId && isScriptOwner && (
                         <button 
                            onClick={onPromote}
                            className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 shrink-0"
                            title="ส่งเข้ากระบวนการผลิต (Create Content)"
                         >
                             <Rocket className="w-4 h-4" /> ส่งเข้าผลิต
                         </button>
                    )}
                </div>

                {/* Bottom Line (Mobile) / Right Side (Desktop): Tools */}
                <div className="flex items-center gap-2 shrink-0 overflow-x-auto xl:overflow-visible pb-1 xl:pb-0 scrollbar-hide w-full xl:w-auto -mx-4 px-4 xl:mx-0 xl:px-0">
                    
                    {/* Comments Toggle */}
                    <button 
                        onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                        className={`relative p-2 rounded-xl transition-all border shadow-sm shrink-0 ${isCommentsOpen ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-white text-gray-500 border-gray-200 hover:text-yellow-600'}`}
                        title="Comments"
                    >
                        <MessageSquarePlus className="w-4 h-4" />
                        {openCommentCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold border border-white">
                                {openCommentCount}
                            </span>
                        )}
                    </button>

                    {/* Share Button */}
                    <button 
                        onClick={() => setShowShareModal(true)}
                        className={`
                            h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border shadow-sm active:scale-95 shrink-0
                            ${isPublic ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:text-indigo-600'}
                        `}
                    >
                        {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                        {isPublic ? 'Public' : 'Share'}
                    </button>

                    {/* Status Pill */}
                    <div className="relative shrink-0">
                        <button 
                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                            className={`
                                h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border shadow-sm active:scale-95
                                ${STATUS_CONFIG[status].color} hover:shadow-md
                            `}
                        >
                            <span className="text-base">{STATUS_CONFIG[status].icon}</span>
                            {STATUS_CONFIG[status].label}
                            <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                        </button>
                        {showStatusMenu && (
                            <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-indigo-50 p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                                    <button 
                                        key={key} 
                                        type="button"
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            changeStatus(key as ScriptStatus); 
                                            setShowStatusMenu(false); 
                                        }} 
                                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between transition-colors mb-1 ${status === key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <span className="flex items-center gap-2"><span className="text-base">{conf.icon}</span> {conf.label}</span>
                                        {status === key && <Check className="w-3 h-3 text-indigo-600" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>

                    {/* Zoom Dropdown */}
                    <div className="relative shrink-0">
                         <button 
                            onClick={() => setShowZoomMenu(!showZoomMenu)}
                            className="h-9 px-3 bg-gray-100 rounded-lg flex items-center gap-1 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200"
                        >
                             {zoomLevel}% <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                        
                        {showZoomMenu && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-24 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 animate-in fade-in zoom-in-95">
                                {ZOOM_OPTIONS.map(z => (
                                    <button
                                        key={z}
                                        onClick={() => { setZoomLevel(z); setShowZoomMenu(false); }}
                                        className={`w-full text-center px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${zoomLevel === z ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {z}%
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>

                    {/* Mode Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200 shrink-0 h-9 items-center">
                        <button onClick={() => setScriptType('MONOLOGUE')} className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-[10px] font-bold ${scriptType === 'MONOLOGUE' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`} title="Monologue"><UserIcon className="w-3 h-3" /> Mono</button>
                        <button onClick={() => setScriptType('DIALOGUE')} className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-[10px] font-bold ${scriptType === 'DIALOGUE' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`} title="Dialogue"><Users className="w-3 h-3" /> Dial</button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>
                    
                    {/* Tools */}
                    {scriptType === 'DIALOGUE' && (
                        <button 
                            onClick={() => setIsChatPreviewOpen(!isChatPreviewOpen)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border shadow-sm hover:-translate-y-0.5 active:translate-y-0 shrink-0 ${isChatPreviewOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                            title="Chat Preview"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>
                    )}

                    <button 
                        onClick={() => setShowConfig(true)} 
                        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border shadow-sm hover:-translate-y-0.5 active:translate-y-0 shrink-0 ${showConfig ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                        title="Character Manager"
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    <button onClick={() => setIsAIOpen(true)} className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-lg shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95 border border-white/20 shrink-0" title="AI Magic">
                        <Wand2 className="w-4 h-4" />
                    </button>
                    
                    <button onClick={() => setIsTeleprompterOpen(true)} className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 hover:bg-green-50 rounded-lg shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0" title="Teleprompter">
                        <PlayCircle className="w-4 h-4" />
                    </button>
                    
                    {/* Templates Dropdown */}
                    <div className="relative shrink-0">
                        <button onClick={() => setShowTemplates(!showTemplates)} className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 rounded-lg shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0" title="Templates">
                            <LayoutTemplate className="w-4 h-4" />
                        </button>
                        {showTemplates && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-orange-100 p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                <p className="text-[10px] font-black text-orange-400 uppercase px-3 py-1.5 flex items-center"><Sparkles className="w-3 h-3 mr-1"/> เลือก Template</p>
                                {TEMPLATES.map((tpl, i) => (
                                    <button 
                                        key={i} 
                                        type="button"
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleSelectTemplate(tpl.content); 
                                        }} 
                                        className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors truncate mb-1"
                                    >
                                        {tpl.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={handlePrint} className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0" title="Print Script">
                        <Printer className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Config Modals */}
            {showConfig && <CharacterManager onClose={() => setShowConfig(false)} />}
            
            <ScriptMetadataModal />
            
            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-indigo-600" /> แบ่งปันสคริปต์ (Share)
                            </h3>
                            <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-700 text-sm">Magic Link (Public View)</p>
                                    <p className="text-xs text-gray-500">ใครที่มีลิงก์นี้สามารถอ่านบทได้</p>
                                </div>
                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isPublic ? 'bg-green-500' : 'bg-gray-300'}`} onClick={handleToggleShare}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                            </div>

                            {isPublic && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Your Link</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={magicLink} 
                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 focus:outline-none"
                                        />
                                        <button 
                                            onClick={() => { 
                                                navigator.clipboard.writeText(magicLink); 
                                                showToast('คัดลอกลิงก์แล้ว! ส่งให้เพื่อนได้เลย', 'success');
                                            }}
                                            className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 flex items-center"
                                        >
                                            <Copy className="w-3 h-3 mr-1" /> Copy
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400">* นักแสดงสามารถเปิดลิงก์นี้ในมือถือเพื่อซ้อมบทได้ทันที (ไม่ต้องล็อกอิน)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditorToolbar;
