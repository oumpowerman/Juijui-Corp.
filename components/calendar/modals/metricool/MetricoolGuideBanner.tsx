import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    ChevronUp,
    Upload,
    Sparkles,
    CheckCircle2,
    PlusCircle,
    Layers
} from 'lucide-react';
import { MetricoolTabType, collapsibleDrawerVariants } from './constants';

interface MetricoolGuideBannerProps {
    isOpen: boolean;
    onCloseGuide: () => void;
    activeTab: MetricoolTabType;
}

export const MetricoolGuideBanner: React.FC<MetricoolGuideBannerProps> = React.memo(({
    isOpen,
    onCloseGuide,
    activeTab
}) => {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    key="metricool-guide-banner"
                    variants={collapsibleDrawerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex-shrink-0 overflow-hidden border-b border-[#E6DFD3] bg-[#F8F4EC]"
                >
                    <div className="px-5 sm:px-6 py-2.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#4A4238]">
                                <BookOpen className="w-3.5 h-3.5 text-[#567A63] shrink-0" />
                                <span>
                                    {activeTab === 'EXPORT'
                                        ? 'คู่มือการส่งออกตารางงานและลิงก์คลิป Google Drive ไปตั้งเวลาใน Metricool'
                                        : 'คู่มือการนำเข้าไฟล์ CSV จาก Metricool และการตรวจสอบ Preview ก่อนบันทึกจริง'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={onCloseGuide}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-[#6E6355] hover:text-[#4A4238] hover:bg-[#EAE3D5] transition-colors shrink-0"
                            >
                                <span>พับเก็บคู่มือ</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {activeTab === 'EXPORT' ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E5DDD0] flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-[#F5E0D8] text-[#8C4F3E] font-bold flex items-center justify-center shrink-0 tabular-nums text-[11px]">
                                        1
                                    </span>
                                    <div>
                                        <p className="font-bold text-[#4A4238]">
                                            ติ๊ก "ส่งโพสต์ Metricool" ที่คลิปไฟนอล
                                        </p>
                                        <p className="text-[11px] text-[#7D7265] leading-snug">
                                            ในแท็บไฟล์แนบของการ์ด กดติ๊กเฉพาะไฟล์คลิปไฟนอล (ตั้งแชร์ Google Drive เป็น "ทุกคนที่มีลิงก์") เพื่อไม่ให้ดึงฟุตเทจดิบผิด
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E5DDD0] flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-[#F5E0D8] text-[#8C4F3E] font-bold flex items-center justify-center shrink-0 tabular-nums text-[11px]">
                                        2
                                    </span>
                                    <div>
                                        <p className="font-bold text-[#4A4238]">
                                            แปลง Direct Link & ตรวจตาราง Preview
                                        </p>
                                        <p className="text-[11px] text-[#7D7265] leading-snug">
                                            ระบบแปลงลิงก์ไฟล์ Google Drive เป็น Direct Link ลงคอลัมน์ Picture Url 1 อัตโนมัติ และแจ้งเตือนหากเผลอใช้ลิงก์โฟลเดอร์
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E5DDD0] flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-[#E6EFE9] text-[#3F634D] font-bold flex items-center justify-center shrink-0 tabular-nums text-[11px]">
                                        3
                                    </span>
                                    <div>
                                        <p className="font-bold text-[#4A4238]">
                                            อัปโหลดเข้าหน้า Planning ใน Metricool
                                        </p>
                                        <p className="text-[11px] text-[#7D7265] leading-snug">
                                            ไปที่เมนู <span className="font-semibold text-[#5A5044]">Planning &gt; Import CSV</span> แล้วอัปโหลดไฟล์ 97 คอลัมน์ได้ทันที
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E5DDD0] space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-bold text-[#4A4238]">
                                        <Upload className="w-3.5 h-3.5 text-[#567A63]" />
                                        <span>1. อัปโหลดไฟล์ & เลือกช่องเป้าหมาย</span>
                                    </div>
                                    <p className="text-[11px] text-[#7D7265] leading-snug">
                                        รองรับ 200–300+ แถว ตัด #แฮชแท็ก ออกจากชื่อการ์ดและรวมแถวซ้ำในวันเดียวกันให้อัตโนมัติ
                                    </p>
                                </div>

                                <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E5DDD0] space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-[#4A4238]">
                                        <Sparkles className="w-3.5 h-3.5 text-[#A86D3D]" />
                                        <span>2. ความหมายของป้ายสถานะการจับคู่</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 text-[10px]">
                                        <span className="inline-flex items-center gap-1 font-bold text-[#8C5A32]">
                                            <CheckCircle2 className="w-3 h-3" />
                                            อัปเดตการ์ดเดิม: ซิงค์ทับการ์ดเดิม
                                        </span>
                                        <span aria-hidden="true" className="text-[#B8AC99]">·</span>
                                        <span className="inline-flex items-center gap-1 font-bold text-[#3F634D]">
                                            <PlusCircle className="w-3 h-3" />
                                            สร้างใหม่: เพิ่มการ์ดใหม่
                                        </span>
                                    </div>
                                </div>

                                <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E5DDD0] space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-bold text-[#4A4238]">
                                        <Layers className="w-3.5 h-3.5 text-[#567A63]" />
                                        <span>3. กรอง ค้นหา และเทียบข้อมูลเก่า-ใหม่</span>
                                    </div>
                                    <p className="text-[11px] text-[#7D7265] leading-snug">
                                        กดปุ่มกรองสถานะ ค้นหาชื่อคลิป หรือกดปุ่ม <span className="font-semibold text-[#8C5A32]">"เทียบข้อมูลเก่า-ใหม่"</span> ก่อนยืนยันบันทึก
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default MetricoolGuideBanner;
