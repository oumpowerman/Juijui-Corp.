
import React, { useState, useRef, useEffect } from 'react';
import { X, Link as LinkIcon, Upload, Check, Image as ImageIcon, Cloud, AlertCircle, Loader2 } from 'lucide-react';
import { googleDriveService } from '../../../services/googleDriveService';
import { supabase } from '../../../lib/supabase';
import { resizeImage, fileToBase64 } from '../../../utils/imageUtils';

interface ImageInsertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUrlInsert: (url: string) => void;
}

const ImageInsertModal: React.FC<ImageInsertModalProps> = ({ isOpen, onClose, onUrlInsert }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [url, setUrl] = useState('');
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check Google Drive status when modal opens
    useEffect(() => {
        if (isOpen) {
            checkStatus();
        }
    }, [isOpen]);

    const checkStatus = async () => {
        try {
            const status = await googleDriveService.getStatus();
            setIsConnected(status);
        } catch (e) {
            console.error('Failed to check Google Drive status:', e);
            setIsConnected(false);
        }
    };

    const handleConnect = async () => {
        try {
            const authUrl = await googleDriveService.getAuthUrl();
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            
            const authWindow = window.open(
                authUrl,
                'google_auth_popup',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            // Listen for success message from popup
            const handleMessage = (event: MessageEvent) => {
                if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                    setIsConnected(true);
                    window.removeEventListener('message', handleMessage);
                }
            };
            window.addEventListener('message', handleMessage);
        } catch (e) {
            setError('Failed to get Google Auth URL');
        }
    };

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            // --- STEP 1: Try Google Drive ---
            if (isConnected) {
                try {
                    const result = await googleDriveService.uploadFile(file);
                    onUrlInsert(result.url);
                    onClose();
                    return;
                } catch (e) {
                    console.warn('Google Drive upload failed, falling back to Supabase...', e);
                }
            }

            // --- STEP 2: Try Supabase Storage (with resizing) ---
            try {
                // Resize image first
                const resizedBlob = await resizeImage(file, 1200, 1200);
                const fileName = `upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                
                const { data, error: storageError } = await supabase.storage
                    .from('images')
                    .upload(fileName, resizedBlob, {
                        contentType: 'image/jpeg',
                        cacheControl: '3600',
                        upsert: false
                    });

                if (storageError) throw storageError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(fileName);

                onUrlInsert(publicUrl);
                onClose();
                return;
            } catch (e) {
                console.warn('Supabase Storage upload failed, falling back to Base64...', e);
            }

            // --- STEP 3: Fallback to Base64 (Last Resort) ---
            const base64 = await fileToBase64(file);
            onUrlInsert(base64);
            onClose();

        } catch (e: any) {
            setError(e.message || 'All upload methods failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onUrlInsert(url.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>
            
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-indigo-500" />
                        เพิ่มรูปภาพ (Insert Image)
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-gray-100/50 mx-6 mt-6 rounded-2xl">
                    <button 
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Upload className="w-4 h-4" />
                        อัปโหลด (Upload)
                    </button>
                    <button 
                        onClick={() => setActiveTab('url')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'url' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <LinkIcon className="w-4 h-4" />
                        ลิงก์ URL
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {activeTab === 'upload' ? (
                        <div className="space-y-4">
                            {!isConnected ? (
                                <div className="border-2 border-dashed border-indigo-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-indigo-50/20">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <Cloud className="w-8 h-8 text-indigo-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-800">เชื่อมต่อ Google Drive</p>
                                        <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
                                            เราจะเก็บรูปภาพของคุณไว้ใน Google Drive เพื่อความรวดเร็วและประหยัดพื้นที่
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleConnect}
                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                                    >
                                        Connect Google Drive
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                    className={`border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all group ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                        disabled={isUploading}
                                    />
                                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform relative">
                                        {isUploading ? (
                                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-indigo-500" />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-700">
                                            {isUploading ? 'กำลังประมวลผลรูปภาพ...' : 'คลิกเพื่อเลือกรูปภาพ'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {isUploading ? 'ระบบกำลังเลือกช่องทางที่เร็วที่สุดให้คุณ' : 'ระบบจะเลือกเก็บใน Google Drive หรือ Supabase ให้อัตโนมัติ'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {!isConnected && !isUploading && (
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-amber-800">แนะนำ: เชื่อมต่อ Google Drive</p>
                                        <p className="text-[10px] text-amber-700 mt-0.5">
                                            หากไม่เชื่อมต่อ ระบบจะใช้ Supabase หรือ Base64 แทน ซึ่งอาจทำให้บทความโหลดช้าลง
                                        </p>
                                        <button 
                                            onClick={handleConnect}
                                            className="mt-2 text-[10px] font-bold text-indigo-600 hover:underline"
                                        >
                                            เชื่อมต่อตอนนี้เลย →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleUrlSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Image URL</label>
                                <input 
                                    autoFocus
                                    type="url"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm"
                                    placeholder="https://example.com/image.jpg"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={!url.trim()}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Check className="w-5 h-5" />
                                แทรกรูปภาพ (Insert Image)
                            </button>
                        </form>
                    )}
                </div>

                <div className="px-6 pb-6">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 text-gray-400 hover:text-gray-600 font-bold text-sm transition-colors"
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageInsertModal;
