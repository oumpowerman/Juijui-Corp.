import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Sparkles, Folder, FolderPlus, Tags, Plus, Link, 
    Save, Loader2, Globe, Check, Youtube, Radio, FileText, 
    Video, MessageSquare, Instagram, Compass, CheckCircle2,
    LogOut, LayoutDashboard
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { NexusPlatform, NexusFolder } from '../../types';
import { GoogleGenAI } from "@google/genai";

// Import modular subcomponents
import { UrlPreviewPanel } from './share/UrlPreviewPanel';
import { FolderSelector } from './share/FolderSelector';
import { TagSelector } from './share/TagSelector';

interface PWAShareTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        title: string;
        text: string;
        url: string;
    } | null;
    currentUser: any;
    onSaveSuccess?: () => void;
}

// Creator friendly tags
const PRESET_CREATOR_TAGS = [
    '#มุมกล้องเจ๋ง',
    '#มุกตลก',
    '#ซาวด์กำลังฮิต',
    '#สปอนเซอร์เข้าได้',
    '#ไอเดียคอนเทนต์',
    '#คลิปสั้น',
    '#วิดีโอยาว',
    '#เอฟเฟกต์เทพ',
    '#แรงบันดาลใจ'
];

export const PWAShareTargetModal: React.FC<PWAShareTargetModalProps> = ({ 
    isOpen, 
    onClose, 
    data, 
    currentUser,
    onSaveSuccess 
}) => {
    const { showToast } = useToast();
    const apiKey = (window as any).process?.env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

    // Extracted Fields
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [platform, setPlatform] = useState<NexusPlatform>(NexusPlatform.GENERIC);

    // folders & Tag State
    const [folders, setFolders] = useState<NexusFolder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');

    // Folders creation state
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Status state
    const [isMetaDataLoading, setIsMetaDataLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [aiEnrichment, setAiEnrichment] = useState(true);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    
    // Post-save flow states
    const [isSaveSuccessful, setIsSaveSuccessful] = useState(false);
    const [autoCloseAfterSave, setAutoCloseAfterSave] = useState(true);

    // Helpers to extract URL from text/url
    const extractUrl = (text: string, urlStr: string): string => {
        if (urlStr && urlStr.trim().startsWith('http')) return urlStr.trim();
        const regex = /(https?:\/\/[^\s]+)/g;
        const match = text.match(regex);
        if (match && match[0]) return match[0];
        return urlStr || text;
    };

    // Detect Platform
    const detectPlatform = (urlStr: string): NexusPlatform => {
        const lower = urlStr.toLowerCase();
        if (lower.includes('youtube.com') || lower.includes('youtu.be')) return NexusPlatform.YOUTUBE;
        if (lower.includes('tiktok.com')) return NexusPlatform.TIKTOK;
        if (lower.includes('instagram.com')) return NexusPlatform.INSTAGRAM;
        if (lower.includes('facebook.com') || lower.includes('fb.watch')) return NexusPlatform.FACEBOOK;
        if (lower.includes('notion.so') || lower.includes('notion.site')) return NexusPlatform.NOTION;
        if (lower.includes('docs.google.com/spreadsheets') || lower.includes('sheets.new')) return NexusPlatform.GOOGLE_SHEETS;
        if (lower.includes('drive.google.com')) return NexusPlatform.GOOGLE_DRIVE;
        if (lower.includes('canva.com')) return NexusPlatform.CANVA;
        return NexusPlatform.GENERIC;
    };

    // Load folders
    const loadFolders = async () => {
        if (!currentUser) return;
        try {
            const { data: list, error } = await supabase
                .from('nexus_folders')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('name', { ascending: true });

            if (error) throw error;
            if (list) {
                setFolders(list.map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    description: f.description,
                    parentId: f.parent_id,
                    userId: f.user_id,
                    color: f.color,
                    icon: f.icon,
                    createdAt: f.created_at,
                    updatedAt: f.updated_at
                })));
            }
        } catch (err) {
            console.error('Error loading folders inside ShareModal:', err);
        }
    };

    // Process shared target info on load
    useEffect(() => {
        if (isOpen && data && currentUser) {
            loadFolders();
            setIsSaveSuccessful(false); // Reset success view on reopening
            
            const extracted = extractUrl(data.text || '', data.url || '');
            setUrl(extracted);
            
            const detectedPlat = detectPlatform(extracted);
            setPlatform(detectedPlat);
            
            setTitle(data.title || 'ไอเดียแชร์ด่วน');
            setDescription(data.text ? data.text.substring(0, 150) : '');
            setThumbnailUrl('');

            // Automatic Oembed preview extractor
            if (extracted.startsWith('http')) {
                setIsMetaDataLoading(true);
                fetch(`https://noembed.com/embed?url=${encodeURIComponent(extracted)}`)
                    .then(res => res.json())
                    .then(oData => {
                        if (oData.title) {
                            setTitle(oData.title);
                        }
                        if (oData.thumbnail_url) {
                            setThumbnailUrl(oData.thumbnail_url);
                        }
                        if (oData.author_name) {
                            setDescription(`ผู้สร้าง: ${oData.author_name} • ดึงข้อมูลอัตโนมัติ`);
                        }
                    })
                    .catch(e => console.warn('oEmbed fetching error, ignoring:', e))
                    .finally(() => setIsMetaDataLoading(false));
            }
        }
    }, [isOpen, data, currentUser]);

    // Handle Folder Creation
    const handleCreateFolderDirectly = async () => {
        if (!newFolderName.trim() || !currentUser) return;
        try {
            const { data: newFolder, error } = await supabase
                .from('nexus_folders')
                .insert([{
                    user_id: currentUser.id,
                    name: newFolderName.trim(),
                    description: 'สร้างจากบอร์ดแชร์ด่วน PWA',
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            if (newFolder) {
                const mapped: NexusFolder = {
                    id: newFolder.id,
                    name: newFolder.name,
                    description: newFolder.description,
                    parentId: newFolder.parent_id,
                    userId: newFolder.user_id,
                    color: newFolder.color,
                    icon: newFolder.icon,
                    createdAt: newFolder.created_at,
                    updatedAt: newFolder.updated_at
                };
                setFolders(prev => [...prev, mapped]);
                setSelectedFolderId(mapped.id);
                setNewFolderName('');
                setIsCreatingFolder(false);
                showToast('สร้างโฟลเดอร์เรียบร้อยแล้ว! 📁', 'success');
            }
        } catch (err: any) {
            console.error('Direct folder creation failed:', err);
            showToast('สร้างโฟลเดอร์ล้มเหลว', 'error');
        }
    };

    // Toggle presets tags selection
    const handleTogglePresetTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(prev => prev.filter(t => t !== tag));
        } else {
            setTags(prev => [...prev, tag]);
        }
    };

    // Add Custom tag
    const handleAddCustomTag = () => {
        let tag = customTagInput.trim();
        if (!tag) return;
        if (!tag.startsWith('#')) tag = `#${tag}`;
        if (!tags.includes(tag)) {
            setTags(prev => [...prev, tag]);
        }
        setCustomTagInput('');
    };

    // Safe Window Exit Helper
    const handleAppClosure = () => {
        try {
            // Attempt standard programmatic window close
            window.close();
        } catch (e) {
            console.warn("window.close is blocked by browser policies:", e);
        }
        
        // Notify of closure outcome & fallback
        showToast('บอร์ดเซฟสำเร็จ! คุณสามารถกดปุ่มโฮมเพื่อกลับไปใช้งานแอปอื่นได้เลย', 'info');
        onClose();
    };

    // Save Integration to Database
    const handleSaveIdea = async () => {
        if (!currentUser || !url) return;
        setIsSaving(true);
        setIsAiProcessing(aiEnrichment && !!apiKey);

        let finalTitle = title;
        let finalDescription = description;
        let finalThumbnailUrl = thumbnailUrl;
        let finalTags = [...tags];

        // 1. Optional Gemini Enrichment
        if (aiEnrichment && apiKey) {
            try {
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({
                    model: "gemini-3.5-flash",
                    contents: `คุณคือ Nexus AI อัจฉริยะ ทำหน้าที่สกัดข้อมูลและคิดหัวข้อเรื่อง/แท็กที่ดึงดูดใจทีมงานครีเอเตอร์
                    URL: ${url}
                    แพลตฟอร์ม: ${platform}
                    หัวข้อต้นฉบับ: ${title}
                    ผู้ใช้บันทึกโน้ต/รายระเอียดเพิ่มเติม: ${description}
                    
                    คำสั่งพิเศษ:
                    - สรุปและเขียนชื่อเรื่องเป็น "ภาษาไทย" ให้น่าสนใจ
                    - คิด Tags สั้นๆ 3-5 คีย์เวิร์ด มีเครื่องหมาย # นำหน้า (เช่น #มุมกล้อง, #มุกตลก, #ไอเดียตัดต่อ)
                    
                    ตอบกลับในรูปแบบ JSON เท่านั้น:
                    {
                      "title": "ชื่อที่สเกลขึ้นใหม่อย่างน่าชม",
                      "description": "คำอธิบายเนื้อหาและคำวิเคราะห์สั้นๆ ไม่เกิน 2 ประโยค",
                      "tags": ["#แท็ก1", "#แท็ก2"]
                    }`,
                    config: { responseMimeType: "application/json" }
                });

                const aiResult = JSON.parse(response.text || '{}');
                if (aiResult.title) finalTitle = aiResult.title;
                if (aiResult.description) finalDescription = aiResult.description;
                if (aiResult.tags) {
                    // Combine custom tags and AI selected tags, removing duplicates
                    const uniqueTags = Array.from(new Set([...finalTags, ...aiResult.tags]));
                    finalTags = uniqueTags;
                }
            } catch (err) {
                console.warn('ShareTarget modal Gemini enrichment failed, using user input fallback:', err);
            } finally {
                setIsAiProcessing(false);
            }
        }

        try {
            // Insert into Supabase
            const { error } = await supabase
                .from('nexus_integrations')
                .insert([{
                    user_id: currentUser.id,
                    title: finalTitle.trim() || 'แอนิเมชันสำหรับวิดีโอ',
                    url: url,
                    platform: platform,
                    description: finalDescription,
                    thumbnail_url: finalThumbnailUrl || undefined,
                    tags: finalTags,
                    folder_id: selectedFolderId,
                    updated_at: new Date().toISOString()
                }]);

            if (error) throw error;

            showToast('บันทึกไอเดียเข้าคลังสมองเรียบร้อย! 🚀🧠', 'success');
            localStorage.removeItem('juijui_pwa_shared_ref'); // Clean up link payload
            
            if (onSaveSuccess) {
                onSaveSuccess();
            }

            // Transit to success screen
            setIsSaveSuccessful(true);

            // If user checked Auto-exit, execute immediate smart exit
            if (autoCloseAfterSave) {
                setTimeout(() => {
                    handleAppClosure();
                }, 1800);
            }
        } catch (err: any) {
            console.error('Error saving shared integration to database:', err);
            showToast('ไม่สามารถบันทึกไอเดียได้ โปรดลองอีกครั้ง', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div id="pwa-share-target-portal" className="fixed inset-0 z-[110000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                    />

                    {/* Modal container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 50 }}
                        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_30px_70px_rgba(79,70,229,0.30)] border border-slate-100 dark:border-slate-800 p-6 sm:p-8 max-h-[90vh] overflow-y-auto index-scroll"
                    >
                        {/* Sparkly Ambient Background */}
                        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 translate-y-8 -translate-x-8 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Success Screen Overlay */}
                        <AnimatePresence mode="wait">
                            {isSaveSuccessful ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col items-center justify-center py-8 text-center"
                                >
                                    <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 mb-6 shadow-inner animate-bounce">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </div>

                                    <h3 className="text-2xl font-black font-kanit text-slate-900 dark:text-white mb-2">
                                        บันทึกไอเดียเรียบร้อยแล้ว! 🎉🧠
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm mb-6 leading-relaxed">
                                        เก็บเข้าหมวดระบบ Nexus เรียบร้อย! ทีมงานสามารถร่วมคอมเมนต์ เขียนบท และแปลงโฟลเดอร์เป็นสคริปต์ได้ทันที
                                    </p>

                                    {autoCloseAfterSave ? (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-8 animate-pulse">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>กำลังปิดหน้าจอแชร์เพื่อนำคุณกลับแอปเดิมโดยอัตโนมัติ...</span>
                                        </div>
                                    ) : (
                                        <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-4" />
                                    )}

                                    {/* Success Options Grid */}
                                    <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                                        <button
                                            type="button"
                                            onClick={handleAppClosure}
                                            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 hover:dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-sm rounded-2xl transition duration-200 flex items-center justify-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>ปิดและย้อนกลับ</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsSaveSuccessful(false);
                                                onClose();
                                            }}
                                            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-150 transition active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>เปิดแผงงานหลัก Juijui</span>
                                        </button>
                                    </div>

                                    <p className="text-[10px] text-slate-400 font-medium mt-6 max-w-xs leading-relaxed">
                                        *หากระบบความปลอดภัยของเบราว์เซอร์ไม่ปิดหน้าต่างอัติโนมัติ คุณสามารถแตะปุ่มโฮม หรือใช้นิ้วปัดปิดแท็บนี้ได้โดยตรง
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Close button */}
                                    <button 
                                        onClick={onClose}
                                        className="absolute top-6 right-6 p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition dark:bg-slate-800 dark:hover:bg-slate-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    {/* Title Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                                            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black font-kanit text-slate-900 dark:text-white">แชร์ด่วนเก็บเข้าคลังสมอง 🧠💡</h3>
                                            <p className="text-xs text-slate-400 font-medium">แชร์จากหน้าสไลด์ TikTok, IG หรือแอปพลิเคชันใดก็ได้ผ่านระบบ PWA</p>
                                        </div>
                                    </div>

                                    {/* Main body content */}
                                    <div className="space-y-5 relative">
                                        {/* PREVIEW CONTAINER */}
                                        <UrlPreviewPanel 
                                            url={url}
                                            platform={platform}
                                            title={title}
                                            thumbnailUrl={thumbnailUrl}
                                            isMetaDataLoading={isMetaDataLoading}
                                        />

                                        {/* TITLE INPUT */}
                                        <div>
                                            <label className="block text-slate-700 dark:text-slate-300 font-bold font-kanit text-sm mb-1.5 flex items-center gap-2">
                                                ปรับปรุงหัวข้อวิดีโอ/ไอเดีย
                                            </label>
                                            <input 
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="ชื่อไอเดีย / คลังข้อมูลจำ"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white rounded-2xl px-4 py-3 text-sm font-bold placeholder-slate-400 transition"
                                            />
                                        </div>

                                        {/* FOLDER SELECTION */}
                                        <FolderSelector 
                                            folders={folders}
                                            selectedFolderId={selectedFolderId}
                                            setSelectedFolderId={setSelectedFolderId}
                                            isCreatingFolder={isCreatingFolder}
                                            setIsCreatingFolder={setIsCreatingFolder}
                                            newFolderName={newFolderName}
                                            setNewFolderName={setNewFolderName}
                                            handleCreateFolderDirectly={handleCreateFolderDirectly}
                                        />

                                        {/* CREATIVE TAGS HUB */}
                                        <TagSelector 
                                            tags={tags}
                                            presetTags={PRESET_CREATOR_TAGS}
                                            handleTogglePresetTag={handleTogglePresetTag}
                                            customTagInput={customTagInput}
                                            setCustomTagInput={setCustomTagInput}
                                            handleAddCustomTag={handleAddCustomTag}
                                        />

                                        {/* GEMINI INTELLIGENT WRITING OPT-IN */}
                                        {apiKey && (
                                            <div className="flex items-center justify-between p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-3xl border border-indigo-100/30 dark:border-indigo-900/30">
                                                <div className="flex items-center gap-3 pr-2">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-100/50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                                        <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs sm:text-sm font-black font-kanit text-indigo-900 dark:text-indigo-300 leading-tight">ใช้ผู้สกัดอัจฉริยะ Gemini AI</h4>
                                                        <p className="text-[10px] sm:text-xs text-indigo-600/70 dark:text-indigo-400/70 font-semibold leading-relaxed mt-0.5">
                                                            ประมวลผลวิดีโอเพื่อแปลงเนื้อหาเป็นไทย แนะนำชื่อหัวข้อและแท็กโดยอัตโนมัติ
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setAiEnrichment(!aiEnrichment)}
                                                    className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-0 shrink-0 ${
                                                        aiEnrichment ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                                                    }`}
                                                >
                                                    <div
                                                        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                                                            aiEnrichment ? 'translate-x-6' : 'translate-x-0'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        )}

                                        {/* CLOSE PREFERENCE CHECKBOX */}
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800/80">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="auto-close-pwa-toggle"
                                                    type="checkbox"
                                                    checked={autoCloseAfterSave}
                                                    onChange={(e) => setAutoCloseAfterSave(e.target.checked)}
                                                    className="w-4 border-2 border-slate-200 dark:border-slate-700 rounded text-indigo-600 focus:ring-indigo-500 h-4"
                                                />
                                            </div>
                                            <div className="text-xs">
                                                <label htmlFor="auto-close-pwa-toggle" className="font-extrabold text-slate-700 dark:text-slate-300 font-kanit cursor-pointer">
                                                    ปิดตัวแอปโดยอัตโนมัติทันทีที่บันทึกเสร็จ 🚪
                                                </label>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                                    อำนวยความสะดวกในการแชร์ลิงก์อย่างว่องไวแล้วกลับไปเล่นแอปเดิมโดยไม่ต้องนั่งปิดหน้าจอเอง
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer operations */}
                                    <div className="flex gap-3 justify-end items-center mt-8 border-t border-slate-100 dark:border-slate-800/60 pt-6">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={isSaving}
                                            className="px-6 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 hover:dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm rounded-2xl transition duration-200 disabled:opacity-40"
                                        >
                                            ไว้ก่อน
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={handleSaveIdea}
                                            disabled={isSaving || !url}
                                            className="px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-150 transition border-b-4 border-indigo-800 hover:border-b-2 active:border-b-0 active:translate-y-1 flex items-center gap-2"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                    <span>{isAiProcessing ? 'Gemini กำลังวิเคราะห์วิดีโอ...' : 'กำลังจัดเก็บ...'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 text-white" />
                                                    <span>บันทึกไอเดีย 🎯</span>
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
