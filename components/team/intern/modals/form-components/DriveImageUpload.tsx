
import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Upload, Loader2, X, Camera, RefreshCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGoogleDriveContext } from '../../../../../context/GoogleDriveContext';
import { motion, AnimatePresence } from 'framer-motion';
import ImageCropModal from './ImageCropModal';

interface DriveImageUploadProps {
    value: string;
    onChange: (value: string) => void;
}

const DriveImageUpload: React.FC<DriveImageUploadProps> = ({ value, onChange }) => {
    const { uploadFileToDrive, isUploading: isDriveUploading, login, retry } = useGoogleDriveContext();
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'CROPPING' | 'UPLOADING' | 'SUCCESS' | 'ERROR' | 'TIMEOUT'>('IDLE');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const UPLOAD_TIMEOUT_MS = 45000; // 45 seconds timeout

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
            setIsCropping(true);
            setUploadStatus('CROPPING');
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsCropping(false);
        setUploadStatus('UPLOADING');
        setUploadProgress(10);

        // Create a preview for the cropped image
        const previewUrl = URL.createObjectURL(croppedBlob);
        setLocalPreview(previewUrl);

        // Start timeout timer
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (uploadStatus === 'UPLOADING') {
                setUploadStatus('TIMEOUT');
            }
        }, UPLOAD_TIMEOUT_MS);

        try {
            const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
            setUploadProgress(30);
            
            const result = await uploadFileToDrive(file, ['Intern_Candidates']);
            
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            if (result && result.thumbnailUrl) {
                setUploadProgress(100);
                setUploadStatus('SUCCESS');
                onChange(result.thumbnailUrl);
                
                // Reset status back to idle after a short delay
                setTimeout(() => setUploadStatus('IDLE'), 2000);
            } else {
                setUploadStatus('ERROR');
            }
        } catch (error) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            console.error('Upload to Drive failed:', error);
            setUploadStatus('ERROR');
        }
    };

    const handleReset = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setUploadStatus('IDLE');
        setUploadProgress(0);
        login(); // Trigger login to refresh account selection
    };

    const handleRemove = () => {
        onChange('');
        setLocalPreview(null);
        setUploadStatus('IDLE');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getStatusText = () => {
        switch (uploadStatus) {
            case 'CROPPING': return 'กำลังปรับแต่ง...';
            case 'UPLOADING': return 'กำลังอัปโหลด...';
            case 'SUCCESS': return 'สำเร็จแล้ว ✨';
            case 'ERROR': return 'เกิดข้อผิดพลาด';
            case 'TIMEOUT': return 'ใช้เวลานานเกินไป';
            default: return 'อัปโหลดรูปภาพ';
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative group">
                <div className={`w-28 h-28 bg-gray-50 border-2 border-dashed rounded-[2.5rem] flex items-center justify-center overflow-hidden transition-all duration-500 ${
                    uploadStatus === 'UPLOADING' ? 'border-indigo-400 bg-indigo-50/30' : 
                    uploadStatus === 'ERROR' || uploadStatus === 'TIMEOUT' ? 'border-rose-300 bg-rose-50/30' :
                    uploadStatus === 'SUCCESS' ? 'border-emerald-400 bg-emerald-50/30' :
                    'border-gray-200 group-hover:border-indigo-300'
                }`}>
                    <AnimatePresence mode="wait">
                        {uploadStatus === 'UPLOADING' ? (
                            <motion.div 
                                key="uploading"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="relative">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-ping" />
                                    </div>
                                </div>
                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Processing...</span>
                            </motion.div>
                        ) : uploadStatus === 'TIMEOUT' || uploadStatus === 'ERROR' ? (
                            <motion.div 
                                key="error"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-2 p-2 text-center"
                            >
                                <AlertCircle className="w-8 h-8 text-rose-500" />
                                <button 
                                    onClick={handleReset}
                                    className="px-2 py-1 bg-rose-100 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-rose-200 transition-colors flex items-center gap-1"
                                >
                                    <RefreshCcw className="w-2.5 h-2.5" />
                                    Reset Account
                                </button>
                            </motion.div>
                        ) : uploadStatus === 'SUCCESS' ? (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-1"
                            >
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </motion.div>
                        ) : (localPreview || value) ? (
                            <motion.img 
                                key="preview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                src={localPreview || value} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                                alt="Avatar"
                            />
                        ) : (
                            <motion.div 
                                key="empty"
                                className="flex flex-col items-center gap-1 opacity-30"
                            >
                                <ImageIcon className="w-8 h-8" />
                                <span className="text-[8px] font-black uppercase tracking-widest">No Image</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {(localPreview || value) && uploadStatus === 'IDLE' && (
                        <motion.button
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 45 }}
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-1 -right-1 p-2 bg-white text-rose-500 rounded-2xl shadow-xl border border-rose-50 hover:bg-rose-500 hover:text-white transition-all z-10 group/remove"
                        >
                            <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        </motion.button>
                    )}
                </AnimatePresence>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadStatus === 'UPLOADING'}
                    className={`absolute -bottom-1 -right-1 p-2.5 text-white rounded-2xl shadow-xl transition-all z-10 active:scale-90 ${
                        uploadStatus === 'UPLOADING' ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
                    }`}
                >
                    <Camera className="w-5 h-5" />
                </button>
            </div>

            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                        uploadStatus === 'ERROR' || uploadStatus === 'TIMEOUT' ? 'text-rose-500' : 
                        uploadStatus === 'SUCCESS' ? 'text-emerald-500' : 'text-gray-400'
                    }`}>
                        {getStatusText()}
                    </p>
                    {uploadStatus === 'UPLOADING' && (
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                className="h-full bg-indigo-500"
                            />
                        </div>
                    )}
                </div>
                <p className="text-[9px] font-bold text-gray-300 italic leading-tight">
                    {uploadStatus === 'TIMEOUT' ? 'การเชื่อมต่อขัดข้อง กรุณากด Reset เพื่อเลือกบัญชีใหม่' : 'บันทึกรูปภาพลงใน Google Drive อัตโนมัติ'}
                </p>
            </div>

            {selectedImage && (
                <ImageCropModal 
                    isOpen={isCropping}
                    image={selectedImage}
                    onClose={() => {
                        setIsCropping(false);
                        setUploadStatus('IDLE');
                        setSelectedImage(null);
                    }}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    );
};

export default DriveImageUpload;
