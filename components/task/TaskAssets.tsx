
import React, { useState, useRef } from 'react';
import { Paperclip, ExternalLink, Download, Trash2, File, HardDrive, Plus, UploadCloud, Loader2 } from 'lucide-react';
import { TaskAsset, AssetCategory } from '../../types';
import { ASSET_CATEGORIES } from '../../constants';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import { format } from 'date-fns';

interface TaskAssetsProps {
    assets: TaskAsset[];
    onAdd: (asset: TaskAsset) => void;
    onDelete: (id: string) => void;
}

const TaskAssets: React.FC<TaskAssetsProps> = ({ assets, onAdd, onDelete }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState<AssetCategory>('OTHER');
    
    const driveUploadInputRef = useRef<HTMLInputElement>(null);
    
    // Google Drive Hook
    const { openDrivePicker, uploadFileToDrive, isReady: isDriveReady, isUploading } = useGoogleDrive();

    const handleAddLink = () => {
        if (!name.trim() || !url.trim()) return;
        
        const newAsset: TaskAsset = {
            id: crypto.randomUUID(),
            name,
            url,
            type: 'LINK',
            category,
            createdAt: new Date()
        };
        
        onAdd(newAsset);
        setName('');
        setUrl('');
        setCategory('OTHER');
        setIsFormOpen(false);
    };

    const handleDriveSelect = () => {
        openDrivePicker((file) => {
            const newAsset: TaskAsset = {
                id: crypto.randomUUID(),
                name: file.name,
                url: file.url,
                type: 'LINK', 
                category: 'REF', 
                createdAt: new Date()
            };
            onAdd(newAsset);
        });
    };

    const handleDriveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const currentMonthFolder = format(new Date(), 'yyyy-MM');

        uploadFileToDrive(
            file, 
            (result) => {
                const newAsset: TaskAsset = {
                    id: crypto.randomUUID(),
                    name: result.name,
                    url: result.url,
                    type: 'LINK',
                    category: 'OTHER', // Or determine by mimeType
                    createdAt: new Date()
                };
                onAdd(newAsset);
                
                // Reset input
                if (driveUploadInputRef.current) driveUploadInputRef.current.value = '';
            },
            ['Work', currentMonthFolder] // Path: Juijui_Uploads / Work / 2023-10
        );
    };

    const handleDelete = (id: string) => {
        if(confirm('ลบไฟล์นี้ใช่ไหม?')) {
            onDelete(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                >
                    <Paperclip className="w-4 h-4" /> แปะลิงก์
                </button>
                
                <button 
                    type="button"
                    onClick={handleDriveSelect}
                    disabled={!isDriveReady}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 border ${
                        isDriveReady 
                        ? 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title={isDriveReady ? "เลือกไฟล์จาก Google Drive" : "กำลังโหลด Google API..."}
                >
                    <HardDrive className="w-4 h-4" /> เลือกจาก Drive
                </button>
            </div>

            {/* Manual Link Form */}
            {isFormOpen && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase">เพิ่มไฟล์ / ลิงก์</span>
                            <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        {/* Upload Direct to Drive Option */}
                        <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2 text-blue-700">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold">อัปโหลดขึ้น Google Drive</p>
                                    <p className="text-[10px] text-blue-400">ประหยัดพื้นที่ Cloud</p>
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={driveUploadInputRef} 
                                className="hidden" 
                                onChange={handleDriveUpload} 
                            />
                            <button 
                                onClick={() => driveUploadInputRef.current?.click()}
                                disabled={!isDriveReady || isUploading}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                            >
                                {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                                {isUploading ? 'กำลังอัป...' : 'เลือกไฟล์'}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase my-1">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span>หรือ แปะลิงก์เอง</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>
                        
                        <input 
                            type="text" 
                            placeholder="ชื่อไฟล์ / เอกสาร (เช่น Script EP.1)" 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="วางลิงก์ (URL) ที่นี่..." 
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                            />
                            <select 
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white font-medium cursor-pointer"
                                value={category}
                                onChange={e => setCategory(e.target.value as AssetCategory)}
                            >
                                {Object.entries(ASSET_CATEGORIES).map(([key, val]: [string, any]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleAddLink}
                            disabled={!name || !url}
                            className="w-full py-2 text-sm bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> บันทึกรายการ
                        </button>
                    </div>
                </div>
            )}

            {/* Assets List */}
            <div className="space-y-3">
                {assets.length === 0 && !isFormOpen && (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                        <File className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">ยังไม่มีไฟล์แนบ</p>
                        <p className="text-xs mt-1">กดปุ่มด้านบนเพื่อเพิ่มไฟล์</p>
                    </div>
                )}
                
                {assets.map((asset) => {
                    const CatInfo = ASSET_CATEGORIES[asset.category] || ASSET_CATEGORIES['OTHER'];
                    const Icon = asset.url.includes('drive.google.com') ? HardDrive : CatInfo.icon;
                    const isDrive = asset.url.includes('drive.google.com');
                    
                    return (
                        <div key={asset.id} className="flex items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors group">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-3 ${isDrive ? 'bg-blue-50 text-blue-600' : CatInfo.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{asset.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                        {isDrive ? 'Google Drive' : CatInfo.label.split(' / ')[0]}
                                    </span>
                                    <a 
                                        href={asset.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-[10px] text-indigo-500 hover:underline flex items-center truncate max-w-[150px]"
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" /> เปิดไฟล์
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={asset.url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                    <Download className="w-4 h-4" />
                                </a>
                                <button 
                                    type="button" 
                                    onClick={() => handleDelete(asset.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TaskAssets;
