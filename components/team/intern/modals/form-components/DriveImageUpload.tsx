
import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Loader2, X, Camera } from 'lucide-react';
import { useGoogleDriveContext } from '../../../../../context/GoogleDriveContext';
import { motion, AnimatePresence } from 'framer-motion';

interface DriveImageUploadProps {
    value: string;
    onChange: (value: string) => void;
}

const DriveImageUpload: React.FC<DriveImageUploadProps> = ({ value, onChange }) => {
    const { uploadFileToDrive, isUploading } = useGoogleDriveContext();
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Show local preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setLocalPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // 2. Upload to Google Drive
        try {
            const result = await uploadFileToDrive(file, ['Intern_Candidates']);
            if (result && result.thumbnailUrl) {
                onChange(result.thumbnailUrl);
            }
        } catch (error) {
            console.error('Upload to Drive failed:', error);
            setLocalPreview(null);
        }
    };

    const handleRemove = () => {
        onChange('');
        setLocalPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-4">
            <div className="relative group">
                <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-300">
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Uploading...</span>
                        </div>
                    ) : (localPreview || value) ? (
                        <img 
                            src={localPreview || value} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            alt="Avatar"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-1 opacity-40">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase tracking-widest">No Image</span>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {(localPreview || value) && !isUploading && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-all z-10"
                        >
                            <X className="w-3 h-3" />
                        </motion.button>
                    )}
                </AnimatePresence>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Camera className="w-4 h-4" />
                </button>
            </div>

            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            
            <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">รูปโปรไฟล์</p>
                <p className="text-[9px] font-bold text-gray-300 italic">บันทึกรูปภาพลงใน Google Drive อัตโนมัติ</p>
            </div>
        </div>
    );
};

export default DriveImageUpload;
