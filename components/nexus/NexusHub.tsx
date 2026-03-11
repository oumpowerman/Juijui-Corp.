
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Share2, Settings, HelpCircle, Search, Loader2, X, Save, FileSpreadsheet, HardDrive } from 'lucide-react';
import NexusHeader from './NexusHeader';
import NexusFilter from './NexusFilter';
import NexusCard from './NexusCard';
import NexusEditModal from './NexusEditModal';
import NexusSettingsModal from './NexusSettingsModal';
import NexusHelpModal from './NexusHelpModal';
import NexusPreviewModal from './NexusPreviewModal';
import { NexusIntegration, NexusPlatform, User } from '../../types';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { extractYouTubeId, getYouTubeThumbnail, getPlatformConfig } from '../../utils/nexusUtils';
import { GoogleGenAI } from "@google/genai";
import AppBackground, { BackgroundTheme } from '../common/AppBackground';
import { ArrowLeft } from 'lucide-react';

interface NexusHubProps {
    currentUser: User;
    onNavigateMode?: (mode: 'ARTICLES' | 'HANDBOOK' | 'NEXUS') => void;
}

const NexusHub: React.FC<NexusHubProps> = ({ currentUser, onNavigateMode }) => {
    const [integrations, setIntegrations] = useState<NexusIntegration[]>([]);
    const [activeTab, setActiveTab] = useState<'ALL' | 'SOCIAL' | 'PRODUCTIVITY' | 'DESIGN' | 'WEB'>('ALL');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewIntegration, setPreviewIntegration] = useState<NexusIntegration | null>(null);
    const [editingIntegration, setEditingIntegration] = useState<NexusIntegration | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    
    // Real Settings State
    const [aiEnabled, setAiEnabled] = useState(true);
    const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>('pastel-indigo');
    
    const apiKey = process.env.GEMINI_API_KEY;

    useEffect(() => {
        const savedAi = localStorage.getItem('nexus_ai_enabled');
        const savedTheme = localStorage.getItem('nexus_theme');
        if (savedAi !== null) setAiEnabled(savedAi === 'true');
        if (savedTheme) setCurrentTheme(savedTheme as BackgroundTheme);
        else {
            const themes: BackgroundTheme[] = [
                'pastel-indigo', 'pastel-purple', 'pastel-pink', 'pastel-rose', 
                'pastel-teal', 'pastel-cyan', 'pastel-sky', 'pastel-emerald'
            ];
            setCurrentTheme(themes[Math.floor(Math.random() * themes.length)]);
        }
    }, []);

    const updateAiEnabled = (enabled: boolean) => {
        setAiEnabled(enabled);
        localStorage.setItem('nexus_ai_enabled', String(enabled));
    };

    const updateTheme = (theme: BackgroundTheme) => {
        setCurrentTheme(theme);
        localStorage.setItem('nexus_theme', theme);
    };

    const handleClearCache = () => {
        if (window.confirm('คุณต้องการล้างข้อมูลแคชทั้งหมดหรือไม่? (ข้อมูลในฐานข้อมูลจะไม่หายไป)')) {
            localStorage.removeItem(`nexus_integrations_${currentUser.id}`);
            fetchIntegrations();
        }
    };

    const fetchIntegrations = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('nexus_integrations')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setIntegrations(data || []);
        } catch (err) {
            console.error('Error fetching integrations:', err);
            const local = localStorage.getItem(`nexus_integrations_${currentUser.id}`);
            if (local) setIntegrations(JSON.parse(local));
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchIntegrations();
    }, [fetchIntegrations]);

    const handleAddIntegration = async (url: string, platform: NexusPlatform) => {
        if (!currentUser) return;
        setIsAdding(true);
        try {
            let title = `New ${platform.toLowerCase().replace('_', ' ')} link`;
            let description = `Added on ${new Date().toLocaleDateString()}`;
            let thumbnailUrl = undefined;
            let integrationTags: string[] = [];

            // 1. Platform Specific Extraction (Fast & Reliable - Source of Truth)
            let rawTitle = '';
            if (platform === NexusPlatform.YOUTUBE || platform === NexusPlatform.TIKTOK) {
                try {
                    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
                    const res = await fetch(oembedUrl);
                    const data = await res.json();
                    if (data.title) {
                        title = data.title;
                        rawTitle = data.title; // Keep the original title for AI context
                    }
                    if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
                    if (data.author_name) description = `โดย ${data.author_name} • ${platform.toLowerCase()}`;
                } catch (e) {
                    console.warn(`${platform} oEmbed fallback failed`);
                }
            }

            if (platform === NexusPlatform.YOUTUBE && !thumbnailUrl) {
                const videoId = extractYouTubeId(url);
                if (videoId) thumbnailUrl = getYouTubeThumbnail(videoId);
            }

            // 2. AI Enrichment (Smart AI - Thai Language Focus)
            if (apiKey && aiEnabled) {
                try {
                    const ai = new GoogleGenAI({ apiKey });
                    const response = await ai.models.generateContent({
                        model: "gemini-3-flash-preview",
                        contents: `คุณคือ Nexus AI อัจฉริยะ หน้าที่ของคุณคือสกัดข้อมูลจาก URL นี้: ${url}
                        แพลตฟอร์ม: ${platform}
                        ชื่อที่ดึงมาได้เบื้องต้น: ${rawTitle || 'ไม่ทราบ'}
                        
                        คำสั่งพิเศษ:
                        - ทุกอย่างต้องตอบเป็น "ภาษาไทย" (Thai Language)
                        - หากมีชื่อที่ดึงมาได้ (Base Title) ให้ใช้ชื่อนั้นเป็นหลัก แต่สามารถขัดเกลาให้สละสลวยขึ้นได้
                        - สรุปเนื้อหา (Description) ให้กระชับ น่าสนใจ และเป็นภาษาไทย
                        - คิด Hashtags ภาษาไทยที่เกี่ยวข้อง 3-5 คำ (เช่น #ความรู้, #บันเทิง, #งานออกแบบ)
                        - หากเป็น Google Drive/Sheet ให้พยายามเดาเนื้อหาจากชื่อไฟล์
                        
                        ตอบกลับในรูปแบบ JSON เท่านั้น:
                        {
                          "title": "ชื่อเรื่องภาษาไทย",
                          "description": "คำอธิบายภาษาไทยสั้นๆ",
                          "thumbnailUrl": "ลิงก์รูปภาพ (ถ้ามี)",
                          "tags": ["แท็ก1", "แท็ก2", "แท็ก3"]
                        }`,
                        config: { responseMimeType: "application/json" }
                    });

                    const aiData = JSON.parse(response.text || '{}');
                    
                    // Smart Merge: Only overwrite title if we don't have a solid one or if AI title is significantly better/Thai version
                    if (aiData.title && (!rawTitle || rawTitle.length < 5)) {
                        title = aiData.title;
                    } else if (aiData.title && rawTitle) {
                        // If we have a raw title, maybe AI just translated it or cleaned it up
                        title = aiData.title;
                    }

                    if (aiData.description) description = aiData.description;
                    if (aiData.thumbnailUrl && !thumbnailUrl) thumbnailUrl = aiData.thumbnailUrl;
                    if (aiData.tags) integrationTags = aiData.tags;
                } catch (aiErr: any) {
                    console.warn('AI Metadata enrichment failed:', aiErr);
                }
            }

            // 3. Manual Fallback (If AI was skipped or failed and we still have a generic title)
            if (title.startsWith('New ') || title === "External Resource" || title.includes('link')) {
                try {
                    const urlObj = new URL(url);
                    const hostname = urlObj.hostname.replace('www.', '');
                    
                    if (platform === NexusPlatform.GENERIC) {
                        title = hostname.charAt(0).toUpperCase() + hostname.slice(1);
                    } else if (platform === NexusPlatform.CANVA) {
                        title = "Canva Design";
                    } else {
                        // For Drive/Sheets/Notion, try to get something from the path
                        const pathParts = urlObj.pathname.split('/').filter(p => p.length > 5);
                        if (pathParts.length > 0) {
                            const lastPart = pathParts[pathParts.length - 1];
                            if (lastPart.includes('-')) {
                                title = lastPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            } else {
                                title = `${platform.charAt(0) + platform.slice(1).toLowerCase().replace('_', ' ')} Resource`;
                            }
                        }
                    }
                } catch {
                    // Keep default
                }
            }

            const newIntegration: any = {
                user_id: currentUser.id,
                title,
                url,
                platform,
                description,
                thumbnail_url: thumbnailUrl,
                tags: integrationTags,
                updated_at: new Date().toISOString()
            };

            // Save to Supabase
            const { data, error } = await supabase
                .from('nexus_integrations')
                .insert([newIntegration])
                .select()
                .single();

            if (error) throw error;

            const updated = [data, ...integrations];
            setIntegrations(updated);
            localStorage.setItem(`nexus_integrations_${currentUser.id}`, JSON.stringify(updated));
        } catch (err) {
            console.error('Error adding integration:', err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteIntegration = async (id: string) => {
        if (!currentUser) return;
        const updated = integrations.filter(i => i.id !== id);
        setIntegrations(updated);
        localStorage.setItem(`nexus_integrations_${currentUser.id}`, JSON.stringify(updated));
        
        try {
            await supabase.from('nexus_integrations').delete().eq('id', id);
        } catch (err) {
            console.error('Error deleting integration:', err);
        }
    };

    const handleUpdateIntegration = async (id: string, updates: Partial<NexusIntegration>) => {
        if (!currentUser) return;
        
        const updatedIntegrations = integrations.map(i => i.id === id ? { ...i, ...updates } : i);
        setIntegrations(updatedIntegrations);
        localStorage.setItem(`nexus_integrations_${currentUser.id}`, JSON.stringify(updatedIntegrations));

        try {
            const { error } = await supabase
                .from('nexus_integrations')
                .update({
                    title: updates.title,
                    description: updates.description,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating integration:', err);
        } finally {
            setEditingIntegration(null);
        }
    };

    const handleToggleTag = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const availableTags = Array.from(new Set(
        integrations.flatMap(i => i.tags || [])
    )).sort();

    const filteredIntegrations = integrations.filter(i => {
        // Category Filtering
        let matchesTab = true;
        if (activeTab === 'SOCIAL') {
            matchesTab = [NexusPlatform.YOUTUBE, NexusPlatform.TIKTOK, NexusPlatform.FACEBOOK, NexusPlatform.INSTAGRAM].includes(i.platform);
        } else if (activeTab === 'PRODUCTIVITY') {
            matchesTab = [NexusPlatform.GOOGLE_SHEETS, NexusPlatform.GOOGLE_DRIVE, NexusPlatform.NOTION].includes(i.platform);
        } else if (activeTab === 'DESIGN') {
            matchesTab = i.platform === NexusPlatform.CANVA;
        } else if (activeTab === 'WEB') {
            matchesTab = i.platform === NexusPlatform.GENERIC;
        }

        // Search Filtering
        const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             i.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (i.tags && i.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
        
        // Tag Filtering
        const matchesTags = selectedTags.length === 0 || 
                           (i.tags && selectedTags.every(tag => i.tags?.includes(tag)));

        return matchesTab && matchesSearch && matchesTags;
    });

    return (
        <AppBackground theme={currentTheme} pattern="dots">
            <div className="min-h-screen p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                {onNavigateMode && (
                                    <button 
                                        onClick={() => onNavigateMode('ARTICLES')}
                                        className="p-2 hover:bg-white/50 rounded-xl transition-all text-slate-400 hover:text-indigo-600 group"
                                        title="กลับไปหน้า Wiki"
                                    >
                                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                                        <Share2 className="w-6 h-6 text-white" />
                                    </div>
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Nexus Hub</h1>
                                </div>
                            </div>
                            <p className="text-slate-500 font-medium max-w-md">
                                ศูนย์กลางการจัดการเครื่องมือและทรัพยากรภายนอกทั้งหมด เชื่อมต่อ ดูตัวอย่าง และจัดการทุกอย่างได้ในที่เดียว
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setIsHelpOpen(true)}
                                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                            >
                                <HelpCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Search & Add Section */}
                    <NexusHeader 
                        onAdd={handleAddIntegration} 
                        isAdding={isAdding} 
                        aiEnabled={aiEnabled} 
                        hasApiKey={!!apiKey}
                    />

                    {/* Filters & Controls */}
                    <NexusFilter 
                        activeTab={activeTab} 
                        onTabChange={setActiveTab} 
                        availableTags={availableTags}
                        selectedTags={selectedTags}
                        onToggleTag={handleToggleTag}
                        onClearTags={() => setSelectedTags([])}
                    />

                    {/* Main List Grid */}
                    {isLoading ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">กำลังซิงโครไนซ์ข้อมูล...</p>
                        </div>
                    ) : filteredIntegrations.length > 0 ? (
                        <motion.div 
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredIntegrations.map((integration) => (
                                    <NexusCard 
                                        key={integration.id} 
                                        integration={integration} 
                                        onDelete={handleDeleteIntegration}
                                        onEdit={setEditingIntegration}
                                        onPreview={(int) => setPreviewIntegration(int)}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-32 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-200"
                        >
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <Sparkles className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">ไม่พบการเชื่อมต่อ</h3>
                            <p className="text-slate-500 font-medium max-w-xs mx-auto">
                                เริ่มต้นด้วยการวางลิงก์ด้านบนเพื่อเชื่อมต่อเครื่องมือภายนอกของคุณเข้ากับ Nexus
                            </p>
                        </motion.div>
                    )}

                    {/* Footer Stats */}
                    <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">รายการทั้งหมด</span>
                                <span className="text-xl font-bold text-slate-800">{integrations.length}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100" />
                            <div className="flex flex-col">
                                <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">อัปเดตล่าสุด</span>
                                <span className="text-xl font-bold text-slate-800">เมื่อครู่</span>
                            </div>
                        </div>
                        
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Nexus Hub v1.0 • เข้ารหัสปลอดภัย
                        </p>
                    </div>

                    {/* Preview Modal (YouTube & Google) */}
                    <NexusPreviewModal 
                        integration={previewIntegration}
                        onClose={() => setPreviewIntegration(null)}
                    />

                    {/* Edit Modal */}
                    <NexusEditModal 
                        integration={editingIntegration}
                        onClose={() => setEditingIntegration(null)}
                        onSave={handleUpdateIntegration}
                    />

                    {/* Settings Modal */}
                    <NexusSettingsModal 
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        aiEnabled={aiEnabled}
                        onAiToggle={updateAiEnabled}
                        currentTheme={currentTheme}
                        onThemeChange={updateTheme}
                        onClearCache={handleClearCache}
                    />

                    {/* Help Modal */}
                    <NexusHelpModal 
                        isOpen={isHelpOpen}
                        onClose={() => setIsHelpOpen(false)}
                    />
                </div>
            </div>
        </AppBackground>
    );
};

export default NexusHub;
