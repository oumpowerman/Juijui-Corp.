
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Image as ImageIcon, Loader2, Calendar, DollarSign, Tag, User, AlertTriangle, Layers, Box, Trash2 } from 'lucide-react';
import { InventoryItem, MasterOption, User as AppUser, AssetCondition, AssetGroup } from '../../types';
import { format } from 'date-fns';

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: InventoryItem | null;
    onSave: (data: Partial<InventoryItem>, file?: File) => Promise<boolean>;
    onDelete?: (id: string) => void;
    masterOptions: MasterOption[];
    users: AppUser[];
}

const CONDITION_OPTIONS: { key: AssetCondition, label: string, color: string, bg: string, icon: string }[] = [
    { key: 'GOOD', label: 'ปกติ (Good)', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✨' },
    { key: 'REPAIR', label: 'ส่งซ่อม (Repair)', color: 'text-orange-600', bg: 'bg-orange-50', icon: '🔧' },
    { key: 'DAMAGED', label: 'ชำรุด (Damaged)', color: 'text-red-600', bg: 'bg-red-50', icon: '💥' },
    { key: 'LOST', label: 'สูญหาย (Lost)', color: 'text-gray-500', bg: 'bg-gray-100', icon: '👻' },
    { key: 'WRITE_OFF', label: 'ตัดจำหน่าย (Write-off)', color: 'text-slate-400', bg: 'bg-slate-100', icon: '🗑️' }
];

const AssetFormModal: React.FC<AssetFormModalProps> = ({ 
    isOpen, onClose, initialData, onSave, onDelete, masterOptions, users 
}) => {
    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [group, setGroup] = useState<string>(''); // Dynamic String now
    const [price, setPrice] = useState('');
    const [buyDate, setBuyDate] = useState('');
    const [serial, setSerial] = useState('');
    const [warranty, setWarranty] = useState('');
    const [condition, setCondition] = useState<AssetCondition>('GOOD');
    const [holderId, setHolderId] = useState('');
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Animation State
    const [animateIn, setAnimateIn] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Dynamic Options Logic ---
    const groupOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'INV_CAT_L1').sort((a,b) => a.sortOrder - b.sortOrder), 
    [masterOptions]);

    const categoryOptions = useMemo(() => {
        // If group is selected, filter L2 by parentKey. Else show all (or none).
        if (!group) return [];
        return masterOptions
            .filter(o => o.type === 'INV_CAT_L2' && o.parentKey === group)
            .sort((a,b) => a.sortOrder - b.sortOrder);
    }, [masterOptions, group]);

    // Scroll Lock Effect
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setAnimateIn(true);
        } else {
            document.body.style.overflow = 'unset';
            setAnimateIn(false);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description || '');
                setGroup(initialData.assetGroup || ''); // Load existing group
                setCategoryId(initialData.categoryId); // Load existing category
                setPrice(initialData.purchasePrice?.toString() || '');
                setBuyDate(initialData.purchaseDate ? format(initialData.purchaseDate, 'yyyy-MM-dd') : '');
                setSerial(initialData.serialNumber || '');
                setWarranty(initialData.warrantyExpire ? format(initialData.warrantyExpire, 'yyyy-MM-dd') : '');
                setCondition(initialData.condition || 'GOOD');
                setHolderId(initialData.currentHolderId || '');
                setPreviewUrl(initialData.imageUrl || '');
                
                if (!initialData.assetGroup && initialData.categoryId) {
                     const cat = masterOptions.find(o => o.type === 'INV_CAT_L2' && o.key === initialData.categoryId);
                     if (cat && cat.parentKey) {
                         setGroup(cat.parentKey);
                     }
                }

            } else {
                // Reset
                setName(''); setDescription(''); 
                setGroup(''); // FIXED: Default to empty string instead of first option
                setCategoryId(''); 
                setPrice(''); setBuyDate(''); setSerial(''); setWarranty('');
                setCondition('GOOD'); setHolderId(''); setPreviewUrl('');
            }
            setImageFile(null);
        }
    }, [isOpen, initialData, masterOptions]); 

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !categoryId || !group) {
            alert('กรุณากรอกชื่อ, กลุ่ม และหมวดหมู่ให้ครบถ้วน');
            return;
        }
        setIsSubmitting(true);
        const payload: Partial<InventoryItem> = {
            id: initialData?.id,
            name,
            description,
            categoryId,
            assetGroup: group as AssetGroup, // Cast string to AssetGroup
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/60 backdrop-blur-md p-4 transition-all duration-300">
            <div 
                className={`
                    bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-[6px] border-white ring-4 ring-indigo-50
                    transform transition-all duration-500 ease-out
                    ${animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10'}
                `}
            >
                
                {/* Header with Cool Gradient */}
                <div className="px-8 py-6 bg-gradient-to-r from-violet-200 via-pink-200 to-indigo-200 flex justify-between items-center shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/30 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                            {initialData ? <Box className="w-8 h-8 text-indigo-500" /> : <Layers className="w-8 h-8 text-pink-500" />}
                        </div>
                        <div>
                            <p className="text-xs font-black text-indigo-900 uppercase tracking-widest opacity-60">Asset Management</p>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                {initialData ? 'แก้ไขข้อมูลทรัพย์สิน' : 'ลงทะเบียนของใหม่'}
                            </h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="relative z-10 p-3 bg-white/50 hover:bg-white rounded-full text-slate-500 hover:text-red-500 transition-all hover:rotate-90 shadow-sm"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-indigo-100">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* LEFT COLUMN: Image & Basic Info */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            {/* Image Uploader - Polaroid Style */}
                            <div className="group relative">
                                <div 
                                    className="aspect-square bg-white rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center cursor-pointer overflow-hidden relative transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-slate-300 group-hover:text-indigo-400 transition-colors">
                                            <div className="bg-slate-50 p-6 rounded-full mb-3 group-hover:bg-indigo-50 transition-colors">
                                                <ImageIcon className="w-10 h-10" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider">Upload Photo</span>
                                        </div>
                                    )}
                                    
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <span className="text-white text-sm font-bold bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/50">
                                            เปลี่ยนรูปภาพ 📸
                                        </span>
                                    </div>
                                </div>
                                {/* Cute Tape decoration */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/30 backdrop-blur-sm rotate-3 shadow-sm border border-white/40"></div>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-2 group focus-within:scale-[1.02] transition-transform origin-left">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2">ชื่อทรัพย์สิน <span className="text-red-400">*</span></label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    className="w-full px-5 py-4 bg-white border-none rounded-2xl shadow-sm text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 focus:shadow-md transition-all outline-none" 
                                    placeholder="เช่น กล้อง Sony A7IV" 
                                    required 
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2">รายละเอียดเพิ่มเติม</label>
                                <textarea 
                                    rows={4} 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    className="w-full px-5 py-4 bg-white border-none rounded-2xl shadow-sm text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none" 
                                    placeholder="รายละเอียด เช่น สี, ตำหนิ, อุปกรณ์ที่แถมมา..." 
                                />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Details & Specs */}
                        <div className="lg:col-span-8 space-y-8">
                            
                            {/* 1. Categorization Card */}
                            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -mr-5 -mt-5 opacity-50"></div>
                                
                                <h4 className="text-sm font-black text-indigo-900 mb-6 flex items-center">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600"><Layers className="w-4 h-4"/></span>
                                    หมวดหมู่ (Categorization)
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">กลุ่ม (Group) <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <select 
                                                value={group} 
                                                onChange={e => {
                                                    setGroup(e.target.value);
                                                    setCategoryId(''); 
                                                }} 
                                                className={`w-full px-4 py-3.5 rounded-xl text-sm font-bold border-2 cursor-pointer outline-none appearance-none transition-all
                                                    ${!group ? 'text-slate-400 border-slate-100 bg-slate-50' : 'text-indigo-700 border-indigo-100 bg-indigo-50/30 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50'}
                                                `}
                                                required
                                            >
                                                <option value="" disabled>-- กรุณาระบุกลุ่มหลัก --</option>
                                                {groupOptions.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">▼</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">ชนิด (Category) <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <select 
                                                value={categoryId} 
                                                onChange={e => setCategoryId(e.target.value)} 
                                                className={`w-full px-4 py-3.5 rounded-xl text-sm font-bold border-2 cursor-pointer outline-none appearance-none transition-all
                                                    ${!categoryId ? 'text-slate-400 border-slate-100 bg-slate-50' : 'text-indigo-700 border-indigo-100 bg-indigo-50/30 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50'}
                                                `}
                                                required
                                                disabled={!group}
                                            >
                                                <option value="">-- กรุณาเลือกชนิด --</option>
                                                {categoryOptions.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">▼</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Specs & Financial Card */}
                            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-br-[100px] -ml-5 -mt-5 opacity-50"></div>

                                <h4 className="text-sm font-black text-emerald-900 mb-6 flex items-center relative z-10">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3 text-emerald-600"><Tag className="w-4 h-4"/></span>
                                    ข้อมูลจำเพาะ (Specification)
                                </h4>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                                    <div className="col-span-2 md:col-span-1 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center"><DollarSign className="w-3 h-3 mr-1"/> ราคาซื้อ</label>
                                        <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border-transparent focus:bg-white border-2 focus:border-emerald-200 rounded-xl text-sm font-bold text-emerald-700 outline-none transition-all" placeholder="0.00" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center"><Calendar className="w-3 h-3 mr-1"/> วันที่ซื้อ</label>
                                        <input type="date" value={buyDate} onChange={e => setBuyDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border-transparent focus:bg-white border-2 focus:border-emerald-200 rounded-xl text-xs font-bold text-slate-600 outline-none transition-all" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center"><Tag className="w-3 h-3 mr-1"/> S/N</label>
                                        <input type="text" value={serial} onChange={e => setSerial(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border-transparent focus:bg-white border-2 focus:border-emerald-200 rounded-xl text-xs font-mono font-bold text-slate-600 outline-none transition-all" placeholder="Serial No." />
                                    </div>
                                    <div className="col-span-2 md:col-span-1 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> หมดประกัน</label>
                                        <input type="date" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border-transparent focus:bg-white border-2 focus:border-emerald-200 rounded-xl text-xs font-bold text-slate-600 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Status & Holder Card */}
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">สภาพปัจจุบัน (Condition)</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {CONDITION_OPTIONS.map(c => (
                                                <button
                                                    key={c.key}
                                                    type="button"
                                                    onClick={() => setCondition(c.key)}
                                                    className={`
                                                        px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5
                                                        ${condition === c.key 
                                                            ? `bg-white border-current shadow-md scale-105 ${c.color}` 
                                                            : 'bg-transparent border-transparent text-slate-400 hover:bg-white hover:shadow-sm'}
                                                    `}
                                                >
                                                    <span>{c.icon}</span> {c.label.split(' ')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center"><User className="w-3 h-3 mr-1"/> ผู้ถือครอง (Current Holder)</label>
                                        <div className="relative">
                                            <select 
                                                value={holderId} 
                                                onChange={e => setHolderId(e.target.value)} 
                                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">-- ส่วนกลาง / ไม่มีผู้ถือ --</option>
                                                {users.filter(u => u.isActive).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </form>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-slate-100 flex justify-between gap-3 shrink-0 relative z-20">
                    <div>
                         {/* DELETE BUTTON - Only show in Edit Mode */}
                         {initialData && onDelete && (
                             <button 
                                 type="button" 
                                 onClick={() => onDelete(initialData.id)}
                                 className="px-5 py-3.5 rounded-2xl text-red-500 font-bold bg-white border-2 border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors text-sm flex items-center gap-2"
                             >
                                 <Trash2 className="w-4 h-4" /> ลบรายการ
                             </button>
                         )}
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose} 
                            className="px-8 py-3.5 rounded-2xl text-slate-500 font-bold bg-slate-50 hover:bg-slate-100 transition-colors text-sm"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting} 
                            className="px-10 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />} 
                            บันทึกข้อมูล
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AssetFormModal;
