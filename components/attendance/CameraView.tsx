
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, SwitchCamera } from 'lucide-react';

interface CameraViewProps {
    challengeText: string;
    onCapture: (file: File) => void;
    onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ challengeText, onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    // Start Camera Function
    const startCamera = useCallback(async () => {
        // Stop previous stream if any
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: facingMode,
                    width: { ideal: 720 }, // Higher quality
                    height: { ideal: 1280 } 
                } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        } catch (err) {
            console.error("Camera Error:", err);
            setError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึง');
        }
    }, [facingMode]);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]); // Re-run when facingMode changes

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // Flip horizontally ONLY for selfie mirror effect
                if (facingMode === 'user') {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                }
                
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setImagePreview(dataUrl);
            }
        }
    };

    const confirmPhoto = async () => {
        if (imagePreview) {
            const res = await fetch(imagePreview);
            const blob = await res.blob();
            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
            onCapture(file);
        }
    };

    const retake = () => {
        setImagePreview(null);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col h-[100dvh]">
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent pt-safe-area">
                <span className="text-white font-bold text-sm drop-shadow-md">📷 Check-in Camera</span>
                <button onClick={onClose} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
                {error ? (
                    <div className="text-white text-center p-6 max-w-xs">
                        <p className="mb-4">{error}</p>
                        <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-full font-bold">ปิด</button>
                    </div>
                ) : (
                    <>
                        {!imagePreview ? (
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                            />
                        ) : (
                            <img src={imagePreview} className="w-full h-full object-cover" />
                        )}
                        
                        {/* Challenge Overlay */}
                        <div className="absolute top-20 left-0 w-full flex justify-center z-10 px-4 pointer-events-none">
                            <div className="bg-indigo-600/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-xl animate-in slide-in-from-top-4 text-center">
                                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mb-1">Challenge Pose</p>
                                <h2 className="text-xl font-black text-white drop-shadow-md">
                                    "{challengeText}"
                                </h2>
                            </div>
                        </div>

                        {/* Hidden Canvas */}
                        <canvas ref={canvasRef} className="hidden" />
                    </>
                )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="bg-black/80 backdrop-blur-md pb-safe-area">
                <div className="p-8 flex justify-between items-center gap-4 max-w-md mx-auto">
                    {!imagePreview ? (
                        <>
                            {/* Gallery / Placeholder (Left) */}
                            <div className="w-12 h-12"></div> 

                            {/* Shutter (Center) */}
                            <button 
                                onClick={takePhoto}
                                className="w-20 h-20 rounded-full border-[6px] border-white flex items-center justify-center bg-white/20 active:scale-95 transition-transform shadow-lg"
                            >
                                <div className="w-16 h-16 bg-white rounded-full"></div>
                            </button>

                            {/* Flip Camera (Right) */}
                            <button 
                                onClick={toggleCamera}
                                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                                <SwitchCamera className="w-6 h-6" />
                            </button>
                        </>
                    ) : (
                        <div className="flex w-full justify-around items-center">
                            <button onClick={retake} className="flex flex-col items-center text-gray-400 gap-2 group">
                                <div className="p-4 rounded-full bg-gray-800 border border-gray-700 group-hover:border-gray-500 transition-colors"><RefreshCw className="w-6 h-6" /></div>
                                <span className="text-xs font-bold">ถ่ายใหม่</span>
                            </button>
                            <button onClick={confirmPhoto} className="flex flex-col items-center text-green-400 gap-2 group">
                                <div className="p-4 rounded-full bg-white text-green-600 shadow-[0_0_20px_rgba(34,197,94,0.5)] group-hover:scale-110 transition-transform"><Check className="w-8 h-8 stroke-[4px]" /></div>
                                <span className="text-xs font-bold text-white">ใช้รูปนี้</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraView;
