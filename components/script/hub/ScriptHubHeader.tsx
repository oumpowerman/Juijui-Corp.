
import React from 'react';
import { FileText, Plus, Sparkles, Info } from 'lucide-react';

interface ScriptHubHeaderProps {
    onCreateClick: () => void;
    onInfoClick?: () => void; // New prop
}

const ScriptHubHeader: React.FC<ScriptHubHeaderProps> = ({ onCreateClick, onInfoClick }) => {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-50 to-orange-50 rounded-bl-[100px] opacity-60 pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shadow-sm">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            Script Hub
                        </h1>
                        {/* Info Button */}
                        {onInfoClick && (
                            <button 
                                onClick={onInfoClick}
                                className="p-1.5 bg-white/80 hover:bg-white text-gray-400 hover:text-rose-500 rounded-full transition-all shadow-sm border border-gray-100 active:scale-95"
                                title="คู่มือการใช้งาน"
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <p className="text-gray-500 font-medium max-w-lg leading-relaxed">
                        ศูนย์รวมบทและสคริปต์ จัดการไอเดีย ร่างบท และส่งไม้ต่อให้ทีม Production ได้อย่างลื่นไหล
                    </p>
                </div>

                <button 
                    onClick={onCreateClick}
                    className="
                        group relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl
                        bg-gradient-to-r from-rose-600 to-pink-600 
                        text-white font-black text-sm
                        shadow-xl shadow-rose-200
                        hover:shadow-rose-300 hover:-translate-y-1 hover:scale-[1.02]
                        active:scale-95 active:translate-y-0
                        transition-all duration-300
                    "
                >
                    <Plus className="w-5 h-5 stroke-[3px]" />
                    <span className="relative z-10 drop-shadow-sm">สร้างสคริปต์ใหม่</span>
                    <Sparkles className="w-4 h-4 text-yellow-300 absolute top-2 right-2 animate-bounce opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </div>
    );
};

export default ScriptHubHeader;
