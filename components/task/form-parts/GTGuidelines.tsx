
import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface GTGuidelinesProps {
    caution: string;
    setCaution: (val: string) => void;
    importance: string;
    setImportance: (val: string) => void;
}

const GTGuidelines: React.FC<GTGuidelinesProps> = ({ caution, setCaution, importance, setImportance }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group relative">
                <label className="block text-xs font-bold text-orange-500 flex items-center ml-1 mb-2 uppercase tracking-wide"><AlertTriangle className="w-4 h-4 mr-1" /> ข้อควรระวัง</label>
                <textarea value={caution} onChange={(e) => setCaution(e.target.value)} rows={3} className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-100 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-300 outline-none resize-none text-sm font-medium text-orange-900 placeholder:text-orange-300 transition-all focus:bg-white shadow-sm" placeholder="ห้ามลืม..." />
            </div>
            <div className="group relative">
                <label className="block text-xs font-bold text-blue-500 flex items-center ml-1 mb-2 uppercase tracking-wide"><Info className="w-4 h-4 mr-1" /> สิ่งที่สำคัญ</label>
                <textarea value={importance} onChange={(e) => setImportance(e.target.value)} rows={3} className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none resize-none text-sm font-medium text-blue-900 placeholder:text-blue-300 transition-all focus:bg-white shadow-sm" placeholder="ต้องเน้นเรื่อง..." />
            </div>
        </div>
    );
};

export default GTGuidelines;
