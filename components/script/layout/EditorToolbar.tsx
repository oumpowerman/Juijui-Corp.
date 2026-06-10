import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Save, Check, Printer, Clock, Wand2, PlayCircle, Settings, 
    User as UserIcon, Users, MessageSquare, Sparkles, Share2, Globe, FileText, 
    Rocket, MessageSquarePlus, Loader2, Maximize2, Minimize2, Zap, ZapOff, Tag, Hash, Search 
} from 'lucide-react';
import { format } from 'date-fns';
import { ScriptStatus } from '../../../types';
import { useScriptContext } from '../core/ScriptContext';
import CharacterManager from '../tools/config/CharacterManager';
import ScriptMetadataModal from '../tools/ScriptMetadataModal';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { handlePrintScript } from '../core/printUtils';
import { googleDriveService } from '../../../services/googleDriveService';

// Refactored Sub-components & Custom Hooks
import { GoogleDocsIcon } from './toolbar/components/GoogleDocsIcon';
import { StatusDropdown } from './toolbar/components/StatusDropdown';
import { ZoomDropdown } from './toolbar/components/ZoomDropdown';
import { TemplatesDropdown } from './toolbar/components/TemplatesDropdown';
import { useToolbarShortcuts } from './toolbar/useToolbarShortcuts';
import { ShareModal } from './toolbar/modals/ShareModal';
import { GoogleDocsModals } from './toolbar/modals/GoogleDocsModals';

const EditorToolbar: React.FC = () => {
    const { 
        title, setTitle, content, status, changeStatus,
        scriptType, setScriptType,
        isSaving, lastSaved, handleSave,
        onClose,
        setIsAIOpen, setIsTeleprompterOpen,
        isChatPreviewOpen, setIsChatPreviewOpen,
        isFindReplaceOpen, setIsFindReplaceOpen,
        setIsMetadataOpen,
        users, ideaOwnerId,
        isPublic, shareToken, handleToggleShare,
        zoomLevel, setZoomLevel,
        contentId, onPromote, 
        isScriptOwner, 
        isCommentsOpen, setIsCommentsOpen, comments,
        isFocusMode, setIsFocusMode,
        isAutoCharacter, setIsAutoCharacter,
        category, tags, masterOptions
    } = useScriptContext();
    
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    // Menu States
    const [showTemplates, setShowTemplates] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showZoomMenu, setShowZoomMenu] = useState(false);
    
    // Save Feedback State
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    
    // Google Drive / Docs Integration States
    const [isConnectedToDoc, setIsConnectedToDoc] = useState(false);
    const [isCheckingDoc, setIsCheckingDoc] = useState(true);
    const [showExportConfirm, setShowExportConfirm] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportResult, setExportResult] = useState<{ id: string, name: string, webViewLink: string } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Check connection on mount
    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            try {
                const statusInfo = await googleDriveService.getStatus();
                if (isMounted) {
                    setIsConnectedToDoc(statusInfo);
                }
            } catch (err) {
                console.error("Failed to check Google Docs connection status", err);
            } finally {
                if (isMounted) {
                    setIsCheckingDoc(false);
                }
            }
        };
        checkStatus();
        return () => {
            isMounted = false;
        };
    }, []);

    // Listen to Google Auth Events
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                setIsConnectedToDoc(true);
                showToast('เชื่อมต่อ Google Docs สำเร็จเรียบร้อย!', 'success');
            }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'GOOGLE_AUTH_TIMESTAMP') {
                setIsConnectedToDoc(true);
                showToast('เชื่อมต่อ Google Docs สำเร็จเรียบร้อย!', 'success');
            }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [showToast]);

    // Google Docs Actions
    const handleConnectGoogle = async () => {
        try {
            const url = await googleDriveService.getAuthUrl();
            if (url) {
                const width = 600;
                const height = 650;
                const left = window.screenX + (window.innerWidth - width) / 2;
                const top = window.screenY + (window.innerHeight - height) / 2;
                window.open(url, 'GoogleAuth', `width=${width},height=${height},left=${left},top=${top}`);
            } else {
                showToast('ไม่สามารถดึงลิงก์เชื่อมต่อ Google Docs ได้', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Docs', 'error');
        }
    };

    const handleExport = async () => {
        setShowExportConfirm(false);
        setIsExporting(true);
        try {
            const result = await googleDriveService.exportToGoogleDocs(title || 'Untitled Script', content);
            setExportResult(result);
            setShowSuccessModal(true);
        } catch (err: any) {
            console.error(err);
            showToast(err.message || 'ส่งออกสคริปต์ไปยัง Google Docs ไม่สำเร็จ', 'error');
        } finally {
            setIsExporting(false);
        }
    };
    
    // Refs for Portal positioning
    const statusBtnRef = useRef<HTMLDivElement>(null);
    const zoomBtnRef = useRef<HTMLDivElement>(null);
    const templatesBtnRef = useRef<HTMLDivElement>(null);

    // Timing helper
    const cleanContentForTiming = (html: string) => {
        return html
            .replace(/\[.*?\]/g, '') // Remove [Stage Directions]
            .replace(/\(.*?\)/g, '') // Remove (Parenthetical Notes)
            .replace(/<strong>.*?:?<\/strong>:?\s*/g, '') // Remove Bold Character Names (handles : inside or outside)
            .replace(/<[^>]*>?/gm, '') // Remove HTML Tags
            .replace(/^[^\n:]+:\s*/gm, '') // Remove "Name: " at start of lines (fallback)
            .trim();
    };

    const textContent = cleanContentForTiming(content);
    const estimatedSeconds = Math.ceil(textContent.length / 12); 
    const formattedDuration = `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`;
    
    // Find Owner for Print logic
    const owner = users.find(u => u.id === ideaOwnerId);

    const handleManualSave = useCallback(async () => {
        if (isSaving) return;
        
        await handleSave(false);
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
    }, [isSaving, handleSave]);

    const handlePrint = useCallback(() => {
        handlePrintScript({
            title,
            content,
            scriptType: scriptType as 'MONOLOGUE' | 'DIALOGUE',
            ownerName: owner?.name,
            formattedDuration
        });
    }, [title, content, scriptType, owner, formattedDuration]);

    // Keyboard Shortcuts Hook
    useToolbarShortcuts({
        handleManualSave,
        isFindReplaceOpen,
        setIsFindReplaceOpen,
        setIsAIOpen,
        setIsTeleprompterOpen,
        isChatPreviewOpen,
        setIsChatPreviewOpen,
        setShowConfig,
        setIsMetadataOpen,
        isFocusMode,
        setIsFocusMode,
        handlePrint,
        setShowShareModal,
        isCommentsOpen,
        setIsCommentsOpen,
    });

    const magicLink = shareToken ? `${window.location.origin}/s/${shareToken}` : '';
    const isAnyMenuOpen = showStatusMenu || showTemplates || showZoomMenu;
    const openCommentCount = comments.filter(c => c.status === 'OPEN').length;

    return (
        <>
            {isAnyMenuOpen && (
                <div 
                    className="fixed inset-0 z-[40]" 
                    onClick={() => { 
                        setShowStatusMenu(false); 
                        setShowTemplates(false); 
                        setShowZoomMenu(false); 
                    }}
                />
            )}

            {/* Main Toolbar - Responsive Layout */}
            {!isFocusMode && (
                <div className={`bg-white/80 backdrop-blur-md border-b border-indigo-50 px-4 py-3 flex flex-col xl:flex-row xl:items-center justify-between shrink-0 shadow-sm gap-3 xl:gap-6 relative transition-all ${isAnyMenuOpen ? 'z-50' : 'z-20'}`}>
                    
                    {/* Top Line: Back & Title & Meta */}
                    <div className="flex items-center gap-3 w-full xl:w-auto overflow-hidden">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose} 
                            className="shrink-0 group p-2 bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 rounded-xl transition-all duration-300 hover:-rotate-12 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                        </motion.button>
                        
                        <div className="flex flex-col min-w-0 flex-1">
                            <input 
                                type="text" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                className="font-kanit font-bold tracking-tight text-gray-800 text-lg md:text-xl outline-none
                                    bg-transparent 
                                    placeholder:text-transparent
                                    placeholder:bg-gradient-to-r
                                    placeholder:from-gray-300
                                    placeholder:via-gray-200
                                    placeholder:to-gray-300
                                    placeholder:bg-[length:200%_100%]
                                    placeholder:bg-clip-text
                                    placeholder:animate-shimmer
                                    w-full truncate     
                                    origin-left
                                    transition-all duration-300
                                    hover:drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]
                                    focus:scale-[1.03]
                                    focus:drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]
                                "
                                placeholder="Untitled Script ✨"
                            />
                            <div className="flex items-center gap-2 md:gap-3 text-[10px] text-gray-400 font-bold mt-0.5 overflow-x-auto scrollbar-hide whitespace-nowrap">
                                {owner && (
                                    <div className="flex items-center gap-1.5 shrink-0 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        <img src={owner.avatarUrl} className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-white" alt={owner.name} />
                                        <span className="text-indigo-600">{owner.name.split(' ')[0]}</span>
                                    </div>
                                )}
                                
                                {/* Manual Save Button */}
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleManualSave}
                                    disabled={isSaving}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-0.5 rounded-full border transition-all shrink-0
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
                                </motion.button>
                                
                                <span className="flex items-center shrink-0" title="Estimated Reading Time">
                                    <Clock className="w-3 h-3 mr-1 text-orange-400" /> {formattedDuration}
                                </span>

                                {category && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-1.5 shrink-0 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100 text-pink-600 shadow-sm"
                                    >
                                        <Tag className="w-3 h-3" />
                                        <span className="font-black uppercase tracking-tighter">
                                            {masterOptions.find(o => o.key === category)?.label || category}
                                        </span>
                                    </motion.div>
                                )}

                                {tags && tags.length > 0 && (
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        <AnimatePresence>
                                            {tags.map((tag, idx) => (
                                                <motion.div 
                                                    key={tag} 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="flex items-center gap-0.5 shrink-0 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-default group/tag"
                                                >
                                                    <Hash className="w-2.5 h-2.5 opacity-40 group-hover/tag:opacity-100 group-hover/tag:scale-110 transition-all" />
                                                    <span className="font-bold">{tag}</span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metadata Button */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsMetadataOpen(true)}
                            className="p-2 text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-all shrink-0"
                            title="แก้ไขรายละเอียด (Metadata)"
                        >
                            <FileText className="w-5 h-5" />
                        </motion.button>
                        
                        {/* Promote to Content Button */}
                        {!contentId && isScriptOwner && (
                             <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onPromote}
                                className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0 animate-pulse"
                                title="ส่งเข้ากระบวนการผลิต (Create Content)"
                             >
                                 <Rocket className="w-4 h-4 text-white" /> ส่งเข้าผลิต
                             </motion.button>
                        )}
                    </div>

                    {/* Bottom Line (Mobile) / Right Side (Desktop): Tools */}
                    <div className="flex items-center gap-2 shrink-0 overflow-x-auto xl:overflow-visible pb-1 xl:pb-0 scrollbar-hide w-full xl:w-auto -mx-4 px-4 xl:mx-0 xl:px-0">
                        
                        {/* Focus Mode Toggle */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFocusMode(true)}
                            className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm shrink-0"
                            title="Focus Mode (เต็มจอ)"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </motion.button>

                        {/* Auto Character Toggle */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAutoCharacter(!isAutoCharacter)}
                            className={`p-2 rounded-xl transition-all border shadow-sm shrink-0 ${isAutoCharacter ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-gray-500 border-gray-200 hover:text-orange-600'}`}
                            title={isAutoCharacter ? "ปิด Auto Character" : "เปิด Auto Character (Enter เพื่อสลับตัวละคร)"}
                        >
                            {isAutoCharacter ? <Zap className="w-4 h-4 animate-pulse" /> : <ZapOff className="w-4 h-4" />}
                        </motion.button>

                        <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>

                        {/* Comments Toggle */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
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
                        </motion.button>

                        {/* Google Docs Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={isConnectedToDoc ? () => setShowExportConfirm(true) : handleConnectGoogle}
                            className={`
                                h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border shadow-sm shrink-0
                                ${isConnectedToDoc 
                                    ? 'bg-blue-50 text-[#1a73e8] border-blue-200 hover:bg-blue-100/70' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:text-[#1a73e8] hover:border-blue-200 hover:bg-blue-50/30'
                                }
                            `}
                            title={isConnectedToDoc ? 'ส่งออกไฟล์สคริปต์นี้ไปยัง Google Docs' : 'เชื่อมต่อบัญชี Google เพื่อใช้งานระบบส่งออกคลาวด์เอกสาร'}
                        >
                            {isCheckingDoc ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" />
                            ) : (
                                <GoogleDocsIcon className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>
                                {isCheckingDoc 
                                    ? 'Checking...' 
                                    : isConnectedToDoc 
                                        ? 'Export to Google Doc' 
                                        : 'Connect Google Docs'
                                }
                            </span>
                        </motion.button>

                        {/* Share Button */}
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowShareModal(true)}
                            className={`
                                h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border shadow-sm shrink-0
                                ${isPublic ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:text-indigo-600'}
                            `}
                        >
                            {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                            {isPublic ? 'Public' : 'Share'}
                        </motion.button>

                        {/* Status Pill */}
                        <StatusDropdown 
                            status={status}
                            changeStatus={changeStatus}
                            showStatusMenu={showStatusMenu}
                            setShowStatusMenu={setShowStatusMenu}
                            statusBtnRef={statusBtnRef}
                        />

                        <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>

                        {/* Zoom Dropdown */}
                        <ZoomDropdown 
                            zoomLevel={zoomLevel} 
                            setZoomLevel={setZoomLevel} 
                            showZoomMenu={showZoomMenu} 
                            setShowZoomMenu={setShowZoomMenu} 
                            zoomBtnRef={zoomBtnRef}
                        />

                        <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>

                        {/* Mode Toggle */}
                        <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200 shrink-0 h-9 items-center">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setScriptType('MONOLOGUE')} className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-[10px] font-bold ${scriptType === 'MONOLOGUE' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`} title="Monologue"><UserIcon className="w-3 h-3" /> Mono</motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setScriptType('DIALOGUE')} className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-[10px] font-bold ${scriptType === 'DIALOGUE' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`} title="Dialogue"><Users className="w-3 h-3" /> Dial</motion.button>
                        </div>

                        <div className="h-6 w-px bg-gray-200 mx-1 shrink-0"></div>
                        
                        {/* Tools Buttons */}
                        {scriptType === 'DIALOGUE' && (
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsChatPreviewOpen(!isChatPreviewOpen)}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border shadow-sm shrink-0 ${isChatPreviewOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                                title="Chat Preview"
                            >
                                <MessageSquare className="w-4 h-4" />
                            </motion.button>
                        )}

                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFindReplaceOpen(!isFindReplaceOpen)} 
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border shadow-sm shrink-0 ${isFindReplaceOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                            title="Find & Replace (Ctrl+F)"
                        >
                            <Search className="w-4 h-4" />
                        </motion.button>

                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowConfig(true)} 
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all border shadow-sm shrink-0 ${showConfig ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                            title="Character Manager"
                        >
                            <Settings className="w-4 h-4" />
                        </motion.button>

                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAIOpen(true)} 
                            className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-lg shadow-lg shadow-purple-200 transition-all border border-white/20 shrink-0" 
                            title="AI Magic"
                        >
                            <Wand2 className="w-4 h-4" />
                        </motion.button>
                        
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsTeleprompterOpen(true)} 
                            className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 hover:bg-green-50 rounded-lg shadow-sm transition-all shrink-0" 
                            title="Teleprompter"
                        >
                            <PlayCircle className="w-4 h-4" />
                        </motion.button>
                        
                        {/* Templates Dropdown */}
                        <TemplatesDropdown 
                            showTemplates={showTemplates} 
                            setShowTemplates={setShowTemplates} 
                            templatesBtnRef={templatesBtnRef}
                        />

                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePrint} 
                            className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm transition-all shrink-0" 
                            title="Print Script"
                        >
                            <Printer className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>
            )}

            {/* Focus Mode Exit Button */}
            {isFocusMode && (
                <div className="fixed top-4 right-4 z-[60] flex items-center gap-2">
                    <div className={`p-2 rounded-xl border shadow-lg flex items-center gap-2 bg-white/80 backdrop-blur-md ${isAutoCharacter ? 'border-orange-200' : 'border-gray-200'}`}>
                        <button 
                            onClick={() => setIsAutoCharacter(!isAutoCharacter)}
                            className={`p-1.5 rounded-lg transition-all ${isAutoCharacter ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            title="Auto Character"
                        >
                            {isAutoCharacter ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                        <div className="w-px h-4 bg-gray-200"></div>
                        <button 
                            onClick={() => setIsFocusMode(false)}
                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md"
                            title="ออกจาก Focus Mode"
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Config Modals */}
            {showConfig && <CharacterManager onClose={() => setShowConfig(false)} />}
            
            <ScriptMetadataModal />
            
            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                isPublic={isPublic}
                handleToggleShare={handleToggleShare}
                magicLink={magicLink}
                showToast={showToast}
                isConnectedToDoc={isConnectedToDoc}
                setShowExportConfirm={setShowExportConfirm}
                handleConnectGoogle={handleConnectGoogle}
            />

            {/* Google Docs Modals Flow */}
            <GoogleDocsModals
                showExportConfirm={showExportConfirm}
                setShowExportConfirm={setShowExportConfirm}
                isExporting={isExporting}
                showSuccessModal={showSuccessModal}
                setShowSuccessModal={setShowSuccessModal}
                exportResult={exportResult}
                title={title}
                handleExport={handleExport}
            />
        </>
    );
};

export default EditorToolbar;
