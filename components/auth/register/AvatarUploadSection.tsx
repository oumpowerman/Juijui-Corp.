import React from 'react';
import { Camera, Loader2, Sparkles } from 'lucide-react';

export interface AvatarUploadSectionProps {
  avatarPreview: string | null;
  isConvertingImg: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export const AvatarUploadSection: React.FC<AvatarUploadSectionProps> = ({
  avatarPreview,
  isConvertingImg,
  fileInputRef,
  handleFileChange,
  error,
}) => {
  return (
    <div id="register-avatarPreview-container" className="flex flex-col items-center mb-6">
      <div 
        className="relative group cursor-pointer" 
        onClick={() => !isConvertingImg && fileInputRef.current?.click()}
      >
        <div className={`w-24 h-24 rounded-full border-4 ${
          error 
            ? 'border-red-200 bg-red-50/30' 
            : avatarPreview 
              ? 'border-pink-300' 
              : 'border-slate-100'
        } bg-slate-50 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-pink-400 group-hover:scale-105 shadow-sm`}>
          {isConvertingImg ? (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-[10px] mt-1">Processing..</span>
            </div>
          ) : avatarPreview ? (
            <img 
              src={avatarPreview} 
              alt="Avatar Preview" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400 select-none">
              <Camera className={`w-8 h-8 mb-1 transition-colors duration-300 ${error ? 'text-red-400' : 'text-slate-400'}`} />
              <span className={`text-[10px] font-bold transition-colors duration-300 ${error ? 'text-red-500' : 'text-red-400'}`}>
                รูปโปรไฟล์ *
              </span>
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
      {error && (
        <p className="text-xs font-bold text-red-500 mt-2 animate-in fade-in duration-300">
          {error}
        </p>
      )}
    </div>
  );
};

export default AvatarUploadSection;
