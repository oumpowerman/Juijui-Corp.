import React from 'react';
import { Folder, FolderPlus } from 'lucide-react';
import { NexusFolder } from '../../../types';

interface FolderSelectorProps {
    folders: NexusFolder[];
    selectedFolderId: string | null;
    setSelectedFolderId: (id: string | null) => void;
    isCreatingFolder: boolean;
    setIsCreatingFolder: (val: boolean) => void;
    newFolderName: string;
    setNewFolderName: (name: string) => void;
    handleCreateFolderDirectly: () => Promise<void>;
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
    folders,
    selectedFolderId,
    setSelectedFolderId,
    isCreatingFolder,
    setIsCreatingFolder,
    newFolderName,
    setNewFolderName,
    handleCreateFolderDirectly,
}) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-bold font-kanit text-sm flex items-center gap-2">
                    <Folder className="w-4 h-4 text-yellow-500" />
                    โปรดเลือกคลังโฟลเดอร์ใน Nexus
                </label>
                <button 
                    type="button"
                    onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                >
                    <FolderPlus className="w-3.5 h-3.5" />
                    {isCreatingFolder ? 'ยกเลิก' : '+ โฟลเดอร์ใหม่'}
                </button>
            </div>

            {isCreatingFolder ? (
                <div className="flex gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 mb-3 block">
                    <input 
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="ระบุชื่อโฟลเดอร์ใหม่..."
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateFolderDirectly();
                            }
                        }}
                    />
                    <button 
                        type="button"
                        onClick={handleCreateFolderDirectly}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shrink-0"
                    >
                        ตกลง
                    </button>
                </div>
            ) : null}

            <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white rounded-2xl px-4 py-3 text-sm font-bold transition"
            >
                <option value="">📁 คลังส่วนกลาง (Root Folder) - ไม่จัดหมวด</option>
                {folders.map(f => (
                    <option key={f.id} value={f.id}>
                        📁 {f.name} {f.description ? `(${f.description})` : ''}
                    </option>
                ))}
            </select>
        </div>
    );
};
