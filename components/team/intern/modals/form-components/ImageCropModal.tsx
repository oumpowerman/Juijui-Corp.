
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropModalProps {
    isOpen: boolean;
    image: string;
    onClose: () => void;
    onCropComplete: (croppedImage: Blob) => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, image, onClose, onCropComplete }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: any,
        rotation = 0
    ): Promise<Blob> => {
        const image = await createImage(imageSrc);
        
        // 1. Create a temporary canvas to handle rotation
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) throw new Error('No 2d context');

        const rotRad = (rotation * Math.PI) / 180;
        const { width: bBoxWidth, height: bBoxHeight } = {
            width: Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height),
            height: Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height),
        };

        tempCanvas.width = bBoxWidth;
        tempCanvas.height = bBoxHeight;

        tempCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
        tempCtx.rotate(rotRad);
        tempCtx.translate(-image.width / 2, -image.height / 2);
        tempCtx.drawImage(image, 0, 0);

        // 2. Calculate target dimensions with a maximum limit
        const MAX_DIMENSION = 1024;
        let targetWidth = pixelCrop.width;
        let targetHeight = pixelCrop.height;

        if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight);
            targetWidth = Math.round(targetWidth * ratio);
            targetHeight = Math.round(targetHeight * ratio);
        }

        // 3. Create final canvas for the cropped and scaled image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('No 2d context');

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw the cropped area from tempCanvas to final canvas with scaling
        ctx.drawImage(
            tempCanvas,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            targetWidth,
            targetHeight
        );

        return new Promise((resolve) => {
            canvas.toBlob((file) => {
                if (file) resolve(file);
            }, 'image/jpeg', 0.85);
        });
    };

    const handleConfirm = async () => {
        try {
            const croppedBlob = await getCroppedImg(image, croppedAreaPixels, rotation);
            onCropComplete(croppedBlob);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">ปรับแต่งรูปภาพ</h3>
                            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="relative h-[400px] w-full bg-slate-100">
                            <Cropper
                                image={image}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={1 / 1}
                                onCropChange={onCropChange}
                                onCropComplete={onCropCompleteInternal}
                                onZoomChange={onZoomChange}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <ZoomOut className="w-4 h-4 text-slate-400" />
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <ZoomIn className="w-4 h-4 text-slate-400" />
                                </div>
                                
                                <div className="flex items-center justify-center gap-4">
                                    <button 
                                        onClick={() => setRotation(r => (r + 90) % 360)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all"
                                    >
                                        <RotateCw className="w-3.5 h-3.5" />
                                        หมุนรูปภาพ
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-sm font-bold transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    ตกลง
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ImageCropModal;
