import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, AlertTriangle, Save, Loader2, Search, Check, ChevronDown, Sparkles } from 'lucide-react';
import { MergedQueueItem } from './types';
import { MasterOption } from '../../../../types';
import { useMasterData } from '../../../../hooks/useMasterData';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';

interface ShootPlanningModalProps {
    item: MergedQueueItem;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, type: 'CONTENT' | 'SCRIPT', data: Partial<MergedQueueItem>) => Promise<void>;
    masterOptions: MasterOption[];
}

const ShootPlanningModal: React.FC<ShootPlanningModalProps> = ({ item, isOpen, onClose, onSave, masterOptions }) => {
    const { addMasterOption } = useMasterData();
    const { showConfirm } = useGlobalDialog();

    const [location, setLocation] = useState(item.shootLocation || '');
    const [timeStart, setTimeStart] = useState(item.shootTimeStart || '');
    const [timeEnd, setTimeEnd] = useState(item.shootTimeEnd || '');
    const [notes, setNotes] = useState(item.shootNotes || '');
    const [isSaving, setIsSaving] = useState(false);

    // Autocomplete State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isCreatingLocation, setIsCreatingLocation] = useState(false);

    const locationOptions = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'SHOOT_LOCATION' && o.isActive)
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [masterOptions]);

    const filteredOptions = useMemo(() => {
        return locationOptions.filter(opt => 
            opt.label.toLowerCase().includes(location.toLowerCase())
        );
    }, [locationOptions, location]);

    const isExactMatch = useMemo(() => {
        return locationOptions.some(opt => 
            opt.label.toLowerCase() === location.trim().toLowerCase()
        );
    }, [locationOptions, location]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCreateNewLocation = async () => {
        const trimmedName = location.trim();
        if (!trimmedName || isCreatingLocation) return;

        setIsCreatingLocation(true);
        try {
            const confirmed = await showConfirm(
                `ต้องการเพิ่มสถานที่ใหม่ "${trimmedName}" เข้าสู่ระบบหรือไม่?`,
                '✨ สร้าง Location ใหม่'
            );

            if (!confirmed) return;

            const generatedKey = trimmedName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
            const newOption = {
                type: 'SHOOT_LOCATION',
                key: generatedKey.length > 2 ? generatedKey : `LOC_${Date.now()}`,
                label: trimmedName,
                color: 'bg-indigo-100 text-indigo-700',
                sortOrder: 99,
                isActive: true
            };

            const success = await addMasterOption(newOption);
            if (success) {
                setLocation(trimmedName);
                setIsDropdownOpen(false);
            }
        } catch (err) {
            console.error('Create location failed:', err);
        } finally {
            setIsCreatingLocation(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(item.id, item.type, {
                shootLocation: location,
                shootTimeStart: timeStart,
                shootTimeEnd: timeEnd,
                shootNotes: notes
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div className="flex-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border mb-3 inline-block ${item.type === 'CONTENT' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                    Shooting Plan
                                </span>
                                <h2 className="text-2xl font-black text-slate-800 leading-tight">
                                    {item.title}
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 pt-4 space-y-6 overflow-y-auto max-h-[60vh] min-h-[400px]">
                            {/* Location */}
                            <div ref={dropdownRef} className="space-y-2 relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <MapPin className="w-3 h-3" /> Location / Studio
                                </label>
                                
                                <div className="relative group/loc">
                                    <div className="relative z-10 rounded-2xl bg-slate-50 border border-slate-200 group-focus-within/loc:border-indigo-500 group-focus-within/loc:ring-4 group-focus-within/loc:ring-indigo-50 transition-all duration-300 flex items-center overflow-hidden">
                                        <input 
                                            type="text"
                                            value={location}
                                            onChange={(e) => {
                                                setLocation(e.target.value);
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            placeholder="เช่น Studio A, Office, หรือ Outdoor..."
                                            className="w-full pl-5 pr-10 py-4 bg-transparent outline-none font-medium text-slate-700"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            {isCreatingLocation ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                            ) : (
                                                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {isDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] max-h-60 overflow-hidden flex flex-col transition-all"
                                            >
                                                {filteredOptions.length > 0 ? (
                                                    <div className="overflow-y-auto p-2">
                                                        <div className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Search className="w-3 h-3" /> Results
                                                        </div>
                                                        {filteredOptions.map(opt => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => {
                                                                    setLocation(opt.label);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between group/opt transition-all ${location === opt.label ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                            >
                                                                <span>{opt.label}</span>
                                                                {location === opt.label && <Check className="w-4 h-4" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center text-slate-400 italic text-sm">
                                                        ไม่พบข้อมูลสถานที่
                                                    </div>
                                                )}

                                                {/* Create New */}
                                                {location.trim() !== '' && !isExactMatch && (
                                                    <button
                                                        onClick={handleCreateNewLocation}
                                                        disabled={isCreatingLocation}
                                                        className="w-full p-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                                                    >
                                                        <Sparkles className="w-4 h-4 text-amber-300" />
                                                        เพิ่มสถานที่: "{location}"
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Time Slot */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                        <Clock className="w-3 h-3" /> Start Time
                                    </label>
                                    <input 
                                        type="time"
                                        value={timeStart}
                                        onChange={(e) => setTimeStart(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                        <Clock className="w-3 h-3" /> End Time
                                    </label>
                                    <input 
                                        type="time"
                                        value={timeEnd}
                                        onChange={(e) => setTimeEnd(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Precautions / Notes */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1 text-amber-600">
                                    <AlertTriangle className="w-3 h-3" /> Precautions / Production Notes
                                </label>
                                <textarea 
                                    rows={4}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="ระบุสิ่งที่ต้องระวัง เช่น แสงเข้า, เสียงข้างบ้าน, พร็อพที่ต้องห้ามลืม..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-medium text-slate-700 resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-slate-100 flex gap-4">
                            <button 
                                onClick={onClose}
                                className="flex-1 py-4 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-[2] py-4 px-6 rounded-2xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                บันทึกแผนการถ่าย
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShootPlanningModal;
