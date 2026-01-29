
import React, { useState, useEffect, useRef } from 'react';
import { X, Link as LinkIcon, Check, Unlink } from 'lucide-react';

interface EditorLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialUrl: string;
    onSave: (url: string) => void;
    onUnlink: () => void;
}

const EditorLinkModal: React.FC<EditorLinkModalProps> = ({ 
    isOpen, onClose, initialUrl, onSave, onUnlink 
}) => {
    const [url, setUrl] = useState(initialUrl);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen) {
            setUrl(initialUrl || '');
            // Focus input after a short delay to allow animation
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border-2 border-indigo-50 overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-indigo-500" /> 
                        {initialUrl ? 'แก้ไขลิงก์ (Edit Link)' : 'ใส่ลิงก์ (Insert Link)'}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
                        type="button"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="relative">
                        <input 
                            ref={inputRef}
                            type="url" 
                            className="w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-sm font-medium transition-all placeholder:text-gray-300"
                            placeholder="https://example.com"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        {initialUrl && (
                            <button 
                                type="button"
                                onClick={() => { onUnlink(); onClose(); }}
                                className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl text-sm font-bold transition-all flex items-center justify-center"
                                title="เอาลิงก์ออก"
                            >
                                <Unlink className="w-4 h-4" />
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-all"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Check className="w-4 h-4" /> บันทึก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditorLinkModal;
