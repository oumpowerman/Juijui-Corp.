
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Briefcase, Phone, Loader2, Camera, UploadCloud, Trash2 } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onSave: (updates: Partial<UserType>, file?: File) => Promise<boolean>;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [name, setName] = useState(user.name);
  const [position, setPosition] = useState(user.position);
  const [phone, setPhone] = useState(user.phoneNumber || '');
  
  // Image State
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setPosition(user.position);
      setPhone(user.phoneNumber || '');
      setPreviewUrl(user.avatarUrl || '');
      setSelectedFile(null);
    }
  }, [isOpen, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Basic validation (optional)
          if (file.size > 5 * 1024 * 1024) {
              alert("ไฟล์ใหญ่เกินไป (Max 5MB)");
              return;
          }
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedFile(null);
      setPreviewUrl('');
      // Note: We don't delete from server immediately, just clear preview
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Pass the file to onSave
    const success = await onSave({
        name,
        position,
        phoneNumber: phone
    }, selectedFile || undefined);

    setIsSubmitting(false);
    if (success) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Full Image Lightbox */}
      {showFullImage && previewUrl && (
          <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
              <img src={previewUrl} className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" />
              <button className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/40">
                  <X className="w-6 h-6" />
              </button>
          </div>
      )}

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 scale-100 animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">แก้ไขโปรไฟล์ ✏️</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* --- Avatar Upload Section --- */}
            <div className="flex flex-col items-center">
                <div className="relative group">
                    <div 
                        className="w-28 h-28 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden cursor-pointer relative"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <UploadCloud className="w-8 h-8 mb-1" />
                                <span className="text-[10px] font-bold">อัปรูป</span>
                            </div>
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white drop-shadow-md" />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                        {previewUrl && (
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setShowFullImage(true); }}
                                className="p-2 bg-white text-gray-600 rounded-full shadow-md border border-gray-100 hover:text-indigo-600 hover:scale-110 transition-all"
                                title="ดูรูปเต็ม"
                            >
                                <User className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                
                {selectedFile ? (
                    <p className="text-xs text-green-600 font-bold mt-3 bg-green-50 px-3 py-1 rounded-full animate-in fade-in">
                        เลือกรูปแล้ว: {selectedFile.name}
                    </p>
                ) : (
                    <p className="text-xs text-gray-400 mt-3">แตะที่รูปเพื่อเปลี่ยน (แนะนำขนาด 1:1)</p>
                )}
            </div>

            {/* --- Form Fields --- */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">ชื่อเล่น (Display Name)</label>
                    <div className="relative group">
                        <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 hover:bg-white focus:bg-white rounded-xl focus:border-indigo-500 outline-none text-sm font-bold text-gray-700 transition-all"
                            placeholder="ชื่อของคุณ"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">ตำแหน่ง (Position)</label>
                    <div className="relative group">
                        <Briefcase className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            value={position}
                            onChange={e => setPosition(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 hover:bg-white focus:bg-white rounded-xl focus:border-indigo-500 outline-none text-sm font-bold text-gray-700 transition-all"
                            placeholder="เช่น Editor, Creative"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">เบอร์โทรศัพท์ (Phone)</label>
                    <div className="relative group">
                        <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="tel" 
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 hover:bg-white focus:bg-white rounded-xl focus:border-indigo-500 outline-none text-sm font-bold text-gray-700 transition-all"
                            placeholder="081-234-5678"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-200 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            กำลังบันทึก...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" /> 
                            บันทึกการเปลี่ยนแปลง
                        </>
                    )}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
