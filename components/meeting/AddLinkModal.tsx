import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Link as LinkIcon, Save, Type } from 'lucide-react';

interface AddLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, url: string) => void;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && url.trim()) {
            onSave(name, url);
            setName('');
            setUrl('');
            onClose();
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 relative animate-in zoom-in-95 border-4 border-indigo-50">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
                
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
                    <span className="bg-indigo-100 p-2 rounded-xl mr-3 text-indigo-600"><LinkIcon className="w-5 h-5" /></span>
                    แนบไฟล์ / ลิงก์
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">ชื่อเอกสาร / ไฟล์</label>
                        <div className="relative group">
                            <Type className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-sm font-bold text-gray-700 transition-all"
                                placeholder="เช่น สไลด์พรีเซนต์..."
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">URL (ลิงก์)</label>
                        <div className="relative group">
                            <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="url" 
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-sm font-medium text-gray-600 transition-all"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={!name || !url}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4 mr-2" /> บันทึก
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default AddLinkModal;