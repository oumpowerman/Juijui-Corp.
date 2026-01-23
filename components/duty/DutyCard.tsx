
import React, { useRef, useState } from 'react';
import { Duty, User } from '../../types';
import { CheckCircle2, Circle, Trash2, Camera, Loader2, Image as ImageIcon, X } from 'lucide-react';

interface DutyCardProps {
    duty: Duty;
    assignee?: User;
    isCurrentUser: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSubmitProof: (dutyId: string, file: File, userName: string) => Promise<boolean>;
}

const DutyCard: React.FC<DutyCardProps> = ({ 
    duty, assignee, isCurrentUser, onToggle, onDelete, onSubmitProof 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showProof, setShowProof] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && assignee) {
            setIsUploading(true);
            await onSubmitProof(duty.id, file, assignee.name);
            setIsUploading(false);
        }
    };

    return (
        <>
            <div className={`
                flex items-center gap-3 p-3 rounded-xl border transition-all group relative overflow-hidden
                ${duty.isDone 
                    ? 'bg-green-50 border-green-200' 
                    : isCurrentUser 
                        ? 'bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-100' 
                        : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'
                }
            `}>
                {/* Checkbox (Toggle) */}
                <button 
                    onClick={() => onToggle(duty.id)} 
                    className="shrink-0 transition-transform active:scale-90"
                    disabled={isUploading}
                >
                    {duty.isDone 
                        ? <CheckCircle2 className="w-6 h-6 text-green-500" /> 
                        : <Circle className={`w-6 h-6 ${isCurrentUser ? 'text-indigo-400' : 'text-gray-300'} hover:text-indigo-600`} />
                    }
                </button>
                
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${duty.isDone ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                        {duty.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                        {assignee ? (
                            <img src={assignee.avatarUrl} className="w-5 h-5 rounded-full object-cover border border-white shadow-sm" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-200" />
                        )}
                        <span className={`text-xs font-medium ${isCurrentUser ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}>
                            {assignee?.name || 'Unknown'}
                            {isCurrentUser && ' (You)'}
                        </span>
                    </div>
                </div>

                {/* Actions Area */}
                <div className="flex items-center gap-1">
                    {/* Proof Button / Indicator */}
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    ) : duty.proofImageUrl ? (
                        <button 
                            onClick={() => setShowProof(true)}
                            className="p-1.5 text-green-600 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                            title="ดูรูปหลักฐาน"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                    ) : (
                        // Only allow upload if it's user's duty or admin (simplified to user for now)
                        (isCurrentUser || !duty.isDone) && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-1.5 rounded-lg transition-colors ${isCurrentUser ? 'text-indigo-500 hover:bg-indigo-100 bg-white' : 'text-gray-300 hover:text-indigo-500'}`}
                                title="ส่งรูปการบ้าน (Photo Proof)"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        )
                    )}
                    
                    {/* Delete */}
                    <button 
                        onClick={() => { if(confirm('ลบเวรนี้?')) onDelete(duty.id) }} 
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-opacity"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                />
            </div>

            {/* Proof Modal */}
            {showProof && duty.proofImageUrl && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowProof(false)}>
                    <div className="relative max-w-lg w-full bg-white rounded-2xl p-2 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowProof(false)} className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full p-1 shadow-md hover:scale-110 transition-transform">
                            <X className="w-5 h-5" />
                        </button>
                        <img src={duty.proofImageUrl} className="w-full h-auto rounded-xl" alt="Proof" />
                        <div className="text-center p-2 text-sm font-bold text-gray-600">
                            หลักฐานการส่งเวร: {duty.title}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DutyCard;
