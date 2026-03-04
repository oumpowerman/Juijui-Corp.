import React, { useState, useRef, useEffect } from 'react';
import { User, Briefcase, Phone, ChevronDown, Check } from 'lucide-react';
import { User as UserType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileBasicInfoProps {
  name: string;
  position: string;
  phone: string;
  positions: { key: string, label: string }[];
  user: UserType;
  onNameChange: (val: string) => void;
  onPositionChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
}

const ProfileBasicInfo: React.FC<ProfileBasicInfoProps> = ({
  name,
  position,
  phone,
  positions,
  user,
  onNameChange,
  onPositionChange,
  onPhoneChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPosition = (label: string) => {
    onPositionChange(label);
    setIsDropdownOpen(false);
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
            {/* Custom Position Dropdown */}
            <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-pink-400 uppercase tracking-wider ml-1">ตำแหน่งงาน</label>
                <div className="relative group">
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full pl-12 pr-10 py-4 text-left border-2 rounded-2xl outline-none text-sm font-bold transition-all shadow-sm flex items-center justify-between
                            ${isDropdownOpen 
                                ? 'bg-white border-pink-300 text-pink-900 ring-4 ring-pink-100' 
                                : 'bg-pink-50/50 border-pink-100 text-pink-900 hover:bg-white'
                            }
                        `}
                    >
                        <span className={position ? '' : 'text-pink-300'}>{position || 'เลือกตำแหน่ง...'}</span>
                        <ChevronDown className={`w-4 h-4 text-pink-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <Briefcase className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 group-hover:text-pink-500 transition-colors pointer-events-none" />
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-pink-100 border border-pink-100 overflow-hidden max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200"
                        >
                            <div className="p-2 space-y-1">
                                {positions.map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => handleSelectPosition(p.label)}
                                        className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors
                                            ${position === p.label 
                                                ? 'bg-pink-50 text-pink-600' 
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {p.label}
                                        {position === p.label && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                                {positions.length === 0 && (
                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">ไม่มีข้อมูลตำแหน่ง</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
    </div>
  );
};

export default ProfileBasicInfo;
