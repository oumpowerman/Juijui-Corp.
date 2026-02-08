
import React, { useState, useMemo } from 'react';
import { Link as LinkIcon, Search, LayoutTemplate, Check, X, Filter } from 'lucide-react';
import { Task, Status, Channel } from '../../../types';
import { STATUS_COLORS } from '../../../constants';

interface Props {
    projectId: string;
    setProjectId: (id: string) => void;
    projects: Task[];
    channels: Channel[]; // New Prop
}

const ProjectLinker: React.FC<Props> = ({ projectId, setProjectId, projects, channels }) => {
    const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');
    const [selectedChannel, setSelectedChannel] = useState<string>('ALL');

    // 1. Initial Project found from ID
    const parentProject = useMemo(() => {
        return projectId ? projects.find(p => p.id === projectId) : null;
    }, [projectId, projects]);

    // 2. Filter Logic for Picker
    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => {
                const matchSearch = p.title.toLowerCase().includes(projectSearch.toLowerCase());
                const matchChannel = selectedChannel === 'ALL' || p.channelId === selectedChannel;
                return matchSearch && matchChannel;
            })
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [projects, projectSearch, selectedChannel]);

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
                    <LinkIcon className="w-3 h-3 mr-1" /> เชื่อมโยงกับโปรเจกต์ (Optional)
                </label>
            </div>
           
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
                        onClick={() => setProjectId('')} // Clear
                        className="p-2 text-indigo-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                        title="ยกเลิกการเชื่อมโยง"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between">
                         <span className="text-xs text-gray-400">ยังไม่ได้เชื่อมโยง</span>
                         <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={isProjectPickerOpen} onChange={(e) => {
                                    if(e.target.checked) setIsProjectPickerOpen(true);
                                }} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${isProjectPickerOpen ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isProjectPickerOpen ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="ml-2 text-xs font-bold text-gray-600">เปิดการเชื่อมโยง</span>
                         </label>
                    </div>
                </div>
            )}

            {/* Project Picker Modal */}
            {isProjectPickerOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 border-4 border-indigo-50">
                        <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-bold text-lg text-gray-800">เลือกโปรเจกต์หลัก</h3>
                            <button onClick={() => setIsProjectPickerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
                             {/* Channel Filter */}
                             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                 <button 
                                    type="button"
                                    onClick={() => setSelectedChannel('ALL')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${selectedChannel === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200'}`}
                                 >
                                     All Channels
                                 </button>
                                 {channels.map(c => (
                                     <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setSelectedChannel(c.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${selectedChannel === c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200'}`}
                                     >
                                        {c.name}
                                     </button>
                                 ))}
                             </div>

                            {/* Search */}
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
                                        onClick={() => { setProjectId(proj.id); setIsProjectPickerOpen(false); }}
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

export default ProjectLinker;
