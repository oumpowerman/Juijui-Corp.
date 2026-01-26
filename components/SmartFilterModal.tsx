
import React, { useState } from 'react';
import { Settings, Plus, Trash2, X, Filter, Palette, Check, Save, Edit3, MonitorPlay, CheckSquare, Ban, CheckCircle2 } from 'lucide-react';
import { ChipConfig, FilterType, Channel, MasterOption } from '../types';
import { COLOR_THEMES } from '../constants';

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
            alert('กรุณาเลือกค่าที่ต้องการกรองด้วยครับ');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] border border-gray-100 animate-modal-pop">
                
                {/* Left: List */}
                <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
                    <div className="p-5 border-b border-gray-200 bg-white">
                        <h3 className="font-bold text-gray-800 flex items-center">
                            <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                            ตัวกรองอัจฉริยะ
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">ออกแบบปุ่มกรองงานได้เอง</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        <button 
                            onClick={initNewChip}
                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center text-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" /> เพิ่มปุ่มใหม่
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
                                    className={`
                                        p-3 rounded-xl cursor-pointer border transition-all flex justify-between items-center group
                                        ${isEditingThis ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'bg-white border-gray-200 hover:border-indigo-300'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${isExclude ? 'bg-red-100' : theme.activeBg}`}>
                                            {isExclude && <X className="w-2 h-2 text-red-600" />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold flex items-center gap-1 ${isExclude ? 'text-red-600 line-through' : 'text-gray-700'}`}>
                                                {chip.label}
                                                <span className={`text-[9px] px-1.5 rounded-full border no-underline ${scope === 'CONTENT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                    {scope}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-gray-400 no-underline">{chip.type} : {chip.value}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete(chip.id); }}
                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right: Editor */}
                <div className="flex-1 bg-white p-6 md:p-8 overflow-y-auto relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    {editingChip ? (
                        <div className="max-w-md mx-auto h-full flex flex-col justify-center animate-fade-in">
                            <div className="text-center mb-8">
                                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transition-colors ${editingChip.mode === 'EXCLUDE' ? 'bg-red-500' : (COLOR_THEMES.find(t => t.id === editingChip.colorTheme)?.activeBg || 'bg-gray-200')}`}>
                                    {editingChip.mode === 'EXCLUDE' ? <Ban className="w-8 h-8 text-white" /> : <Filter className="w-8 h-8 text-white" />}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {chips.find(c => c.id === editingChip.id) ? 'แก้ไขปุ่มกรอง' : 'สร้างปุ่มกรองใหม่'}
                                </h3>
                            </div>

                            <form onSubmit={handleSaveSubmit} className="space-y-5">
                                {/* Mode Selector */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">1. โหมดการกรอง (Mode)</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingChip({...editingChip, mode: 'INCLUDE'})}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${editingChip.mode === 'INCLUDE' || !editingChip.mode ? 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-200' : 'bg-white border-gray-200 text-gray-500 opacity-60'}`}
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> แสดงเฉพาะ (Include)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingChip({...editingChip, mode: 'EXCLUDE'})}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${editingChip.mode === 'EXCLUDE' ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200' : 'bg-white border-gray-200 text-gray-500 opacity-60'}`}
                                        >
                                            <Ban className="w-4 h-4" /> ไม่แสดง (Exclude)
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                                        {editingChip.mode === 'EXCLUDE' 
                                            ? '* เลือกโหมดนี้เพื่อ "ซ่อน" งานที่ไม่ต้องการออกจากปฏิทิน' 
                                            : '* เลือกโหมดนี้เพื่อ "แสดงเฉพาะ" งานที่ตรงเงื่อนไข'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">2. ชื่อปุ่ม (Label)</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all"
                                        placeholder={editingChip.mode === 'EXCLUDE' ? "เช่น ไม่เอางานเสร็จ, ซ่อน Vlog..." : "เช่น งานด่วน, Youtube Only..."}
                                        value={editingChip.label}
                                        onChange={e => setEditingChip({...editingChip, label: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">3. กรองโดย (Filter By)</label>
                                        <select 
                                            className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm cursor-pointer"
                                            value={editingChip.type}
                                            onChange={e => setEditingChip({...editingChip, type: e.target.value as FilterType, value: ''})}
                                        >
                                            <option value="STATUS">Status (สถานะ)</option>
                                            <option value="FORMAT">Format (รูปแบบ)</option>
                                            <option value="CHANNEL">Channel (ช่อง)</option>
                                            <option value="PILLAR">Pillar (แกนเนื้อหา)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">4. ค่าที่ต้องการ (Value)</label>
                                        <select 
                                            className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm cursor-pointer"
                                            value={editingChip.value}
                                            onChange={e => setEditingChip({...editingChip, value: e.target.value})}
                                            required
                                        >
                                            <option value="" disabled>-- เลือกค่า --</option>
                                            
                                            {editingChip.type === 'CHANNEL' && channels.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                            
                                            {editingChip.type === 'FORMAT' && (
                                                formatOptions.length > 0 
                                                ? formatOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>) 
                                                : <option disabled>ไม่มีข้อมูล Master Data</option>
                                            )}
                                            
                                            {editingChip.type === 'STATUS' && (
                                                statusOptions.length > 0 
                                                ? statusOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                                                : <option disabled>ไม่มีข้อมูล Master Data</option>
                                            )}
                                            
                                            {editingChip.type === 'PILLAR' && (
                                                pillarOptions.length > 0
                                                ? pillarOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                                                : <option disabled>ไม่มีข้อมูล Master Data</option>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* Extra Settings: Scope & Color */}
                                <div className="grid grid-cols-2 gap-4 items-start">
                                     {/* Scope Selection */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">5. Scope</label>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditingChip({...editingChip, scope: 'CONTENT'})}
                                                className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all ${editingChip.scope === 'CONTENT' || !editingChip.scope ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-1 ring-indigo-200' : 'bg-white border-gray-200 text-gray-500'}`}
                                            >
                                                <MonitorPlay className="w-3 h-3" /> Content
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingChip({...editingChip, scope: 'TASK'})}
                                                className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all ${editingChip.scope === 'TASK' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 ring-1 ring-emerald-200' : 'bg-white border-gray-200 text-gray-500'}`}
                                            >
                                                <CheckSquare className="w-3 h-3" /> Task
                                            </button>
                                        </div>
                                    </div>

                                    {/* Color Theme (Disable if Exclude) */}
                                    <div className={editingChip.mode === 'EXCLUDE' ? 'opacity-40 pointer-events-none grayscale' : ''}>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center"><Palette className="w-4 h-4 mr-2"/> 6. Theme</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLOR_THEMES.map(theme => (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    onClick={() => setEditingChip({...editingChip, colorTheme: theme.id})}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${theme.bg} ${editingChip.colorTheme === theme.id ? `ring-2 ring-offset-2 ${theme.ring} border-transparent scale-110` : 'border-transparent hover:scale-105'}`}
                                                >
                                                    {editingChip.colorTheme === theme.id && <Check className={`w-4 h-4 mx-auto ${theme.text}`} />}
                                                </button>
                                            ))}
                                        </div>
                                        {editingChip.mode === 'EXCLUDE' && <p className="text-[9px] text-red-500 mt-1">* สีถูกล็อคสำหรับโหมดซ่อน</p>}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setEditingChip(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">ยกเลิก</button>
                                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center">
                                        <Save className="w-4 h-4 mr-2" /> บันทึก
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Edit3 className="w-8 h-8 opacity-20" />
                            </div>
                            <p>เลือกรายการทางซ้ายเพื่อแก้ไข</p>
                            <p className="text-sm">หรือกดปุ่ม "เพิ่มปุ่มใหม่"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartFilterModal;
