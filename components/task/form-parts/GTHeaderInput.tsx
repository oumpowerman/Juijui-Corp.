
import React, { useState } from 'react';
import { List, Briefcase, X, ChevronDown } from 'lucide-react';
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
        <div className="group relative">
            <label className="block text-sm font-bold text-gray-500 mb-2 ml-1 uppercase tracking-wider">Task Title <span className="text-red-500">*</span></label>
            <div className="flex gap-2 relative">
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className={`
                        flex-1 px-5 py-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-2 border-indigo-100 rounded-2xl 
                        focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-xl font-bold text-indigo-900 
                        transition-all hover:shadow-md placeholder:text-indigo-300/70
                        ${assigneeType === 'INDIVIDUAL' && suggestedTasks.length > 0 ? 'pr-14' : ''}
                    `}
                    placeholder="ชื่องาน (เอาให้ปัง)..." 
                />
                
                {/* Embedded Button for Suggested Tasks */}
                {assigneeType === 'INDIVIDUAL' && suggestedTasks.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setIsResPickerOpen(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-indigo-500 rounded-xl shadow-sm border border-indigo-100 hover:border-indigo-300 transition-all active:scale-95 group/btn"
                        title="เลือกจากหน้าที่รับผิดชอบ (Pick from Responsibilities)"
                    >
                        <List className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                )}
            </div>
            
            {assigneeType === 'INDIVIDUAL' && suggestedTasks.length > 0 && (
                 <p className="text-[10px] text-indigo-400 mt-1.5 ml-2 flex items-center gap-1">
                    <span className="bg-indigo-100 text-indigo-600 px-1 rounded">TIP</span> กดปุ่ม <List className="w-3 h-3 inline"/> เพื่อเลือกชื่องานตามตำแหน่ง
                 </p>
            )}

            {/* Responsibility Picker Modal */}
            {isResPickerOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 border-4 border-indigo-50">
                        <div className="flex justify-between items-center p-4 border-b bg-indigo-50">
                            <h3 className="font-bold text-indigo-900 flex items-center">
                                <Briefcase className="w-5 h-5 mr-2 text-indigo-600"/> 
                                เลือกงานจากหน้าที่
                            </h3>
                            <button onClick={() => setIsResPickerOpen(false)} className="p-1 hover:bg-white rounded-full text-indigo-400 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>
                        
                        <div className="p-2 bg-gray-50/50 max-h-[300px] overflow-y-auto">
                            {suggestedTasks.map(taskOpt => (
                                <button
                                    key={taskOpt.id}
                                    type="button"
                                    onClick={() => { setTitle(taskOpt.label); setIsResPickerOpen(false); }}
                                    className="w-full text-left p-3 mb-2 rounded-xl bg-white border-2 border-transparent hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all text-sm font-bold text-gray-600 shadow-sm group/item flex items-center justify-between"
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
