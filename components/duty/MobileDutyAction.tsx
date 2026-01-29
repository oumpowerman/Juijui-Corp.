
import React, { useRef, useState } from 'react';
import { Duty } from '../../types';
import { Camera, CheckCircle2, Loader2, Sparkles, ArrowRightLeft } from 'lucide-react';

interface MobileDutyActionProps {
    duty: Duty;
    onToggle: (id: string) => void;
    onSubmitProof: (dutyId: string, file: File, userName: string) => Promise<boolean>;
    onRequestSwap: (duty: Duty) => void;
    userName: string;
}

const MobileDutyAction: React.FC<MobileDutyActionProps> = ({ duty, onToggle, onSubmitProof, onRequestSwap, userName }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            await onSubmitProof(duty.id, file, userName);
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 mb-6 relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            
            <div className="relative z-10 text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/20">
                    <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" /> Daily Mission
                </div>
                <h3 className="text-2xl font-black leading-tight mb-1">
                    เวรของคุณวันนี้
                </h3>
                <p className="text-indigo-100 text-lg font-bold">"{duty.title}"</p>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10 mb-4">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center gap-2 bg-white text-indigo-600 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all hover:bg-indigo-50 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    ) : (
                        <Camera className="w-8 h-8" />
                    )}
                    <span className="text-sm">ถ่ายรูปส่งงาน</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleFileChange}
                />

                <button
                    onClick={() => onToggle(duty.id)}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center gap-2 bg-indigo-500/50 border border-white/30 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all hover:bg-indigo-500/70"
                >
                    <CheckCircle2 className="w-8 h-8" />
                    <span className="text-sm">ติ๊กเสร็จ (ไม่มีรูป)</span>
                </button>
            </div>

            <div className="relative z-10 text-center">
                 <button 
                    onClick={() => onRequestSwap(duty)}
                    className="text-xs text-indigo-200 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
                 >
                    <ArrowRightLeft className="w-3 h-3" /> ไม่สะดวก? ขอแลกเวร
                 </button>
            </div>
        </div>
    );
};

export default MobileDutyAction;
