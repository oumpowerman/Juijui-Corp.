import React from 'react';
import { BellRing } from 'lucide-react';

interface ProfileSocialSectionProps {
  lineUserId: string;
  onLineUserIdChange: (val: string) => void;
}

const ProfileSocialSection: React.FC<ProfileSocialSectionProps> = ({ lineUserId, onLineUserIdChange }) => {
  return (
    <div className="space-y-3 mt-4 px-1">
        <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider ml-1 flex items-center gap-2">
             <div className="bg-emerald-100 p-1.5 rounded-lg">
                <BellRing className="w-3.5 h-3.5 text-emerald-600" /> 
             </div>
             LINE User ID (สำหรับแจ้งเตือน)
        </label>
        <div className="relative group">
            <input 
                type="text" 
                value={lineUserId}
                onChange={e => onLineUserIdChange(e.target.value)}
                className="w-full px-5 py-4 bg-emerald-50/50 border-2 border-emerald-100 focus:bg-white focus:border-emerald-300 rounded-2xl outline-none text-xs font-mono font-bold text-emerald-800 transition-all shadow-sm group-hover:bg-white placeholder:text-emerald-300/70"
                placeholder="Uxxxxxxxxxxxxxxxxxxxx..."
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-emerald-100 rounded-lg text-[10px] font-bold text-emerald-600 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                Required
            </div>
        </div>
         <p className="text-[10px] text-emerald-400/80 ml-2 font-medium">
             * ใส่ User ID ของ LINE เพื่อรับแจ้งเตือนผ่านบอท (หาได้จาก Rich Menu ใน LINE)
         </p>
    </div>
  );
};

export default ProfileSocialSection;
