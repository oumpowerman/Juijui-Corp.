
import React, { useRef, useState } from 'react';
import { Duty, User } from '../../types';
import { CheckCircle2, Circle, Trash2, Camera, Loader2, Image as ImageIcon, X, ArrowRightLeft } from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface DutyCardProps {
    duty: Duty;
    assignee?: User;
    isCurrentUser: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSubmitProof: (dutyId: string, file: File, userName: string) => Promise<boolean>;
    onRequestSwap: (duty: Duty) => void; // New Prop
}

const DutyCard: React.FC<DutyCardProps> = ({ 
    duty, assignee, isCurrentUser, onToggle, onDelete, onSubmitProof, onRequestSwap 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showProof, setShowProof] = useState(false);
    const { showConfirm } = useGlobalDialog();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && assignee) {
            setIsUploading(true);
            await onSubmitProof(duty.id, file, assignee.name);
            setIsUploading(false);
        }
    };

    const handleDeleteClick = async () => {
        const confirmed = await showConfirm(
            `คุณต้องการลบรายการเวร "${duty.title}" ของ ${assignee?.name || 'Unassigned'} ใช่หรือไม่?`,
            'ยืนยันการลบรายการเวร'
        );
        if (confirmed) {
            onDelete(duty.id);
        }
    };

    const handleToggleCheck = async () => {
        // If currently unchecked (marking as done), ask for confirmation
        if (!duty.isDone) {
            const confirmed = await showConfirm(
                'ยืนยันว่าทำเวรเสร็จเรียบร้อยแล้วใช่หรือไม่?',
                'ยืนยันการส่งงาน'
            );
            if (confirmed) {
                onToggle(duty.id);
            }
        } else {
            // Unchecking (correcting mistake) - usually immediate, or can add confirm if needed
            onToggle(duty.id);
        }
    };

    return (
        <>
            <div className={`
                relative flex flex-col p-3 rounded-2xl border-2 transition-all group overflow-hidden
                ${duty.isDone 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : isCurrentUser 
                        ? 'bg-white border-indigo-200 shadow-md ring-2 ring-indigo-50 transform scale-[1.02]' 
                        : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                }
            `}>
                {/* Stamped Effect for Done */}
                {duty.isDone && (
                    <div className="absolute right-[-10px] top-[10px] rotate-12 opacity-20 pointer-events-none">
                        <div className="border-4 border-emerald-600 text-emerald-600 font-black text-xl px-2 py-1 rounded-lg uppercase tracking-widest">
                            COMPLETED
                        </div>
                    </div>
                )}

                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        {assignee ? (
                            <img 
                                src={assignee.avatarUrl} 
                                className={`w-10 h-10 rounded-full object-cover border-2 ${duty.isDone ? 'border-emerald-200 grayscale' : 'border-white shadow-sm'}`} 
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 font-bold border-2 border-dashed border-gray-300">?</div>
                        )}
                        {isCurrentUser && !duty.isDone && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white"></div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${duty.isDone ? 'text-gray-500 line-through decoration-2' : 'text-gray-800'}`}>
                            {duty.title}
                        </p>
                        <p className={`text-[10px] font-medium truncate ${isCurrentUser ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {assignee ? assignee.name : 'Unassigned'}
                        </p>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-3 pt-2 border-t border-dashed border-gray-200 flex items-center justify-between">
                    <div className="flex gap-2">
                        {/* Status Toggle with Confirmation */}
                         <button 
                            onClick={handleToggleCheck} 
                            className={`text-xs font-bold flex items-center gap-1 transition-colors ${duty.isDone ? 'text-emerald-600' : 'text-gray-400 hover:text-indigo-600'}`}
                            disabled={isUploading}
                        >
                            {duty.isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            {duty.isDone ? 'เรียบร้อย' : 'รอทำ'}
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                         {/* Swap Button (Only for Me and Not Done) */}
                         {isCurrentUser && !duty.isDone && (
                            <button 
                                onClick={() => onRequestSwap(duty)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                                title="ขอแลกเวร"
                            >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Proof Button */}
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        ) : duty.proofImageUrl ? (
                            <button 
                                onClick={() => setShowProof(true)}
                                className="p-1.5 text-emerald-600 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
                                title="ดูรูปหลักฐาน"
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            // Only allow upload if it's user's duty or incomplete
                            (isCurrentUser || !duty.isDone) && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-1.5 rounded-lg transition-colors ${isCurrentUser ? 'text-white bg-indigo-500 hover:bg-indigo-600 shadow-sm' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                                    title="ส่งรูปการบ้าน"
                                >
                                    <Camera className="w-3.5 h-3.5" />
                                </button>
                            )
                        )}
                        
                        {/* Delete */}
                        <button 
                            onClick={handleDeleteClick} 
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-opacity"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleFileChange}
                />
            </div>

            {/* Proof Modal */}
            {showProof && duty.proofImageUrl && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowProof(false)}>
                    <div className="relative max-w-lg w-full bg-transparent p-2 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowProof(false)} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors">
                            <X className="w-8 h-8" />
                        </button>
                        <img src={duty.proofImageUrl} className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white" alt="Proof" />
                        <div className="mt-4 text-center">
                            <span className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                                📸 หลักฐาน: {duty.title}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DutyCard;
