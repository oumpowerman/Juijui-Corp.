import React, { useState, useRef, useEffect } from 'react';
import { User, Briefcase, Phone, Lock } from 'lucide-react';
import { User as UserType } from '../../types';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface ProfileBasicInfoProps {
  name: string;
  position: string;
  phone: string;
  email: string;
  positions: { key: string, label: string }[];
  user: UserType;
  onNameChange: (val: string) => void;
  onPositionChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onEmailChange: (val: string) => void;
}

const ProfileBasicInfo: React.FC<ProfileBasicInfoProps> = ({
  name,
  position,
  phone,
  email,
  user,
  onNameChange,
  onPhoneChange,
  onEmailChange
}) => {
  const { showAlert } = useGlobalDialog();

  const handlePositionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showAlert(
      'ตำแหน่งงานของคุณถูกล็อกไว้เพื่อความปลอดภัย หากต้องการเปลี่ยนตำแหน่งงานอย่างเป็นทางการ กรุณาติดต่อฝ่ายบุคคล (HR) ค่ะ',
      '🔒 ข้อมูลตำแหน่งงานถูกล็อก'
    );
  };

  return (
    <div className="space-y-5 px-1">
        {/* Name Input */}
        <div className="space-y-2">
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider ml-1">ชื่อเล่น / ชื่อที่ใช้ในทีม</label>
            <div className="relative group">
                <input 
                    type="text" 
                    value={name}
                    onChange={e => onNameChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-indigo-50/50 border-2 border-indigo-100 focus:bg-white focus:border-indigo-300 rounded-2xl outline-none text-sm font-bold text-indigo-900 transition-all shadow-sm group-hover:bg-white placeholder:text-indigo-300"
                    placeholder="ชื่อเล่น"
                    required
                />
                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Locked Custom Position Field */}
            <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                    <label className="block text-xs font-bold text-pink-400 uppercase tracking-wider">ตำแหน่งงาน</label>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-md border border-slate-200 uppercase tracking-wide">
                        <Lock className="w-2.5 h-2.5" /> ล็อกข้อมูล 🔒
                    </span>
                </div>
                <div className="relative group">
                    <button
                        type="button"
                        onClick={handlePositionClick}
                        className="w-full pl-12 pr-10 py-4 text-left border-2 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner flex items-center justify-between bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/70 hover:border-slate-300 cursor-pointer active:scale-98"
                    >
                        <span>{position || 'ไม่ได้กำหนดตำแหน่ง'}</span>
                        <Lock className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
                    </button>
                    <Briefcase className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-500 transition-colors pointer-events-none" />
                </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider ml-1">เบอร์โทรศัพท์</label>
                <div className="relative group">
                    <input 
                        type="tel" 
                        value={phone}
                        onChange={e => onPhoneChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 border-2 border-emerald-100 focus:bg-white focus:border-emerald-300 rounded-2xl outline-none text-sm font-bold text-emerald-900 transition-all shadow-sm group-hover:bg-white placeholder:text-emerald-300"
                        placeholder="08x-xxx-xxxx"
                    />
                    <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none" />
                </div>
            </div>
        </div>

        {/* Email Input */}
        <div className="space-y-2">
            <label className="block text-xs font-bold text-violet-400 uppercase tracking-wider ml-1">อีเมลสำหรับกู้คืนบัญชี 📧</label>
            <div className="relative group">
                <input 
                    type="email" 
                    value={email}
                    onChange={e => onEmailChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-violet-50/50 border-2 border-violet-100 focus:bg-white focus:border-violet-300 rounded-2xl outline-none text-sm font-bold text-violet-900 transition-all shadow-sm group-hover:bg-white placeholder:text-violet-300"
                    placeholder="email@example.com (ไม่บังคับ)"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none group-focus-within:scale-110 transition-transform">📧</span>
            </div>
            
            {/* Instruction / Warn Message */}
            {!email ? (
              <p className="text-xs font-bold text-amber-600 bg-amber-50/50 border border-amber-200/40 rounded-2xl px-4 py-3 mt-2 animate-in fade-in duration-300 flex items-center gap-1.5 shadow-sm leading-relaxed">
                <span>⚠️ คุณยังไม่ได้ผูกอีเมลสำหรับกู้คืนรหัสผ่าน แนะนำให้กรอกไว้เพื่อป้องกันบัญชีสูญหายในอนาคตครับ</span>
              </p>
            ) : (
              <p className="text-xs font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-200/40 rounded-2xl px-4 py-3 mt-2 animate-in fade-in duration-300 flex items-center gap-1.5 shadow-sm leading-relaxed">
                <span>✓ อีเมลของคุณพร้อมใช้งานสำหรับกู้คืนรหัสผ่านแล้วครับ</span>
              </p>
            )}
        </div>
    </div>
  );
};

export default ProfileBasicInfo;
