
import React, { useState } from 'react';
import { X, Building2, User, Mail, Phone, Image as ImageIcon, Check } from 'lucide-react';
import { Client } from '../../../types/task';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (clientData: Partial<Client>) => Promise<void>;
    initialName?: string;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, initialName = '' }) => {
    const [name, setName] = useState(initialName);
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            await onSave({
                name,
                contactPerson: contact,
                email,
                phone,
                logoUrl
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 overflow-hidden"
                >
                    <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-indigo-50 to-white border-b border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">เพิ่มข้อมูลลูกค้า</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Master Client Information</p>
                    </div>

                    <div className="p-8 space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-3 h-3" /> ชื่อบริษัท/แบรนด์ *
                            </label>
                            <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none"
                                placeholder="ระบุชื่อบริษัท..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3 h-3" /> ผู้ติดต่อ
                                </label>
                                <input 
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="ชื่อผู้ติดต่อ..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Phone className="w-3 h-3" /> เบอร์โทร
                                </label>
                                <input 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="08X-XXX-XXXX"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3 h-3" /> อีเมล
                            </label>
                            <input 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="client@company.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Logo URL
                            </label>
                            <input 
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            disabled={isSaving || !name.trim()}
                            onClick={handleSave}
                            className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                                isSaving || !name.trim() 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 text-white shadow-indigo-200 hover:-translate-y-0.5 hover:shadow-indigo-300 active:scale-95'
                            }`}
                        >
                            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                            บันทึกข้อมูล
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ClientModal;
