
import React, { useState, useRef } from 'react';
import { Sparkles, ArrowRight, Lock, Mail, User, AlertCircle, Rocket, Heart, Camera, Briefcase, MessageSquareQuote, LogIn, UserPlus, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SuccessModal from './SuccessModal';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // New Fields
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  
  // File Upload State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Trigger animation key
  const [animKey, setAnimKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleMode = (mode: 'LOGIN' | 'REGISTER') => {
      const targetIsLogin = mode === 'LOGIN';
      if (isLogin === targetIsLogin) return;

      setIsLogin(targetIsLogin);
      setErrorMsg(null);
      setAnimKey(prev => prev + 1); // Trigger re-render for animation
  };

  const handleCloseSuccessModal = () => {
      setShowSuccessModal(false);
      setIsLogin(true);
      setPassword(''); 
      setErrorMsg(null);
      // Reset new fields
      setPosition('');
      setPhone('');
      setReason('');
      setAvatarFile(null);
      setAvatarPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setAvatarFile(file);
          const objectUrl = URL.createObjectURL(file);
          setAvatarPreview(objectUrl);
      }
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
            // Force Avatar Check
            if (!avatarFile) {
                throw new Error('กรุณาอัปโหลดรูปโปรไฟล์ด้วยนะครับ 📸 (บังคับ)');
            }

            // Register Logic - Fixed: Send metadata IN signUp options
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        position: position,
                        phone_number: phone,
                        reason: reason,
                        // Note: Real file upload usually happens after getting user ID
                        // For now, we assume user will update avatar later or we handle it via a separate flow
                    }
                }
            });
            
            if (authError) throw authError;

            setShowSuccessModal(true);
        }
    } catch (error: any) {
        setErrorMsg(error.message || 'อุ๊ย! มีข้อผิดพลาด ลองใหม่นะ');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Blobs (Decor) */}
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br transition-all duration-1000 ${isLogin ? 'from-blue-50 to-white' : 'from-pink-50 to-white'}`}></div>
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-purple-200/40 to-blue-200/40 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-yellow-100/40 to-pink-200/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className={`
          relative w-full max-w-5xl bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row border border-white/60 transition-all duration-700
          h-auto min-h-[780px] md:h-[780px]
      `}>
        
        {/* --- ARTWORK SIDE --- */}
        <div className={`
            hidden md:flex md:w-5/12 relative flex-col items-center justify-center text-white p-12 overflow-hidden transition-all duration-700
            ${isLogin 
                ? 'bg-gradient-to-br from-[#4f46e5] to-[#818cf8]' 
                : 'bg-gradient-to-br from-[#db2777] to-[#f472b6]'}
        `}>
             {/* Dynamic Pattern */}
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 4px 4px, white 2px, transparent 0)', backgroundSize: '40px 40px' }}></div>
             
             <div className="relative z-10 text-center flex flex-col items-center animate-slide-up">
                <div className="w-28 h-28 bg-white/20 rounded-[2rem] flex items-center justify-center mb-8 backdrop-blur-md shadow-xl ring-2 ring-white/30 rotate-3 hover:rotate-6 transition-transform duration-500">
                    {isLogin ? <Sparkles className="w-14 h-14 text-white drop-shadow-md" /> : <Rocket className="w-14 h-14 text-white drop-shadow-md" />}
                </div>
                
                <h2 className="text-4xl font-black mb-4 leading-tight drop-shadow-sm tracking-tight">
                    Juijui Planner
                </h2>
                <p className="text-white/90 text-lg leading-relaxed mb-10 font-medium max-w-xs">
                    {isLogin 
                        ? "ระบบจัดการงานคอนเทนต์ สำหรับทีมครีเอเตอร์ยุคใหม่"
                        : "สมัครสมาชิกเพื่อเริ่มจัดการงาน และ Workload ทีมของคุณ"
                    }
                </p>

                {/* Decorative Elements */}
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
             </div>
        </div>

        {/* --- FORM SIDE --- */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col relative overflow-y-auto scrollbar-hide">
            
            {/* --- 3D Switcher --- */}
            <div className="flex justify-center mb-8">
                 <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center border border-slate-200/80 shadow-inner w-full max-w-[340px] relative">
                      <button 
                        type="button"
                        onClick={() => toggleMode('LOGIN')}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black tracking-wide transition-all duration-300 relative z-10
                            ${isLogin 
                                ? 'bg-white text-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.15)] translate-y-[-1px] scale-[1.02] ring-1 ring-indigo-50' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                            }
                        `}
                      >
                         <LogIn className={`w-4 h-4 transition-transform duration-300 ${isLogin ? 'scale-110' : 'scale-100'}`} />
                         เข้าสู่ระบบ
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => toggleMode('REGISTER')}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black tracking-wide transition-all duration-300 relative z-10
                            ${!isLogin 
                                ? 'bg-white text-pink-600 shadow-[0_4px_12px_rgba(219,39,119,0.15)] translate-y-[-1px] scale-[1.02] ring-1 ring-pink-50' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                            }
                        `}
                      >
                         <UserPlus className={`w-4 h-4 transition-transform duration-300 ${!isLogin ? 'scale-110' : 'scale-100'}`} />
                         สมัครสมาชิก
                      </button>
                 </div>
            </div>

            <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center" key={animKey}>
                <div className="mb-8 animate-slide-up text-center md:text-left" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-3xl font-black mb-2 flex items-center justify-center md:justify-start gap-2 text-slate-800">
                        {isLogin ? (
                           <>ยินดีต้อนรับกลับ! <span className="text-3xl animate-wave">👋</span></>
                        ) : (
                           <>สร้างบัญชีใหม่ <span className="text-3xl animate-bounce-slow">✨</span></>
                        )}
                    </h3>
                    <p className="text-slate-500 font-medium">
                        {isLogin ? 'กรอกข้อมูลเพื่อเข้าสู่ระบบจัดการงานของคุณ' : 'กรอกข้อมูลสั้นๆ เพื่อเข้าร่วมทีม'}
                    </p>
                </div>

                {/* Alerts */}
                {errorMsg && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-100 flex items-start gap-3 text-red-500 animate-slide-up shadow-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="font-bold text-sm">{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up flex-1" style={{ animationDelay: '0.2s' }}>
                    
                    {/* --- Avatar Upload (Register Only) --- */}
                    {!isLogin && (
                        <div className="flex justify-center mb-6">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className={`w-24 h-24 rounded-full border-4 ${avatarPreview ? 'border-pink-300' : 'border-slate-100'} bg-slate-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-pink-400 group-hover:scale-105 shadow-sm`}>
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400">
                                            <Camera className="w-8 h-8 mb-1" />
                                            <span className="text-[10px] font-bold text-red-400">ใส่รูป (บังคับ)</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-pink-600 transition-colors">
                                    <Sparkles className="w-3 h-3" />
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    )}

                    {!isLogin && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1 uppercase tracking-wider">
                                    ชื่อเล่น <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent hover:bg-slate-100 focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-bold text-slate-700 text-sm"
                                        placeholder="ชื่อของคุณ"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1 uppercase tracking-wider">
                                    ตำแหน่ง <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Briefcase className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-pink-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent hover:bg-slate-100 focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-bold text-slate-700 text-sm"
                                        placeholder="เช่น Editor"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">อีเมล <span className="text-red-500">*</span></label>
                        <div className="relative group">
                            <Mail className={`w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isLogin ? 'group-focus-within:text-indigo-500' : 'group-focus-within:text-pink-500'}`} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent hover:bg-slate-100 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400 ${isLogin ? 'focus:border-indigo-400' : 'focus:border-pink-400'}`}
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                            <div className="relative group">
                                <Phone className={`w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-pink-500`} />
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent hover:bg-slate-100 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:border-pink-400`}
                                    placeholder="081-234-5678"
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">รหัสผ่าน <span className="text-red-500">*</span></label>
                        <div className="relative group">
                            <Lock className={`w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isLogin ? 'group-focus-within:text-indigo-500' : 'group-focus-within:text-pink-500'}`} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent hover:bg-slate-100 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400 ${isLogin ? 'focus:border-indigo-400' : 'focus:border-pink-400'}`}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {/* --- Reason Field (Register Only) --- */}
                    {!isLogin && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">ข้อความถึง CEO อุ้มจุ๊ยจุ๊ย</label>
                            <div className="relative group">
                                <MessageSquareQuote className="w-5 h-5 text-slate-400 absolute left-4 top-4 group-focus-within:text-pink-500 transition-colors" />
                                <textarea 
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={2}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent hover:bg-slate-100 focus:bg-white focus:border-pink-400 rounded-xl outline-none transition-all font-medium text-slate-700 text-sm resize-none"
                                    placeholder="แนะนำตัวสั้นๆ..."
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-6">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className={`
                                w-full py-3.5 rounded-xl font-black text-white text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2
                                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                                ${isLogin 
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200' 
                                    : 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-200'}
                            `}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                                    กำลังดำเนินการ...
                                </span>
                            ) : (
                                <>
                                    {isLogin ? 'เข้าสู่ระบบ (Login)' : 'ส่งใบสมัคร (Register)'} 
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>

      {/* --- SUCCESS MODAL COMPONENT --- */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title="ยินดีต้อนรับ! 🎉"
        description={
            <>
                เย้! ส่งใบสมัครเรียบร้อยครับ <br/>
                <span className="text-gray-500 text-sm">เดี๋ยวพี่ Admin จะรีบมาตรวจและอนุมัตินะคร้าบ</span><br/>
                <span className="text-pink-500 font-bold text-lg mt-2 block">ล็อกอินรอไว้ได้เลย!</span> 
            </>
        }
        buttonText="กลับไปหน้าเข้าสู่ระบบ"
      />

    </div>
  );
};

export default AuthPage;
