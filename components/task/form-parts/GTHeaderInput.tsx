
import React, { useState } from 'react';
import { List, Briefcase, X, ChevronDown, Target } from 'lucide-react';
import { MasterOption } from '../../../types';

interface GTHeaderInputProps {
    title: string;
    setTitle: (val: string) => void;
    assigneeType: 'TEAM' | 'INDIVIDUAL';
    suggestedTasks: MasterOption[];
}

const GTHeaderInput: React.FC<GTHeaderInputProps> = ({ title, setTitle, assigneeType, suggestedTasks }) => {
    const [isResPickerOpen, setIsResPickerOpen] = useState(false);

    return (
        <div className="relative group/header">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-3xl blur-xl opacity-0 group-focus-within/header:opacity-40 transition-opacity duration-700 pointer-events-none"></div>

            <div className="relative bg-white/80 backdrop-blur-sm p-4 rounded-[2rem] border-2 border-indigo-50 shadow-sm focus-within:border-indigo-300 focus-within:shadow-lg focus-within:shadow-indigo-100/50 transition-all duration-300">
                <label className="block text-xs font-black text-indigo-400 mb-1 ml-2 uppercase tracking-widest flex items-center gap-1">
                     <Target className="w-3 h-3" /> 🎯 ชื่อภารกิจ (Mission Name) <span className="text-red-400">*</span>
                </label>
                
                <div className="flex gap-2 relative">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 text-indigo-500 rounded-xl group-focus-within/header:scale-110 group-focus-within/header:bg-indigo-600 group-focus-within/header:text-white transition-all duration-500">
                        <Target className="w-6 h-6" />
                    </div>

                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className={`
                            w-full pl-14 pr-4 py-3 bg-transparent border-none outline-none text-2xl font-black text-slate-800 placeholder:text-slate-300 placeholder:font-bold transition-all
                            ${assigneeType === 'INDIVIDUAL' && suggestedTasks.length > 0 ? 'pr-14' : ''}
                        `}
                        placeholder="ตั้งชื่อภารกิจให้ปัง..." 
                    />
                    
                    {/* Embedded Button for Suggested Tasks */}
                    {assigneeType === 'INDIVIDUAL' && suggestedTasks.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setIsResPickerOpen(true)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all active:scale-95 group/btn"
                            title="เลือกจากหน้าที่รับผิดชอบ"
                        >
                            <List className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        </button>
                    )}
                </div>
            </div>

            {/* Hint */}
            {assigneeType === 'INDIVIDUAL' && suggestedTasks.length > 0 && (
                 <p className="text-[10px] text-indigo-300/80 mt-1.5 ml-4 font-bold">
                    * กดปุ่มลิสต์ด้านขวา เพื่อเลือกงานตามตำแหน่งได้นะ
                 </p>
            )}

            {/* Responsibility Picker Modal */}
            {isResPickerOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border-4 border-indigo-50">
                        <div className="flex justify-between items-center px-6 py-4 border-b bg-indigo-50/50">
                            <h3 className="font-bold text-indigo-900 flex items-center">
                                <Briefcase className="w-5 h-5 mr-2 text-indigo-600"/> 
                                เลือกงานจากหน้าที่
                            </h3>
                            <button onClick={() => setIsResPickerOpen(false)} className="p-1.5 hover:bg-white rounded-full text-indigo-400 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>
                        
                        <div className="p-3 bg-gray-50/50 max-h-[300px] overflow-y-auto space-y-1">
                            {suggestedTasks.map(taskOpt => (
                                <button
                                    key={taskOpt.id}
                                    type="button"
                                    onClick={() => { setTitle(taskOpt.label); setIsResPickerOpen(false); }}
                                    className="w-full text-left p-4 rounded-2xl bg-white border border-gray-100 hover:border-indigo-300 hover:shadow-md hover:text-indigo-700 transition-all text-sm font-bold text-gray-600 group/item flex items-center justify-between"
                                >
                                    <span>{taskOpt.label}</span>
                                    <ChevronDown className="w-4 h-4 opacity-0 group-hover/item:opacity-100 -rotate-90 transition-all text-indigo-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GTHeaderInput;
