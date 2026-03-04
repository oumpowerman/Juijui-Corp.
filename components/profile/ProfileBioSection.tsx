import React from 'react';
import { Quote } from 'lucide-react';

interface ProfileBioSectionProps {
  bio: string;
  onBioChange: (val: string) => void;
}

const ProfileBioSection: React.FC<ProfileBioSectionProps> = ({ bio, onBioChange }) => {
  return (
    <div className="relative mt-2 group px-1">
        {/* Background Layer */}
        <div className="absolute inset-0 bg-yellow-200/40 rounded-3xl transform rotate-2 translate-y-2 transition-transform group-hover:rotate-3"></div>
        
        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-100 p-1.5 rounded-3xl shadow-sm group-focus-within:border-yellow-300 group-focus-within:shadow-md transition-all">
            <div className="bg-white/40 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <label className="block text-xs font-black text-yellow-500 uppercase tracking-wider ml-1 mb-3 flex items-center gap-2">
                    <div className="bg-yellow-100 p-1.5 rounded-lg">
                        <Quote className="w-3 h-3 fill-yellow-500 text-yellow-600" /> 
                    </div>
                    Bio / สไตล์การทำงาน
                </label>
                
                <div className="relative">
                    <textarea 
                        rows={3}
                        value={bio}
                        onChange={e => onBioChange(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm font-bold text-yellow-900 placeholder:text-yellow-300/70 resize-none leading-relaxed px-1 relative z-10"
                        placeholder="แนะนำตัวเองสั้นๆ..."
                    />
                    <Quote className="w-12 h-12 text-yellow-100 absolute -bottom-4 -right-2 pointer-events-none transform rotate-180" />
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProfileBioSection;
