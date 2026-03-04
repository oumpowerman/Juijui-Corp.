import React from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { User } from '../../types';
import UserAvatarWithHP from '../common/UserAvatarWithHP';
import { motion } from 'framer-motion';

interface ProfileAvatarUploaderProps {
  user: User;
  previewUrl: string;
  isConvertingImg: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ProfileAvatarUploader: React.FC<ProfileAvatarUploaderProps> = ({
  user,
  previewUrl,
  isConvertingImg,
  onFileSelect,
  fileInputRef
}) => {
  // Create a temporary user object with the preview URL for the avatar component
  const previewUser = { ...user, avatarUrl: previewUrl };

  return (
    <div className="flex flex-col items-center shrink-0 relative z-10">
      <motion.div 
        className="relative group cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => !isConvertingImg && fileInputRef.current?.click()}
      >
        {/* Main Avatar Component */}
        <div className="relative z-10 p-1 bg-white/30 backdrop-blur-md rounded-full border border-white/50 shadow-xl shadow-indigo-500/10">
            {isConvertingImg ? (
                <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gray-50/50 backdrop-blur-sm border-4 border-white">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <UserAvatarWithHP 
                    user={previewUser} 
                    size="2xl" 
                    className="drop-shadow-2xl" 
                    showStatus={false} // We show status separately
                    showLevel={true}
                />
            )}
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-[2px] rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform">
                <Camera className="w-6 h-6 text-white drop-shadow-md" />
            </div>
        </div>

        {/* HP Badge */}
        <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-30 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-white/60 text-[10px] font-black text-gray-600 whitespace-nowrap flex items-center gap-1"
        >
            <span className={user.hp > 30 ? "text-emerald-500" : "text-rose-500"}>♥</span> 
            {user.hp}/{user.maxHp} HP
        </motion.div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/png, image/jpeg, image/jpg, image/heic"
          onChange={onFileSelect}
          disabled={isConvertingImg}
        />
      </motion.div>
      
      <p className="mt-4 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
          Click to Change
      </p>
    </div>
  );
};

export default ProfileAvatarUploader;
