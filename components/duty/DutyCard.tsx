
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Duty, User } from '../../types';
import { CheckCircle2, Circle, Trash2, Camera, Loader2, Image as ImageIcon, X, ArrowRightLeft, Skull, AlertCircle, Ban, HeartHandshake, ExternalLink } from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { isPast, isToday, isSameDay, subDays } from 'date-fns';
import { compressImage } from '../../lib/imageUtils';

import { useGameConfig } from '../../context/GameConfigContext';

interface DutyCardProps {
    duty: Duty;
    assignee?: User;
    isCurrentUser: boolean;
    currentUserName?: string; 
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSubmitProof: (dutyId: string, file: File, userName: string) => Promise<boolean>;
    onRequestSwap: (duty: Duty) => void; 
}

const DutyCard: React.FC<DutyCardProps> = ({ 
    duty, assignee, isCurrentUser, currentUserName, onToggle, onDelete, onSubmitProof, onRequestSwap 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showProof, setShowProof] = useState(false);
    const { showConfirm, showAlert } = useGlobalDialog();
    const { config } = useGameConfig();

    // Logic Checks
    const today = new Date();
    const dutyDate = new Date(duty.date);
    const isYesterday = isSameDay(dutyDate, subDays(today, 1));
    const graceHour = config?.AUTO_JUDGE_CONFIG?.duty_grace_hour || 10;
    const isGracePeriod = isYesterday && today.getHours() < graceHour;

    const isMissed = !duty.isDone && isPast(dutyDate) && !isToday(dutyDate) && !isGracePeriod;
    const isAbandoned = duty.penaltyStatus === 'ABANDONED';
    const isTribunal = duty.penaltyStatus === 'AWAITING_TRIBUNAL';
    const isLateDone = duty.penaltyStatus === 'LATE_COMPLETED';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Determine who is submitting (Owner or Hero)
        const submitterName = isCurrentUser ? (assignee?.name || 'Unknown') : (currentUserName || 'Hero');

        if (file) {
            setIsUploading(true);
            try {
                // Compress before upload
                const compressedFile = await compressImage(file);
                await onSubmitProof(duty.id, compressedFile, submitterName);
            } catch (error) {
                console.error("Compression error, trying original file", error);
                await onSubmitProof(duty.id, file, submitterName);
            }
            setIsUploading(false);
        }
    };

    const handleDeleteClick = async () => {
        if (!isCurrentUser) return;
        const confirmed = await showConfirm(
            `คุณต้องการลบรายการเวร "${duty.title}" ของ ${assignee?.name || 'Unassigned'} ใช่หรือไม่?`,
            'ยืนยันการลบรายการเวร'
        );
        if (confirmed) {
            onDelete(duty.id);
        }
    };

    const handleToggleCheck = async () => {
        // SECURITY LOCK: Only assignee can interact via normal toggle
        if (!isCurrentUser) return;

        if (isAbandoned) return; // Locked

        // If currently unchecked (marking as done), ask for confirmation
        if (!duty.isDone) {
            if (isMissed || isTribunal) {
                if(isTribunal) {
                    await showAlert('กรุณากดปุ่ม "ขอแก้ตัว" ที่หน้า Dashboard หรือรอ Tribunal Modal เด้งขึ้นมาครับ', 'ใช้ช่องทางพิเศษ');
                    return;
                }

                const confirmed = await showConfirm(
                    'รายการนี้เลยกำหนดแล้ว การติ๊กเสร็จตอนนี้อาจถือเป็น Late Submit ยืนยันหรือไม่?',
                    'ยืนยันการส่งงานย้อนหลัง'
                );
                if (confirmed) onToggle(duty.id);
            } else {
                const confirmed = await showConfirm(
                    'ยืนยันว่าทำเวรเสร็จเรียบร้อยแล้วใช่หรือไม่?',
                    'ยืนยันการส่งงาน'
                );
                if (confirmed) onToggle(duty.id);
            }
        } else {
            // Unchecking
            onToggle(duty.id);
        }
    };

    // Hero Assist Handler
    const handleHeroAssist = async () => {
        if (isAbandoned) return;
        const confirmed = await showConfirm(
            `คุณต้องการช่วยทำเวรแทน ${assignee?.name || 'เพื่อน'} ใช่หรือไม่? \n(คุณจะได้รับ Hero Bonus XP)`,
            '🦸‍♂️ ยืนยันการช่วยเพื่อน'
        );
        if (confirmed) {
            fileInputRef.current?.click();
        }
    };

    // Helper to transform Google Drive Links to Direct Images
    const getDisplayImageUrl = (url: string | undefined) => {
        if (!url) return '';
        if (url.includes('drive.google.com')) {
            // Try to extract ID
            const idPart = url.split('id=')[1] || url.split('/d/')[1]?.split('/')[0];
            if (idPart) {
                // Use Googleusercontent proxy for direct image rendering
                return `https://lh3.googleusercontent.com/d/${idPart}=s2000`; 
            }
        }
        return url;
    };

    // Dynamic Styles
    let cardStyle = 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm';
    let statusBadge = null;

    if (isAbandoned) {
        cardStyle = 'bg-gray-200 border-gray-300 opacity-60 grayscale cursor-not-allowed';
        statusBadge = <div className="absolute right-[-15px] top-[15px] rotate-45 bg-red-600 text-white text-[9px] px-6 py-1 font-black shadow-md z-10 border-2 border-white">FAILED</div>;
    } else if (duty.isDone) {
        cardStyle = 'bg-emerald-50 border-emerald-100';
        if (isLateDone) {
             statusBadge = <div className="absolute right-2 top-2 text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded border border-orange-200 font-bold">LATE</div>;
        }
    } else if (isTribunal) {
        cardStyle = 'bg-yellow-50 border-yellow-300 border-dashed shadow-md ring-2 ring-yellow-100 animate-pulse';
    } else if (isMissed) {
        cardStyle = 'bg-red-50 border-red-300 border-dashed opacity-90';
    } else if (isGracePeriod) {
        cardStyle = 'bg-blue-50 border-blue-200 border-dashed animate-pulse';
    } else if (isCurrentUser) {
        cardStyle = 'bg-white border-indigo-200 shadow-md ring-2 ring-indigo-50 transform scale-[1.02]';
    }

    return (
        <div className={`
            relative flex flex-col p-3 rounded-2xl border-2 transition-all group overflow-hidden
            ${cardStyle}
        `}>
            {statusBadge}
            {isTribunal && (
                 <div className="absolute right-0 top-0 p-1">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                </div>
            )}
            {isMissed && !duty.isDone && !isAbandoned && !isTribunal && (
                <div className="absolute right-0 top-0 p-1">
                    <Skull className="w-4 h-4 text-red-400 opacity-50" />
                </div>
            )}
            {isAbandoned && (
                <div className="absolute right-0 top-0 p-1">
                    <Ban className="w-4 h-4 text-gray-500" />
                </div>
            )}

            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                    {assignee ? (
                        <img 
                            src={assignee.avatarUrl} 
                            className={`w-10 h-10 rounded-full object-cover border-2 ${duty.isDone ? 'border-emerald-200 grayscale' : isMissed || isAbandoned ? 'border-red-200' : 'border-white shadow-sm'}`} 
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 font-bold border-2 border-dashed border-gray-300">?</div>
                    )}
                    
                    {isCurrentUser && !duty.isDone && !isMissed && !isAbandoned && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white"></div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${duty.isDone ? 'text-gray-500 line-through decoration-2' : isAbandoned ? 'text-gray-500 line-through' : isMissed ? 'text-red-700' : 'text-gray-800'}`}>
                        {duty.title}
                    </p>
                    <p className={`text-[10px] font-medium truncate ${isCurrentUser ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {assignee ? assignee.name : 'Unassigned'}
                    </p>
                    
                    {/* Status Text */}
                    {isAbandoned ? (
                         <p className="text-[9px] text-gray-500 font-black mt-0.5">ABANDONED (ละเลย)</p>
                    ) : isTribunal ? (
                         <p className="text-[9px] text-yellow-600 font-black mt-0.5 animate-bounce">WAITING TRIBUNAL</p>
                    ) : isGracePeriod ? (
                         <p className="text-[9px] text-blue-600 font-black mt-0.5">GRACE PERIOD (รอตรวจ)</p>
                    ) : isMissed ? (
                        <p className="text-[9px] text-red-500 font-bold mt-0.5">Missed</p>
                    ) : null}
                </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-3 pt-2 border-t border-dashed border-gray-200 flex items-center justify-between">
                <div className="flex gap-2">
                     <button 
                        onClick={handleToggleCheck} 
                        className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                            !isCurrentUser ? 'cursor-default opacity-50' : 
                            isAbandoned ? 'text-gray-400 cursor-not-allowed' :
                            duty.isDone ? 'text-emerald-600' : 
                            isMissed || isTribunal ? 'text-red-500 hover:text-red-700' : 
                            'text-gray-400 hover:text-indigo-600'
                        }`}
                        disabled={!isCurrentUser || isUploading || isAbandoned}
                    >
                        {duty.isDone ? <CheckCircle2 className="w-4 h-4" /> : (isMissed || isTribunal) ? <AlertCircle className="w-4 h-4" /> : isGracePeriod ? <Loader2 className="w-4 h-4 animate-spin" /> : <Circle className="w-4 h-4" />}
                        {duty.isDone ? 'เรียบร้อย' : isTribunal ? 'รอแก้ตัว' : isAbandoned ? 'ถูกล็อค' : isGracePeriod ? 'รอตรวจ' : isMissed ? 'ขาด' : 'รอทำ'}
                    </button>
                </div>

                <div className="flex items-center gap-1">
                     {/* Swap: Only for Me, Not Done, Not Missed, Not Abandoned */}
                     {isCurrentUser && !duty.isDone && !isMissed && !isAbandoned && !isTribunal && (
                        <button 
                            onClick={() => onRequestSwap(duty)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                            title="ขอแลกเวร"
                        >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                    )}
                    
                    {/* Hero Assist Button (For Others) */}
                    {!isCurrentUser && !duty.isDone && !isAbandoned && (
                        <button 
                            onClick={handleHeroAssist}
                            className="flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg text-[9px] font-bold transition-all active:scale-95"
                            title="ช่วยเพื่อนทำเวร (ได้ XP)"
                        >
                            <HeartHandshake className="w-3.5 h-3.5" /> Assist
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
                        // Allow upload if current user, not done, and NOT abandoned
                        (isCurrentUser && !duty.isDone && !isAbandoned) && (
                            <button 
                                onClick={() => {
                                    if(isTribunal) showAlert('กรุณาใช้ปุ่ม "ขอแก้ตัว" ใน Dashboard หรือรอหน้าต่าง Tribunal เพื่อส่งงานครับ', 'ผิดช่องทาง');
                                    else fileInputRef.current?.click();
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                    isCurrentUser && !isMissed && !isTribunal ? 'text-white bg-indigo-500 hover:bg-indigo-600 shadow-sm' : 
                                    (isMissed || isTribunal) ? 'text-red-400 hover:bg-red-100' :
                                    'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                                }`}
                                title="ส่งรูปการบ้าน"
                            >
                                <Camera className="w-3.5 h-3.5" />
                            </button>
                        )
                    )}
                    
                    {/* Delete: Hide if not current user */}
                    {isCurrentUser && (
                        <button 
                            onClick={handleDeleteClick} 
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-opacity"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
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

            {/* Proof Modal - Using Portal */}
            {showProof && duty.proofImageUrl && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowProof(false)}>
                    <div className="relative max-w-lg w-full bg-transparent p-2 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowProof(false)} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors">
                            <X className="w-8 h-8" />
                        </button>
                        
                        {/* Display Image with Proxy Logic */}
                        <img 
                            src={getDisplayImageUrl(duty.proofImageUrl)} 
                            className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white bg-black" 
                            alt="Proof" 
                        />
                        
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <span className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                                📸 หลักฐาน: {duty.title}
                            </span>
                            <a 
                                href={duty.proofImageUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-white/70 text-xs hover:text-white hover:underline flex items-center gap-1"
                            >
                                <ExternalLink className="w-3 h-3" /> เปิดลิงก์ต้นฉบับ
                            </a>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DutyCard;
