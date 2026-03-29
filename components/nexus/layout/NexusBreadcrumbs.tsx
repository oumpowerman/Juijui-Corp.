
import React from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { NexusFolder } from '../../../types';

interface NexusBreadcrumbsProps {
    currentFolder: NexusFolder | null;
    folders: NexusFolder[];
    onNavigate: (folderId: string | null) => void;
}

const NexusBreadcrumbs: React.FC<NexusBreadcrumbsProps> = ({ 
    currentFolder, 
    folders, 
    onNavigate 
}) => {
    // Helper to get the path to the current folder
    const getPath = () => {
        const path: NexusFolder[] = [];
        let current = currentFolder;
        while (current) {
            path.unshift(current);
            current = folders.find(f => f.id === current?.parentId) || null;
        }
        return path;
    };

    const path = getPath();

    return (
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button
                onClick={() => onNavigate(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap group ${
                    !currentFolder 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
            >
                <Home className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="text-[12px] font-bold tracking-tight uppercase">หน้าแรก</span>
            </button>

            {path.map((folder, index) => (
                <React.Fragment key={folder.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <button
                        onClick={() => onNavigate(folder.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap group ${
                            index === path.length - 1 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                    >
                        <Folder className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span className="text-[12px] font-bold tracking-tight uppercase">{folder.name}</span>
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );
};

export default NexusBreadcrumbs;
