
import React, { useState, useEffect, useCallback } from 'react';
import { MasterOption } from '../../../../types';
import { Monitor, Smartphone, Globe, Image as ImageIcon, Link as LinkIcon, Save, Loader2, Camera, MapPin, ExternalLink, ShieldCheck, Edit2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useGoogleDrive } from '../../../../hooks/useGoogleDrive';
import Cropper from 'react-easy-crop';
import heic2any from 'heic2any';

interface PWAConfigViewProps {
    masterOptions: MasterOption[];
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onAdd: (option: Omit<MasterOption, 'id' | 'createdAt'>) => Promise<boolean>;
}

const PWAConfigView: React.FC<PWAConfigViewProps> = ({ masterOptions, onUpdate, onAdd }) => {
    const { openDrivePicker, isAuthenticated, login } = useGoogleDrive();
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Local state for form
    const [appName, setAppName] = useState('');
    const [appIcon, setAppIcon] = useState('');
    const [appLink, setAppLink] = useState('');

    // Cropping state
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [targetSize, setTargetSize] = useState<192 | 512>(192); // Default to 192 for manifest compatibility

    // Find existing configs
    const nameConfig = masterOptions.find(o => o.type === 'PWA_CONFIG' && o.key === 'APP_NAME');
    const iconConfig = masterOptions.find(o => o.type === 'PWA_CONFIG' && o.key === 'APP_ICON');
    const linkConfig = masterOptions.find(o => o.type === 'PWA_CONFIG' && o.key === 'APP_LINK');

    useEffect(() => {
        if (nameConfig) setAppName(nameConfig.label);
        if (iconConfig) setAppIcon(iconConfig.label);
        if (linkConfig) setAppLink(linkConfig.label);
    }, [nameConfig, iconConfig, linkConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const promises = [];

            // Save Name
            if (nameConfig) {
                promises.push(onUpdate({ ...nameConfig, label: appName }));
            } else {
                promises.push(onAdd({ type: 'PWA_CONFIG' as any, key: 'APP_NAME', label: appName, isActive: true, sortOrder: 1, color: 'bg-blue-500' }));
            }

            // Save Icon
            if (iconConfig) {
                promises.push(onUpdate({ ...iconConfig, label: appIcon }));
            } else {
                promises.push(onAdd({ type: 'PWA_CONFIG' as any, key: 'APP_ICON', label: appIcon, isActive: true, sortOrder: 2, color: 'bg-blue-500' }));
            }

            // Save Link
            if (linkConfig) {
                promises.push(onUpdate({ ...linkConfig, label: appLink }));
            } else {
                promises.push(onAdd({ type: 'PWA_CONFIG' as any, key: 'APP_LINK', label: appLink, isActive: true, sortOrder: 3, color: 'bg-blue-500' }));
            }

            await Promise.all(promises);

            // --- INSTANT CACHE SYNC (Inspired by HoneyMoney) ---
            try {
                localStorage.setItem('pwa_app_name', appName);
                localStorage.setItem('pwa_app_icon', appIcon);
                
                // Update current DOM immediately
                document.title = appName;
                const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
                if (appleIcon) appleIcon.setAttribute('href', appIcon);
                const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
                if (metaTitle) metaTitle.setAttribute('content', appName);
            } catch (e) {
                console.warn("Failed to sync PWA cache:", e);
            }

            setMessage({ text: 'บันทึกการตั้งค่า PWA เรียบร้อยแล้ว! ไอคอนจะเปลี่ยนทันทีในเครื่องนี้', type: 'success' });
        } catch (error) {
            console.error('Error saving PWA config:', error);
            setMessage({ text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePickIcon = async () => {
        if (!isAuthenticated) {
            await login();
            return;
        }
        
        openDrivePicker(async (file: any) => {
            if (file) {
                let url = file.thumbnailUrl || `https://lh3.googleusercontent.com/d/${file.id}`;
                const mimeType = file.mimeType?.toLowerCase();

                // Handle HEIC/HEIF conversion
                if (mimeType === 'image/heic' || mimeType === 'image/heif' || url.toLowerCase().endsWith('.heic') || url.toLowerCase().endsWith('.heif')) {
                    setIsConverting(true);
                    try {
                        // We need to fetch the file as a blob to convert it
                        // Note: This might hit CORS if not using the proxy or direct download link with token
                        // But thumbnails are usually JPEGs even for HEIC, so we try to use thumbnail first
                        if (file.thumbnailUrl) {
                            url = file.thumbnailUrl.replace(/=s\d+$/, '=s1200'); // Get higher res thumbnail
                        } else {
                            // If no thumbnail, we have to try converting the actual file
                            // This is complex due to CORS, so we'll warn or try a proxy if available
                            // For now, let's assume thumbnails work for preview/crop
                        }
                        
                        // If it's still a HEIC URL (not a thumbnail), convert it
                        if (url.toLowerCase().includes('.heic') || url.toLowerCase().includes('.heif')) {
                            const response = await fetch(url);
                            const blob = await response.blob();
                            const convertedBlob = await heic2any({
                                blob,
                                toType: 'image/png',
                            });
                            const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                            url = URL.createObjectURL(finalBlob);
                        }
                    } catch (err) {
                        console.error('HEIC conversion failed:', err);
                        // Fallback to thumbnail if possible
                    } finally {
                        setIsConverting(false);
                    }
                }

                setImageToCrop(url);
                setIsCropping(true);
            }
        });
    };

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async () => {
        if (!imageToCrop || !croppedAreaPixels) return;

        try {
            const image = new Image();
            image.src = imageToCrop;
            image.crossOrigin = 'anonymous'; // Important for canvas
            
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            // Set canvas size based on selection
            canvas.width = targetSize;
            canvas.height = targetSize;

            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                targetSize,
                targetSize
            );

            const base64Image = canvas.toDataURL('image/png');
            setAppIcon(base64Image);
            setIsCropping(false);
            setImageToCrop(null);
        } catch (e) {
            console.error('Error cropping image:', e);
            // Fallback to original if crop fails (e.g. CORS)
            setAppIcon(imageToCrop);
            setIsCropping(false);
            setImageToCrop(null);
        }
    };

    const requestIOSPermissions = async () => {
        try {
            // Camera
            await navigator.mediaDevices.getUserMedia({ video: true });
            // Location
            navigator.geolocation.getCurrentPosition(() => {});
            setMessage({ text: 'ขอสิทธิ์กล้องและตำแหน่งเรียบร้อยแล้ว (iOS จะจำค่านี้ไว้)', type: 'success' });
        } catch (err) {
            setMessage({ text: 'ไม่สามารถขอสิทธิ์ได้ โปรดตรวจสอบการตั้งค่าเบราว์เซอร์', type: 'error' });
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
            {/* PWA Status Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                            <Smartphone className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">PWA Approach</h2>
                            <p className="text-indigo-100 text-sm font-medium opacity-90">ติดตั้งแอปบน iOS & Android ได้ทันทีโดยไม่ต้องผ่าน Store</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={requestIOSPermissions}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                        >
                            <ShieldCheck className="w-4 h-4" /> iOS Permission Fix
                        </button>
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-bold">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Config */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-indigo-600" /> ข้อมูลพื้นฐานแอป
                        </h3>
                    </div>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">ชื่อแอป (App Name)</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={appName}
                                    onChange={e => setAppName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700"
                                    placeholder="เช่น Juijui Planner"
                                />
                                <Smartphone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">ลิงค์แอป (App URL / Link)</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={appLink}
                                    onChange={e => setAppLink(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-600"
                                    placeholder="https://your-app.run.app"
                                />
                                <Globe className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Icon Config */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-indigo-600" /> ไอคอนแอป (App Icon)
                        </h3>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                                {appIcon ? (
                                    <img src={appIcon} alt="App Icon Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-300" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={handlePickIcon} className="p-2 bg-white rounded-full text-indigo-600 shadow-lg">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 space-y-3">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    แนะนำรูปทรงสี่เหลี่ยมจัตุรัส (1:1) ขนาดอย่างน้อย 512x512px เพื่อความคมชัดบนทุกหน้าจอ
                                </p>
                                <button 
                                    onClick={handlePickIcon}
                                    disabled={isConverting}
                                    className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isConverting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            กำลังแปลงไฟล์ HEIC...
                                        </>
                                    ) : (
                                        isAuthenticated ? 'เลือกจาก Google Drive' : 'เชื่อมต่อ Google Drive'
                                    )}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Icon URL (Direct Link)</label>
                            <input 
                                type="text" 
                                value={appIcon}
                                onChange={e => setAppIcon(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-mono text-gray-500 outline-none focus:border-indigo-300"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* iOS & Android Specific Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <Camera className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-black text-blue-800 uppercase tracking-tighter">iOS Compatibility</span>
                    </div>
                    <p className="text-xs text-blue-600 leading-relaxed">
                        บน iOS (Safari) ผู้ใช้ต้องกดปุ่ม <b>Share</b> แล้วเลือก <b>"Add to Home Screen"</b> เพื่อติดตั้งแอป ระบบจะใช้ Meta Tags ที่เราตั้งค่าไว้โดยอัตโนมัติ
                    </p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                            <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-black text-emerald-800 uppercase tracking-tighter">Android Compatibility</span>
                    </div>
                    <p className="text-xs text-emerald-600 leading-relaxed">
                        Android จะแสดงปุ่มติดตั้งแอปโดยอัตโนมัติหากพบไฟล์ <b>manifest.json</b> ที่ถูกต้อง ไอคอนจะถูกดึงจากไฟล์ที่เราตั้งค่าไว้ในหน้านี้
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    บันทึกการตั้งค่าทั้งหมด
                </button>
            </div>

            {/* Cropping Modal */}
            {isCropping && imageToCrop && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-xl text-gray-800 tracking-tight">ปรับแต่งไอคอน ({targetSize}x{targetSize})</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Crop your app icon</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setTargetSize(192)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${targetSize === 192 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    192PX (FAST)
                                </button>
                                <button 
                                    onClick={() => setTargetSize(512)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${targetSize === 512 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    512PX (HD)
                                </button>
                            </div>
                        </div>

                        <div className="relative flex-1 min-h-[400px] bg-gray-900">
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="p-6 bg-gray-50 space-y-6">
                            <div className="flex items-center gap-4">
                                <ZoomOut className="w-4 h-4 text-gray-400" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <ZoomIn className="w-4 h-4 text-gray-400" />
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setIsCropping(false); setImageToCrop(null); }}
                                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    onClick={createCroppedImage}
                                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" /> ยืนยันการตัดรูป
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PWAConfigView;
