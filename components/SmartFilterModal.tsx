
import React, { useState, useRef, useEffect } from 'react';
import { Settings, Plus, Trash2, X, Filter, Palette, Check, Save, Edit3, MonitorPlay, CheckSquare, Ban, CheckCircle2, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChipConfig, FilterType, Channel, MasterOption } from '../types';
import { COLOR_THEMES } from '../constants';
import { useGlobalDialog } from '../context/GlobalDialogContext';

interface SmartFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    chips: ChipConfig[];
    channels: Channel[];
    masterOptions?: MasterOption[];
    onSave: (chip: ChipConfig) => void;
    onDelete: (id: string) => void;
}

const SmartFilterModal: React.FC<SmartFilterModalProps> = ({ 
    isOpen, onClose, chips, channels, masterOptions = [], onSave, onDelete 
}) => {
    const [editingChip, setEditingChip] = useState<ChipConfig | null>(null);
    const { showAlert, showConfirm } = useGlobalDialog();

    const handleDelete = async (id: string, label: string) => {
        const confirmed = await showConfirm(
            `คุณแน่ใจหรือไม่ว่าต้องการลบปุ่ม "${label || 'ไม่มีชื่อ'}"?`,
            'ยืนยันการลบ'
        );
        if (confirmed) {
            onDelete(id);
            if (editingChip?.id === id) {
                setEditingChip(null);
            }
        }
    };

    // --- Custom Select Component ---
    const CustomSelect: React.FC<{
        value: string;
        options: { value: string; label: string; logo?: string }[];
        onChange: (val: string) => void;
        placeholder: string;
        showLogo?: boolean;
    }> = ({ value, options, onChange, placeholder, showLogo }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [search, setSearch] = useState('');
        const containerRef = useRef<HTMLDivElement>(null);
        const selectedOption = options.find(o => o.value === value);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const filteredOptions = options.filter(o => 
            o.label.toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="relative" ref={containerRef}>
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full px-5 py-4 bg-white/80 border-2 rounded-2xl transition-all duration-300 font-bold text-slate-700 cursor-pointer shadow-sm flex items-center justify-between group ${isOpen ? 'border-indigo-400 ring-4 ring-indigo-500/10' : 'border-slate-100 hover:border-indigo-200'}`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        {showLogo && selectedOption && (
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-100 bg-white flex-shrink-0">
                                {selectedOption.logo ? (
                                    <img src={selectedOption.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                                        {selectedOption.label.substring(0, 1)}
                                    </div>
                                )}
                            </div>
                        )}
                        <span className={`truncate ${!selectedOption ? 'text-slate-300' : ''}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-indigo-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : 'group-hover:text-indigo-400'}`} />
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 5, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-[70] left-0 right-0 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"
                        >
                            {options.length > 8 && (
                                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                    <Search className="w-4 h-4 text-slate-400" />
                                    <input 
                                        autoFocus
                                        type="text"
                                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-600 w-full placeholder:text-slate-300"
                                        placeholder="ค้นหา..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                            )}
                            <div className="max-h-[250px] overflow-y-auto p-2 scrollbar-thin">
                                {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                                    <div 
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${value === opt.value ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        {showLogo && (
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 bg-white flex-shrink-0 shadow-sm">
                                                {opt.logo ? (
                                                    <img src={opt.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                        {opt.label.substring(0, 1)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <span className="font-bold text-sm">{opt.label}</span>
                                        {value === opt.value && <Check className="w-4 h-4 ml-auto" />}
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-400 text-xs font-bold">ไม่พบข้อมูล</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    // Derive Options from Master Data
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive);
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive);
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive);

    const initNewChip = () => {
        setEditingChip({
            id: `chip_${Date.now()}`,
            label: '',
            type: 'FORMAT',
            value: '',
            colorTheme: 'indigo',
            scope: 'CONTENT',
            mode: 'INCLUDE'
        });
    };

    const handleSaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(editingChip && editingChip.value) {
            onSave(editingChip);
            setEditingChip(null);
        } else {
            showAlert('กรุณาเลือกค่าที่ต้องการกรองด้วยครับ', 'ข้อมูลไม่ครบ');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white/90 backdrop-blur-2xl w-full max-w-4xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col md:flex-row max-h-[650px] border border-white/50 animate-modal-pop relative">
                
                {/* Decorative Glows */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

                {/* Left: List */}
                <div className="w-full md:w-1/3 bg-slate-50/30 backdrop-blur-sm border-r border-slate-200/30 flex flex-col relative z-10">
                    <div className="p-6 border-b border-slate-200/30 bg-white/30">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                            <div className="p-2 bg-indigo-400 rounded-xl shadow-lg shadow-indigo-100 animate-float">
                                <Settings className="w-5 h-5 text-white" />
                            </div>
                            ตัวกรองอัจฉริยะ
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium italic">ออกแบบปุ่มกรองงานได้เอง</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                        <button 
                            onClick={initNewChip}
                            className="w-full py-4 border-2 border-dashed border-slate-200/60 rounded-2xl text-slate-400 hover:text-indigo-400 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300 flex items-center justify-center gap-2 font-bold group active:scale-95"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> เพิ่มปุ่มใหม่
                        </button>

                        {chips.map(chip => {
                            const theme = COLOR_THEMES.find(t => t.id === chip.colorTheme) || COLOR_THEMES[0];
                            const isEditingThis = editingChip?.id === chip.id;
                            const scope = chip.scope || 'CONTENT';
                            const isExclude = chip.mode === 'EXCLUDE';
                            
                            return (
                                <div 
                                    key={chip.id}
                                    onClick={() => setEditingChip({...chip})}
                                    className={`group p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between relative overflow-hidden ${
                                        isEditingThis 
                                        ? `bg-white ${theme.ring} shadow-xl shadow-${theme.id}-50/50 translate-x-1` 
                                        : 'bg-white/40 border-transparent hover:border-slate-200/50 hover:bg-white/80 hover:shadow-md'
                                    }`}
                                >
                                    {isEditingThis && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.activeBg}`} />}
                                    
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full shadow-sm ${isExclude ? 'bg-rose-400 animate-pulse' : theme.bg}`} />
                                        <div>
                                            <p className={`font-bold text-sm ${isEditingThis ? 'text-slate-900' : 'text-slate-600'} flex items-center gap-1`}>
                                                {chip.label || 'ไม่มีชื่อ'}
                                                <span className={`text-[9px] px-1.5 rounded-full border no-underline font-black ${scope === 'CONTENT' ? 'bg-indigo-50 text-indigo-400 border-indigo-100' : 'bg-emerald-50 text-emerald-400 border-emerald-100'}`}>
                                                    {scope}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{chip.type} : {chip.value}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(chip.id, chip.label); }}
                                        className="p-2 text-slate-300 hover:text-rose-400 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right: Editor */}
                <div className="flex-1 bg-white/40 p-6 md:p-10 pt-8 md:pt-10 overflow-y-auto relative scrollbar-thin z-10">
                    <button onClick={onClose} className="absolute top-8 right-8 p-3 text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-md rounded-2xl transition-all duration-300 z-20 active:scale-90">
                        <X className="w-5 h-5" />
                    </button>

                    {editingChip ? (
                        <div className="max-w-md mx-auto flex flex-col animate-fade-in">
                            <div className="text-center mb-6">
                                <div className={`w-16 h-16 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl transition-all duration-500 transform hover:rotate-6 ${editingChip.mode === 'EXCLUDE' ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200' : (COLOR_THEMES.find(t => t.id === editingChip.colorTheme)?.activeBg || 'bg-indigo-500 shadow-indigo-200')} animate-float`}>
                                    {editingChip.mode === 'EXCLUDE' ? <Ban className="w-10 h-10 text-white" /> : <Filter className="w-10 h-10 text-white" />}
                                </div>
                                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                                    {chips.find(c => c.id === editingChip.id) ? 'แก้ไขปุ่มกรอง' : 'สร้างปุ่มกรองใหม่'}
                                </h3>
                                <div className="h-1 w-12 bg-indigo-500 mx-auto mt-3 rounded-full opacity-50" />
                            </div>

                            <form onSubmit={handleSaveSubmit} className="space-y-5">
                                {/* Mode Selector */}
                                <div className="bg-white/60 backdrop-blur-sm p-5 rounded-[2rem] border border-slate-200/50 shadow-sm">
                                    <label className="block text-xs font-kanit font-medium text-slate-400 uppercase tracking-widest mb-4">1. โหมดการกรอง (Mode)</label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setEditingChip({...editingChip, mode: 'INCLUDE'})}
                                            className={`flex-1 py-4 rounded-2xl text-sm font-black border-2 transition-all duration-300 flex items-center justify-center gap-2 ${editingChip.mode === 'INCLUDE' || !editingChip.mode ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-lg shadow-emerald-100 -translate-y-1' : 'bg-white border-slate-100 text-slate-400 opacity-60 hover:opacity-100'}`}
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> แสดงเฉพาะ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingChip({...editingChip, mode: 'EXCLUDE'})}
                                            className={`flex-1 py-4 rounded-2xl text-sm font-black border-2 transition-all duration-300 flex items-center justify-center gap-2 ${editingChip.mode === 'EXCLUDE' ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-lg shadow-rose-100 -translate-y-1' : 'bg-white border-slate-100 text-slate-400 opacity-60 hover:opacity-100'}`}
                                        >
                                            <Ban className="w-4 h-4" /> ไม่แสดง
                                        </button>
                                    </div>
                                </div>

                                {/* Label Input */}
                                <div className="relative group">
                                    <label className="block text-xs font-kanit font-medium text-slate-400 uppercase tracking-widest mb-2 ml-1">2. ชื่อปุ่ม (Label)</label>
                                    <input 
                                        type="text"
                                        className="w-full px-6 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all duration-300 font-bold text-slate-700 placeholder:text-slate-300 shadow-sm group-hover:shadow-md"
                                        placeholder="เช่น งานด่วน, Youtube Only..."
                                        value={editingChip.label}
                                        onChange={e => setEditingChip({...editingChip, label: e.target.value})}
                                        required
                                    />
                                </div>

                                {/* Filter Logic */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Select: Filter By */}
                                    <div className="relative">
                                        <label className="block text-xs font-kanit font-medium text-slate-400 uppercase tracking-widest mb-2 ml-1">3. กรองโดย</label>
                                        <CustomSelect 
                                            value={editingChip.type}
                                            options={[
                                                { value: 'STATUS', label: 'Status (สถานะ)' },
                                                { value: 'FORMAT', label: 'Format (รูปแบบ)' },
                                                { value: 'CHANNEL', label: 'Channel (ช่อง)' },
                                                { value: 'PILLAR', label: 'Pillar (แกนเนื้อหา)' },
                                            ]}
                                            onChange={(val) => setEditingChip({...editingChip, type: val as FilterType, value: ''})}
                                            placeholder="เลือกประเภท"
                                        />
                                    </div>

                                    {/* Select: Value */}
                                    <div className="relative">
                                        <label className="block text-xs font-kanit font-medium text-slate-400 uppercase tracking-widest mb-2 ml-1">4. ค่าที่ต้องการ</label>
                                        <CustomSelect 
                                            value={editingChip.value}
                                            options={
                                                editingChip.type === 'CHANNEL' 
                                                    ? channels.map(c => ({ value: c.id, label: c.name, logo: c.logoUrl }))
                                                    : editingChip.type === 'FORMAT' 
                                                        ? formatOptions.map(opt => ({ value: opt.key, label: opt.label }))
                                                        : editingChip.type === 'STATUS' 
                                                            ? statusOptions.map(opt => ({ value: opt.key, label: opt.label }))
                                                            : pillarOptions.map(opt => ({ value: opt.key, label: opt.label }))
                                            }
                                            onChange={(val) => setEditingChip({...editingChip, value: val})}
                                            placeholder="-- เลือกค่า --"
                                            showLogo={editingChip.type === 'CHANNEL'}
                                        />
                                    </div>
                                </div>

                                {/* Extra Settings: Scope & Color */}
                                <div className="grid grid-cols-2 gap-8 items-start">
                                    <div>
                                        <label className="block text-xs font-kanit font-medium text-slate-400 uppercase tracking-widest mb-3 ml-1">5. Scope</label>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditingChip({...editingChip, scope: 'CONTENT'})}
                                                className={`py-3 px-4 rounded-xl text-xs font-black border-2 flex items-center gap-3 transition-all duration-300 ${editingChip.scope === 'CONTENT' || !editingChip.scope ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-md -translate-y-0.5' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                            >
                                                <MonitorPlay className="w-4 h-4" /> Content
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingChip({...editingChip, scope: 'TASK'})}
                                                className={`py-3 px-4 rounded-xl text-xs font-black border-2 flex items-center gap-3 transition-all duration-300 ${editingChip.scope === 'TASK' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-md -translate-y-0.5' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                            >
                                                <CheckSquare className="w-4 h-4" /> Task
                                            </button>
                                        </div>
                                    </div>

                                    <div className={editingChip.mode === 'EXCLUDE' ? 'opacity-40 pointer-events-none grayscale' : ''}>
                                        <label className="block text-xs font-kanit font-medium text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center"><Palette className="w-4 h-4 mr-2"/> 6. Theme</label>
                                        <div className="flex flex-wrap gap-3">
                                            {COLOR_THEMES.map(theme => (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    onClick={() => setEditingChip({...editingChip, colorTheme: theme.id})}
                                                    className={`w-10 h-10 rounded-full border-4 transition-all duration-300 ${theme.bg} ${editingChip.colorTheme === theme.id ? `ring-4 ring-offset-2 ${theme.ring} border-white scale-110 shadow-lg` : 'border-transparent hover:scale-110'}`}
                                                >
                                                    {editingChip.colorTheme === theme.id && <Check className={`w-5 h-5 mx-auto ${theme.text}`} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 px-6 pb-6 flex gap-4">
                                    <button type="button" onClick={() => setEditingChip(null)} className="flex-1 py-4 text-slate-500 hover:text-slate-700 font-kanit font-bold hover:bg-slate-100 rounded-2xl transition-all duration-300 active:scale-95">ยกเลิก</button>
                                    <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white font-kanit font-bold rounded-2xl shadow-lg shadow-purple-300/60 hover:shadow-purple-400/70 hover:-translate-y-1 hover:scale-[1.02] hover:brightness-110 transition-all duration-300 active:scale-95 flex items-center justify-center group">
                                        <Save className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300 " /> บันทึกการตั้งค่า
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            <div className="w-24 h-24 bg-slate-50/50 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner animate-float">
                                <Edit3 className="w-10 h-10 opacity-20" />
                            </div>
                            <p className="font-black text-slate-400">เลือกรายการทางซ้ายเพื่อแก้ไข</p>
                            <p className="text-sm font-medium text-slate-300 mt-1">หรือกดปุ่ม "เพิ่มปุ่มใหม่" เพื่อเริ่มสร้าง</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartFilterModal;
