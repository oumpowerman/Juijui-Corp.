
import React, { useState, useMemo, Suspense, lazy } from 'react';
import { WikiArticle, User, MasterOption } from '../types';
import { useWiki } from '../hooks/useWiki';
import { useMasterData } from '../hooks/useMasterData';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import InfoModal from './ui/InfoModal';
import WikiGuide from './wiki/WikiGuide';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useToast } from '../context/ToastContext';

// Import Sub-Components
import WikiSidebar from './wiki/WikiSidebar';
import WikiList from './wiki/WikiList';
import WikiReader from './wiki/WikiReader';
import WikiHandbook from './wiki/WikiHandbook';
import NexusHub from './nexus/NexusHub';

// Lazy Load Editor
const WikiEditor = lazy(() => import('./wiki/WikiEditor'));

interface WikiViewProps {
    currentUser: User;
}

export type WikiLayoutMode = 'STANDARD' | 'FOCUS' | 'ZEN';

const WikiView: React.FC<WikiViewProps> = ({ currentUser }) => {
    const { articles, addArticle, updateArticle, deleteArticle, toggleHelpful } = useWiki(currentUser);
    const { masterOptions } = useMasterData();
    const { showConfirm } = useGlobalDialog();
    const { showToast } = useToast();
    
    // UI State
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingArticle, setViewingArticle] = useState<WikiArticle | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [wikiMode, setWikiMode] = useState<'ARTICLES' | 'HANDBOOK' | 'NEXUS'>('ARTICLES');
    
    // Responsive & Layout State
    const [layoutMode, setLayoutMode] = useState<WikiLayoutMode>('STANDARD');
    const [isMobileListVisible, setIsMobileListVisible] = useState(true);

    const isAdmin = currentUser.role === 'ADMIN';

    // --- Dynamic Categories ---
    const categories = useMemo(() => {
        const cats = masterOptions
            .filter(o => o.type === 'WIKI_CATEGORY' && o.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
            
        // Fallback if no master data
        if (cats.length === 0) {
            return [
                { id: 'gen', key: 'GENERAL', label: 'General', type: 'WIKI_CATEGORY', color: 'bg-gray-100 text-gray-600', sortOrder: 1, isActive: true },
                { id: 'rule', key: 'RULES', label: 'Rules & Policy', type: 'WIKI_CATEGORY', color: 'bg-red-50 text-red-600', sortOrder: 2, isActive: true },
                { id: 'tool', key: 'TOOLS', label: 'Tools', type: 'WIKI_CATEGORY', color: 'bg-blue-50 text-blue-600', sortOrder: 3, isActive: true },
            ] as MasterOption[];
        }
        return cats;
    }, [masterOptions]);

    // --- Filter Logic ---
    const filteredArticles = useMemo(() => {
        return articles.filter(a => {
            // Category Match (Includes sub-categories if we implemented mapping logic, but here simple match)
            // For now, if selected is ALL, show all. If specific, show matches.
            // Note: If you have nested categories, you might want to match children too.
            const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory;
            
            const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                a.content.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchSearch;
        }).sort((a, b) => (Number(b.isPinned) - Number(a.isPinned)));
    }, [articles, selectedCategory, searchQuery]);

    // --- Actions ---
    const handleCreateStart = () => {
        setViewingArticle(null);
        setIsEditing(true);
        setIsMobileListVisible(false); 
    };

    const handleEditStart = (article: WikiArticle) => {
        setViewingArticle(article);
        setIsEditing(true);
    };

    const handleOpenArticle = (article: WikiArticle) => {
        setViewingArticle(article);
        setIsEditing(false);
        setIsMobileListVisible(false); 
    };

    const handleBackToList = () => {
        // Only clear viewing article if we are not editing an existing one
        if (!isEditing) {
            setViewingArticle(null);
        }
        setIsEditing(false);
        setIsMobileListVisible(true);
    };

    const handleSave = async (formData: Partial<WikiArticle>) => {
        if (!formData.title?.trim()) {
            showToast('กรุณากรอกหัวข้อบทความครับ', 'error');
            return;
        }
        
        const payload: any = {
            ...formData,
            content: formData.content || '<p></p>',
            targetRoles: (formData.targetRoles && formData.targetRoles.length > 0) ? formData.targetRoles : ['ALL']
        };

        if (formData.id) {
            await updateArticle(formData.id, payload);
            // Update local view immediately for snappy feel
            if (viewingArticle && viewingArticle.id === formData.id) {
                setViewingArticle({ ...viewingArticle, ...payload } as WikiArticle);
            }
        } else {
            await addArticle({
                title: payload.title,
                content: payload.content,
                category: payload.category || (selectedCategory !== 'ALL' ? selectedCategory : categories[0]?.key || 'GENERAL'),
                targetRoles: payload.targetRoles,
                isPinned: payload.isPinned,
                coverImage: payload.coverImage
            });
            handleBackToList(); 
        }
        setIsEditing(false);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm('คุณต้องการลบบทความนี้ใช่หรือไม่?', 'ยืนยันการลบ');
        if (confirmed) {
            await deleteArticle(id);
            handleBackToList();
        }
    };

    // --- Layout Controllers ---
    const cycleLayoutMode = () => {
        setLayoutMode(prev => {
            if (prev === 'STANDARD') return 'FOCUS';
            if (prev === 'FOCUS') return 'ZEN';
            return 'STANDARD';
        });
    };

    // Calculate visibility based on layout mode (Desktop only logic)
    const showSidebar = layoutMode === 'STANDARD';
    const showList = (layoutMode === 'STANDARD' || layoutMode === 'FOCUS') && wikiMode === 'ARTICLES';

    return (
        // Main Container: Fixed height relative to viewport to enable independent scrolling
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative ring-1 ring-white/50 font-sans isolate transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
            
            {/* Background Decoration - More 3D & Pastel */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 z-50 opacity-80"></div>
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pink-200/20 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            {/* 1. LEFT SIDEBAR (Categories Tree) */}
            <div className={`
                ${showSidebar ? 'lg:w-72 opacity-100' : 'lg:w-0 opacity-0'} 
                hidden lg:flex flex-col border-r border-white/40 bg-white/30 backdrop-blur-md transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
            `}>
                <WikiSidebar 
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    isOpen={true} // Controlled by parent width
                    onClose={() => setLayoutMode('FOCUS')}
                    onOpenGuide={() => setIsInfoOpen(true)}
                />
            </div>

            {/* 2. MIDDLE LIST (Articles) */}
            <div className={`
                ${showList ? 'lg:w-96 opacity-100' : 'lg:w-0 opacity-0'}
                border-r border-white/40 min-w-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${isMobileListVisible ? 'flex w-full absolute inset-0 z-20 lg:static' : 'hidden lg:flex'}
                flex-col bg-white/40 backdrop-blur-sm overflow-hidden
            `}>
                <WikiList 
                    articles={filteredArticles}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    viewingArticleId={viewingArticle?.id}
                    onSelectArticle={handleOpenArticle}
                    onCreate={handleCreateStart}
                    isSidebarOpen={showSidebar}
                    onOpenSidebar={() => setLayoutMode('STANDARD')}
                    isMobileListVisible={isMobileListVisible}
                />
            </div>

            {/* 3. RIGHT CONTENT (Reader / Editor / Handbook / NexusHub) */}
            <div className={`
                flex-1 bg-white/60 backdrop-blur-md flex flex-col relative transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-10 overflow-hidden
                ${!isMobileListVisible ? 'absolute inset-0 z-30' : 'hidden lg:flex'}
            `}>
                {/* Tab Switch Header - Glassy & 3D */}
                <div className="p-4 border-b border-white/40 bg-white/20 backdrop-blur-sm flex justify-center shrink-0">
                    <div className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-[2rem] w-full max-w-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_8px_16px_-4px_rgba(0,0,0,0.05)] border border-white/60">
                        <button 
                            onClick={() => {
                                setWikiMode('ARTICLES');
                                setIsMobileListVisible(true);
                            }}
                            className={`flex-1 py-2.5 rounded-[1.5rem] text-xs font-bold transition-all duration-300 ${wikiMode === 'ARTICLES' ? 'bg-white shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'}`}
                        >
                            Articles
                        </button>
                        <button 
                            onClick={() => {
                                setWikiMode('HANDBOOK');
                                setIsMobileListVisible(false);
                            }}
                            className={`flex-1 py-2.5 rounded-[1.5rem] text-xs font-bold transition-all duration-300 ${wikiMode === 'HANDBOOK' ? 'bg-white shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'}`}
                        >
                            Handbook
                        </button>
                        <button 
                            onClick={() => {
                                setWikiMode('NEXUS');
                                setIsMobileListVisible(false);
                            }}
                            className={`flex-1 py-2.5 rounded-[1.5rem] text-xs font-bold transition-all duration-300 ${wikiMode === 'NEXUS' ? 'bg-white shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'}`}
                        >
                            Nexus Hub
                        </button>
                    </div>
                </div>
                {wikiMode === 'NEXUS' ? (
                    <NexusHub currentUser={currentUser} onNavigateMode={setWikiMode} />
                ) : wikiMode === 'HANDBOOK' ? (
                    <WikiHandbook currentUser={currentUser} />
                ) : isEditing ? (
                    <Suspense fallback={
                        <div className="flex-1 flex flex-col items-center justify-center text-indigo-300">
                            <Loader2 className="w-12 h-12 animate-spin mb-4" />
                            <p className="font-bold text-sm animate-pulse">กำลังโหลดเครื่องมือเขียน...</p>
                        </div>
                    }>
                        <WikiEditor 
                            initialData={viewingArticle || { category: selectedCategory === 'ALL' ? (categories[0]?.key || 'GENERAL') : selectedCategory }}
                            categories={categories}
                            onSave={handleSave}
                            onCancel={() => {
                                setIsEditing(false);
                                if (!viewingArticle) handleBackToList();
                            }}
                        />
                    </Suspense>
                ) : viewingArticle ? (
                    <WikiReader 
                        article={viewingArticle}
                        category={categories.find(c => c.key === viewingArticle.category)}
                        isAdmin={isAdmin}
                        onBack={handleBackToList}
                        onEdit={handleEditStart}
                        onDelete={handleDelete}
                        onToggleHelpful={toggleHelpful}
                        layoutMode={layoutMode}
                        onCycleLayout={cycleLayoutMode}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30 relative overflow-hidden">
                         {/* Playful Empty State Decor */}
                         <div className="absolute w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -top-20 -right-20 pointer-events-none animate-pulse"></div>
                         <div className="absolute w-[400px] h-[400px] bg-pink-50/50 rounded-full blur-3xl bottom-0 left-0 pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

                        <div className="relative z-10 text-center animate-in zoom-in-95 duration-500 hover:scale-105 transition-transform px-6">
                            <div className="w-32 h-32 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] flex items-center justify-center mb-6 mx-auto transform -rotate-6 ring-8 ring-white/50 border border-white/60">
                                <span className="text-6xl">📖</span>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-700 mb-2 tracking-tight">Wiki Knowledge Base</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8 leading-relaxed">
                                คลังความรู้ประจำทีม เลือกหัวข้อจากด้านซ้าย <br/> เพื่อเริ่มอ่านหรือค้นหาข้อมูล
                            </p>
                            
                            <button 
                                onClick={handleCreateStart}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-bold rounded-2xl shadow-[0_20px_40px_-12px_rgba(99,102,241,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(99,102,241,0.5)] hover:-translate-y-1.5 transition-all active:scale-95 flex items-center mx-auto gap-3 group"
                            >
                                <Sparkles className="w-5 h-5 text-yellow-200 fill-yellow-200 group-hover:rotate-12 transition-transform" /> 
                                เขียนบทความใหม่
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* INFO MODAL */}
            <InfoModal 
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="คู่มือ Wiki Library"
            >
                <WikiGuide />
            </InfoModal>
        </div>
    );
};

export default WikiView;
