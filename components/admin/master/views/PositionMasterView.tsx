
import React from 'react';
import { MasterOption } from '../../../../types';
import { Briefcase, Plus, User, Edit2, Trash2, Award, X, ChevronRight, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';

interface PositionMasterViewProps {
    masterOptions: MasterOption[];
    onEdit: (option: MasterOption) => void;
    onCreate: (type: string, parentKey?: string) => void;
    onDelete: (id: string) => void;
    setSelectedParentId: (id: string | null) => void;
}

const PositionMasterView: React.FC<PositionMasterViewProps> = ({ 
    masterOptions, onEdit, onCreate, onDelete, setSelectedParentId 
}) => {
    const { showConfirm } = useGlobalDialog();
    const positions = masterOptions.filter(o => o.type === 'POSITION').sort((a,b) => a.sortOrder - b.sortOrder);
    const responsibilities = masterOptions.filter(o => o.type === 'RESPONSIBILITY').sort((a,b) => a.sortOrder - b.sortOrder);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-teal-50/80 to-emerald-50/80 backdrop-blur-xl p-6 rounded-3xl border border-teal-100/50 shadow-lg relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-md text-teal-600">
                        <Briefcase className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-teal-900 tracking-tight">Position & Roles</h3>
                        <p className="text-sm text-teal-700/80 font-medium">Manage organizational structure and responsibilities</p>
                    </div>
                </div>
                
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedParentId(null); onCreate('POSITION'); }} 
                    className="relative z-10 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30 flex items-center gap-2 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Position</span>
                </motion.button>
            </motion.div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {positions.map((pos, index) => {
                    const tasks = responsibilities.filter(r => r.parentKey === pos.key);
                    return (
                        <motion.div 
                            key={pos.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col"
                            style={{ boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset' }}
                        >
                            {/* Card Header */}
                            <div className="p-6 pb-4 border-b border-slate-100/50 relative">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => onEdit(pos)} className="p-2 bg-white/80 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={async () => { 
                                        if(await showConfirm('Delete this position?')) onDelete(pos.id); 
                                    }} className="p-2 bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${pos.color ? pos.color.replace('text-', 'bg-').replace('border-', 'ring-').split(' ')[0] + '/20' : 'bg-slate-100'}`}>
                                        <User className={`w-7 h-7 ${pos.color ? pos.color.split(' ')[1] : 'text-slate-500'}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-xl text-slate-800 tracking-tight">{pos.label}</h4>
                                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200/50">
                                            {pos.key}
                                        </span>
                                    </div>
                                </div>
                                
                                {pos.description && (
                                    <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {pos.description}
                                    </p>
                                )}
                            </div>

                            {/* Responsibilities Section */}
                            <div className="flex-1 p-5 bg-slate-50/50 flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <Layers className="w-3 h-3" />
                                        <span>Responsibilities</span>
                                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md text-[10px]">{tasks.length}</span>
                                    </div>
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { setSelectedParentId(pos.key); onCreate('RESPONSIBILITY', pos.key); }} 
                                        className="text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold flex items-center transition-colors border border-indigo-100"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Add Task
                                    </motion.button>
                                </div>

                                <div className="space-y-2.5 flex-1">
                                    {tasks.length === 0 ? (
                                        <div className="h-full min-h-[100px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                            <Award className="w-8 h-8 text-slate-300 mb-2" />
                                            <p className="text-xs text-slate-400 font-medium">No responsibilities yet</p>
                                        </div>
                                    ) : (
                                        tasks.map((task, i) => (
                                            <motion.div 
                                                key={task.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 + (i * 0.05) }}
                                                className="group/item flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${task.color ? task.color.split(' ')[0].replace('bg-', 'bg-') : 'bg-indigo-400'}`}></div>
                                                    <span className="text-sm font-semibold text-slate-700">{task.label}</span>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <button onClick={() => onEdit(task)} className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors">
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => onDelete(task.id)} className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                
                {/* Add New Position Card (Empty State) */}
                <motion.button
                    whileHover={{ scale: 1.02, rotate: 1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedParentId(null); onCreate('POSITION'); }}
                    className="min-h-[300px] flex flex-col items-center justify-center gap-4 rounded-3xl border-3 border-dashed border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-teal-300 transition-all group"
                >
                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Plus className="w-8 h-8 text-slate-300 group-hover:text-teal-500 transition-colors" />
                    </div>
                    <div className="text-center">
                        <h4 className="text-lg font-bold text-slate-400 group-hover:text-teal-600 transition-colors">Create New Position</h4>
                        <p className="text-xs text-slate-400 mt-1">Add a new role to your organization</p>
                    </div>
                </motion.button>
            </div>
        </div>
    );
};

export default PositionMasterView;
