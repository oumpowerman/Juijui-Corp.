
import React from 'react';

interface CFBriefProps {
    description: string;
    setDescription: (val: string) => void;
}

const CFBrief: React.FC<CFBriefProps> = ({ description, setDescription }) => {
    return (
        <div className="group bg-white p-4 rounded-[1.5rem] border-2 border-gray-100 focus-within:border-indigo-200 focus-within:shadow-md transition-all">
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-wide group-focus-within:text-indigo-500 transition-colors">
                รายละเอียด / บรีฟ (Brief)
            </label>
            <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={4} 
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-700 placeholder:text-gray-300 resize-none outline-none leading-relaxed" 
                placeholder="พิมพ์รายละเอียดงานตรงนี้..." 
            />
        </div>
    );
};

export default CFBrief;
