
import React from 'react';
import { Layout, Layers } from 'lucide-react';
import { MasterOption } from '../../../types';

interface CFCategorizationProps {
    contentFormat: string;
    setContentFormat: (val: string) => void;
    pillar: string;
    setPillar: (val: string) => void;
    formatOptions: MasterOption[];
    pillarOptions: MasterOption[];
}

const CFCategorization: React.FC<CFCategorizationProps> = ({ 
    contentFormat, setContentFormat, pillar, setPillar, formatOptions, pillarOptions 
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-pink-50 p-4 rounded-[1.5rem] border-2 border-pink-100 hover:border-pink-200 transition-colors relative overflow-hidden group">
                <label className="block text-xs font-black text-pink-500 mb-2 uppercase tracking-wide flex items-center relative z-10"><Layout className="w-3.5 h-3.5 mr-1.5" /> รูปแบบ (Format)</label>
                <select value={contentFormat} onChange={(e) => setContentFormat(e.target.value)} className="w-full px-4 py-3 bg-white/80 border-2 border-pink-100/50 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition-all text-sm relative z-10 shadow-sm">
                    <option value="">-- เลือก --</option>
                    {formatOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                </select>
            </div>
            <div className="bg-blue-50 p-4 rounded-[1.5rem] border-2 border-blue-100 hover:border-blue-200 transition-colors relative overflow-hidden group">
                <label className="block text-xs font-black text-blue-500 mb-2 uppercase tracking-wide flex items-center relative z-10"><Layers className="w-3.5 h-3.5 mr-1.5" /> แกนเนื้อหา (Pillar)</label>
                <select value={pillar} onChange={(e) => setPillar(e.target.value)} className="w-full px-4 py-3 bg-white/80 border-2 border-blue-100/50 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all text-sm relative z-10 shadow-sm">
                    <option value="">-- เลือก --</option>
                    {pillarOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                </select>
            </div>
        </div>
    );
};

export default CFCategorization;
