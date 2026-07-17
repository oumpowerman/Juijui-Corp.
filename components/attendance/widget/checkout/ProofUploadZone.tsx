import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, Eye } from 'lucide-react';

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
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-400" /> แนบภาพหลักฐาน
                </label>
            </div>

            <AnimatePresence mode="wait">
                {previewUrl ? (
                    <motion.div 
                        key="preview-active"
                        initial={{ opacity: 0, y: -15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 0.95, transition: { duration: 0.2 } }}
                        className="space-y-2 bg-slate-50/40 p-3.5 rounded-2xl border border-slate-100 backdrop-blur-sm shadow-sm overflow-hidden"
                    >
                        {/* Custom zoomable image thumbnail with hover spring scale */}
                        <motion.div 
                            onClick={onOpenLightbox}
                            whileHover={{ scale: 1.015 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className="group relative w-full h-44 rounded-2xl overflow-hidden border border-slate-100 bg-slate-900 shadow-sm cursor-zoom-in active:scale-[0.98]"
                        >
                            <img 
                                src={previewUrl} 
                                alt="Proof attachment" 
                                className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-85 transition-all duration-300"
                                referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white gap-1.5 p-4 text-center">
                                <span className="p-2 bg-white/20 rounded-full backdrop-blur-md">
                                    <Eye className="w-5 h-5 text-white stroke-[2.5]" />
                                </span>
                                <span className="text-xs font-bold drop-shadow-sm">คลิกเพื่อดูรูปใหญ่</span>
                            </div>
                        </motion.div>
                        
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100/50">
                            <div className="min-w-0 flex-1 mr-2">
                                <p className="text-xs font-bold text-slate-500 truncate">
                                    {selectedFile?.name || 'proof.jpg'}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-wider">
                                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : '0 KB'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (previewUrl) {
                                        URL.revokeObjectURL(previewUrl);
                                    }
                                    onFileSelect(null, '');
                                }}
                                className="p-2 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 text-rose-500 rounded-xl transition-all shrink-0 flex items-center gap-1 px-3 text-xs font-bold cursor-pointer active:scale-95"
                                title="ลบรูปภาพและแนบใหม่"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ลบรูปภาพ</span>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="upload-placeholder"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        whileHover="hover"
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                            localFileInputRef.current?.click();
                        }}
                        className="p-6 rounded-2xl border border-dashed border-slate-200 bg-white/40 backdrop-blur-sm hover:border-indigo-300 hover:bg-white hover:shadow-lg hover:shadow-indigo-100/30 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center shadow-sm"
                    >
                        <motion.div 
                            variants={{
                                hover: { y: -6, scale: 1.08, backgroundColor: 'rgb(238 242 255)' }
                            }}
                            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                            className="p-3 bg-slate-50 text-slate-400 group-hover:text-indigo-500 rounded-xl"
                        >
                            <Upload className="w-6 h-6 text-slate-400" />
                        </motion.div>
                        <div>
                            <p className="text-xs font-bold text-slate-500">แนบภาพหลักฐานประกอบ</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-wider">รองรับไฟล์รูปภาพสูงสุด 5MB</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
        </div>
    );
};
