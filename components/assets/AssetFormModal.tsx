
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Image as ImageIcon, Loader2, Calendar, DollarSign, Tag, User, AlertTriangle } from 'lucide-react';
import { InventoryItem, MasterOption, User as AppUser, AssetCondition, AssetGroup } from '../../types';
import { format } from 'date-fns';

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: InventoryItem | null;
    onSave: (data: Partial<InventoryItem>, file?: File) => Promise<boolean>;
    masterOptions: MasterOption[];
    users: AppUser[];
}

const CONDITION_OPTIONS: { key: AssetCondition, label: string, color: string }[] = [
    { key: 'GOOD', label: 'ปกติ (Good)', color: 'text-green-600' },
    { key: 'REPAIR', label: 'ส่งซ่อม (Repair)', color: 'text-orange-600' },
    { key: 'DAMAGED', label: 'ชำรุด (Damaged)', color: 'text-red-600' },
    { key: 'LOST', label: 'สูญหาย (Lost)', color: 'text-gray-500' },
    { key: 'WRITE_OFF', label: 'ตัดจำหน่าย (Write-off)', color: 'text-slate-400' }
];

const GROUP_OPTIONS: { key: AssetGroup, label: string }[] = [
    { key: 'PRODUCTION', label: 'อุปกรณ์ออกกอง (Production)' },
    { key: 'OFFICE', label: 'เครื่องใช้สำนักงาน (Office)' },
    { key: 'IT', label: 'อุปกรณ์ไอที (IT)' },
];

const AssetFormModal: React.FC<AssetFormModalProps> = ({ 
    isOpen, onClose, initialData, onSave, masterOptions, users 
}) => {
    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [group, setGroup] = useState<AssetGroup>('PRODUCTION');
    const [price, setPrice] = useState('');
    const [buyDate, setBuyDate] = useState('');
    const [serial, setSerial] = useState('');
    const [warranty, setWarranty] = useState('');
    const [condition, setCondition] = useState<AssetCondition>('GOOD');
    const [holderId, setHolderId] = useState('');
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter Categories (L2)
    const categories = masterOptions.filter(o => o.type === 'INV_CAT_L2').sort((a,b) => a.sortOrder - b.sortOrder);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description || '');
                setCategoryId(initialData.categoryId);
                setGroup(initialData.assetGroup || 'PRODUCTION');
                setPrice(initialData.purchasePrice?.toString() || '');
                setBuyDate(initialData.purchaseDate ? format(initialData.purchaseDate, 'yyyy-MM-dd') : '');
                setSerial(initialData.serialNumber || '');
                setWarranty(initialData.warrantyExpire ? format(initialData.warrantyExpire, 'yyyy-MM-dd') : '');
                setCondition(initialData.condition || 'GOOD');
                setHolderId(initialData.currentHolderId || '');
                setPreviewUrl(initialData.imageUrl || '');
            } else {
                // Reset
                setName(''); setDescription(''); setCategoryId(''); setGroup('PRODUCTION');
                setPrice(''); setBuyDate(''); setSerial(''); setWarranty('');
                setCondition('GOOD'); setHolderId(''); setPreviewUrl('');
            }
            setImageFile(null);
        }
    }, [isOpen, initialData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !categoryId) {
            alert('กรุณากรอกชื่อและหมวดหมู่');
            return;
        }
        setIsSubmitting(true);
        const payload: Partial<InventoryItem> = {
            id: initialData?.id,
            name,
            description,
            categoryId,
            assetGroup: group,
            purchasePrice: parseFloat(price) || 0,
            purchaseDate: buyDate ? new Date(buyDate) : undefined,
            serialNumber: serial,
            warrantyExpire: warranty ? new Date(warranty) : undefined,
            condition,
            currentHolderId: holderId || undefined,
            imageUrl: previewUrl // Will be handled by hook if file present
        };
        const success = await onSave(payload, imageFile || undefined);
        setIsSubmitting(false);
        if (success) onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 border-white">
                
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        {initialData ? 'แก้ไขข้อมูลทรัพย์สิน' : 'ลงทะเบียนทรัพย์สินใหม่'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-gray-400 transition-colors"><X className="w-5 h-5"/></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Image Upload */}
                        <div className="flex justify-center md:justify-start">
                             <div 
                                className="w-40 h-40 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center cursor-pointer hover:border-indigo-300 overflow-hidden relative group"
                                onClick={() => fileInputRef.current?.click()}
                             >
                                {previewUrl ? (
                                    <img src={previewUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                                        <span className="text-xs">รูปภาพ</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold">เปลี่ยนรูป</span>
                                </div>
                             </div>
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">ชื่อทรัพย์สิน <span className="text-red-500">*</span></label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl font-bold text-gray-800 focus:border-indigo-400 outline-none" required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">กลุ่ม (Group)</label>
                                    <select value={group} onChange={e => setGroup(e.target.value as AssetGroup)} className="w-full px-3 py-2 border rounded-xl text-sm font-medium bg-white">
                                        {GROUP_OPTIONS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">หมวดหมู่ <span className="text-red-500">*</span></label>
                                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm font-medium bg-white" required>
                                        <option value="">-- เลือก --</option>
                                        {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial & Identity */}
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center text-xs font-bold text-gray-500 mb-1"><DollarSign className="w-3 h-3 mr-1"/> ราคาซื้อ (บาท)</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="flex items-center text-xs font-bold text-gray-500 mb-1"><Calendar className="w-3 h-3 mr-1"/> วันที่ซื้อ</label>
                            <input type="date" value={buyDate} onChange={e => setBuyDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                        </div>
                        <div>
                            <label className="flex items-center text-xs font-bold text-gray-500 mb-1"><Tag className="w-3 h-3 mr-1"/> Serial Number</label>
                            <input type="text" value={serial} onChange={e => setSerial(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" placeholder="S/N" />
                        </div>
                        <div>
                            <label className="flex items-center text-xs font-bold text-gray-500 mb-1"><AlertTriangle className="w-3 h-3 mr-1"/> หมดประกัน</label>
                            <input type="date" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                        </div>
                    </div>

                    {/* Status & Holder */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">สภาพปัจจุบัน</label>
                            <select value={condition} onChange={e => setCondition(e.target.value as AssetCondition)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold bg-white focus:border-indigo-400">
                                {CONDITION_OPTIONS.map(c => <option key={c.key} value={c.key} className={c.color}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase flex items-center"><User className="w-3 h-3 mr-1"/> ผู้ถือครอง (Holder)</label>
                            <select value={holderId} onChange={e => setHolderId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
                                <option value="">-- ส่วนกลาง / ไม่มี --</option>
                                {users.filter(u => u.isActive).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">หมายเหตุ / รายละเอียดเพิ่มเติม</label>
                        <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none" placeholder="เช่น ซื้อจากร้าน Big Camera..." />
                    </div>

                </form>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>} บันทึก
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AssetFormModal;
