
import React from 'react';
import { Sparkles } from 'lucide-react';

interface CFHeaderProps {
    title: string;
    setTitle: (value: string) => void;
}

const CFHeader: React.FC<CFHeaderProps> = ({ title, setTitle }) => {
    return (
        <div className="group relative">
            <label className="block text-sm font-black text-indigo-900 mb-2 group-hover:text-indigo-600 transition-colors flex items-center uppercase tracking-tight">
                <Sparkles className="w-5 h-5 mr-1.5 text-yellow-400 fill-yellow-400 animate-pulse" /> 
                หัวข้อคอนเทนต์ <span className="text-gray-400 text-xs font-normal ml-2">(Content Title)</span> <span className="text-red-500 ml-1">*</span>
            </label>
            <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full px-5 py-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-2 border-indigo-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-xl font-bold text-indigo-900 placeholder:text-indigo-300 transition-all hover:shadow-lg shadow-indigo-100/50" 
                placeholder="เช่น Vlog พาแมวไปอาบน้ำ..." 
            />
        </div>
    );
};

export default CFHeader;
