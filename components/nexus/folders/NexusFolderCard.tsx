
import React from 'react';
import { motion } from 'framer-motion';
import { Folder, MoreVertical, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { NexusFolder } from '../../../types';

interface NexusFolderCardProps {
    folder: NexusFolder;
    itemCount: number;
    onClick: (folderId: string) => void;
    onEdit: (folder: NexusFolder) => void;
    onDelete: (folderId: string) => void;
}

const NexusFolderCard: React.FC<NexusFolderCardProps> = ({ 
    folder, 
    itemCount, 
    onClick, 
    onEdit, 
    onDelete 
}) => {
    const [showActions, setShowActions] = React.useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            onClick={() => onClick(folder.id)}
            className="group relative bg-white/70 backdrop-blur-md border border-white/50 rounded-[2rem] p-6 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col h-full"
        >
            {/* Folder Color Accent */}
            <div 
                className="absolute top-0 left-0 w-full h-1.5 rounded-t-[2rem]"
                style={{ backgroundColor: folder.color || '#6366f1' }}
            />

            <div className="flex items-start justify-between mb-4">
                <div 
                    className="p-4 rounded-2xl shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: `${folder.color || '#6366f1'}15` }}
                >
                    <Folder 
                        className="w-8 h-8" 
                        style={{ color: folder.color || '#6366f1' }}
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(!showActions);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {showActions && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-10">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(folder);
                                    setShowActions(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" /> แก้ไขโฟลเดอร์
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(folder.id);
                                    setShowActions(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> ลบโฟลเดอร์
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {folder.name}
                </h3>
                {folder.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium leading-relaxed">
                        {folder.description}
                    </p>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {itemCount} รายการ
                </span>
                <div className="flex items-center gap-1 text-[12px] font-bold text-indigo-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                    เปิด <ChevronRight className="w-4 h-4" />
                </div>
            </div>

            {/* Glossy Shine Effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full group-hover:translate-x-full" />
        </motion.div>
    );
};

export default NexusFolderCard;
