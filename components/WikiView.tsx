
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
    const showList = layoutMode === 'STANDARD' || layoutMode === 'FOCUS';

    return (
        // Main Container: Fixed height relative to viewport to enable independent scrolling
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-2xl relative ring-1 ring-white/50 font-sans isolate transition-all duration-500">
            
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 z-50"></div>
            
            {/* 1. LEFT SIDEBAR (Categories Tree) */}
            <div className={`
                ${showSidebar ? 'lg:w-72 opacity-100' : 'lg:w-0 opacity-0'} 
                hidden lg:flex flex-col border-r border-slate-100 bg-slate-50/80 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden
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
                border-r border-slate-100 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
                ${isMobileListVisible ? 'flex w-full absolute inset-0 z-20 lg:static' : 'hidden lg:flex'}
                flex-col bg-white overflow-hidden
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

            {/* 3. RIGHT CONTENT (Reader / Editor) */}
            <div className={`
                flex-1 bg-white flex flex-col relative transition-all duration-500 ease-in-out z-10 overflow-hidden
                ${!isMobileListVisible ? 'absolute inset-0 z-30' : 'hidden lg:flex'}
            `}>
                {isEditing ? (
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
                            <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-6 mx-auto transform -rotate-6 ring-8 ring-white/50">
                                <span className="text-6xl">📖</span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-700 mb-2 tracking-tight">Wiki Knowledge Base</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8 leading-relaxed">
                                คลังความรู้ประจำทีม เลือกหัวข้อจากด้านซ้าย <br/> เพื่อเริ่มอ่านหรือค้นหาข้อมูล
                            </p>
                            
                            <button 
                                onClick={handleCreateStart}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center mx-auto gap-3 group"
                            >
                                <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300 group-hover:spin" /> 
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
