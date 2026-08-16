import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    FileText, 
    UploadCloud, 
    X, 
    Download, 
    Info, 
    AlertCircle, 
    CheckCircle2, 
    HelpCircle,
    ChevronRight,
    Users,
    Calendar,
    FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { useToast } from '../../../../context/ToastContext';
import { supabase } from '../../../../lib/supabase';
import { parseHistoricalLeaveFile } from '../../../../services/csvService';
import { User } from '../../../../types';

interface AdminLeaveMigratorProps {
    allUsers: User[];
    refreshLeaves: () => Promise<void>;
    refreshAttendance: () => Promise<void>;
}

export const AdminLeaveMigrator: React.FC<AdminLeaveMigratorProps> = ({
    allUsers,
    refreshLeaves,
    refreshAttendance
}) => {
    const { showConfirm } = useGlobalDialog();
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleDownloadTemplate = () => {
        const headers = ["email", "leave_type", "start_date", "end_date", "reason", "is_half_day", "half_day_session"];
        const rows = [
            ["employee1@example.com", "SICK", "12/09/2026", "13/09/2026", "ปวดหัว ตัวร้อน เป็นไข้", "false", ""],
            ["employee2@example.com", "VACATION", "15/10/2026", "17/10/2026", "พักร้อนประจำปี", "false", ""],
            ["employee1@example.com", "PERSONAL", "20/10/2026", "20/10/2026", "ทำธุระส่วนตัว", "true", "AM"]
        ];
        
        const csvContent = "\ufeff" + [headers.join(","), ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "leave_import_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('ดาวน์โหลดไฟล์ Template เรียบร้อยแล้ว', 'success');
    };

    const handleDownloadJSONTemplate = () => {
        const template = [
            {
                "email": "employee1@example.com",
                "leave_type": "SICK",
                "start_date": "12/09/2026",
                "end_date": "13/09/2026",
                "reason": "ปวดหัว ตัวร้อน เป็นไข้",
                "is_half_day": false,
                "half_day_session": ""
            },
            {
                "email": "employee2@example.com",
                "leave_type": "VACATION",
                "start_date": "15/10/2026",
                "end_date": "17/10/2026",
                "reason": "พักร้อนประจำปี",
                "is_half_day": false,
                "half_day_session": ""
            },
            {
                "email": "employee1@example.com",
                "leave_type": "PERSONAL",
                "start_date": "20/10/2026",
                "end_date": "20/10/2026",
                "reason": "ทำธุระส่วนตัว",
                "is_half_day": true,
                "half_day_session": "AM"
            }
        ];
        const jsonContent = JSON.stringify(template, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "leave_import_template.json");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('ดาวน์โหลดไฟล์ JSON Template เรียบร้อยแล้ว', 'success');
    };

    const processFile = async (file: File) => {
        const fileName = file.name.toLowerCase();
        const isSupported = fileName.endsWith('.csv') || 
                            fileName.endsWith('.xlsx') || 
                            fileName.endsWith('.xls') || 
                            fileName.endsWith('.json');
                            
        if (!isSupported) {
            showToast('กรุณาอัปโหลดไฟล์ในรูปแบบ CSV (.csv), Excel (.xlsx, .xls) หรือ JSON (.json) เท่านั้น', 'error');
            return;
        }

        setIsImporting(true);
        try {
            const parsedRows = await parseHistoricalLeaveFile(file, allUsers);
            if (parsedRows.length === 0) {
                showToast('ไม่พบข้อมูลการลาย้อนหลังที่ถูกต้องในไฟล์ หรือข้อมูลผู้ใช้ไม่ตรงกับในระบบ', 'warning');
                setIsImporting(false);
                return;
            }

            const confirmImport = await showConfirm(
                `ตรวจพบประวัติการลาที่ถูกต้องจำนวน ${parsedRows.length} รายการ\n\nระบบจะบันทึกเป็นสถานะ อนุมัติแล้ว (APPROVED) และหักโควตาวันลาของพนักงานโดยไม่ส่งผลเสียต่อค่าพลังชีวิต (HP)\n\nต้องการยืนยันการนำเข้าหรือไม่?`,
                'ยืนยันการนำเข้าประวัติการลาสะสม'
            );

            if (!confirmImport) {
                setIsImporting(false);
                return;
            }

            const { error } = await supabase
                .from('leave_requests')
                .insert(parsedRows);

            if (error) throw error;

            if (refreshLeaves) await refreshLeaves();
            if (refreshAttendance) await refreshAttendance();

            showToast(`นำเข้าประวัติการลาย้อนหลังสำเร็จรวม ${parsedRows.length} รายการ! 🎉`, 'success');
            setIsModalOpen(false); // Close modal on success
        } catch (err: any) {
            console.error('Import leave historical error:', err);
            showToast('เกิดข้อผิดพลาดในการนำเข้า: ' + (err.message || err), 'error');
        } finally {
            setIsImporting(false);
        }
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
        if (e.target) e.target.value = ''; // reset file input
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFile(e.dataTransfer.files[0]);
        }
    };

    const leaveTypesHelp = [
        { key: 'SICK', label: 'ลาป่วย (Sick Leave)', desc: 'ป่วยทั่วไป, ปวดหัว, ท้องเสีย เป็นต้น' },
        { key: 'VACATION', label: 'ลาพักร้อน (Vacation Leave)', desc: 'ลาหยุดพักผ่อนประจำปี' },
        { key: 'PERSONAL', label: 'ลากิจ (Personal Leave)', desc: 'ทำธุระส่วนตัว ติดต่อราชการ' },
        { key: 'EMERGENCY', label: 'ลาฉุกเฉิน (Emergency Leave)', desc: 'เหตุด่วนฉุกเฉินที่ไม่คาดคิด' },
        { key: 'LATE_ENTRY', label: 'มาสายชดเชย (Late Entry)', desc: 'ขอมาสายเนื่องจากเหตุจำเป็น' },
        { key: 'ONSITE', label: 'ทำงานนอกสถานที่ (Onsite)', desc: 'ไปพบบริษัทคู่ค้า, ตรวจไซท์งาน' },
        { key: 'WFH', label: 'ทำงานจากบ้าน (WFH)', desc: 'Work from Home' },
        { key: 'UNPAID', label: 'ลาไม่รับค่าจ้าง (Unpaid Leave)', desc: 'ลาหยุดงานโดยไม่ขอรับค่าจ้าง' },
    ];

    return (
        <>
            <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">เครื่องมือนำเข้าประวัติการลาย้อนหลัง</h3>
                        <p className="text-xs text-slate-500">จัดการข้อมูลและอัปโหลดไฟล์ประวัติแบบเป็นกลุ่มเพื่ออัปเดตยอดวันลาสะสม</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 border border-indigo-100 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"

                >
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    จัดการประวัติย้อนหลัง (Admin Utilities)
                </button>
            </div>

            {mounted && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                                onClick={() => !isImporting && setIsModalOpen(false)}
                            />

                            {/* Modal Container */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl border border-slate-100 z-[10000] overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                                            <FileSpreadsheet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">เครื่องมือนำเข้าประวัติการลาย้อนหลัง</h3>
                                            <p className="text-xs text-slate-500">สำหรับนำเข้ารายการอนุมัติแบบกลุ่ม ยอดวันลาสะสมของพนักงานจะอัปเดตทันที</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={isImporting}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Scrollable Content */}
                                <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-600 text-sm">
                                    
                                    {/* Info Banner */}
                                    <div className="flex gap-3 p-4 bg-amber-50/60 border border-amber-100 rounded-2xl">
                                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-semibold text-amber-800 text-xs">ข้อมูลสำคัญก่อนดำเนินการ</p>
                                            <ul className="list-disc list-inside text-[11px] text-amber-700 space-y-1 leading-relaxed">
                                                <li>รายการที่นำเข้าจะถูกปรับเป็นสถานะ <strong>อนุมัติแล้ว (APPROVED)</strong> โดยอัตโนมัติ</li>
                                                <li>ระบบจะแนบคำอธิบายเหตุผลเป็น <code>[MIGRATED] ประวัติการลาย้อนหลัง...</code> เพื่อให้แยกแยะได้</li>
                                                <li>การนำเข้าข้อมูลจะไม่ส่งข้อความแจ้งเตือนซ้ำซ้อนไปยังพนักงาน และไม่หักพลังชีวิต (HP) ของพนักงาน</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Step-by-Step Layout */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        {/* Left Column: Instructions & Template Download */}
                                        <div className="lg:col-span-7 space-y-5">
                                            <div className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-slate-50/30">
                                                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                                                    <span className="flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-600 text-[10px] rounded-full font-bold">1</span>
                                                    ตรวจสอบโครงสร้างข้อมูล (CSV / Excel / JSON)
                                                </h4>
                                                
                                                <div className="space-y-3">
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                        กรุณาใช้ไฟล์ที่มีโครงสร้างหัวคอลัมน์ (สำหรับ CSV/Excel) หรือคีย์ (สำหรับ JSON) ดังต่อไปนี้:
                                                    </p>
                                                    
                                                    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                                                        <table className="w-full text-left border-collapse text-[11px]">
                                                            <thead>
                                                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                                                    <th className="px-3 py-2 font-semibold">ชื่อคอลัมน์</th>
                                                                    <th className="px-3 py-2 font-semibold">ตัวอย่าง</th>
                                                                    <th className="px-3 py-2 font-semibold">หมายเหตุ</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 text-slate-600">
                                                                <tr>
                                                                    <td className="px-3 py-2 font-mono text-indigo-600 font-semibold">email</td>
                                                                    <td className="px-3 py-2">employee1@example.com</td>
                                                                    <td className="px-3 py-2 text-slate-400">อีเมล/Username ของพนักงาน</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="px-3 py-2 font-mono text-indigo-600 font-semibold">leave_type</td>
                                                                    <td className="px-3 py-2">SICK</td>
                                                                    <td className="px-3 py-2 text-slate-400">ดูรหัสประเภทด้านล่าง</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="px-3 py-2 font-mono text-indigo-600 font-semibold">start_date</td>
                                                                    <td className="px-3 py-2">12/09/2026</td>
                                                                    <td className="px-3 py-2 text-slate-400">รูปแบบ DD/MM/YYYY หรือ ISO</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="px-3 py-2 font-mono text-indigo-600 font-semibold">end_date</td>
                                                                    <td className="px-3 py-2">13/09/2026</td>
                                                                    <td className="px-3 py-2 text-slate-400">วันสิ้นสุดการลา</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="px-3 py-2 font-mono text-indigo-600 font-semibold text-slate-400">is_half_day</td>
                                                                    <td className="px-3 py-2 text-slate-400">false</td>
                                                                    <td className="px-3 py-2 text-slate-400">ใส่ true หรือ false (ระบุหรือไม่ระบุก็ได้)</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="px-3 py-2 font-mono text-indigo-600 font-semibold text-slate-400">half_day_session</td>
                                                                    <td className="px-3 py-2 text-slate-400">AM</td>
                                                                    <td className="px-3 py-2 text-slate-400">กรณีครึ่งวัน ใส่ AM หรือ PM</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                <div className="pt-2 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={handleDownloadTemplate}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        ดาวน์โหลด CSV Template
                                                    </button>
                                                    <button
                                                        onClick={handleDownloadJSONTemplate}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        ดาวน์โหลด JSON Template
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Supported Leave Types list */}
                                            <div className="border border-slate-100 rounded-2xl p-5 space-y-3 bg-white">
                                                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                    ประเภทการลาที่ระบบรองรับ (Leave Types)
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                                    {leaveTypesHelp.map((t) => (
                                                        <div key={t.key} className="flex flex-col p-2 bg-slate-50 rounded-xl border border-slate-100">
                                                            <span className="font-mono font-bold text-indigo-600">{t.key}</span>
                                                            <span className="text-slate-700 font-semibold mt-0.5">{t.label}</span>
                                                            <span className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">{t.desc}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Drag and Drop Upload */}
                                        <div className="lg:col-span-5 flex flex-col justify-stretch">
                                            <div className="flex-1 flex flex-col h-full">
                                                <div className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-slate-50/30 flex-1 flex flex-col">
                                                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-600 text-[10px] rounded-full font-bold">2</span>
                                                        อัปโหลดและประมวลผลข้อมูล
                                                    </h4>

                                                    <div 
                                                        onDragEnter={handleDrag}
                                                        onDragOver={handleDrag}
                                                        onDragLeave={handleDrag}
                                                        onDrop={handleDrop}
                                                        onClick={() => !isImporting && fileInputRef.current?.click()}
                                                        className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                                                            dragActive 
                                                            ? 'border-indigo-500 bg-indigo-50/30' 
                                                            : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                                                        } ${isImporting ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    >
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept=".csv,.xlsx,.xls,.json"
                                                            onChange={handleImportFile}
                                                            className="hidden"
                                                            disabled={isImporting}
                                                        />

                                                        {isImporting ? (
                                                            <div className="space-y-3 flex flex-col items-center">
                                                                <div className="relative flex items-center justify-center">
                                                                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-xs text-slate-800">กำลังประมวลผลไฟล์ข้อมูล...</p>
                                                                    <p className="text-[10px] text-slate-400 mt-1">กำลังแมปข้อมูลกับประวัติพนักงานในระบบ</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full inline-block">
                                                                    <UploadCloud className="w-6 h-6 animate-bounce" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="font-bold text-xs text-slate-700">ลากไฟล์ CSV, Excel หรือ JSON มาวาง หรือคลิกเพื่ออัปโหลด</p>
                                                                    <p className="text-[10px] text-slate-400">รองรับไฟล์รูปแบบ .csv, .xlsx, .xls และ .json</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2 p-3.5 bg-indigo-50/30 rounded-xl border border-indigo-50 text-[11px] text-indigo-700 leading-relaxed">
                                                        <div className="flex gap-2 items-start">
                                                            <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                            <div>
                                                                <span className="font-semibold">ข้อแนะนำ:</span> ข้อมูลวันที่สามารถใช้ พ.ศ. (เช่น 2569) หรือ ค.ศ. (เช่น 2026) ได้อย่างยืดหยุ่น โดยระบบจะทำการปรับค่ามาตรฐานให้อัตโนมัติก่อนบันทึก
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end px-8 py-5 border-t border-slate-100 bg-slate-50/50 gap-3">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={isImporting}
                                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        ปิดหน้าต่าง
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
