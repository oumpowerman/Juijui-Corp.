
import React, { useState } from 'react';
import { HardDrive, Plus, Edit2, Trash2, Database, Info, Save, X, ExternalLink } from 'lucide-react';
import { useStorage } from '../../../../context/StorageContext';
import { StorageConfig } from '../../../../types/task';
import { motion, AnimatePresence } from 'framer-motion';

const StorageHubMasterView: React.FC = () => {
    const { storageConfigs, isLoading, saveConfig, deleteConfig } = useStorage();
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<StorageConfig | null>(null);
    const [formData, setFormData] = useState<Partial<StorageConfig>>({
        label: '',
        currentLetter: '',
        description: ''
    });

    const handleStartAdd = () => {
        setFormData({ label: '', currentLetter: '', description: '' });
        setIsAdding(true);
        setEditingItem(null);
    };

    const handleStartEdit = (item: StorageConfig) => {
        setFormData(item);
        setEditingItem(item);
        setIsAdding(false);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingItem(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.label || !formData.currentLetter) return;

        await saveConfig(formData as any);
        handleCancel();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Legend / Alert */}
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-amber-800 text-sm">Storage Mapping System คืออะไร?</h4>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1">
                        ใช้แก้ปัญหาเมื่อ Harddisk ต่อภายนอกเปลี่ยนชื่อ Drive (เช่น จาก E: เป็น G:) 
                        โดยคุณสามารถระบุ Label ไว้ (เช่น HDD_WORK) และเมื่อ Drive เปลี่ยนชื่อ คุณแค่มาอัปเดตที่นี่ที่เดียว 
                        Path ในโปรเจกต์ทั้งหมดจะถูก Resolved ใหม่ให้ถูกต้องตาม Drive Letter ปัจจุบันทันที
                    </p>
                </div>
            </div>

            {/* List Header */}
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-500" />
                    รายการ Storage Hub ({storageConfigs.length})
                </h3>
                {!isAdding && !editingItem && (
                    <button 
                        onClick={handleStartAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-xs shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> เพิ่ม Hub ใหม่
                    </button>
                )}
            </div>

            {/* Form (Add/Edit) */}
            <AnimatePresence mode="wait">
                {(isAdding || editingItem) && (
                    <motion.form 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleSubmit}
                        className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-xl space-y-4 shadow-indigo-100/20"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-black text-indigo-600 uppercase tracking-tight flex items-center gap-2">
                                {editingItem ? 'Edit Storage Hub' : 'Add New Storage Hub'}
                            </h4>
                            <button type="button" onClick={handleCancel} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Drive Label (ชื่อเรียก)</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="เช่น YOUTUBE_HDD, NAS_SERVER"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Current Drive Letter (ค่าปัจจุบัน)</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="เช่น E:, /Volumes/HDD, //Server/Share"
                                    value={formData.currentLetter}
                                    onChange={e => setFormData({ ...formData, currentLetter: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Description (คำอธิบาย)</label>
                                <textarea 
                                    placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับไดรฟ์นี้..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all h-20 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2.5 rounded-xl text-gray-500 font-bold text-sm hover:bg-gray-100 transition-all"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                type="submit"
                                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                            >
                                <Save className="w-4 h-4" />
                                {editingItem ? 'บันทึกการเปลี่ยนแปลง' : 'ยืนยันเพิ่ม Hub'}
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* List Views */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storageConfigs.map(config => (
                    <motion.div 
                        key={config.id}
                        layout
                        whileHover={{ y: -4 }}
                        className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <HardDrive className="w-12 h-12" />
                        </div>

                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                <Database className="w-5 h-5" />
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleStartEdit(config)}
                                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => { if(window.confirm('ยืนยันการลบ Hub นี้?')) deleteConfig(config.id!) }}
                                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h4 className="text-lg font-black text-slate-700 tracking-tight leading-tight">{config.label}</h4>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{config.description || 'No description provided'}</p>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Mapping</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div className="flex items-center gap-2 text-indigo-600 font-mono font-bold text-sm">
                                    <ExternalLink className="w-3 h-3" />
                                    {config.currentLetter}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {storageConfigs.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <HardDrive className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">ยังไม่มีข้อมูล Storage Hub</p>
                        <p className="text-xs text-gray-300">เริ่มเพิ่มเพื่อจัดการ Drive Letter อย่างเป็นระบบ</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StorageHubMasterView;
