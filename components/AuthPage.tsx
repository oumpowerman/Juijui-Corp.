
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Lock, Mail, User, AlertCircle, Rocket, Camera, Briefcase, Quote, LogIn, UserPlus, Phone, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SuccessModal from './SuccessModal';
import ImageCropper from './ImageCropper';
import heic2any from 'heic2any';

interface AuthPageProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration specific fields
  const [position, setPosition] = useState(''); 
  const [employmentType, setEmploymentType] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  
  // Master Data State
  const [positions, setPositions] = useState<{key: string, label: string}[]>([]);
  
  // File Upload State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isConvertingImg, setIsConvertingImg] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null); // For Cropper
  
  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [animKey, setAnimKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
  }, []);

  const toggleMode = (mode: 'LOGIN' | 'REGISTER') => {
      const targetIsLogin = mode === 'LOGIN';
      if (isLogin === targetIsLogin) return;
      setIsLogin(targetIsLogin);
      setErrorMsg(null);
      setAnimKey(prev => prev + 1); 
  };

  const handleCloseSuccessModal = () => {
      setShowSuccessModal(false);
      setIsLogin(true);
      setPassword(''); 
      setErrorMsg(null);
      setPosition('');
      setPhone('');
      setReason('');
      setAvatarFile(null);
      setAvatarPreview(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          let file = e.target.files[0];
          
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
                  setErrorMsg("ไม่สามารถแปลงไฟล์รูปภาพได้ กรุณาลองใช้รูปอื่น");
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
          
          // Reset input value to allow re-selecting same file
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(croppedBlob);
      setAvatarPreview(objectUrl);
      setCropImageSrc(null); // Close cropper
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            onLoginSuccess(); 
        } else {
            // 1. Validation
            if (!avatarFile) {
                throw new Error('กรุณาอัปโหลดรูปโปรไฟล์ด้วยนะครับ 📸');
            }
            if (!name.trim() || !position.trim() || !phone.trim() || !employmentType) {
                throw new Error('กรุณากรอกข้อมูลให้ครบทุกช่องที่มีเครื่องหมาย * นะครับ');
            }

            // 2. Register Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        position: position,
                        phone_number: phone,
                    }
                }
            });
            
            if (authError) throw authError;
            if (!authData.user) throw new Error("สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");

            const userId = authData.user.id;

            // 3. Upload Avatar to Storage
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, avatarFile);

            if (uploadError) throw new Error('อัปโหลดรูปไม่สำเร็จ: ' + uploadError.message);

            // 4. Get Public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            // 5. Update Profile Table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ 
                    full_name: name,
                    avatar_url: publicUrl,
                    position: position, 
                    employment_type: employmentType,
                    start_date: new Date().toISOString(),
                    phone_number: phone,
                    bio: reason, // ADDED: Save reason to bio field
                    role: 'MEMBER',
                    work_days: [1, 2, 3, 4, 5], // Explicitly set default to Mon-Fri
                    hp: 100,
                    max_hp: 100,
                    xp: 0,
                    level: 1,
                    available_points: 0,
                    death_count: 0
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            // 6. Check if Auto-Login occurred
            if (authData.session) {
                onLoginSuccess();
            } else {
                setShowSuccessModal(true);
            }
        }
    } catch (error: any) {
        setErrorMsg(error.message || 'อุ๊ย! มีข้อผิดพลาด ลองใหม่นะ');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#f0f4f8] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Image Cropper Modal */}
      {cropImageSrc && (
          <ImageCropper 
              imageSrc={cropImageSrc}
              onCropComplete={handleCropComplete}
              onCancel={() => setCropImageSrc(null)}
          />
      )}

      {/* Background Decor */}
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br transition-all duration-1000 ${isLogin ? 'from-blue-50 to-white' : 'from-pink-50 to-white'}`}></div>
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-purple-200/40 to-blue-200/40 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-yellow-100/40 to-pink-200/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className={`
          relative w-full max-w-5xl bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row border border-white/60 transition-all duration-700
          h-full max-h-[850px] md:h-[780px]
      `}>
        {onBack && (
            <button 
                onClick={onBack}
                className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/60 transition-all active:scale-95 shadow-sm"
            >
                <ArrowRight className="w-4 h-4 rotate-180" /> กลับหน้าหลัก
            </button>
        )}
        
        {/* --- ARTWORK SIDE --- */}
        <div className={`
            hidden md:flex md:w-5/12 relative flex-col items-center justify-center text-white p-12 overflow-hidden transition-all duration-700
            ${isLogin 
                ? 'bg-gradient-to-br from-[#4f46e5] to-[#818cf8]' 
                : 'bg-gradient-to-br from-[#db2777] to-[#f472b6]'}
        `}>
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 4px 4px, white 2px, transparent 0)', backgroundSize: '40px 40px' }}></div>
             
             <AnimatePresence mode="wait">
                <motion.div 
                    key={isLogin ? 'login' : 'register'}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    className="relative z-10 text-center flex flex-col items-center"
                >
                    <motion.div 
                        animate={{ 
                            rotate: [3, 8, 3, -2, 3],
                            y: [0, -4, 0]
                        }}
                        transition={{ 
                            duration: 5, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="w-28 h-28 bg-white/20 rounded-[2rem] flex items-center justify-center mb-8 backdrop-blur-md shadow-xl ring-2 ring-white/30"
                    >
                        {isLogin ? <Sparkles className="w-14 h-14 text-white drop-shadow-md" /> : <Rocket className="w-14 h-14 text-white drop-shadow-md" />}
                    </motion.div>
                    
                    <h2 className="text-4xl font-black mb-4 leading-tight drop-shadow-sm tracking-tight">
                        ContentOS
                    </h2>
                    <p className="text-white/90 text-lg leading-relaxed mb-10 font-medium max-w-xs">
                        {isLogin 
                            ? "ระบบจัดการงานคอนเทนต์ สำหรับทีมครีเอเตอร์ยุคใหม่"
                            : "สมัครสมาชิกเพื่อเริ่มจัดการงาน และ Workload ทีมของคุณ"
                        }
                    </p>
                </motion.div>
             </AnimatePresence>
        </div>

        {/* --- FORM SIDE --- */}
        <div className="w-full md:w-7/12 p-6 md:p-12 flex flex-col flex-1 relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            
            <div className="flex justify-center mb-8">
                 <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center border border-slate-200/80 shadow-inner w-full max-w-[340px] relative">
                      <button 
                        type="button"
                        onClick={() => toggleMode('LOGIN')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 relative z-10 ${isLogin ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         <LogIn className="w-4 h-4" /> เข้าสู่ระบบ
                      </button>
                      <button 
                        type="button"
                        onClick={() => toggleMode('REGISTER')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 relative z-10 ${!isLogin ? 'bg-white text-pink-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         <UserPlus className="w-4 h-4" /> สมัครสมาชิก
                      </button>
                 </div>
            </div>

            <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={isLogin ? 'login-form' : 'reg-form'}
                        initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                        <div className="mb-6 text-center md:text-left">
                            <motion.h3 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl font-black mb-2 text-slate-800"
                            >
                                {isLogin ? 'ยินดีต้อนรับกลับ! 👋' : 'สร้างบัญชีใหม่ ✨'}
                            </motion.h3>
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-slate-500 font-medium"
                            >
                                {isLogin ? 'กรอกข้อมูลเพื่อเข้าสู่ระบบจัดการงาน' : 'กรอกข้อมูลตำแหน่งงานเพื่อเข้าร่วมทีม'}
                            </motion.p>
                        </div>

                {errorMsg && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-100 flex items-start gap-3 text-red-500 shadow-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="font-bold text-sm">{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {!isLogin && (
                        <div className="flex justify-center mb-6">
                            <div className="relative group cursor-pointer" onClick={() => !isConvertingImg && fileInputRef.current?.click()}>
                                <div className={`w-24 h-24 rounded-full border-4 ${avatarPreview ? 'border-pink-300' : 'border-slate-100'} bg-slate-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-pink-400 group-hover:scale-105 shadow-sm`}>
                                    {isConvertingImg ? (
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="text-[10px] mt-1">Processing..</span>
                                        </div>
                                    ) : avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400">
                                            <Camera className="w-8 h-8 mb-1" />
                                            <span className="text-[10px] font-bold text-red-400">รูปโปรไฟล์ *</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                                    <Sparkles className="w-3 h-3" />
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/jpg, image/heic" 
                                    onChange={handleFileChange} 
                                    disabled={isConvertingImg}
                                />
                            </div>
                        </div>
                    )}

                    {!isLogin && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ชื่อเล่น *</label>
                                <div className="relative group">
                                    <motion.div
                                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                                    >
                                        <User className="w-5 h-5 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
                                    </motion.div>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-bold text-slate-700 text-sm" placeholder="ชื่อเล่น" required={!isLogin} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ตำแหน่งงาน *</label>
                                <div className="relative group">
                                    <Briefcase className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500 transition-colors" />
                                    <select 
                                        value={position} 
                                        onChange={(e) => setPosition(e.target.value)} 
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-bold text-slate-700 text-sm appearance-none cursor-pointer"
                                        required={!isLogin}
                                    >
                                        <option value="">เลือกตำแหน่ง...</option>

                                        {positions.length > 0 ? (
                                            positions.map(p => (
                                                <option key={p.key} value={p.label}>
                                                    {p.label}
                                                </option>))) : (
                                            <>
                                                <option value="Editor">Editor</option>
                                                <option value="Creative">Creative</option>
                                            </>
                                        )}

                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ประเภทพนักงาน *</label>
                            <div className="relative group">
                                <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500 transition-colors" />
                                <select 
                                    value={employmentType} 
                                    onChange={(e) => setEmploymentType(e.target.value)} 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-bold text-slate-700 text-sm appearance-none cursor-pointer"
                                    required={!isLogin}
                                >
                                    <option value="">โปรดเลือกรายการในนี้...</option>
                                    <option value="FULL_TIME">พนักงานประจำ (Full-time)</option>
                                    <option value="INTERN">นักศึกษาฝึกงาน (Intern)</option>
                                    <option value="PROBATION">ทดลองงาน (Probation)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">อีเมล *</label>
                        <div className="relative group">
                            <motion.div
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                            >
                                <Mail className={`w-5 h-5 text-slate-400 transition-colors ${isLogin ? 'group-focus-within:text-indigo-500' : 'group-focus-within:text-pink-500'}`} />
                            </motion.div>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-700 ${isLogin ? 'focus:border-indigo-400' : 'focus:border-pink-400'}`} placeholder="email@example.com" required />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">เบอร์โทรศัพท์ *</label>
                            <div className="relative group">
                                <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500 transition-colors" />
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-bold text-slate-700" placeholder="08x-xxx-xxxx" required={!isLogin} />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">รหัสผ่าน *</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                                <motion.div
                                    animate={{ 
                                        rotate: [0, 8, 0, -8, 0],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <Lock className={`w-5 h-5 text-slate-400 transition-colors ${isLogin ? 'group-focus-within:text-indigo-500' : 'group-focus-within:text-pink-500'}`} />
                                </motion.div>
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className={`w-full pl-11 pr-12 py-3 bg-slate-50 border-2 border-transparent focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-700 ${isLogin ? 'focus:border-indigo-400' : 'focus:border-pink-400'} [&::-ms-reveal]:hidden [&::-webkit-password-reveal-button]:hidden`} 
                                placeholder="••••••••" 
                                required 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors outline-none focus:ring-0 z-20"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">แนะนำตัว / ฝากถึงทีมงาน</label>
                            <div className="relative group">
                                <Quote className="w-5 h-5 text-slate-400 absolute left-4 top-4 group-focus-within:text-pink-500 transition-colors" />
                                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-medium text-slate-700 text-sm resize-none" placeholder="บอกเราหน่อยว่าทำไมอยากร่วมทีม..." />
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={isLoading || isConvertingImg}
                            className={`w-full py-4 rounded-xl font-black text-white text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isLoading || isConvertingImg ? 'opacity-70 cursor-not-allowed' : ''} ${isLogin ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200' : 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-200'}`}
                        >
                            {isLoading || isConvertingImg ? 'กำลังประมวลผล...' : isLogin ? 'เข้าสู่ระบบ (Login)' : 'ส่งใบสมัครสมาชิก'} 
                            {(!isLoading && !isConvertingImg) && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
      </div>

      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title="ส่งใบสมัครแล้ว! 🎉"
        description={
            <>
                เย้! เราได้รับข้อมูลของคุณแล้ว <br/>
                <span className="text-gray-500 text-sm">พี่ Admin จะรีบตรวจความถูกต้องและอนุมัติให้โดยไว</span><br/>
                <span className="text-pink-500 font-bold text-lg mt-2 block">รอก่อนนะคร้าบ!</span> 
            </>
        }
        buttonText="กลับไปหน้าล็อกอิน"
      />
    </div>
  );
};

export default AuthPage;
