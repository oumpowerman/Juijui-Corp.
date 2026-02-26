
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
    MoreVertical,
    Search,
    LayoutGrid,
    List,
    Briefcase,
    Users,
    Video,
    Camera,
    PenTool,
    Settings
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
            
            // If searching, ignore parent structure to find anything
            if (searchQuery) return matchSearch;
            return matchParent;
        }).sort((a, b) => a.sortOrder - b.sortOrder);
    }, [nodes, currentParentId, searchQuery]);

    // --- Handlers ---
    const handleNodeClick = (node: WikiNode) => {
        if (node.type === 'FOLDER') {
            setCurrentParentId(node.id);
            setSearchQuery('');
        } else {
            // Open Page View (could be a modal or a separate view)
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
        if (!iconName) return type === 'FOLDER' ? <Folder /> : <FileText />;
        
        switch (iconName) {
            case 'Briefcase': return <Briefcase />;
            case 'Users': return <Users />;
            case 'Video': return <Video />;
            case 'Camera': return <Camera />;
            case 'PenTool': return <PenTool />;
            case 'Settings': return <Settings />;
            default: return <span>{iconName}</span>; // Assume emoji if not matched
        }
    };

    if (isLoading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            {/* Header / Toolbar */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col gap-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Team Handbook</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Descriptions & Guidelines</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                            <button 
                                onClick={() => setViewMode('GRID')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('LIST')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {isAdmin && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleCreate('FOLDER')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    <Folder className="w-4 h-4" /> + Folder
                                </button>
                                <button 
                                    onClick={() => handleCreate('PAGE')}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Add Page
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Breadcrumbs & Search */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                        <button 
                            onClick={() => setCurrentParentId(null)}
                            className={`flex items-center gap-1 text-xs font-bold transition-colors ${!currentParentId ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Handbook
                        </button>
                        {breadcrumbs.map((node, idx) => (
                            <React.Fragment key={node.id}>
                                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                                <button 
                                    onClick={() => setCurrentParentId(node.id)}
                                    className={`flex items-center gap-1 text-xs font-bold transition-colors whitespace-nowrap ${idx === breadcrumbs.length - 1 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {node.title}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search handbook..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {currentParentId && !searchQuery && (
                    <button 
                        onClick={handleBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs mb-6 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                    </button>
                )}

                {filteredNodes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-slate-100">
                            <Folder className="w-10 h-10 opacity-20" />
                        </div>
                        <p className="font-bold text-sm">ยังไม่มีข้อมูลในส่วนนี้</p>
                        {isAdmin && (
                            <button 
                                onClick={() => handleCreate('FOLDER')}
                                className="mt-4 text-indigo-600 font-bold text-xs hover:underline"
                            >
                                เริ่มต้นสร้างหัวข้อใหม่
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={viewMode === 'GRID' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-2"}>
                        <AnimatePresence mode="popLayout">
                            {filteredNodes.map((node) => (
                                <motion.div
                                    key={node.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => handleNodeClick(node)}
                                    className={`
                                        group relative cursor-pointer transition-all duration-300
                                        ${viewMode === 'GRID' 
                                            ? 'bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1' 
                                            : 'bg-white px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-slate-50'}
                                    `}
                                >
                                    <div className={`
                                        shrink-0 flex items-center justify-center rounded-2xl transition-colors
                                        ${viewMode === 'GRID' ? 'w-12 h-12 mb-4' : 'w-10 h-10'}
                                        ${node.type === 'FOLDER' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}
                                    `}>
                                        {getIcon(node.icon, node.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-black text-slate-800 truncate ${viewMode === 'GRID' ? 'text-base mb-1' : 'text-sm'}`}>
                                            {node.title}
                                        </h4>
                                        {node.description && (
                                            <p className={`text-slate-400 font-medium line-clamp-2 ${viewMode === 'GRID' ? 'text-[10px]' : 'text-[9px]'}`}>
                                                {node.description}
                                            </p>
                                        )}
                                    </div>

                                    {isAdmin && (
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => handleEdit(e, node)}
                                                className="p-1.5 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm"
                                            >
                                                <Edit3 className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(e, node)}
                                                className="p-1.5 bg-white border border-slate-100 text-slate-400 hover:text-red-600 rounded-lg shadow-sm"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}

                                    {node.type === 'FOLDER' && viewMode === 'GRID' && (
                                        <div className="absolute bottom-5 right-5 text-slate-200 group-hover:text-indigo-200 transition-colors">
                                            <ChevronRight className="w-6 h-6" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
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
