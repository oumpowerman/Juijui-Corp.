
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
    
    // Responsive State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
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

    // --- Renders ---

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-2xl relative ring-1 ring-white/50 font-sans isolate">
            
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 z-50"></div>
            
            {/* 1. LEFT SIDEBAR (Categories) */}
            <WikiSidebar 
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onOpenGuide={() => setIsInfoOpen(true)}
            />

            {/* 2. MIDDLE LIST (Articles) */}
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
                isSidebarOpen={isSidebarOpen}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                isMobileListVisible={isMobileListVisible}
            />

            {/* 3. RIGHT CONTENT (Reader / Editor) */}
            <div className={`
                flex-1 bg-white flex flex-col relative transition-all duration-500 ease-in-out z-20 overflow-hidden
                ${!isMobileListVisible ? 'absolute inset-0' : 'hidden lg:flex'}
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
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30 relative overflow-hidden">
                         {/* Empty State Decor */}
                         <div className="absolute w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -top-20 -right-20 pointer-events-none"></div>
                         <div className="absolute w-[400px] h-[400px] bg-cyan-50/50 rounded-full blur-3xl bottom-0 left-0 pointer-events-none"></div>

                        <div className="relative z-10 text-center animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6 mx-auto transform rotate-6 hover:rotate-12 transition-transform duration-500">
                                <FileText className="w-12 h-12 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-700 mb-2">เลือกบทความเพื่ออ่าน</h3>
                            <p className="text-slate-400 font-medium max-w-xs mx-auto mb-8">
                                คลังความรู้ของทีม รวบรวมเทคนิค Workflow <br/>และคู่มือต่างๆ ไว้ที่นี่
                            </p>
                            
                            <button 
                                onClick={handleCreateStart}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95 flex items-center mx-auto gap-2"
                            >
                                <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" /> สร้างบทความใหม่
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
