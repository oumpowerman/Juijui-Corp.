
import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-200 relative">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                                <BookOpen className="w-6 h-6" />
                            </span>
                            {title}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1 ml-1 font-medium">คู่มือการใช้งานฉบับย่อ (Quick Guide)</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Scroll Area */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-gray-300">
                    {children}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white shrink-0 text-center">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 w-full md:w-auto"
                    >
                        เข้าใจแล้ว! ลุยเลย 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InfoModal;
