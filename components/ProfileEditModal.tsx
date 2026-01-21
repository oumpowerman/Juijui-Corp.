
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Briefcase, Phone, Loader2, Camera, UploadCloud, Trash2, Quote, Smile, Sparkles, MessageCircle } from 'lucide-react';
import { User as UserType } from '../types';
import { supabase } from '../lib/supabase';
import heic2any from 'heic2any';
import ImageCropper from './ImageCropper';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onSave: (updates: Partial<UserType>, file?: File) => Promise<boolean>;
}

const FUNNY_FEELINGS = [
    "ปวดหลัง... 👵",
    "อยากกินหมูกระทะ 🥓",
    "Error 404: Energy Not Found 🔋",
    "งานคือเงิน เงินคืองาน 💸",
    "ง่วงนอนตลอดเวลา 😴",
    "ร่างทองพร้อมลุย! ✨",
    "สมองไหล... 🫠",
    "รอวันศุกร์ 🎉",
    "ปั่นงานยิกๆ 🔥",
    "ขอชาไข่มุกด่วน 🧋"
];

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [name, setName] = useState(user.name);
  const [position, setPosition] = useState(user.position);
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [bio, setBio] = useState(user.bio || ''); 
  const [feeling, setFeeling] = useState(user.feeling || ''); // ADDED
  
  // Image State
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Crop State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
  // Master Data State
  const [positions, setPositions] = useState<{key: string, label: string}[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConvertingImg, setIsConvertingImg] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setPosition(user.position);
      setPhone(user.phoneNumber || '');
      setBio(user.bio || ''); 
      setFeeling(user.feeling || ''); // Set feeling
      setPreviewUrl(user.avatarUrl || '');
      setSelectedFile(null);
      setCropImageSrc(null);
      
      const fetchPositions = async () => {
        const { data } = await supabase
            .from('master_options')
            .select('key, label')
            .eq('type', 'POSITION')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        
        if (data && data.length > 0) {
            setPositions(data);
        }
      };
      fetchPositions();
    }
  }, [isOpen, user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          let file = e.target.files[0];
          
          if (file.size > 5 * 1024 * 1024) {
              alert("ไฟล์ใหญ่เกินไป (จำกัด 5MB)");
              return;
          }

          // HEIC Conversion Logic
          if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
              setIsConvertingImg(true);
              try {
                  const convertedBlob = await heic2any({
                      blob: file,
                      toType: 'image/jpeg',
                      quality: 0.8
                  });
                  
                  const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                  file = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
              } catch (err) {
                  console.error("HEIC Conversion error:", err);
                  alert("ไม่สามารถแปลงไฟล์ HEIC ได้ กรุณาลองใช้รูปอื่น");
                  setIsConvertingImg(false);
                  return;
              } finally {
                  setIsConvertingImg(false);
              }
          }

          // Read file as Data URL for Cropper
          const reader = new FileReader();
          reader.onload = () => {
              setCropImageSrc(reader.result as string);
          };
          reader.readAsDataURL(file);
          
          // Reset input to allow re-selection
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(croppedBlob));
      setCropImageSrc(null); // Close cropper
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // ส่งข้อมูลที่แก้ไข พร้อมไฟล์รูปภาพ (ถ้ามีการเลือกใหม่)
    const success = await onSave({
        name: name.trim(),
        position: position.trim(),
        phoneNumber: phone.trim(),
        bio: bio,
        feeling: feeling // Send feeling
    }, selectedFile || undefined);

    setIsSubmitting(false);
    if (success) onClose();
  };

  const randomFeeling = () => {
      const random = FUNNY_FEELINGS[Math.floor(Math.random() * FUNNY_FEELINGS.length)];
      setFeeling(random);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      
      {/* Image Cropper Modal */}
      {cropImageSrc && (
          <ImageCropper 
              imageSrc={cropImageSrc}
              onCropComplete={handleCropComplete}
              onCancel={() => setCropImageSrc(null)}
          />
      )}

      {/* Lightbox ดูรูปใหญ่ */}
      {showFullImage && previewUrl && !cropImageSrc && (
          <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
              <img src={previewUrl} className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" />
              <button className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/40">
                  <X className="w-6 h-6" />
              </button>
          </div>
      )}

      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
          <h3 className="text-lg font-black text-gray-800 tracking-tight">แก้ไขโปรไฟล์ ✏️</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* อัปโหลดรูปภาพ */}
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div 
                            className="w-32 h-32 rounded-full bg-gray-100 border-[6px] border-white shadow-xl overflow-hidden cursor-pointer relative ring-2 ring-gray-100"
                            onClick={() => !isConvertingImg && fileInputRef.current?.click()}
                        >
                            {isConvertingImg ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="text-[10px] mt-1">Processing..</span>
                                </div>
                            ) : previewUrl ? (
                                <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <Camera className="w-8 h-8 mb-1" />
                                    <span className="text-[10px] font-bold">ใส่รูป</span>
                                </div>
                            )}
                            
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                        </div>

                        {previewUrl && !isConvertingImg && (
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setShowFullImage(true); }}
                                className="absolute 0 bottom-1 right-1 p-2 bg-white text-gray-600 rounded-full shadow-md border border-gray-100 hover:text-indigo-600 transition-all hover:scale-110 active:scale-95"
                            >
                                <User className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/jpg, image/heic"
                        onChange={handleFileSelect}
                        disabled={isConvertingImg}
                    />
                    <p className="text-[10px] text-gray-400 mt-3 font-medium uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">แตะรูปเพื่อเปลี่ยน</p>
                </div>

                {/* ฟิลด์ข้อมูล */}
                <div className="space-y-5">
                    
                    {/* Status / Feeling Input (ENHANCED UI) */}
                    <div className="relative group animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 rounded-2xl opacity-70 blur-sm group-hover:opacity-100 transition duration-500"></div>
                        <div className="relative bg-white p-4 rounded-2xl">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center">
                                    <MessageCircle className="w-4 h-4 mr-1.5 text-pink-500 fill-pink-500" /> สถานะวันนี้ (Status)
                                </label>
                                <button type="button" onClick={randomFeeling} className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors flex items-center font-bold active:scale-95">
                                    <Sparkles className="w-3 h-3 mr-1" /> สุ่มคำคม
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={feeling}
                                    onChange={e => setFeeling(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-pink-200 placeholder:text-gray-300 transition-all text-center"
                                    placeholder="เช่น ปวดหลัง, หิวข้าว, ร่างทอง..."
                                />
                                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45 border-b border-r border-gray-100"></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 px-2">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">ชื่อเล่น / ชื่อที่ใช้ในทีม</label>
                            <div className="relative group">
                                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold text-gray-800 transition-all shadow-sm"
                                    placeholder="ชื่อเล่น"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">ตำแหน่งงาน (Position)</label>
                            <div className="relative group">
                                <Briefcase className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <select 
                                    value={position}
                                    onChange={e => setPosition(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold text-gray-800 transition-all shadow-sm appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">เลือกตำแหน่ง...</option>
                                    {positions.map(p => (
                                        <option key={p.key} value={p.label}>{p.label}</option>
                                    ))}
                                    {positions.length === 0 && <option value={user.position}>{user.position}</option>}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">เบอร์โทรศัพท์ (Phone)</label>
                            <div className="relative group">
                                <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold text-gray-800 transition-all shadow-sm"
                                    placeholder="08x-xxx-xxxx"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bio Input (ENHANCED UI - Sticky Note Style) */}
                    <div className="relative mt-6 group">
                        <div className="absolute inset-0 bg-yellow-100 rounded-2xl transform rotate-2 translate-y-1 transition-transform group-hover:rotate-3"></div>
                        <div className="relative bg-white border-2 border-yellow-100 p-1 rounded-2xl shadow-sm group-focus-within:border-yellow-300 transition-colors">
                            <div className="bg-yellow-50/50 rounded-xl p-4">
                                <label className="block text-xs font-black text-yellow-600 uppercase tracking-wider ml-1 mb-2 flex items-center">
                                    <Quote className="w-3 h-3 mr-1 fill-yellow-600" /> Bio / สไตล์การทำงาน
                                </label>
                                <div className="relative">
                                    <textarea 
                                        rows={3}
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-600 placeholder:text-yellow-700/30 resize-none leading-relaxed px-1"
                                        placeholder="แนะนำตัวเองสั้นๆ..."
                                    />
                                    <Quote className="w-10 h-10 text-yellow-200 absolute -bottom-2 -right-2 pointer-events-none opacity-50 transform rotate-180" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-20">
            <button 
                type="submit" 
                form="profile-form"
                disabled={isSubmitting || isConvertingImg}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-xl hover:shadow-indigo-200 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
            >
                {isSubmitting || isConvertingImg ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {isConvertingImg ? 'กำลังแปลงไฟล์...' : 'กำลังบันทึกข้อมูล...'}
                    </>
                ) : (
                    <>
                        <Save className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> 
                        บันทึกการเปลี่ยนแปลง
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;
