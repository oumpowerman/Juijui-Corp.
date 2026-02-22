
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Briefcase, Phone, Loader2, Camera, UploadCloud, Trash2, Quote, Smile, Sparkles, MessageCircle, CalendarClock, Palmtree, BellRing } from 'lucide-react';
import { User as UserType, WorkStatus } from '../types';
import { WORK_STATUS_CONFIG } from '../constants';
import { supabase } from '../lib/supabase';
import heic2any from 'heic2any';
import ImageCropper from './ImageCropper';
import { format } from 'date-fns';
import { useGlobalDialog } from '../context/GlobalDialogContext';

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
  const { showAlert } = useGlobalDialog();
  const [name, setName] = useState(user.name);
  const [position, setPosition] = useState(user.position);
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [bio, setBio] = useState(user.bio || ''); 
  const [feeling, setFeeling] = useState(user.feeling || ''); 
  
  // Status & Leave State
  const [workStatus, setWorkStatus] = useState<WorkStatus>(user.workStatus || 'ONLINE');
  const [leaveStart, setLeaveStart] = useState(user.leaveStartDate ? format(user.leaveStartDate, 'yyyy-MM-dd') : '');
  const [leaveEnd, setLeaveEnd] = useState(user.leaveEndDate ? format(user.leaveEndDate, 'yyyy-MM-dd') : '');

  // Line User ID
  const [lineUserId, setLineUserId] = useState(user.lineUserId || '');

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
      setFeeling(user.feeling || ''); 
      setWorkStatus(user.workStatus || 'ONLINE');
      setLeaveStart(user.leaveStartDate ? format(user.leaveStartDate, 'yyyy-MM-dd') : '');
      setLeaveEnd(user.leaveEndDate ? format(user.leaveEndDate, 'yyyy-MM-dd') : '');
      setLineUserId(user.lineUserId || '');
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
              showAlert("ไฟล์ใหญ่เกินไป (จำกัด 5MB)", "ไฟล์ใหญ่เกินไป");
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
                  showAlert("ไม่สามารถแปลงไฟล์ HEIC ได้ กรุณาลองใช้รูปอื่น", "ข้อผิดพลาดในการแปลงไฟล์");
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
    
    // Prepare Leave Dates (Nullable)
    const startDate = leaveStart ? new Date(leaveStart) : null;
    const endDate = leaveEnd ? new Date(leaveEnd) : null;

    // Send data
    const success = await onSave({
        name: name.trim(),
        position: position.trim(),
        phoneNumber: phone.trim(),
        bio: bio,
        feeling: feeling,
        workStatus: workStatus,
        leaveStartDate: startDate,
        leaveEndDate: endDate,
        lineUserId: lineUserId.trim()
    }, selectedFile || undefined);

    setIsSubmitting(false);
    if (success) onClose();
  };

  const randomFeeling = () => {
      const random = FUNNY_FEELINGS[Math.floor(Math.random() * FUNNY_FEELINGS.length)];
      setFeeling(random);
  };

  const handleStatusChange = (status: WorkStatus) => {
      setWorkStatus(status);
      if (status === 'ONLINE') {
          // Clear leave dates if setting to Online
          setLeaveStart('');
          setLeaveEnd('');
      } else if ((status === 'SICK' || status === 'VACATION') && !leaveStart) {
          // Auto-fill today if setting to Sick/Vacation
          setLeaveStart(format(new Date(), 'yyyy-MM-dd'));
          setLeaveEnd(format(new Date(), 'yyyy-MM-dd'));
      }
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

      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
          <h3 className="text-lg font-black text-gray-800 tracking-tight">แก้ไขโปรไฟล์ ✏️</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="flex gap-6 items-start">
                    {/* อัปโหลดรูปภาพ */}
                    <div className="flex flex-col items-center shrink-0">
                        <div className="relative group">
                            <div 
                                className="w-24 h-24 rounded-full bg-gray-100 border-[4px] border-white shadow-lg overflow-hidden cursor-pointer relative ring-2 ring-gray-100"
                                onClick={() => !isConvertingImg && fileInputRef.current?.click()}
                            >
                                {isConvertingImg ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                ) : previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <Camera className="w-6 h-6 mb-1" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-6 h-6 text-white drop-shadow-md" />
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/jpg, image/heic"
                                onChange={handleFileSelect}
                                disabled={isConvertingImg}
                            />
                        </div>
                    </div>

                    {/* Status & Feeling Section */}
                    <div className="flex-1 space-y-4">
                        {/* Work Status Toggle */}
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">สถานะการทำงาน</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(WORK_STATUS_CONFIG).map(([key, config]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleStatusChange(key as WorkStatus)}
                                        className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${workStatus === key ? `${(config as any).color} ring-2 ring-offset-1 ring-gray-200` : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <span>{(config as any).icon}</span> {(config as any).label.split('(')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Leave Date Range (Conditional) */}
                        {(workStatus === 'SICK' || workStatus === 'VACATION') && (
                            <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-orange-700 uppercase mb-2 flex items-center">
                                    <Palmtree className="w-3 h-3 mr-1" /> ระบุวันลา (Leave Period)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        value={leaveStart} 
                                        onChange={e => setLeaveStart(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-orange-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input 
                                        type="date" 
                                        value={leaveEnd} 
                                        onChange={e => setLeaveEnd(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-orange-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Feeling Input */}
                        <div className="relative group">
                            <input 
                                type="text" 
                                value={feeling}
                                onChange={e => setFeeling(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 bg-white border-2 border-indigo-50 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-gray-300 placeholder:font-normal"
                                placeholder="สเตตัสวันนี้..."
                            />
                            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-200" />
                            <button type="button" onClick={randomFeeling} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-pink-400 hover:bg-pink-50 rounded-lg transition-colors" title="สุ่มคำคม">
                                <Sparkles className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* General Info */}
                <div className="space-y-4 px-1">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">ตำแหน่งงาน</label>
                            <div className="relative group">
                                <Briefcase className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <select 
                                    value={position}
                                    onChange={e => setPosition(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold text-gray-800 transition-all shadow-sm appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">เลือก...</option>
                                    {positions.map(p => (
                                        <option key={p.key} value={p.label}>{p.label}</option>
                                    ))}
                                    {positions.length === 0 && <option value={user.position}>{user.position}</option>}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">เบอร์โทรศัพท์</label>
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

                    {/* Bio Input */}
                    <div className="relative mt-2 group">
                        <div className="absolute inset-0 bg-yellow-100 rounded-2xl transform rotate-1 translate-y-1 transition-transform group-hover:rotate-2"></div>
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
                    
                    {/* LINE User ID (For Notifications) */}
                    <div className="space-y-1.5 mt-4">
                        <label className="block text-xs font-bold text-green-600 uppercase tracking-wider ml-1 flex items-center gap-1">
                             <BellRing className="w-3 h-3" /> LINE User ID (สำหรับแจ้งเตือน)
                        </label>
                        <div className="relative group">
                            <input 
                                type="text" 
                                value={lineUserId}
                                onChange={e => setLineUserId(e.target.value)}
                                className="w-full px-4 py-3 bg-green-50 border-2 border-green-100 focus:bg-white focus:border-green-500 rounded-2xl outline-none text-xs font-mono text-gray-600 transition-all shadow-sm placeholder:text-green-300"
                                placeholder="Uxxxxxxxxxxxxxxxxxxxx..."
                            />
                        </div>
                         <p className="text-[10px] text-gray-400 ml-1">
                             * ใส่ User ID ของ LINE เพื่อรับแจ้งเตือนผ่านบอท (หาได้จาก Rich Menu ใน LINE)
                         </p>
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
