
import React, { useState } from 'react';
import { Paperclip, ExternalLink, Download, Trash2, File } from 'lucide-react';
import { TaskAsset, AssetCategory } from '../types';
import { ASSET_CATEGORIES } from '../constants';

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

    const handleAdd = () => {
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

    const handleDelete = (id: string) => {
        if(confirm('ลบไฟล์นี้ใช่ไหม?')) {
            onDelete(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Add Asset Form */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center">
                        <Paperclip className="w-4 h-4 mr-2" /> แนบไฟล์ / ลิงก์
                    </h3>
                    {!isFormOpen && (
                        <button 
                            type="button"
                            onClick={() => setIsFormOpen(true)}
                            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                        >
                            + เพิ่มรายการ
                        </button>
                    )}
                </div>

                {isFormOpen && (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                        <input 
                            type="text" 
                            placeholder="ชื่อไฟล์ / เอกสาร (เช่น Script EP.1)" 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={name}
                            onChange={e => setName(e.target.value)}
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
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white font-medium"
                                value={category}
                                onChange={e => setCategory(e.target.value as AssetCategory)}
                            >
                                {Object.entries(ASSET_CATEGORIES).map(([key, val]: [string, any]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setIsFormOpen(false)}
                                className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                type="button" 
                                onClick={handleAdd}
                                disabled={!name || !url}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Assets List */}
            <div className="space-y-3">
                {assets.length === 0 && !isFormOpen && (
                    <div className="text-center py-10 text-gray-400">
                        <File className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>ยังไม่มีไฟล์แนบ</p>
                    </div>
                )}
                
                {assets.map((asset) => {
                    const CatInfo = ASSET_CATEGORIES[asset.category] || ASSET_CATEGORIES['OTHER'];
                    const Icon = CatInfo.icon;
                    
                    return (
                        <div key={asset.id} className="flex items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors group">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-3 ${CatInfo.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{asset.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                        {CatInfo.label.split(' / ')[0]}
                                    </span>
                                    <a 
                                        href={asset.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-[10px] text-indigo-500 hover:underline flex items-center truncate max-w-[150px]"
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" /> {asset.url}
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
