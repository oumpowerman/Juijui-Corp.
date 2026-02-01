
import React from 'react';
import { X, Save, Check, Loader2 } from 'lucide-react';

interface MasterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    isEditing: boolean;
    formData: any;
    setFormData: (data: any) => void;
    rewardFormData?: any;
    setRewardFormData?: (data: any) => void;
    activeTab: string;
}

const COLOR_PRESETS = [
    { name: 'Gray', class: 'bg-gray-100 text-gray-700 border-gray-200' },
    { name: 'Red', class: 'bg-red-50 text-red-700 border-red-200' },
    { name: 'Orange', class: 'bg-orange-50 text-orange-700 border-orange-200' },
    { name: 'Yellow', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { name: 'Green', class: 'bg-green-50 text-green-700 border-green-200' },
    { name: 'Teal', class: 'bg-teal-50 text-teal-700 border-teal-200' },
    { name: 'Blue', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Indigo', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { name: 'Purple', class: 'bg-purple-50 text-purple-700 border-purple-200' },
    { name: 'Pink', class: 'bg-pink-50 text-pink-700 border-pink-200' },
];

const MasterFormModal: React.FC<MasterFormModalProps> = ({ 
    isOpen, onClose, onSubmit, isSubmitting, isEditing, 
    formData, setFormData, rewardFormData, setRewardFormData, activeTab 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95">
                <div className="px-5 py-3 bg-indigo-600 text-white flex justify-between items-center">
                    <h3 className="font-bold text-sm">{isEditing ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    {activeTab === 'REWARDS' && rewardFormData && setRewardFormData ? (
                        <>
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">ชื่อรางวัล</label><input type="text" value={rewardFormData.title || ''} onChange={e => setRewardFormData({...rewardFormData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm font-bold" required /></div>
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">รายละเอียด</label><textarea rows={2} value={rewardFormData.description || ''} onChange={e => setRewardFormData({...rewardFormData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm resize-none" /></div>
                            <div className="flex gap-4"><div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">แต้ม</label><input type="number" value={rewardFormData.cost || 0} onChange={e => setRewardFormData({...rewardFormData, cost: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm font-bold" /></div><div className="w-24"><label className="block text-xs font-bold text-gray-500 mb-1">ไอคอน</label><input type="text" value={rewardFormData.icon || ''} onChange={e => setRewardFormData({...rewardFormData, icon: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm text-center" /></div></div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Label (ชื่อที่แสดง)</label>
                                <input type="text" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm font-bold" required autoFocus />
                            </div>
                            
                            {/* Don't show Key input for Sub-items if it's meant to be auto-generated or if Key is not user-friendly */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Key (รหัสอ้างอิง - ENG)</label>
                                <input type="text" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm font-mono uppercase bg-gray-50" required disabled={isEditing} />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">Color Theme</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {COLOR_PRESETS.map(c => (
                                        <button key={c.name} type="button" onClick={() => setFormData({...formData, color: c.class})} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${c.class.split(' ')[0]} ${formData.color === c.class ? 'border-gray-600 ring-2 ring-gray-200' : 'border-transparent hover:scale-105'}`}>{formData.color === c.class && <Check className="w-4 h-4" />}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    
                    <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex justify-center items-center mt-2">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> บันทึก</>}</button>
                </form>
            </div>
        </div>
    );
};

export default MasterFormModal;
