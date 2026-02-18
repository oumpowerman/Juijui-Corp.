
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, X, Check, LayoutTemplate, Youtube, Facebook, Instagram, Video, Globe, Palette, Loader2, Image as ImageIcon, Camera } from 'lucide-react';
import { Channel, Platform, Task } from '../types';
import { PLATFORM_ICONS } from '../constants';
import MentorTip from './MentorTip';
import NotificationBellBtn from './NotificationBellBtn';

interface ChannelManagerProps {
  tasks: Task[];
  channels: Channel[];
  onAdd: (channel: Channel, file?: File) => Promise<boolean>;
  onEdit: (channel: Channel, file?: File) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onOpenSettings: () => void;
}

const BRAND_COLORS = [
  { id: 'red', class: 'bg-red-100 text-red-700 border-red-200 ring-red-500' },
  { id: 'orange', class: 'bg-orange-100 text-orange-700 border-orange-200 ring-orange-500' },
  { id: 'amber', class: 'bg-amber-100 text-amber-700 border-amber-200 ring-amber-500' },
  { id: 'green', class: 'bg-green-100 text-green-700 border-green-200 ring-green-500' },
  { id: 'teal', class: 'bg-teal-100 text-teal-700 border-teal-200 ring-teal-500' },
  { id: 'blue', class: 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-500' },
  { id: 'indigo', class: 'bg-indigo-100 text-indigo-700 border-indigo-200 ring-indigo-500' },
  { id: 'purple', class: 'bg-purple-100 text-purple-700 border-purple-200 ring-purple-500' },
  { id: 'pink', class: 'bg-pink-100 text-pink-700 border-pink-200 ring-pink-500' },
  { id: 'slate', class: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500' },
];

const PLATFORM_OPTIONS: { id: Platform, label: string, icon: any, color: string }[] = [
    { id: 'YOUTUBE', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
    { id: 'FACEBOOK', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { id: 'TIKTOK', label: 'TikTok', icon: Video, color: 'text-zinc-800' },
    { id: 'INSTAGRAM', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { id: 'OTHER', label: 'Other/Website', icon: Globe, color: 'text-gray-600' },
];

const ChannelManager: React.FC<ChannelManagerProps> = ({ tasks, channels, onAdd, onEdit, onDelete, onOpenSettings }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['YOUTUBE']);
  const [color, setColor] = useState(BRAND_COLORS[0].class);
  
  // Image State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) {
      const channelToEdit = channels.find(c => c.id === editingId);
      if (channelToEdit) {
        setName(channelToEdit.name);
        setDescription(channelToEdit.description || '');
        setSelectedPlatforms(channelToEdit.platforms || []);
        setColor(channelToEdit.color);
        setLogoPreview(channelToEdit.logoUrl || null);
        setLogoFile(null); // Reset file input
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [editingId, channels]);

  const clearFields = () => {
    setName('');
    setDescription('');
    setSelectedPlatforms(['YOUTUBE']);
    setColor(BRAND_COLORS[0].class);
    setLogoFile(null);
    setLogoPreview(null);
    setEditingId(null);
  };

  const closeForm = () => {
    clearFields();
    setIsFormOpen(false);
  };

  const togglePlatform = (p: Platform) => {
      setSelectedPlatforms(prev => 
          prev.includes(p) ? prev.filter(i => i !== p) : [...prev, p]
      );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setLogoFile(file);
          setLogoPreview(URL.createObjectURL(file));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
        alert("กรุณาตั้งชื่อรายการ/แบรนด์ด้วยครับ");
        return;
    }
    if (selectedPlatforms.length === 0) {
        alert("ต้องเลือกอย่างน้อย 1 ช่องทาง (Platform) นะครับ");
        return;
    }

    setIsSubmitting(true);

    try {
      const newId = editingId || crypto.randomUUID();
      
      const payload: Channel = {
          id: newId,
          name: name.trim(),
          description: description.trim(),
          color,
          platforms: selectedPlatforms,
          logoUrl: logoPreview || undefined // Pass current preview/url logic handled in hook
      };

      let success = false;
      if (editingId) {
        success = await onEdit(payload, logoFile || undefined);
      } else {
        success = await onAdd(payload, logoFile || undefined);
      }

      if (success) {
        closeForm();
      }
    } catch (err) {
      console.error("Error submitting:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <MentorTip variant="orange" messages={["อัปโหลด Logo ช่องได้แล้วนะ! จะช่วยให้ดูเป็นทางการขึ้นเยอะเลย", "คลิกที่การ์ดรายการเพื่อแก้ไขข้อมูลได้เลย"]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
             จัดการช่องรายการ (Brands & Shows)
          </h1>
          <p className="text-gray-500 mt-1">
             สร้าง "รายการ" หรือ "แบรนด์" ของคุณ แล้วระบุว่ารายการนี้ลงที่ไหนบ้าง
          </p>
        </div>
        <div className="flex items-center gap-3">
            {!isFormOpen && (
            <button 
                onClick={() => { 
                    clearFields(); 
                    setIsFormOpen(true); 
                }}
                className="flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
                <Plus className="w-5 h-5 mr-2" />
                สร้างรายการใหม่
            </button>
            )}
            
            {/* Notification Button */}
            <NotificationBellBtn 
                onClick={() => onOpenSettings()}
                className="hidden md:flex"
            />
        </div>
      </div>

      {/* Editor Form */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden animate-in slide-in-from-top-4 relative">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    {editingId ? <Edit2 className="w-5 h-5 mr-2 text-indigo-500" /> : <Plus className="w-5 h-5 mr-2 text-indigo-500" />}
                    {editingId ? 'แก้ไขข้อมูลรายการ' : 'เพิ่มรายการใหม่'}
                </h3>
                <button 
                    onClick={() => { if(!isSubmitting) closeForm(); }} 
                    className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Logo Uploader */}
                    <div className="flex flex-col items-center gap-3 shrink-0">
                        <label className="text-sm font-bold text-gray-700">Logo</label>
                        <div 
                            className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-indigo-400" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/png, image/jpeg, image/jpg"
                        />
                        {logoPreview && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(null); if(fileInputRef.current) fileInputRef.current.value=''; }} className="text-xs text-red-500 hover:underline">ลบรูป</button>
                        )}
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                1. ชื่อรายการ / แบรนด์ (Name) <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="เช่น Juijui Vlog, ข่าวเช้า, เกมมิ่ง..." 
                                className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none font-bold text-gray-800 transition-all text-lg placeholder:font-normal placeholder:text-gray-300 disabled:opacity-70 disabled:bg-gray-50"
                                autoFocus
                                disabled={isSubmitting}
                            />
                            
                            <label className="block text-sm font-bold text-gray-700 mt-4 mb-1">
                                รายละเอียด / คอนเซปต์ (Description)
                            </label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="เช่น รายการพาเที่ยว เน้นกิน สบายๆ..." 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-indigo-500 outline-none text-gray-700 transition-all resize-none h-24 text-sm disabled:opacity-70"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center">
                                <Palette className="w-4 h-4 mr-2 text-indigo-500" />
                                2. สีประจำรายการ (Brand Color)
                            </label>
                            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                                {BRAND_COLORS.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setColor(c.class)}
                                        disabled={isSubmitting}
                                        className={`
                                            h-10 rounded-lg border-2 transition-all relative flex items-center justify-center
                                            ${c.class.split(' ')[0]} 
                                            ${c.class.split(' ')[2]}
                                            ${color === c.class ? 'ring-2 ring-offset-2 ' + c.class.split(' ')[3] : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'}
                                            ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}
                                        `}
                                    >
                                        {color === c.class && <Check className="w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 my-6"></div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center">
                         <LayoutTemplate className="w-4 h-4 mr-2 text-indigo-500" />
                         3. รายการนี้ลงที่ไหนบ้าง? (Active Platforms)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {PLATFORM_OPTIONS.map((p) => {
                            const isSelected = selectedPlatforms.includes(p.id);
                            const Icon = p.icon;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => togglePlatform(p.id)}
                                    disabled={isSubmitting}
                                    className={`
                                        flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative
                                        ${isSelected 
                                            ? `border-indigo-500 bg-indigo-50/50 shadow-sm` 
                                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                        }
                                        ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}
                                    `}
                                >
                                    <Icon className={`w-8 h-8 mb-2 ${isSelected ? p.color : 'text-gray-300'}`} />
                                    <span className={`font-bold text-sm ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>
                                        {p.label}
                                    </span>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                     <button 
                        type="button"
                        onClick={closeForm}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 mr-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className={`
                            px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center
                            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>{editingId ? 'บันทึกการแก้ไข' : 'สร้างรายการใหม่'}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.length === 0 && !isFormOpen && (
            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                <LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>ยังไม่มีรายการเลยครับ ลองกด "สร้างรายการใหม่" ดูนะ</p>
            </div>
        )}
        
        {channels.map((channel) => {
            const taskCount = tasks.filter(t => t.channelId === channel.id).length;
            const bgClass = (channel.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-');
            
            return (
                <div 
                    key={channel.id} 
                    onClick={() => { setEditingId(channel.id); setIsFormOpen(true); }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 transition-all group overflow-hidden flex flex-col cursor-pointer relative"
                >
                    {/* Color Bar / Banner */}
                    <div className={`h-24 w-full ${bgClass} relative`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent"></div>
                    </div>
                    
                    {/* Logo Overlay */}
                    <div className="absolute top-12 left-5">
                         <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center">
                             {channel.logoUrl ? (
                                 <img src={channel.logoUrl} className="w-full h-full object-cover" alt="logo" />
                             ) : (
                                 <div className={`w-full h-full flex items-center justify-center font-black text-2xl uppercase ${channel.color.split(' ')[1]}`}>
                                     {channel.name.substring(0, 2)}
                                 </div>
                             )}
                         </div>
                    </div>

                    <div className="p-5 pt-10 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-xl text-gray-800 line-clamp-1" title={channel.name}>
                                {channel.name}
                            </h3>
                            <div className="flex space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(confirm(`ยืนยันลบรายการ "${channel.name}" ?`)) onDelete(channel.id);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="ลบรายการ"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {channel.description && (
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
                                {channel.description}
                            </p>
                        )}
                        {!channel.description && <div className="min-h-[40px]"></div>}

                        <div className="mt-auto pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {channel.platforms.map(p => {
                                        const Icon = PLATFORM_ICONS[p];
                                        const pColor = PLATFORM_OPTIONS.find(opt => opt.id === p)?.color || 'text-gray-500';
                                        return (
                                            <div key={p} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm z-10" title={p}>
                                                <Icon className={`w-4 h-4 ${pColor}`} />
                                            </div>
                                        );
                                    })}
                                </div>
                                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                    {taskCount} งาน
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ChannelManager;
