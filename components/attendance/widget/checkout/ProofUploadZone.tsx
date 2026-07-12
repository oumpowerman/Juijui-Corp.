import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Trash2 } from 'lucide-react';

interface ProofUploadZoneProps {
    selectedFile: File | null;
    previewUrl: string;
    onFileSelect: (file: File | null, url: string) => void;
    onOpenLightbox: () => void;
}

export const ProofUploadZone: React.FC<ProofUploadZoneProps> = ({
    selectedFile,
    previewUrl,
    onFileSelect,
    onOpenLightbox
}) => {
    const localFileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-400" /> แนบภาพหลักฐาน
                </label>
            </div>

            <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                    if (!previewUrl) {
                        localFileInputRef.current?.click();
                    }
                }}
                className={`
                    p-4 rounded-2xl border border-dashed transition-all flex items-center justify-between gap-3 group relative overflow-hidden shadow-sm
                    ${previewUrl 
                        ? 'border-emerald-200 bg-emerald-50/40 backdrop-blur-sm' 
                        : 'border-slate-200 bg-white/40 backdrop-blur-sm hover:bg-white hover:border-orange-200 hover:shadow-orange-100/30 cursor-pointer'
                    }
                `}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                        onClick={(e) => {
                            if (previewUrl) {
                                e.stopPropagation();
                                onOpenLightbox();
                            } else {
                                localFileInputRef.current?.click();
                            }
                        }}
                        className={`p-2.5 rounded-xl shadow-md transition-all shrink-0 ${
                            previewUrl 
                                ? 'bg-emerald-100 text-emerald-600 cursor-zoom-in relative w-12 h-12 overflow-hidden border border-emerald-200/50 flex items-center justify-center p-0' 
                                : 'bg-white text-slate-400 group-hover:rotate-12'
                        }`}
                    >
                        {previewUrl ? (
                            <img 
                                src={previewUrl} 
                                alt="Proof thumbnail" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <Upload className="w-5 h-5"/>
                        )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${previewUrl ? 'text-emerald-800' : 'text-slate-500 group-hover:text-orange-600'}`}>
                            {previewUrl ? (selectedFile?.name || 'proof.jpg') : 'แนบภาพหลักฐานประกอบ'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-wider">
                            {previewUrl 
                                ? `${selectedFile ? (selectedFile.size / 1024).toFixed(0) : 0} KB` 
                                : 'รองรับไฟล์รูปภาพสูงสุด 5MB'
                            }
                        </p>
                    </div>
                </div>

                {previewUrl && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (previewUrl) {
                                URL.revokeObjectURL(previewUrl);
                            }
                            onFileSelect(null, '');
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all shrink-0 relative z-10"
                        title="ลบรูปภาพ"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}

                <input 
                    type="file" 
                    ref={localFileInputRef} 
                    className="hidden" 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const url = URL.createObjectURL(file);
                            onFileSelect(file, url);
                        }
                    }} 
                    accept="image/*" 
                />
            </motion.div>
        </div>
    );
};
