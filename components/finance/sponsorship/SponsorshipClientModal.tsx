import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, User, Mail, Phone, Image as ImageIcon, Check, Trash2, AlertTriangle, Globe } from 'lucide-react';
import { Client } from '../../../types/task';
import { motion, AnimatePresence } from 'framer-motion';

interface SponsorshipClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (clientData: Partial<Client>) => Promise<void>;
    onDelete?: (clientId: string) => Promise<void>;
    initialClient?: Client | null;
}

const SponsorshipClientModal: React.FC<SponsorshipClientModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialClient = null
}) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (initialClient) {
            setName(initialClient.name || '');
            setContact(initialClient.contactPerson || '');
            setEmail(initialClient.email || '');
            setPhone(initialClient.phone || '');
            setLogoUrl(initialClient.logoUrl || '');
        } else {
            setName('');
            setContact('');
            setEmail('');
            setPhone('');
            setLogoUrl('');
        }
        setShowDeleteConfirm(false);
    }, [initialClient, isOpen]);

    // Handle ESC key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isSaving && !isDeleting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSaving, isDeleting, onClose]);

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            await onSave({
                id: initialClient?.id,
                name: name.trim(),
                contactPerson: contact.trim() || undefined,
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                logoUrl: logoUrl.trim() || undefined
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!initialClient?.id || !onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(initialClient.id);
            onClose();
        } finally {
            setIsDeleting(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto">
                    {/* Backdrop Overlay */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                            if (!isSaving && !isDeleting) onClose();
                        }}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" 
                    />

                    {/* Modal Content Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 16 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-slate-200/90 overflow-hidden z-10 my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-5 py-4 sm:px-7 sm:py-6 bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white border-b border-amber-100/60 shrink-0">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                                            {initialClient ? 'แก้ไขข้อมูลสปอนเซอร์ / ลูกค้า' : 'เพิ่มสปอนเซอร์ / ลูกค้าใหม่'}
                                        </h2>
                                        <p className="text-[11px] text-amber-700/80 font-bold uppercase tracking-wider mt-0.5">
                                            {initialClient ? `Client ID: ${initialClient.id.slice(0, 8)}...` : 'Sponsorship & Client Partner'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={onClose}
                                    disabled={isSaving || isDeleting}
                                    className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                                    title="ปิดหน้าต่าง (Esc)"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="p-5 sm:p-7 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            {/* Logo & Brand Preview Badge */}
                            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                    {logoUrl ? (
                                        <img 
                                            src={logoUrl} 
                                            alt="Logo Preview" 
                                            className="w-full h-full object-contain p-1"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <Building2 className="w-6 h-6 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                        {name || 'ชื่อแบรนด์หรือลูกค้า'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1 mt-0.5">
                                        <User className="w-3 h-3 text-slate-300 shrink-0" />
                                        {contact || 'ยังไม่ได้ระบุผู้ติดต่อ'}
                                    </p>
                                </div>
                            </div>

                            {/* Client Name Input */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-amber-500" /> ชื่อบริษัท / แบรนด์สปอนเซอร์ <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 transition-all"
                                    placeholder="เช่น Garena, Shopee, Samsung..."
                                    autoFocus
                                />
                            </div>

                            {/* Contact Person & Phone (Responsive 1 or 2 cols) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-slate-400" /> ผู้ติดต่อ (Contact Person)
                                    </label>
                                    <input 
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 transition-all"
                                        placeholder="ชื่อผู้ประสานงาน..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" /> เบอร์โทรศัพท์
                                    </label>
                                    <input 
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 transition-all"
                                        placeholder="08X-XXX-XXXX"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" /> อีเมล
                                </label>
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 transition-all"
                                    placeholder="marketing@brand.com"
                                />
                            </div>

                            {/* Logo Image URL */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> ลิงก์โลโก้แบรนด์ (Logo URL)
                                </label>
                                <input 
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 transition-all"
                                    placeholder="https://domain.com/logo.png"
                                />
                            </div>

                            {/* Delete Confirmation Warning Box */}
                            <AnimatePresence>
                                {showDeleteConfirm && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                        className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs space-y-2.5 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 text-red-700 font-bold">
                                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                            ยืนยันการลบลูกค้ารายนี้?
                                        </div>
                                        <p className="text-[11px] text-red-600 leading-relaxed">
                                            ระบบจะซ่อนลูกค้าออกจากตัวเลือก Dropdown แต่ข้อมูลสถิติหรือดีลคอนเทนต์เดิมจะไม่สูญหาย
                                        </p>
                                        <div className="flex gap-2 justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isDeleting}
                                                onClick={handleDelete}
                                                className="px-3.5 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 shadow-sm shadow-red-500/20 cursor-pointer transition-colors"
                                            >
                                                {isDeleting ? (
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                )}
                                                ลบลูกค้าทันที
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="px-5 py-4 sm:px-7 sm:py-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <div>
                                {initialClient?.id && onDelete && !showDeleteConfirm && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>ลบลูกค้า</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                <button 
                                    type="button" 
                                    onClick={onClose}
                                    disabled={isSaving || isDeleting}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <motion.button 
                                    whileTap={{ scale: 0.96 }}
                                    type="button"
                                    disabled={isSaving || !name.trim()}
                                    onClick={handleSave}
                                    className={`px-5 sm:px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                                        isSaving || !name.trim() 
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                            : 'bg-amber-500 text-white shadow-amber-500/25 hover:bg-amber-600'
                                    }`}
                                >
                                    {isSaving ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                    )}
                                    <span>{initialClient ? 'บันทึกการแก้ไข' : 'เพิ่มลูกค้า'}</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SponsorshipClientModal;

