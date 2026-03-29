
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Share2, Settings, HelpCircle, Search, Loader2, X, Save, FileSpreadsheet, HardDrive, FolderPlus, Plus, Folder, LayoutGrid } from 'lucide-react';
import NexusHeader from './NexusHeader';
import NexusFilter from './NexusFilter';
import NexusCard from './NexusCard';
import NexusEditModal from './NexusEditModal';
import NexusSettingsModal from './NexusSettingsModal';
import NexusHelpModal from './NexusHelpModal';
import NexusPreviewModal from './NexusPreviewModal';
import NexusFolderCard from './folders/NexusFolderCard';
import NexusFolderModal from './folders/NexusFolderModal';
import NexusBreadcrumbs from './layout/NexusBreadcrumbs';
import NexusNavigation from './layout/NexusNavigation';
import NexusEmptyState from './layout/NexusEmptyState';
import { NexusIntegration, NexusPlatform, User, NexusFolder } from '../../types';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useNexusData } from '../../hooks/nexus/useNexusData';
import { useNexusActions } from '../../hooks/nexus/useNexusActions';
import { filterIntegrations, filterFolders } from './utils/nexusFilters';
import AppBackground, { BackgroundTheme } from '../common/AppBackground';

interface NexusHubProps {
    currentUser: User;
    onNavigateMode?: (mode: 'ARTICLES' | 'HANDBOOK' | 'NEXUS') => void;
}

const NexusHub: React.FC<NexusHubProps> = ({ currentUser, onNavigateMode }) => {
    const { showConfirm } = useGlobalDialog();
    const apiKey = process.env.GEMINI_API_KEY;

    // Data Hook
    const { 
        integrations, setIntegrations, 
        folders, setFolders, 
        isLoading, fetchData 
    } = useNexusData(currentUser);

    // UI State
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ALL' | 'SOCIAL' | 'PRODUCTIVITY' | 'DESIGN' | 'WEB'>('ALL');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewIntegration, setPreviewIntegration] = useState<NexusIntegration | null>(null);
    const [editingIntegration, setEditingIntegration] = useState<NexusIntegration | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState<NexusFolder | null>(null);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>('pastel-indigo');

    // Actions Hook
    const {
        isAdding,
        handleAddIntegration,
        handleDeleteIntegration,
        handleUpdateIntegration,
        handleSaveFolder,
        handleDeleteFolder
    } = useNexusActions(
        currentUser,
        integrations, setIntegrations,
        folders, setFolders,
        currentFolderId,
        aiEnabled,
        apiKey,
        showConfirm
    );

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

    const handleClearCache = async () => {
        if (await showConfirm('คุณต้องการล้างข้อมูลแคชทั้งหมดหรือไม่? (ข้อมูลในฐานข้อมูลจะไม่หายไป)')) {
            localStorage.removeItem(`nexus_integrations_${currentUser.id}`);
            localStorage.removeItem(`nexus_folders_${currentUser.id}`);
            fetchData();
        }
    };

    // Filtered Data
    const filteredIntegrations = useMemo(() => 
        filterIntegrations(integrations, activeTab, selectedTags, searchQuery, currentFolderId),
    [integrations, activeTab, selectedTags, searchQuery, currentFolderId]);

    const filteredFolders = useMemo(() => 
        filterFolders(folders, searchQuery, currentFolderId),
    [folders, searchQuery, currentFolderId]);

    const hasResults = filteredIntegrations.length > 0 || filteredFolders.length > 0;

    const currentFolder = useMemo(() => 
        folders.find(f => f.id === currentFolderId) || null
    , [folders, currentFolderId]);

    const availableTags = useMemo(() => Array.from(new Set(
        integrations.flatMap(i => i.tags || [])
    )).sort(), [integrations]);

    const handleToggleTag = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const content = (
        <div className={`max-w-7xl mx-auto ${onNavigateMode ? 'pt-6' : ''}`}>
            {/* Navigation & Title */}
            <NexusNavigation 
                currentFolder={currentFolder}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenHelp={() => setIsHelpOpen(true)}
                isIntegrated={!!onNavigateMode}
            />

                {/* Search & Add Section */}
                <div className={onNavigateMode ? 'mb-8' : 'mb-12'}>
                    <NexusHeader 
                        onAdd={handleAddIntegration} 
                        isAdding={isAdding} 
                        aiEnabled={aiEnabled} 
                        hasApiKey={!!apiKey}
                    />
                </div>

                {/* Filters & Folder Actions */}
                <div className={`flex flex-col md:flex-row items-start justify-between gap-6 ${onNavigateMode ? 'mb-6' : 'mb-10'}`}>
                    <div className="flex-1 w-full">
                        <NexusFilter 
                            activeTab={activeTab} 
                            onTabChange={setActiveTab} 
                            availableTags={availableTags}
                            selectedTags={selectedTags}
                            onToggleTag={handleToggleTag}
                            onClearTags={() => setSelectedTags([])}
                        />
                    </div>

                    <button
                        onClick={() => {
                            setEditingFolder(null);
                            setIsFolderModalOpen(true);
                        }}
                        className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 shrink-0"
                    >
                        <FolderPlus className="w-5 h-5" /> 
                        <span>สร้างโฟลเดอร์</span>
                    </button>
                </div>

            {/* Main List Grid */}
            {isLoading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest">กำลังซิงโครไนซ์ข้อมูล...</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Breadcrumbs Navigation */}
                    <div className="px-2">
                        <NexusBreadcrumbs 
                            currentFolder={currentFolder}
                            folders={folders}
                            onNavigate={setCurrentFolderId}
                        />
                    </div>

                    {hasResults ? (
                        <div className="space-y-16">
                            {/* Search Mode Indicator */}
                            {searchQuery && (
                                <div className="flex items-center gap-3 px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                    <Search className="w-4 h-4 text-indigo-500" />
                                    <p className="text-sm font-bold text-indigo-700">
                                        กำลังแสดงผลการค้นหาสำหรับ: <span className="text-indigo-900 underline underline-offset-4">"{searchQuery}"</span>
                                    </p>
                                    <button 
                                        onClick={() => {
                                            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                                            if (input) {
                                                input.value = '';
                                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                            }
                                        }}
                                        className="ml-auto text-xs font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest"
                                    >
                                        ล้างการค้นหา
                                    </button>
                                </div>
                            )}

                            {/* Folders Section - Only show if not searching or if folders match search */}
                            {(filteredFolders.length > 0) && (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 px-2">
                                        <Folder className="w-5 h-5 text-slate-400" />
                                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">โฟลเดอร์ ({filteredFolders.length})</h2>
                                        <div className="flex-1 h-px bg-slate-100" />
                                    </div>
                                    
                                    <motion.div 
                                        layout
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {filteredFolders.map((folder) => (
                                                <NexusFolderCard 
                                                    key={folder.id}
                                                    folder={folder}
                                                    itemCount={integrations.filter(i => i.folderId === folder.id).length}
                                                    onClick={setCurrentFolderId}
                                                    onEdit={(f) => {
                                                        setEditingFolder(f);
                                                        setIsFolderModalOpen(true);
                                                    }}
                                                    onDelete={handleDeleteFolder}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                </section>
                            )}

                            {/* Items Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <LayoutGrid className="w-5 h-5 text-slate-400" />
                                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                                        {searchQuery ? 'ผลลัพธ์การค้นหา' : 'รายการทั้งหมด'} ({filteredIntegrations.length})
                                    </h2>
                                    <div className="flex-1 h-px bg-slate-100" />
                                </div>

                                <motion.div 
                                    layout
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                >
                                    <AnimatePresence mode="popLayout">
                                        {filteredIntegrations.map((integration) => (
                                            <NexusCard 
                                                key={integration.id} 
                                                integration={integration} 
                                                folderName={searchQuery !== '' ? folders.find(f => f.id === integration.folderId)?.name : undefined}
                                                onDelete={handleDeleteIntegration}
                                                onEdit={setEditingIntegration}
                                                onPreview={(int) => setPreviewIntegration(int)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            </section>
                        </div>
                    ) : (
                        <NexusEmptyState 
                            onAddFolder={() => setIsFolderModalOpen(true)}
                            onFocusAddInput={() => {
                                const input = document.querySelector('input[placeholder*="วางลิงก์"]') as HTMLInputElement;
                                if (input) input.focus();
                            }}
                        />
                    )}
                </div>
            )}

            {/* Footer Stats */}
            <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[14px] font-kanit font-medium text-slate-400 uppercase tracking-widest">รายการทั้งหมด</span>
                        <span className="text-xl font-bold text-slate-800">{integrations.length}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    <div className="flex flex-col">
                        <span className="text-[14px] font-kanit font-medium text-slate-400 uppercase tracking-widest">โฟลเดอร์</span>
                        <span className="text-xl font-bold text-slate-800">{folders.length}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    <div className="flex flex-col">
                        <span className="text-[14px] font-kanit font-medium text-slate-400 uppercase tracking-widest">อัปเดตล่าสุด</span>
                        <span className="text-xl font-kanit font-bold text-slate-800">เมื่อครู่</span>
                    </div>
                </div>
                
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Nexus Hub v2.0 • Folder System Enabled
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
                folders={folders}
                onClose={() => setEditingIntegration(null)}
                onSave={handleUpdateIntegration}
            />

            {/* Folder Modal */}
            <NexusFolderModal 
                isOpen={isFolderModalOpen}
                onClose={() => {
                    setIsFolderModalOpen(false);
                    setEditingFolder(null);
                }}
                onSave={(data) => handleSaveFolder(data, editingFolder)}
                folder={editingFolder}
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
    );

    if (onNavigateMode) {
        return (
            <div className="min-h-full p-4 md:p-8 pt-0">
                {content}
            </div>
        );
    }

    return (
        <AppBackground theme={currentTheme} pattern="dots" className="min-h-screen">
            <div className="min-h-screen p-4 md:p-8">
                {content}
            </div>
        </AppBackground>
    );
};

export default NexusHub;
