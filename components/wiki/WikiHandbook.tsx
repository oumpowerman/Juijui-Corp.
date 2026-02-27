
import React, { useState, useMemo } from 'react';
import { User, WikiNode, WikiNodeType } from '../../types';
import { useWikiNodes } from '../../hooks/useWikiNodes';
import { 
    Folder, 
    FileText, 
    ChevronRight, 
    Plus, 
    ArrowLeft, 
    Edit3, 
    Trash2, 
    Search,
    LayoutGrid,
    List,
    Briefcase,
    Users,
    Video,
    Camera,
    PenTool,
    Settings,
    Sparkles,
    Zap,
    BookOpen,
    Info,
    Trophy,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import WikiNodeEditor from './WikiNodeEditor';

interface WikiHandbookProps {
    currentUser: User;
}

const WikiHandbook: React.FC<WikiHandbookProps> = ({ currentUser }) => {
    const { nodes, isLoading, addNode, updateNode, deleteNode } = useWikiNodes(currentUser);
    const { showConfirm } = useGlobalDialog();

    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<WikiNode | null>(null);
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

    const isAdmin = currentUser.role === 'ADMIN';

    // --- Navigation Logic ---
    const currentNode = useMemo(() => nodes.find(n => n.id === currentParentId), [nodes, currentParentId]);
    
    const breadcrumbs = useMemo(() => {
        const path: WikiNode[] = [];
        let curr = currentNode;
        while (curr) {
            path.unshift(curr);
            curr = nodes.find(n => n.id === curr?.parentId);
        }
        return path;
    }, [nodes, currentNode]);

    const filteredNodes = useMemo(() => {
        return nodes.filter(n => {
            const matchParent = n.parentId === currentParentId;
            const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                n.description?.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (searchQuery) return matchSearch;
            return matchParent;
        }).sort((a, b) => a.sortOrder - b.sortOrder);
    }, [nodes, currentParentId, searchQuery]);

    // --- Smart Stats ---
    const stats = useMemo(() => {
        const totalNodes = nodes.length;
        const folders = nodes.filter(n => n.type === 'FOLDER').length;
        const pages = nodes.filter(n => n.type === 'PAGE').length;
        const recentlyUpdated = nodes.filter(n => {
            const updatedDate = new Date(n.updatedAt);
            const now = new Date();
            const diffDays = Math.ceil(Math.abs(now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
        }).length;

        return { totalNodes, folders, pages, recentlyUpdated };
    }, [nodes]);

    // --- Handlers ---
    const handleNodeClick = (node: WikiNode) => {
        if (node.type === 'FOLDER') {
            setCurrentParentId(node.id);
            setSearchQuery('');
        } else {
            setEditingNode(node);
            setIsEditorOpen(true);
        }
    };

    const handleBack = () => {
        if (currentNode) {
            setCurrentParentId(currentNode.parentId);
        }
    };

    const handleCreate = (type: WikiNodeType) => {
        setEditingNode({
            parentId: currentParentId,
            type
        } as any);
        setIsEditorOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, node: WikiNode) => {
        e.stopPropagation();
        const confirmed = await showConfirm(
            `คุณต้องการลบ "${node.title}" ใช่หรือไม่? ${node.type === 'FOLDER' ? 'หัวข้อย่อยทั้งหมดจะถูกลบไปด้วย' : ''}`,
            'ยืนยันการลบ'
        );
        if (confirmed) {
            deleteNode(node.id);
        }
    };

    const handleEdit = (e: React.MouseEvent, node: WikiNode) => {
        e.stopPropagation();
        setEditingNode(node);
        setIsEditorOpen(true);
    };

    const getIcon = (iconName: string | undefined, type: WikiNodeType) => {
        if (!iconName) return type === 'FOLDER' ? <Folder className="w-6 h-6" /> : <FileText className="w-6 h-6" />;
        
        switch (iconName) {
            case 'Briefcase': return <Briefcase className="w-6 h-6" />;
            case 'Users': return <Users className="w-6 h-6" />;
            case 'Video': return <Video className="w-6 h-6" />;
            case 'Camera': return <Camera className="w-6 h-6" />;
            case 'PenTool': return <PenTool className="w-6 h-6" />;
            case 'Settings': return <Settings className="w-6 h-6" />;
            default: return <span className="text-xl">{iconName}</span>;
        }
    };

    const getNodeColor = (index: number, type: WikiNodeType) => {
        const folderColors = [
            'from-indigo-500 to-purple-600 shadow-indigo-100',
            'from-blue-500 to-cyan-600 shadow-blue-100',
            'from-violet-500 to-fuchsia-600 shadow-violet-100',
            'from-emerald-500 to-teal-600 shadow-emerald-100'
        ];
        const pageColors = [
            'from-pink-500 to-rose-600 shadow-pink-100',
            'from-amber-500 to-orange-600 shadow-amber-100',
            'from-sky-500 to-indigo-600 shadow-sky-100',
            'from-lime-500 to-emerald-600 shadow-lime-100'
        ];

        return type === 'FOLDER' 
            ? folderColors[index % folderColors.length] 
            : pageColors[index % pageColors.length];
    };

    if (isLoading) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-600 animate-pulse" />
            </div>
            <p className="mt-4 text-slate-400 font-black text-xs uppercase tracking-widest">Initializing Command Center...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden relative isolate">
            {/* Background Glows */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl -z-10"></div>
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl -z-10"></div>

            {/* --- TOP COMMAND BAR --- */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-6 flex flex-col gap-6 shrink-0 z-20 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <motion.div 
                            whileHover={{ rotate: 15, scale: 1.1 }}
                            className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-200 relative group"
                        >
                            <Sparkles className="w-7 h-7 group-hover:animate-spin-slow" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-bounce"></div>
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
                                Wiki Handbook <span className="text-indigo-600">2.0</span>
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">
                                    <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Smart Command Center
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                    {currentNode ? currentNode.title : 'Main Directory'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search everything..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-72 pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl text-sm font-bold focus:outline-none transition-all shadow-inner"
                            />
                        </div>

                        {/* View Toggles */}
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => setViewMode('GRID')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-white shadow-md text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setViewMode('LIST')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'LIST' ? 'bg-white shadow-md text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>

                        {isAdmin && (
                            <div className="flex gap-2">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCreate('FOLDER')}
                                    className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-100 text-slate-600 font-black text-xs rounded-2xl hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                                >
                                    <Folder className="w-4 h-4" /> Folder
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCreate('PAGE')}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs rounded-2xl hover:shadow-xl hover:shadow-indigo-200 transition-all shadow-lg"
                                >
                                    <Plus className="w-4 h-4 stroke-[3px]" /> Add Page
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Breadcrumbs & Quick Stats */}
                <div className="flex items-center justify-between gap-6 border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        <button 
                            onClick={() => setCurrentParentId(null)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${!currentParentId ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                        >
                            <BookOpen className="w-4 h-4" /> Handbook
                        </button>
                        {breadcrumbs.map((node, idx) => (
                            <React.Fragment key={node.id}>
                                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                                <button 
                                    onClick={() => setCurrentParentId(node.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${idx === breadcrumbs.length - 1 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                >
                                    {node.title}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Guides</span>
                                <span className="text-sm font-black text-slate-700">{stats.pages}</span>
                            </div>
                            <div className="w-px h-6 bg-slate-100"></div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Updated Weekly</span>
                                <span className="text-sm font-black text-indigo-600">+{stats.recentlyUpdated}</span>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                            <Trophy className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase">Team Efficiency: 98%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="max-w-7xl mx-auto">
                    {/* Welcome Banner (Only on Root) */}
                    {!currentParentId && !searchQuery && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-10 p-8 rounded-[3rem] bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-2xl shadow-indigo-200"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/20 shadow-inner">
                                    <Info className="w-10 h-10 text-indigo-300" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-3xl font-black tracking-tight mb-2">Welcome to the HQ Handbook</h3>
                                    <p className="text-indigo-200 font-medium max-w-2xl leading-relaxed">
                                        ศูนย์รวมข้อมูลและแนวทางการทำงานที่อัจฉริยะที่สุด ค้นหาคู่มือการทำงาน (Job Description), ขั้นตอนการปฏิบัติงาน (SOP) และเทคนิคต่างๆ ได้ที่นี่
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="text-xs font-black uppercase tracking-widest">Smart Search Enabled</span>
                                    </div>
                                    <div className="bg-indigo-500/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                                        <Users className="w-4 h-4 text-indigo-300" />
                                        <span className="text-xs font-black uppercase tracking-widest">{stats.folders} Active Folders</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentParentId && !searchQuery && (
                        <button 
                            onClick={handleBack}
                            className="flex items-center gap-3 text-slate-400 hover:text-indigo-600 font-black text-xs mb-8 transition-all group bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm w-fit"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                            <span>Back to {breadcrumbs[breadcrumbs.length - 2]?.title || 'Main Directory'}</span>
                        </button>
                    )}

                    {filteredNodes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-32">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-6 border border-slate-100 relative"
                            >
                                <Folder className="w-14 h-14 opacity-10 text-indigo-600" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Search className="w-8 h-8 text-slate-200 animate-pulse" />
                                </div>
                            </motion.div>
                            <h4 className="font-black text-slate-800 text-lg">ไม่พบข้อมูลที่คุณต้องการ</h4>
                            <p className="text-slate-400 font-medium text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือสร้างหัวข้อใหม่ได้เลย</p>
                            {isAdmin && (
                                <button 
                                    onClick={() => handleCreate('FOLDER')}
                                    className="mt-6 px-6 py-3 bg-indigo-50 text-indigo-600 font-black text-xs rounded-2xl hover:bg-indigo-100 transition-all"
                                >
                                    + เริ่มต้นสร้างหัวข้อใหม่
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={viewMode === 'GRID' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-3"}>
                            <AnimatePresence mode="popLayout">
                                {filteredNodes.map((node, index) => (
                                    <motion.div
                                        key={node.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleNodeClick(node)}
                                        className={`
                                            group relative cursor-pointer transition-all duration-500
                                            ${viewMode === 'GRID' 
                                                ? 'bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-2' 
                                                : 'bg-white px-6 py-4 rounded-[1.5rem] border border-slate-100 flex items-center gap-5 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-100'}
                                        `}
                                    >
                                        {/* Colorful Icon Container */}
                                        <div className={`
                                            shrink-0 flex items-center justify-center rounded-[1.5rem] transition-all duration-500 shadow-lg
                                            ${viewMode === 'GRID' ? 'w-16 h-16 mb-6 group-hover:scale-110 group-hover:rotate-6' : 'w-12 h-12'}
                                            bg-gradient-to-br ${getNodeColor(index, node.type)} text-white
                                        `}>
                                            {getIcon(node.icon, node.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`font-black text-slate-800 truncate ${viewMode === 'GRID' ? 'text-lg' : 'text-base'}`}>
                                                    {node.title}
                                                </h4>
                                                {node.type === 'FOLDER' && (
                                                    <span className="bg-slate-100 text-slate-400 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Folder</span>
                                                )}
                                            </div>
                                            {node.description && (
                                                <p className={`text-slate-400 font-bold leading-relaxed line-clamp-2 ${viewMode === 'GRID' ? 'text-xs' : 'text-[11px]'}`}>
                                                    {node.description}
                                                </p>
                                            )}
                                        </div>

                                        {isAdmin && (
                                            <div className="absolute top-5 right-5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                <button 
                                                    onClick={(e) => handleEdit(e, node)}
                                                    className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-lg hover:scale-110 transition-all"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, node)}
                                                    className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-red-600 rounded-xl shadow-lg hover:scale-110 transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}

                                        {node.type === 'FOLDER' && viewMode === 'GRID' && (
                                            <div className="absolute bottom-7 right-7 text-slate-200 group-hover:text-indigo-400 transition-all group-hover:translate-x-1">
                                                <ChevronRight className="w-7 h-7" />
                                            </div>
                                        )}

                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Modal */}
            <WikiNodeEditor 
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                node={editingNode}
                onSave={async (data) => {
                    if (editingNode?.id) {
                        await updateNode(editingNode.id, data);
                    } else {
                        await addNode(data as any);
                    }
                    setIsEditorOpen(false);
                }}
            />
        </div>
    );
};

export default WikiHandbook;
