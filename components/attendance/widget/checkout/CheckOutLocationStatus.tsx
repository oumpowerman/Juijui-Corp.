import React, { useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, ShieldCheck, MapPin, RefreshCw, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface CheckOutLocationStatusProps {
    status: 'LOADING' | 'SUCCESS' | 'OUT_OF_RANGE' | 'ERROR';
    isGpsSecure: boolean;
    gpsThreatReason?: string;
    distance?: number;
    matchedLocationName?: string;
    onRetry: () => void;
}

export const CheckOutLocationStatus: React.FC<CheckOutLocationStatusProps> = ({
    status,
    isGpsSecure,
    gpsThreatReason,
    distance = 0,
    matchedLocationName,
    onRetry
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // 1. Loading state (No expand needed, just clean compact design)
    if (status === 'LOADING') {
        return (
            <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-left select-none flex items-center gap-3 animate-in fade-in duration-300">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700">กำลังตรวจสอบพิกัดตำแหน่ง...</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-none">ระบบกำลังยืนยันความปลอดภัยของสัญญาณ GPS</p>
                </div>
            </div>
        );
    }

    // Toggle expansion safely
    const toggleExpand = (e: React.MouseEvent) => {
        // Prevent toggling if the click was on the retry button
        if ((e.target as HTMLElement).closest('.retry-btn')) {
            return;
        }
        setIsExpanded(!isExpanded);
    };

    // 2. Threat Detected state
    if (!isGpsSecure && gpsThreatReason) {
        return (
            <div 
                onClick={toggleExpand}
                className="p-3.5 bg-rose-50/50 hover:bg-rose-50/80 border border-rose-100 rounded-2xl text-left transition-all cursor-pointer shadow-xs select-none flex flex-col animate-in fade-in slide-in-from-top-2 duration-300"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                        <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div className="ml-3 min-w-0">
                            <h4 className="text-xs font-semibold text-rose-800">สัญญาณ GPS ไม่ปลอดภัย (Spoof Warning)</h4>
                            <p className="text-[11px] text-rose-600/80 mt-0.5 truncate">กรุณาปิดซอฟต์แวร์จำลองตำแหน่ง</p>
                        </div>
                    </div>
                    <div className="shrink-0 text-rose-400 pl-2">
                        <ChevronDown 
                            className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                    </div>
                </div>

                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    <div className="pt-3 mt-3 border-t border-rose-100 flex flex-col gap-2.5">
                        <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                            {gpsThreatReason}
                        </p>
                        <p className="text-[10px] text-rose-500/80 leading-relaxed font-medium bg-white/40 p-2 rounded-lg border border-rose-100/50">
                            *กรุณาปิดโปรแกรมจำลองพิกัด หรือเชื่อมต่อสัญญาณ GPS ปกติเพื่อความถูกต้องในการลงเวลาปฏิบัติงาน
                        </p>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRetry();
                            }} 
                            className="retry-btn flex items-center gap-1.5 self-start bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                        >
                            <RefreshCw className="w-3 h-3"/> สแกนพิกัดอีกครั้ง
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // 3. Error state (cannot fetch geolocation)
    if (status === 'ERROR') {
        return (
            <div 
                onClick={toggleExpand}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl text-left transition-all cursor-pointer shadow-xs select-none flex flex-col animate-in fade-in slide-in-from-top-2 duration-300"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div className="ml-3 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-700">ไม่สามารถเข้าถึงพิกัดตำแหน่งได้</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">กรุณาเปิดสิทธิ์ GPS บนอุปกรณ์ของคุณ</p>
                        </div>
                    </div>
                    <div className="shrink-0 text-slate-400 pl-2">
                        <ChevronDown 
                            className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                    </div>
                </div>

                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    <div className="pt-3 mt-3 border-t border-slate-200 flex flex-col gap-2.5">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            กรุณาตรวจสอบสิทธิ์การเข้าถึงตำแหน่ง GPS ของเบราว์เซอร์ เพื่อความถูกต้องในการระบุระยะทางปฏิบัติงานจริง
                        </p>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRetry();
                            }} 
                            className="retry-btn flex items-center gap-1.5 self-start bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                        >
                            <RefreshCw className="w-3 h-3" /> ลองระบุพิกัดอีกครั้ง
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // 4. Out of Range state
    if (status === 'OUT_OF_RANGE') {
        return (
            <div 
                onClick={toggleExpand}
                className="p-3.5 bg-amber-50/40 hover:bg-amber-50/80 border border-amber-100 rounded-2xl text-left transition-all cursor-pointer shadow-xs select-none flex flex-col animate-in fade-in slide-in-from-top-2 duration-300"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div className="ml-3 min-w-0">
                            <h4 className="text-xs font-semibold text-amber-800">อยู่นอกพื้นที่ปฏิบัติงาน (ห่าง {distance.toFixed(0)} ม.)</h4>
                            <p className="text-[11px] text-amber-700/80 mt-0.5 truncate">พิกัดไม่อยู่ในจุดกำหนด</p>
                        </div>
                    </div>
                    <div className="shrink-0 text-amber-400 pl-2">
                        <ChevronDown 
                            className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                    </div>
                </div>

                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    <div className="pt-3 mt-3 border-t border-amber-100 flex flex-col gap-2.5">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            พิกัดปัจจุบันของคุณห่างจากจุดเช็คอินที่ใกล้ที่สุด ({matchedLocationName || 'สำนักงาน'}) เกินกว่าระยะรัศมีปฏิบัติงานที่กำหนดไว้
                        </p>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRetry();
                            }} 
                            className="retry-btn flex items-center gap-1.5 self-start bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                        >
                            <RefreshCw className="w-3 h-3"/> อัปเดตพิกัดอีกครั้ง
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // 5. Success/In Range state
    return (
        <div 
            onClick={toggleExpand}
            className="p-3.5 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-2xl text-left transition-all cursor-pointer shadow-xs select-none flex flex-col animate-in fade-in slide-in-from-top-3 duration-300"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                    <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                        <MapPin className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="ml-3 min-w-0">
                        <h3 className="text-xs font-semibold text-emerald-800">ยืนยันพิกัดเข้าพื้นที่สำเร็จ</h3>
                        <p className="text-[11px] text-emerald-700/80 mt-0.5 truncate">
                            สถานที่: <span className="font-semibold text-emerald-950">{matchedLocationName}</span> ({distance.toFixed(0)} ม.)
                        </p>
                    </div>
                </div>
                <div className="shrink-0 text-emerald-400 pl-2">
                    <ChevronDown 
                        className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                </div>
            </div>

            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
            >
                <div className="pt-3 mt-3 border-t border-emerald-100 flex flex-col gap-2">
                    <span className="text-[9px] bg-emerald-200/50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold self-start inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Secure Verified
                    </span>
                    <p className="text-[10px] text-emerald-600/80 font-medium">
                        *ระบบยืนยันความปลอดภัย สแกนป้องกันโปรแกรมจำลอง และสอดคล้องกับขอบเขตพื้นที่สำนักงานของคุณ
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

