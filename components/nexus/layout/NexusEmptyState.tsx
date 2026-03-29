
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FolderPlus, Plus } from 'lucide-react';

interface NexusEmptyStateProps {
    onAddFolder: () => void;
    onFocusAddInput: () => void;
}

const NexusEmptyState: React.FC<NexusEmptyStateProps> = ({ onAddFolder, onFocusAddInput }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-200"
        >
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Sparkles className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">ไม่พบข้อมูลในโฟลเดอร์นี้</h3>
            <p className="text-slate-500 font-kanit font-medium max-w-xs mx-auto mb-8">
                เริ่มต้นด้วยการสร้างโฟลเดอร์ย่อยหรือวางลิงก์เพื่อเก็บข้อมูลในหมวดหมู่นี้
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                    onClick={onAddFolder}
                    className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                >
                    <FolderPlus className="w-5 h-5 text-indigo-600" /> สร้างโฟลเดอร์ย่อย
                </button>
                <div className="text-slate-300 font-bold">หรือ</div>
                <button
                    onClick={onFocusAddInput}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> เพิ่มลิงก์ใหม่
                </button>
            </div>
        </motion.div>
    );
};

export default NexusEmptyState;
