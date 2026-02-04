
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Duty } from '../../types';
import { Scale, AlertTriangle, Camera, Loader2, Skull, ArrowRight, MessageCircle, FileText, Upload, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { compressImage } from '../../lib/imageUtils';

interface DutyTribunalModalProps {
    isOpen: boolean;
    pendingDuty: Duty;
    onAcceptPenalty: (duty: Duty) => Promise<void>;
    onRedeem: (duty: Duty, file: File) => Promise<void>;
    onAppeal: (duty: Duty, reason: string, file?: File) => Promise<void>;
}

const DutyTribunalModal: React.FC<DutyTribunalModalProps> = ({ 
    isOpen, pendingDuty, onAcceptPenalty, onRedeem, onAppeal 
}) => {
    const [step, setStep] = useState<'DECISION' | 'PROOF' | 'APPEAL'>('DECISION');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const appealFileRef = useRef<HTMLInputElement>(null);

    // Appeal State
    const [appealReason, setAppealReason] = useState('');
    const [appealFile, setAppealFile] = useState<File | null>(null);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessing(true);
            try {
                const compressed = await compressImage(file);
                await onRedeem(pendingDuty, compressed);
            } catch (error) {
                console.error(error);
                alert('เกิดข้อผิดพลาดในการอัปโหลด');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleAppealFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
         if(e.target.files?.[0]) setAppealFile(e.target.files[0]);
    };

    const handleSubmitAppeal = async () => {
        if(!appealReason.trim()) {
            alert('กรุณาระบุเหตุผลด้วยครับ');
            return;
        }
        setIsProcessing(true);
        await onAppeal(pendingDuty, appealReason, appealFile || undefined);
        setIsProcessing(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative border-8 border-yellow-400 animate-in zoom-in-95 duration-300 ring-4 ring-orange-200">
                
                {/* Header: The Tribunal */}
                <div className="bg-yellow-400 p-6 text-yellow-900 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white p-4 rounded-full mb-3 shadow-lg animate-bounce-slow border-4 border-yellow-200">
                            <AlertTriangle className="w-10 h-10 text-yellow-500" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tight">Last Chance!</h2>
                        <p className="text-yellow-800 text-sm font-bold">โอกาสสุดท้ายก่อนโดนแบน</p>
                    </div>
                </div>

                <div className="p-8 text-center space-y-6">
                    
                    {/* Verdict Content */}
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-3">คุณลืมทำเวรวันก่อนใช่หรือไม่?</p>
                        <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl mb-4">
                            <h3 className="text-xl font-black text-gray-800 mb-1">"{pendingDuty.title}"</h3>
                            <p className="text-sm text-red-500 font-bold">
                                ประจำวันที่ {format(new Date(pendingDuty.date), 'd MMMM', { locale: th })}
                            </p>
                        </div>
                    </div>

                    {step === 'DECISION' && (
                        <div className="space-y-3">
                            <button 
                                onClick={() => setStep('PROOF')}
                                disabled={isProcessing}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    ขอแก้ตัวเดี๋ยวนี้!
                                </span>
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                <span className="absolute right-3 text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-indigo-100">-5 HP</span>
                            </button>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setStep('APPEAL')}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-white border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-4 h-4" /> แจ้งเหตุจำเป็น
                                </button>
                                <button 
                                    onClick={() => onAcceptPenalty(pendingDuty)}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-white border-2 border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-500 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <Skull className="w-4 h-4" /> ยอมรับผิด
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'PROOF' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <div className="text-sm text-gray-600 bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-left">
                                <p className="font-bold text-indigo-800 mb-2">เงื่อนไขการแก้ตัว:</p>
                                <ul className="list-disc pl-4 space-y-1 text-xs">
                                    <li>ต้องถ่ายรูปหลักฐาน <b>ณ เวลานี้</b></li>
                                    <li>ระบบจะบันทึกสถานะเป็น <b>LATE COMPLETED</b></li>
                                    <li>จะถูกหักคะแนนเล็กน้อย (-5 HP) เป็นค่าปรับล่าช้า</li>
                                </ul>
                            </div>
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                                ถ่ายรูปส่งงาน
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
                                onClick={() => setStep('DECISION')}
                                disabled={isProcessing}
                                className="text-gray-400 text-xs hover:underline flex items-center justify-center gap-1 w-full"
                            >
                                <ArrowLeft className="w-3 h-3" /> ย้อนกลับ
                            </button>
                        </div>
                    )}

                    {step === 'APPEAL' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 text-left">
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">เหตุผล / ความจำเป็น</label>
                                <textarea 
                                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none h-24"
                                    placeholder="เช่น ป่วยกระทันหัน, ติดธุระด่วน..."
                                    value={appealReason}
                                    onChange={e => setAppealReason(e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">หลักฐาน (ถ้ามี)</label>
                                <div 
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-3 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => appealFileRef.current?.click()}
                                >
                                    {appealFile ? (
                                        <span className="text-sm font-bold text-blue-600 truncate">{appealFile.name}</span>
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-400">
                                            <Upload className="w-5 h-5 mb-1" />
                                            <span className="text-[10px]">คลิกเพื่อแนบรูป</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={appealFileRef} className="hidden" onChange={handleAppealFileChange} accept="image/*" />
                            </div>

                            <button 
                                onClick={handleSubmitAppeal}
                                disabled={isProcessing || !appealReason}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                                ยื่นเรื่อง
                            </button>
                            
                            <button 
                                onClick={() => setStep('DECISION')}
                                disabled={isProcessing}
                                className="text-gray-400 text-xs hover:underline flex items-center justify-center gap-1 w-full"
                            >
                                <ArrowLeft className="w-3 h-3" /> ย้อนกลับ
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
};

export default DutyTribunalModal;
