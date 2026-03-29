
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Folder, HardDrive, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { NexusIntegration, NexusFolder } from '../../types';

interface NexusEditModalProps {
    integration: NexusIntegration | null;
    folders: NexusFolder[];
    onClose: () => void;
    onSave: (id: string, updates: Partial<NexusIntegration>) => void;
}

const NexusEditModal: React.FC<NexusEditModalProps> = ({ integration, folders, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [folderId, setFolderId] = useState<string | null>(null);
    const [folderSearch, setFolderSearch] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (integration) {
            setTitle(integration.title || '');
            setDescription(integration.description || '');
            setFolderId((integration as any).folder_id || null);
        }
    }, [integration]);

    // Build hierarchical tree
    const folderTree = useMemo(() => {
        const map: Record<string, any> = {};
        const roots: any[] = [];
        
        folders.forEach(f => {
            map[f.id] = { ...f, children: [] };
        });
        
        folders.forEach(f => {
            if (f.parentId && map[f.parentId]) {
                map[f.parentId].children.push(map[f.id]);
            } else {
                roots.push(map[f.id]);
            }
        });
        
        return roots;
    }, [folders]);

    const filteredFolders = folders.filter(f => 
        f.name.toLowerCase().includes(folderSearch.toLowerCase())
    );

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const renderTree = (items: any[], level = 0) => {
        return items.map(item => {
            const isExpanded = expandedFolders.has(item.id);
            const hasChildren = item.children && item.children.length > 0;
            const isSelected = folderId === item.id;

            return (
                <div key={item.id} className="flex flex-col">
                    <button
                        onClick={() => setFolderId(item.id)}
                        className={`group flex items-center gap-2 p-2 rounded-xl transition-all text-left relative ${
                            isSelected 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                        style={{ marginLeft: `${level * 20}px` }}
                    >
                        {/* Guide Line */}
                        {level > 0 && (
                            <div 
                                className="absolute left-[-10px] top-[-10px] bottom-1/2 w-[1px] bg-slate-200"
                                style={{ left: '-12px' }}
                            />
                        )}
                        {level > 0 && (
                            <div 
                                className="absolute left-[-10px] top-1/2 w-[10px] h-[1px] bg-slate-200"
                                style={{ left: '-12px' }}
                            />
                        )}

                        <div className="flex items-center gap-1 min-w-[20px]">
                            {hasChildren ? (
                                <div 
                                    onClick={(e) => toggleExpand(item.id, e)}
                                    className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                                >
                                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </div>
                            ) : (
                                <div className="w-3" />
                            )}
                        </div>

                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                            <Folder className="w-3.5 h-3.5" style={{ color: !isSelected ? item.color : undefined }} />
                        </div>
                        
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold leading-none truncate">{item.name}</span>
                            {item.description && (
                                <span className="text-[8px] font-medium opacity-50 truncate">{item.description}</span>
                            )}
                        </div>

                        {isSelected && (
                            <motion.div 
                                layoutId="active-folder"
                                className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-600"
                            />
                        )}
                    </button>

                    <AnimatePresence>
                        {isExpanded && hasChildren && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                {renderTree(item.children, level + 1)}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        });
    };

    const handleSave = () => {
        if (integration) {
            onSave(integration.id, { 
                title, 
                description, 
                folderId: folderId as any // Cast to any to match the snake_case/camelCase handling in NexusHub
            });
        }
    };

    const modalContent = (
        <AnimatePresence>
            {integration && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">แก้ไขข้อมูลการเชื่อมต่อ</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Update Connection Details</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-kanit font-bold text-slate-400 uppercase tracking-widest ml-1">ชื่อหัวข้อ (Title)</label>
                                <input 
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-kanit font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-kanit font-medium text-slate-400 uppercase tracking-widest ml-1">คำอธิบาย (Description)</label>
                                <textarea 
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-kanit font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[12px] font-kanit font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Folder className="w-3 h-3" /> เลือกโฟลเดอร์ปลายทาง (Target Folder)
                                    </label>
                                    {folders.length > 4 && (
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                            <input 
                                                type="text"
                                                placeholder="ค้นหาโฟลเดอร์..."
                                                value={folderSearch}
                                                onChange={(e) => setFolderSearch(e.target.value)}
                                                className="bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-3 py-1 text-[10px] font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all w-32"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar p-1 space-y-1">
                                    {/* Root Option - Only show if not searching or if search matches 'หน้าแรก' */}
                                    {(!folderSearch || 'หน้าแรก'.includes(folderSearch.toLowerCase())) && (
                                        <button
                                            onClick={() => setFolderId(null)}
                                            className={`group flex items-center gap-3 p-2 rounded-xl transition-all text-left relative ${
                                                folderId === null 
                                                ? 'bg-indigo-50 text-indigo-700' 
                                                : 'hover:bg-slate-50 text-slate-600'
                                            }`}
                                        >
                                            <div className="w-3" /> {/* Spacer to align with tree arrows */}
                                            <div className={`p-1.5 rounded-lg transition-colors ${folderId === null ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                <HardDrive className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold leading-none">หน้าแรก</span>
                                                <span className="text-[8px] font-medium opacity-50 uppercase tracking-tighter">Root Directory</span>
                                            </div>
                                            {folderId === null && (
                                                <motion.div 
                                                    layoutId="active-folder"
                                                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-600"
                                                />
                                            )}
                                        </button>
                                    )}

                                    {/* Folder Tree or Search Results */}
                                    {folderSearch ? (
                                        <div className="space-y-1">
                                            {filteredFolders.map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => setFolderId(f.id)}
                                                    className={`group flex items-center gap-3 p-2 rounded-xl transition-all text-left relative ${
                                                        folderId === f.id 
                                                        ? 'bg-indigo-50 text-indigo-700' 
                                                        : 'hover:bg-slate-50 text-slate-600'
                                                    }`}
                                                >
                                                    <div className="w-3" />
                                                    <div className={`p-1.5 rounded-lg transition-colors ${folderId === f.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                        <Folder className="w-3.5 h-3.5" style={{ color: folderId !== f.id ? f.color : undefined }} />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-xs font-bold leading-none truncate">{f.name}</span>
                                                        <span className="text-[8px] font-medium opacity-50 uppercase tracking-tighter">Subfolder</span>
                                                    </div>
                                                    {folderId === f.id && (
                                                        <motion.div 
                                                            layoutId="active-folder"
                                                            className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-600"
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        renderTree(folderTree)
                                    )}

                                    {filteredFolders.length === 0 && folderSearch && (
                                        <div className="py-8 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                            <Folder className="w-8 h-8 text-slate-200" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ไม่พบโฟลเดอร์ที่คุณค้นหา</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="flex-1 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    บันทึกข้อมูล
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default NexusEditModal;
