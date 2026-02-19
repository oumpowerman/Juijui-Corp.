
import React, { useState, useRef } from 'react';
import { Paperclip, ExternalLink, Trash2, HardDrive, Plus, Loader2, Link as LinkIcon, Image as ImageIcon, FileText, Video, X, CloudOff, FolderOpen, Cloud, ChevronDown, Check } from 'lucide-react';
import { TaskAsset, AssetCategory } from '../types';
import { ASSET_CATEGORIES } from '../constants';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { format } from 'date-fns';
import { useGlobalDialog } from '../context/GlobalDialogContext';

interface TaskAssetsProps {
    assets: TaskAsset[];
    onAdd: (asset: TaskAsset) => void;
    onDelete: (id: string) => void;
}

const TaskAssets: React.FC<TaskAssetsProps> = ({ assets, onAdd, onDelete }) => {
    const { showConfirm } = useGlobalDialog();
    
    // UI States
    const [isExpanded, setIsExpanded] = useState(false); 
    const [inputType, setInputType] = useState<'NONE' | 'LINK' | 'DRIVE'>('NONE');
    const [isCatOpen, setIsCatOpen] = useState(false); // Dropdown State
    
    // Form States
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState<AssetCategory>('OTHER');
    
    const driveUploadInputRef = useRef<HTMLInputElement>(null);
    
    // Google Drive Hook
    const { uploadFileToDrive, isReady: isDriveReady, isUploading } = useGoogleDrive();

    // --- Actions ---

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
        resetForm();
    };

    const handleDriveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const currentYear = format(new Date(), 'yyyy');
        const currentMonth = format(new Date(), 'MM_MMMM');

        uploadFileToDrive(
            file, 
            (result) => {
                let autoCategory: AssetCategory = 'OTHER';
                if (result.mimeType.includes('image')) autoCategory = 'THUMBNAIL';
                if (result.mimeType.includes('video')) autoCategory = 'VIDEO_DRAFT';
                if (result.mimeType.includes('pdf')) autoCategory = 'SCRIPT';

                const newAsset: TaskAsset = {
                    id: crypto.randomUUID(),
                    name: result.name,
                    url: result.url,
                    type: 'LINK',
                    category: autoCategory, 
                    createdAt: new Date()
                };
                onAdd(newAsset);
                
                if (driveUploadInputRef.current) driveUploadInputRef.current.value = '';
                resetForm();
            },
            ['Juijui_Assets', currentYear, currentMonth] 
        );
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm('จะลบไฟล์นี้จริงๆ หรอ?', 'ยืนยันการลบ 🗑️');
        if (confirmed) {
            onDelete(id);
        }
    };

    const resetForm = () => {
        setName('');
        setUrl('');
        setCategory('OTHER');
        setInputType('NONE');
        setIsExpanded(false);
        setIsCatOpen(false);
    };

    // --- Render Helpers ---

    const getAssetStyle = (category: AssetCategory, isDrive: boolean) => {
        if (isDrive) return { bg: 'bg-blue-100', text: 'text-blue-600', icon: HardDrive };
        
        switch (category) {
            case 'SCRIPT': return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: FileText };
            case 'THUMBNAIL': return { bg: 'bg-pink-100', text: 'text-pink-600', icon: ImageIcon };
            case 'VIDEO_DRAFT': return { bg: 'bg-purple-100', text: 'text-purple-600', icon: Video };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: LinkIcon };
        }
    };

    const currentCatConfig = ASSET_CATEGORIES[category] || ASSET_CATEGORIES['OTHER'];
    const CurrentCatIcon = currentCatConfig.icon;

    return (
        <div className="space-y-4">
            
            {/* Header Area */}
            <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-1.5 rounded-lg shadow-sm">
                        <FolderOpen className="w-4 h-4" />
                    </span>
                    Assets & Files <span className="text-sm text-gray-400 font-medium">({assets.length})</span>
                </h3>

                {/* Drive Status Indicator */}
                {!isDriveReady && (
                    <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-100 animate-pulse">
                        <CloudOff className="w-3 h-3" />
                        <span>Drive Disconnected</span>
                    </div>
                )}
            </div>

            {/* --- COMPACT UPLOAD BAR --- */}
            {!isExpanded ? (
                <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-top-1">
                    <button 
                        type="button"
                        onClick={() => { setIsExpanded(true); setInputType('LINK'); }}
                        className="flex-1 py-3.5 border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 hover:border-indigo-300 hover:shadow-sm active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> เพิ่มไฟล์ / ลิงก์ (Add New)
                    </button>
                    {isDriveReady && (
                        <button 
                            type="button"
                            onClick={() => driveUploadInputRef.current?.click()}
                            className="px-6 py-3.5 bg-white border-2 border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 text-sm font-bold"
                            title="อัปโหลดขึ้น Drive ทันที"
                        >
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <HardDrive className="w-5 h-5" />}
                            <span className="hidden sm:inline">Upload Drive</span>
                        </button>
                    )}
                     <input type="file" ref={driveUploadInputRef} className="hidden" onChange={handleDriveUpload} />
                </div>
            ) : (
                // --- EXPANDED FORM ---
                <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-xl shadow-indigo-50/50 relative animate-in zoom-in-95">
                    <button 
                        type="button"
                        onClick={resetForm} 
                        className="absolute top-3 right-3 p-2 text-gray-300 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="mb-5 text-center">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Select Upload Type</p>
                        <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1">
                            <button 
                                type="button"
                                onClick={() => setInputType('LINK')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${inputType === 'LINK' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                🔗 แปะลิงก์ (Link)
                            </button>
                            <button 
                                type="button"
                                onClick={() => isDriveReady ? setInputType('DRIVE') : null}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${inputType === 'DRIVE' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'} ${!isDriveReady && 'opacity-50 cursor-not-allowed'}`}
                            >
                                <HardDrive className="w-4 h-4" /> Google Drive
                            </button>
                        </div>
                    </div>

                    {inputType === 'LINK' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ชื่อไฟล์ (Label)</label>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🏷️</span>
                                    <input 
                                        type="text" 
                                        placeholder="เช่น Ref. งาน, ไฟล์ลูกค้าส่งมา..." 
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-300 rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">URL / Link</label>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🌐</span>
                                    <input 
                                        type="text" 
                                        placeholder="https://..." 
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-300 rounded-xl text-sm font-medium text-indigo-600 outline-none transition-all"
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {/* --- Custom Dropdown --- */}
                            <div className="relative">
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">หมวดหมู่</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCatOpen(!isCatOpen)}
                                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between border-2 transition-all bg-white hover:border-indigo-200 ${isCatOpen ? 'border-indigo-300 ring-4 ring-indigo-50' : 'border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-1.5 rounded-lg ${currentCatConfig.color}`}>
                                            <CurrentCatIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-gray-700">{currentCatConfig.label}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCatOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCatOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsCatOpen(false)}></div>
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 p-2 max-h-60 overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95">
                                            {Object.entries(ASSET_CATEGORIES).map(([key, val]: [string, any]) => {
                                                const Icon = val.icon;
                                                const isSelected = category === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => { setCategory(key as AssetCategory); setIsCatOpen(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 transition-all ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`p-1.5 rounded-lg ${val.color}`}>
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-600'}`}>{val.label}</span>
                                                        </div>
                                                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>

                            <button 
                                type="button"
                                onClick={handleAddLink}
                                disabled={!name || !url}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5 stroke-[3px]" /> บันทึกรายการ
                            </button>
                        </div>
                    )}

                    {inputType === 'DRIVE' && (
                        <div className="text-center py-8 bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-100">
                            {isDriveReady ? (
                                <button 
                                    type="button"
                                    onClick={() => driveUploadInputRef.current?.click()}
                                    className="group flex flex-col items-center gap-3 transition-all active:scale-95"
                                >
                                    <div className="p-4 bg-white rounded-full shadow-md group-hover:scale-110 transition-transform">
                                        <Cloud className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <span className="text-sm font-bold text-blue-600">คลิกเพื่อเลือกไฟล์จากเครื่อง</span>
                                    <span className="text-xs text-blue-400">อัปโหลดขึ้น Google Drive อัตโนมัติ</span>
                                </button>
                            ) : (
                                <div className="flex flex-col items-center text-orange-500">
                                    <span className="text-3xl mb-2">😴</span>
                                    <p className="font-bold text-sm">Google Drive is sleeping...</p>
                                    <p className="text-xs opacity-80 mt-1">ยังเชื่อมต่อไม่ได้ ลองใหม่ภายหลังนะ</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Asset List (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-indigo-100">
                {assets.map((asset) => {
                    const isDrive = asset.url.includes('drive.google.com');
                    const style = getAssetStyle(asset.category, isDrive);
                    const Icon = style.icon;

                    return (
                        <div key={asset.id} className="group flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-gray-700 truncate group-hover:text-indigo-600 transition-colors">
                                        {asset.name}
                                    </h4>
                                    <a 
                                        href={asset.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-xs text-gray-400 hover:text-blue-500 hover:underline flex items-center gap-1 truncate mt-0.5 font-medium"
                                    >
                                        {isDrive ? 'Google Drive' : 'External Link'} <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => handleDelete(asset.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
            
        </div>
    );
};

export default TaskAssets;
