import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Link as LinkIcon, Save, Type, HardDrive, UploadCloud, Loader2, RefreshCw } from 'lucide-react';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import { format } from 'date-fns';

interface AddLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, url: string) => void;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    const driveUploadInputRef = useRef<HTMLInputElement>(null);
    const { openDrivePicker, uploadFileToDrive, isReady: isDriveReady, isUploading, isAuthenticated: isDriveAuthenticated, login, logout, retry } = useGoogleDrive();

    if (!isOpen) return null;

    const handleDriveSelect = () => {
        if (!isDriveAuthenticated) {
            login();
            return;
        }
        openDrivePicker((file: any) => {
            onSave(file.name, file.url);
            onClose();
        });
    };

    const handleUploadClick = () => {
        if (!isDriveAuthenticated) {
            login();
            return;
        }
        driveUploadInputRef.current?.click();
    };

    const handleDriveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const currentMonthFolder = format(new Date(), 'yyyy-MM');

        try {
            const result = await uploadFileToDrive(
                file,
                ['Meeting_Attachments', currentMonthFolder]
            );
            onSave(result.name, result.url);
            onClose();
        } catch (err) {
            console.error('Drive upload failed:', err);
        } finally {
            if (driveUploadInputRef.current) {
                driveUploadInputRef.current.value = '';
            }
        }
    };

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
                
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="bg-indigo-100 p-2 rounded-xl mr-3 text-indigo-600"><LinkIcon className="w-5 h-5" /></span>
                        แนบไฟล์ / ลิงก์
                    </div>
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Google Drive Status & Quick Actions */}
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl mb-4">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                                <HardDrive className={`w-3.5 h-3.5 ${isDriveAuthenticated ? 'text-emerald-500' : 'text-slate-400'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isDriveAuthenticated ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    Cloud Storage {isDriveAuthenticated ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    type="button"
                                    onClick={retry}
                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-all"
                                    title="Refresh connection"
                                >
                                    <RefreshCw className={`w-3 h-3 ${!isDriveReady && 'animate-spin'}`} />
                                    {isDriveReady ? 'REFRESH' : 'INITIALIZING...'}
                                </button>
                                {isDriveAuthenticated && (
                                    <button 
                                        type="button"
                                        onClick={logout}
                                        className="text-[10px] font-bold text-red-500 hover:text-red-700 ml-1"
                                        title="Disconnect"
                                    >
                                        LOGOUT
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                type="button"
                                onClick={handleDriveSelect}
                                disabled={!isDriveReady}
                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[12px] font-kanit font-bold uppercase tracking-wider transition-all border-b-4 ${isDriveAuthenticated ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-white text-slate-400 border-gray-100 hover:bg-gray-50'}`}
                            >
                                <HardDrive className="w-3.5 h-3.5 shadow-sm" /> 
                                {isDriveAuthenticated ? 'เลือกจาก Drive' : 'เชื่อมต่อ Drive'}
                            </button>
                            <button 
                                type="button"
                                onClick={handleUploadClick}
                                disabled={!isDriveReady || isUploading}
                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[12px] font-kanit font-bold uppercase tracking-wider transition-all border-b-4 ${isDriveAuthenticated ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-white text-slate-400 border-gray-100 hover:bg-gray-50'}`}
                            >
                                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 shadow-sm" />}
                                {isUploading ? 'กำลังอัป...' : isDriveAuthenticated ? 'อัปขึ้น Drive' : 'เชื่อมต่อเพื่ออัป'}
                            </button>
                        </div>
                    </div>

                    <div className="relative flex items-center gap-2 my-4">
                        <div className="h-px bg-gray-100 flex-1"></div>
                        <span className="text-[12px] font-bold text-gray-300 uppercase tracking-widest">หรือแปะลิงก์เอง</span>
                        <div className="h-px bg-gray-100 flex-1"></div>
                    </div>

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

                <input 
                    type="file" 
                    ref={driveUploadInputRef} 
                    className="hidden" 
                    onChange={handleDriveUpload} 
                />
            </div>
        </div>,
        document.body
    );
};

export default AddLinkModal;