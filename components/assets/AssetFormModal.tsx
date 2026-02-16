
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Image as ImageIcon, Loader2, Calendar, DollarSign, Tag, User, AlertTriangle, Layers, Box, Trash2, Hash, Package, Monitor, CheckCircle2, Copy, Check, Plus, Info } from 'lucide-react';
import { InventoryItem, MasterOption, User as AppUser, AssetCondition, AssetGroup, InventoryType } from '../../types';
import { format } from 'date-fns';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: InventoryItem | null;
    onSave: (data: Partial<InventoryItem>, file?: File) => Promise<boolean>;
    onDelete?: (id: string) => void;
    masterOptions: MasterOption[];
    users: AppUser[];
    existingTags?: string[]; 
    existingGroups?: string[]; // NEW PROP
}

const AssetFormModal: React.FC<AssetFormModalProps> = ({ 
    isOpen, onClose, initialData, onSave, onDelete, masterOptions, users, existingTags = [], existingGroups = []
}) => {
    const { showAlert, showConfirm } = useGlobalDialog();

    // Form State
    const [itemType, setItemType] = useState<InventoryType>('FIXED');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [group, setGroup] = useState<string>(''); 
    const [groupLabel, setGroupLabel] = useState(''); 
    
    // Group Combobox & Toggle State
    const [showGroupDropdown, setShowGroupDropdown] = useState(false);
    const [isGroupingEnabled, setIsGroupingEnabled] = useState(false);
    
    // Fixed Asset Fields
    const [price, setPrice] = useState('');
    const [buyDate, setBuyDate] = useState('');
    const [serial, setSerial] = useState('');
    const [warranty, setWarranty] = useState('');
    const [condition, setCondition] = useState<AssetCondition>('GOOD');
    const [holderId, setHolderId] = useState('');

    // Consumable Fields
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState('ชิ้น');
    const [minThreshold, setMinThreshold] = useState(5);
    const [maxCapacity, setMaxCapacity] = useState(50);
    
    // Tags State
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [animateIn, setAnimateIn] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const tagInputRef = useRef<HTMLInputElement>(null);
    const groupInputRef = useRef<HTMLDivElement>(null);

    // --- Dynamic Options Logic ---
    const groupOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'INV_CAT_L1').sort((a,b) => a.sortOrder - b.sortOrder), 
    [masterOptions]);

    const categoryOptions = useMemo(() => {
        if (!group) return [];
        return masterOptions
            .filter(o => o.type === 'INV_CAT_L2' && o.parentKey === group)
            .sort((a,b) => a.sortOrder - b.sortOrder);
    }, [masterOptions, group]);

    // Dynamic Condition Options
    const conditionOptions = useMemo(() => {
        const opts = masterOptions.filter(o => o.type === 'ITEM_CONDITION' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
        if (opts.length > 0) return opts;
        
        // Fallback
        return [
            { key: 'GOOD', label: 'ปกติ (Good)', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { key: 'REPAIR', label: 'ส่งซ่อม (Repair)', color: 'bg-orange-50 text-orange-600 border-orange-100' },
            { key: 'DAMAGED', label: 'ชำรุด (Damaged)', color: 'bg-red-50 text-red-600 border-red-100' },
            { key: 'LOST', label: 'สูญหาย (Lost)', color: 'bg-gray-100 text-gray-500 border-gray-200' },
        ];
    }, [masterOptions]);

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

    // Click Outside for Group Dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (groupInputRef.current && !groupInputRef.current.contains(event.target as Node)) {
                setShowGroupDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [groupInputRef]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setItemType(initialData.itemType || 'FIXED');
                setName(initialData.name);
                setDescription(initialData.description || '');
                setGroup(initialData.assetGroup || ''); 
                setCategoryId(initialData.categoryId); 
                setGroupLabel(initialData.groupLabel || ''); 
                setIsGroupingEnabled(!!initialData.groupLabel); // Auto-open if data exists
                
                // Fixed Fields
                setPrice(initialData.purchasePrice?.toString() || '');
                setBuyDate(initialData.purchaseDate ? format(initialData.purchaseDate, 'yyyy-MM-dd') : '');
                setSerial(initialData.serialNumber || '');
                setWarranty(initialData.warrantyExpire ? format(initialData.warrantyExpire, 'yyyy-MM-dd') : '');
                setCondition(initialData.condition || 'GOOD');
                setHolderId(initialData.currentHolderId || '');
                
                // Consumable Fields
                setQuantity(initialData.quantity || 1);
                setUnit(initialData.unit || 'ชิ้น');
                setMinThreshold(initialData.minThreshold || 5);
                setMaxCapacity(initialData.maxCapacity || 50);

                setPreviewUrl(initialData.imageUrl || '');
                setTags(initialData.tags || []);
                
                if (!initialData.assetGroup && initialData.categoryId) {
                     const cat = masterOptions.find(o => o.type === 'INV_CAT_L2' && o.key === initialData.categoryId);
                     if (cat && cat.parentKey) {
                         setGroup(cat.parentKey);
                     }
                }

            } else {
                // Reset
                setItemType('FIXED');
                setName(''); setDescription(''); 
                setGroup(''); 
                setCategoryId(''); 
                setGroupLabel('');
                setIsGroupingEnabled(false); // Reset to closed
                setPrice(''); setBuyDate(''); setSerial(''); setWarranty('');
                setCondition('GOOD'); setHolderId(''); setPreviewUrl('');
                setQuantity(1); setUnit('ชิ้น'); setMinThreshold(5); setMaxCapacity(50);
                setTags([]);
            }
            setCurrentTag('');
            setImageFile(null);
            setShowGroupDropdown(false);
        }
    }, [isOpen, initialData, masterOptions]); 

    // Handle Tag Suggestions
    useEffect(() => {
        if (currentTag.trim()) {
            const matches = existingTags.filter(t => 
                t.toLowerCase().includes(currentTag.toLowerCase()) && 
                !tags.includes(t)
            ).slice(0, 5); 
            setTagSuggestions(matches);
            setIsTagDropdownOpen(matches.length > 0);
        } else {
            setIsTagDropdownOpen(false);
        }
    }, [currentTag, existingTags, tags]);
    
    // Filtered Groups for Autocomplete
    const filteredGroups = useMemo(() => {
        if (!groupLabel) return existingGroups;
        return existingGroups.filter(g => g.toLowerCase().includes(groupLabel.toLowerCase()));
    }, [groupLabel, existingGroups]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const addTag = (val: string) => {
        const trimmed = val.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setCurrentTag('');
            setIsTagDropdownOpen(false);
            tagInputRef.current?.focus();
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(currentTag);
        }
    };
    
    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation with Global Alert
        if (!name || !categoryId || !group) {
            await showAlert('กรุณากรอกชื่อ, กลุ่ม และหมวดหมู่ให้ครบถ้วน', 'ข้อมูลไม่ครบ');
            return;
        }

        setIsSubmitting(true);
        const payload: Partial<InventoryItem> = {
            id: initialData?.id,
            itemType,
            name,
            description,
            categoryId,
            assetGroup: group as AssetGroup,
            groupLabel: groupLabel || undefined, // Save new field
            imageUrl: previewUrl, 
            tags,
            // Conditional Fields
            ...(itemType === 'FIXED' ? {
                purchasePrice: parseFloat(price) || 0,
                purchaseDate: buyDate ? new Date(buyDate) : undefined,
                serialNumber: serial,
                warrantyExpire: warranty ? new Date(warranty) : undefined,
                condition,
                currentHolderId: holderId || undefined,
            } : {
                quantity,
                unit,
                minThreshold,
                maxCapacity
            })
        };
        const success = await onSave(payload, imageFile || undefined);
        setIsSubmitting(false);
        if (success) onClose();
    };

    const handleDeleteClick = async () => {
        if (initialData && onDelete) {
            const confirmed = await showConfirm(
                'คุณต้องการลบรายการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
                'ยืนยันการลบ'
            );
            if (confirmed) {
                onDelete(initialData.id);
            }
        }
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
                
                {/* Header */}
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
                                {initialData ? 'แก้ไขข้อมูล' : 'ลงทะเบียนของใหม่'}
                            </h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 p-3 bg-white/50 hover:bg-white rounded-full text-slate-500 hover:text-red-500 transition-all shadow-sm"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-indigo-100">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* LEFT COLUMN: Image & Type */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                             
                             {/* Type Switcher (CONDITIONAL) */}
                             {!initialData ? (
                                 <div className="bg-gray-100 p-1 rounded-2xl flex">
                                    <button
                                        type="button"
                                        onClick={() => setItemType('FIXED')}
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${itemType === 'FIXED' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Monitor className="w-4 h-4" /> ทรัพย์สินถาวร
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setItemType('CONSUMABLE')}
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${itemType === 'CONSUMABLE' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Package className="w-4 h-4" /> วัสดุสิ้นเปลือง
                                    </button>
                                 </div>
                             ) : (
                                 // Edit Mode: Static Badge
                                 <div className={`p-4 rounded-2xl border flex items-center justify-center gap-3 ${itemType === 'FIXED' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                                     {itemType === 'FIXED' ? <Monitor className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                                     <div>
                                         <p className="text-[10px] font-bold uppercase opacity-60">ITEM TYPE</p>
                                         <p className="font-black text-sm">
                                             {itemType === 'FIXED' ? 'ทรัพย์สินถาวร (Fixed)' : 'วัสดุสิ้นเปลือง (Supplies)'}
                                         </p>
                                     </div>
                                 </div>
                             )}

                            {/* Image Uploader */}
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
                                </div>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2">ชื่อรายการ <span className="text-red-400">*</span></label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 bg-white border-none rounded-2xl shadow-sm text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" placeholder={itemType === 'FIXED' ? "เช่น กล้อง Sony A7IV" : "เช่น ทิชชู่, ถ่าน AA"} required />
                            </div>
                            
                            {/* Group Label Input (Toggle & Reveal UI) */}
                            <div className="relative" ref={groupInputRef}>
                                {!isGroupingEnabled ? (
                                    <button 
                                        type="button" 
                                        onClick={() => { setIsGroupingEnabled(true); setTimeout(() => groupInputRef.current?.querySelector('input')?.focus(), 100); }}
                                        className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 ml-2 py-2 transition-all hover:translate-x-1"
                                    >
                                        <Plus className="w-4 h-4" /> จัดกลุ่ม/รวมกอง (Add to Stack)
                                    </button>
                                ) : (
                                    <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                                <Layers className="w-3 h-3" /> ชื่อกลุ่ม/รุ่น (Grouping)
                                            </label>
                                            <button 
                                                type="button" 
                                                onClick={() => { setIsGroupingEnabled(false); setGroupLabel(''); }}
                                                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors"
                                                title="ยกเลิกการรวมกลุ่ม"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={groupLabel} 
                                                onChange={e => {
                                                    setGroupLabel(e.target.value);
                                                    setShowGroupDropdown(true);
                                                }} 
                                                onFocus={() => setShowGroupDropdown(true)}
                                                className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl shadow-sm text-sm font-bold text-indigo-900 placeholder:text-indigo-200 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                                                placeholder="ตั้งชื่อกลุ่ม (เช่น โต๊ะทำงาน A)" 
                                            />
                                            {showGroupDropdown && filteredGroups.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-1 animate-in fade-in zoom-in-95 max-h-[200px] overflow-y-auto">
                                                    <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider bg-gray-50/50">เลือกที่มีอยู่หรือพิมพ์ใหม่</div>
                                                    {filteredGroups.map(g => (
                                                        <button
                                                            key={g}
                                                            type="button"
                                                            onClick={() => {
                                                                setGroupLabel(g);
                                                                setShowGroupDropdown(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors flex items-center justify-between group"
                                                        >
                                                            {g}
                                                            <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-500" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-indigo-400 mt-2 ml-1 flex items-center gap-1 font-medium">
                                            <Info className="w-3 h-3" /> ใส่ชื่อเดียวกันเพื่อรวมการ์ดหน้าแรก (Stack)
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2">รายละเอียด</label>
                                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-5 py-4 bg-white border-none rounded-2xl shadow-sm text-sm font-medium text-slate-600 focus:ring-4 focus:ring-indigo-100 outline-none resize-none" placeholder="รายละเอียดเพิ่มเติม..." />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Conditional Fields */}
                        <div className="lg:col-span-8 space-y-8">
                            
                            {/* 1. Categorization */}
                            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-visible">
                                <h4 className="text-sm font-black text-indigo-900 mb-6 flex items-center">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600"><Layers className="w-4 h-4"/></span>
                                    หมวดหมู่ & แท็ก
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">กลุ่ม (Group) <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <select value={group} onChange={e => { setGroup(e.target.value); setCategoryId(''); }} className="w-full px-4 py-3.5 rounded-xl text-sm font-bold border-2 cursor-pointer outline-none bg-slate-50 border-slate-100 focus:bg-indigo-50/30 focus:border-indigo-300" required>
                                                <option value="" disabled>-- เลือกกลุ่ม --</option>
                                                {groupOptions.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">ชนิด (Category) <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-4 py-3.5 rounded-xl text-sm font-bold border-2 cursor-pointer outline-none bg-slate-50 border-slate-100 focus:bg-indigo-50/30 focus:border-indigo-300" required disabled={!group}>
                                                <option value="">-- เลือกชนิด --</option>
                                                {categoryOptions.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="col-span-1 md:col-span-2 space-y-2 relative">
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 flex items-center">
                                            <Hash className="w-3 h-3 mr-1"/> Tags
                                        </label>
                                        <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all min-h-[50px]">
                                            {tags.map(tag => (
                                                <span key={tag} className="flex items-center text-xs font-bold text-indigo-700 bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">
                                                    #{tag} <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-indigo-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                                                </span>
                                            ))}
                                            <input ref={tagInputRef} type="text" className="flex-1 bg-transparent text-sm font-medium text-gray-700 outline-none px-2" placeholder={tags.length === 0 ? "พิมพ์แท็ก..." : ""} value={currentTag} onChange={e => setCurrentTag(e.target.value)} onKeyDown={handleTagKeyDown} />
                                        </div>
                                        
                                        {/* Suggestions Dropdown */}
                                        {isTagDropdownOpen && tagSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-1 animate-in fade-in zoom-in-95 max-h-[200px] overflow-y-auto">
                                                <div className="text-[10px] font-bold text-gray-400 px-2 py-1">SUGGESTIONS</div>
                                                {tagSuggestions.map(tag => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => addTag(tag)}
                                                        className="w-full text-left px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <Hash className="w-3 h-3 opacity-50" /> {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* CONDITIONAL RENDER BASED ON TYPE */}
                            {itemType === 'FIXED' ? (
                                <>
                                    {/* 2. Specs & Financial (Fixed Asset) */}
                                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                                        <h4 className="text-sm font-black text-emerald-900 mb-6 flex items-center relative z-10">
                                            <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3 text-emerald-600"><Tag className="w-4 h-4"/></span>
                                            ข้อมูลจำเพาะ (Fixed Asset Info)
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                                            <div className="col-span-2 md:col-span-1 space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase">ราคาซื้อ</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border-transparent focus:bg-white border-2 focus:border-emerald-200 rounded-xl text-sm font-bold text-emerald-700 outline-none" placeholder="0.00" /></div>
                                            <div className="col-span-2 md:col-span-1 space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase">วันที่ซื้อ</label><input type="date" value={buyDate} onChange={e => setBuyDate(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border-transparent focus:bg-white border-2 focus:border-emerald-200 rounded-xl text-xs font-bold text-slate-600 outline-none" /></div>
                                            <div className="col-span-2 md:col-span-1 space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase">S/N</label><input type="text" value={serial} onChange={e => setSerial(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border-transparent focus:bg-white border-2 focus:border-emerald-200 rounded-xl text-xs font-mono font-bold text-slate-600 outline-none" placeholder="Serial No." /></div>
                                            <div className="col-span-2 md:col-span-1 space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase">หมดประกัน</label><input type="date" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border-transparent focus:bg-white border-2 focus:border-emerald-200 rounded-xl text-xs font-bold text-slate-600 outline-none" /></div>
                                        </div>
                                    </div>
                                    {/* 3. Status & Holder */}
                                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">สภาพปัจจุบัน (Condition)</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {conditionOptions.map(c => (
                                                        <button 
                                                            key={c.key} 
                                                            type="button" 
                                                            onClick={() => setCondition(c.key as AssetCondition)} 
                                                            className={`
                                                                px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5
                                                                ${condition === c.key 
                                                                    ? `bg-white border-current shadow-md scale-105 ${c.color.split(' ')[1]} ${c.color.split(' ')[2]}` // Use text- and border- from config
                                                                    : 'bg-transparent border-transparent text-slate-400 hover:bg-white hover:shadow-sm'
                                                                }
                                                            `}
                                                        >
                                                            {c.key === 'GOOD' && <CheckCircle2 className="w-3.5 h-3.5"/>}
                                                            {c.key === 'DAMAGED' && <AlertTriangle className="w-3.5 h-3.5"/>}
                                                            {c.label.split('(')[0]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">ผู้ถือครอง</label>
                                                <div className="relative">
                                                    <select value={holderId} onChange={e => setHolderId(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 appearance-none cursor-pointer">
                                                        <option value="">-- ส่วนกลาง / ไม่มีผู้ถือ --</option>
                                                        {users.filter(u => u.isActive).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* 2. Supplies Info (Consumable) */}
                                    <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-100 shadow-sm relative overflow-hidden">
                                         <h4 className="text-sm font-black text-orange-900 mb-6 flex items-center relative z-10">
                                            <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center mr-3 text-orange-600"><Package className="w-4 h-4"/></span>
                                            ข้อมูลสต็อค (Stock Details)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-6 relative z-10">
                                             <div className="space-y-2">
                                                 <label className="text-[10px] font-bold text-orange-400 uppercase">จำนวนคงเหลือ</label>
                                                 <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full px-4 py-3 bg-white border-2 border-orange-100 rounded-xl text-xl font-black text-orange-600 outline-none focus:border-orange-300 text-center" />
                                             </div>
                                             <div className="space-y-2">
                                                 <label className="text-[10px] font-bold text-orange-400 uppercase">หน่วยนับ</label>
                                                 <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-orange-100 rounded-xl text-sm font-bold text-gray-600 outline-none focus:border-orange-300 text-center" placeholder="ชิ้น, อัน, แพ็ค" />
                                             </div>
                                             <div className="space-y-2">
                                                 <label className="text-[10px] font-bold text-orange-400 uppercase">เตือนเมื่อต่ำกว่า (Min)</label>
                                                 <input type="number" value={minThreshold} onChange={e => setMinThreshold(parseInt(e.target.value))} className="w-full px-4 py-3 bg-white border-2 border-orange-100 rounded-xl text-sm font-bold text-red-500 outline-none focus:border-orange-300 text-center" />
                                             </div>
                                             <div className="space-y-2">
                                                 <label className="text-[10px] font-bold text-orange-400 uppercase">จุได้สูงสุด (Max)</label>
                                                 <input type="number" value={maxCapacity} onChange={e => setMaxCapacity(parseInt(e.target.value))} className="w-full px-4 py-3 bg-white border-2 border-orange-100 rounded-xl text-sm font-bold text-green-600 outline-none focus:border-orange-300 text-center" />
                                             </div>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                    </div>
                    
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </form>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-slate-100 flex justify-between gap-3 shrink-0 relative z-20">
                    <div>
                         {initialData && onDelete && (
                             <button type="button" onClick={handleDeleteClick} className="px-5 py-3.5 rounded-2xl text-red-500 font-bold bg-white border-2 border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors text-sm flex items-center gap-2"><Trash2 className="w-4 h-4" /> ลบรายการ</button>
                         )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-8 py-3.5 rounded-2xl text-slate-500 font-bold bg-slate-50 hover:bg-slate-100 transition-colors text-sm">ยกเลิก</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="px-10 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />} บันทึกข้อมูล
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AssetFormModal;
