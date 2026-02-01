
import React, { useState, useMemo } from 'react';
import { Link as LinkIcon, Search, LayoutTemplate, Check, X } from 'lucide-react';
import { Task, Status } from '../../../types';
import { STATUS_COLORS } from '../../../constants';

interface GTProjectLinkerProps {
    parentProject: Task | null | undefined;
    onSetParentProject: (id: string | null) => void;
    projects: Task[];
}

const GTProjectLinker: React.FC<GTProjectLinkerProps> = ({ parentProject, onSetParentProject, projects }) => {
    const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => p.title.toLowerCase().includes(projectSearch.toLowerCase()))
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [projects, projectSearch]);

    return (
        <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 ml-1 uppercase flex items-center">
                <LinkIcon className="w-3 h-3 mr-1" /> เชื่อมโยงกับโปรเจกต์ (Optional)
            </label>
            {parentProject ? (
                <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <LayoutTemplate className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-xs text-indigo-400 font-bold uppercase">Linked to Project</p>
                            <p className="font-bold text-indigo-800 text-sm truncate max-w-[200px]">{parentProject.title}</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={() => onSetParentProject(null)}
                        className="p-2 text-indigo-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                        title="ยกเลิกการเชื่อมโยง"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsProjectPickerOpen(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <Search className="w-4 h-4" /> เลือกโปรเจกต์หลัก (Select Parent Project)
                </button>
            )}

            {/* Project Picker Modal */}
            {isProjectPickerOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 border-4 border-indigo-50">
                        <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-bold text-lg text-gray-800">เลือกโปรเจกต์หลัก</h3>
                            <button onClick={() => setIsProjectPickerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="p-4 bg-gray-50 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาชื่อโปรเจกต์..." 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-sm font-bold"
                                    value={projectSearch}
                                    onChange={e => setProjectSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-4 space-y-2">
                            {filteredProjects.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <p>ไม่พบโปรเจกต์ที่ค้นหา</p>
                                </div>
                            ) : (
                                filteredProjects.map(proj => (
                                    <div 
                                        key={proj.id} 
                                        onClick={() => { onSetParentProject(proj.id); setIsProjectPickerOpen(false); }}
                                        className="p-3 bg-white border border-gray-100 rounded-xl hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex items-center gap-3 group"
                                    >
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <LayoutTemplate className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-indigo-600">{proj.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${STATUS_COLORS[proj.status as Status] || 'bg-gray-100 text-gray-500'}`}>
                                                    {proj.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GTProjectLinker;
