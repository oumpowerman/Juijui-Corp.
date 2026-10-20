import React from 'react';
import { User, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { BRAND_CONFIG } from '../../config/brand';

interface LoginFormProps {
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPasswordClick: () => void;
  onGoogleSignIn?: () => void;
  onFacebookSignIn?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  onSubmit,
  onForgotPasswordClick,
  onGoogleSignIn,
  onFacebookSignIn,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Username Input */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ชื่อผู้ใช้ (Username) หรือ อีเมล *</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <User className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </motion.div>
          </div>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 rounded-xl outline-none transition-all font-bold text-slate-700" 
            placeholder="ชื่อผู้ใช้ หรือ อีเมลของคุณ" 
            required 
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1">
        <div className="flex justify-between items-center ml-1">
          <label className="text-xs font-bold text-slate-500 uppercase">รหัสผ่าน *</label>
          <button 
              type="button" 
              onClick={onForgotPasswordClick}
              className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-tighter outline-none"
          >
              ลืมรหัสผ่าน?
          </button>
        </div>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <motion.div
              animate={{ 
                  rotate: [0, 8, 0, -8, 0],
                  scale: [1, 1.1, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </motion.div>
          </div>
          <input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full pl-11 pr-12 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 rounded-xl outline-none transition-all font-bold text-slate-700 [&::-ms-reveal]:hidden [&::-webkit-password-reveal-button]:hidden" 
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

      {/* Submit Button */}
      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-white text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-200`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังเข้าสู่ระบบ...</span>
            </>
          ) : (
            <>
              <span>เข้าสู่ระบบ (Login)</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )} 
        </button>
      </div>

      {/* Social OAuth Section (Google & Facebook) */}
      <div className="relative flex items-center justify-center my-5 py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80"></div>
        </div>
        <span className="relative px-3 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          หรือเข้าสู่ระบบด่วนเพื่อทดลองเล่น / ใช้งานจริง
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button 
          type="button"
          onClick={() => onGoogleSignIn?.()}
          className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">ด้วย Google</span>
        </button>

        <button 
          type="button"
          onClick={() => onFacebookSignIn?.()}
          className="w-full py-3 px-4 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span className="text-xs font-bold text-white whitespace-nowrap">ด้วย Facebook</span>
        </button>
      </div>
    </form>
  );
};
