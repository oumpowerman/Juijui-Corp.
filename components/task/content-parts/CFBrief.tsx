
import React from 'react';
import { FileText } from 'lucide-react';

interface CFBriefProps {
    description: string;
    setDescription: (val: string) => void;
}

const CFBrief: React.FC<CFBriefProps> = ({ description, setDescription }) => {
    return (
        <div className="relative group transition-all duration-500">
            {/* Background Decoration Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] opacity-20 group-hover:opacity-40 group-focus-within:opacity-100 blur transition duration-500"></div>
            
            <div className="relative bg-white rounded-[1.8rem] p-1">
                <div className="bg-gradient-to-b from-slate-50/50 to-white rounded-[1.6rem] border border-indigo-100 p-6 relative overflow-hidden group-focus-within:bg-white transition-colors">
                    
                    {/* Header Label */}
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-black text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
                                <FileText className="w-5 h-5" />
                            </span>
                            Creative Brief (รายละเอียดงาน)
                            <span className="text-red-500 ml-1 text-lg">*</span>
                        </label>
                    </div>

                    {/* Text Area Container */}
                    <div className="relative">
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            rows={6} 
                            className="
                                w-full bg-transparent border-none focus:ring-0 p-2 
                                text-base text-slate-700 font-medium leading-relaxed 
                                placeholder:text-slate-300 placeholder:font-normal 
                                resize-none outline-none relative z-10
                            " 
                            placeholder={`สิ่งที่ต้องทำ, Concept หลัก, Mood & Tone...\n(พิมพ์รายละเอียดให้ครบถ้วน เพื่อให้ทีมทำงานได้ทันที)`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CFBrief;
