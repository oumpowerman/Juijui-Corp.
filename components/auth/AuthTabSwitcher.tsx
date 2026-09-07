import React from 'react';
import { LogIn, UserPlus } from 'lucide-react';

export interface AuthTabSwitcherProps {
  authMode: 'LOGIN' | 'REGISTER';
  onSelectMode: (mode: 'LOGIN' | 'REGISTER') => void;
}

export const AuthTabSwitcher: React.FC<AuthTabSwitcherProps> = ({
  authMode,
  onSelectMode,
}) => {
  const isLogin = authMode === 'LOGIN';
  const isRegister = authMode === 'REGISTER';

  return (
    <div className="flex justify-center mb-8">
      <div className="bg-slate-100/70 p-1.5 rounded-2xl flex items-center border border-slate-200/50 shadow-inner w-full max-w-[340px] relative">
        <button
          type="button"
          onClick={() => onSelectMode('LOGIN')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 relative z-10 ${
            isLogin
              ? 'bg-white text-indigo-600 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LogIn className="w-4 h-4" /> เข้าสู่ระบบ
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('REGISTER')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all duration-300 relative z-10 ${
            isRegister
              ? 'bg-white text-pink-600 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserPlus className="w-4 h-4" /> สมัครสมาชิก
        </button>
      </div>
    </div>
  );
};

export default AuthTabSwitcher;
