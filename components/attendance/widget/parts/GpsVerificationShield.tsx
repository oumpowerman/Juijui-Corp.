import React from 'react';
import { ShieldCheck, ShieldAlert, Check, AlertTriangle } from 'lucide-react';

interface GpsVerificationShieldProps {
    isGpsSecure: boolean;
    isUserLate: boolean;
    startTime?: string;
    gpsThreatReason?: string;
    onAppealClick?: () => void;
}

const GpsVerificationShield: React.FC<GpsVerificationShieldProps> = ({
    isGpsSecure,
    isUserLate,
    startTime,
    gpsThreatReason,
    onAppealClick,
}) => {
    return (
        <div className="flex flex-col items-center pt-1 w-full">
            {isGpsSecure ? (
                <>
                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-2 relative animate-pulse">
                        <span className="absolute inset-0 rounded-full bg-emerald-200/40 animate-ping" />
                        <ShieldCheck className="w-8 h-8 relative z-10" />
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold shadow-sm">
                        <Check className="w-3 h-3" />
                        {isUserLate ? 'GPS Secure (Late Detected)' : 'GPS Secure Verified'}
                    </div>
                    {isUserLate ? (
                        <p className="text-[10px] text-amber-600 font-bold mt-1.5 text-center px-4 animate-pulse leading-normal">
                            ระบบตรวจพบการเข้างานสาย (เกณฑ์เริ่มงาน: {startTime} น.) <br/>
                            กำลังนำคุณไปหน้ากรอกใบคำร้องขอเข้าสายใน 3 วินาที...
                        </p>
                    ) : (
                        <p className="text-[9px] text-gray-400 mt-0.5 text-center px-4">
                            ตรวจสอบระบบยืนยันตัวตนพิกัด & ป้องกันสวมสิทธิ์พิกัดปลอมสำเร็จ
                        </p>
                    )}
                </>
            ) : (
                <>
                    <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-2 relative animate-bounce">
                        <span className="absolute inset-0 rounded-full bg-rose-200/40 animate-ping" />
                        <ShieldAlert className="w-8 h-8 relative z-10" />
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-[10px] font-bold shadow-sm">
                        <AlertTriangle className="w-3 h-3" />
                        Fake GPS / Emulator Detected!
                    </div>
                    <p className="text-[10px] text-rose-500 font-bold mt-1 text-center px-4 leading-normal">
                        {gpsThreatReason || 'ตรวจพบการพยายามใช้แอปสวมสิทธิ์จำลองพิกัดเพื่อโกงเวลาทำงาน'}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1 text-center px-4">
                        ไม่อนุญาตให้เช็คอิน! กรุณาปิดแอป Fake GPS หรือแอปจำลองพิกัดบนเครื่องของท่านก่อน
                    </p>
                    {onAppealClick && (
                        <button
                            id="gps-appeal-button"
                            type="button"
                            onClick={onAppealClick}
                            className="mt-3.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-100/50 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5 cursor-pointer"
                        >
                            📷 ยื่นเรื่องอุทธรณ์พิกัด (พร้อมถ่ายภาพหน้างานจริง)
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default GpsVerificationShield;
