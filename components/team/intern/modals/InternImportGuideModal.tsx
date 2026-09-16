import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users2, 
    Sparkles, 
    X, 
    Download, 
    UploadCloud, 
    FileCode, 
    FileSpreadsheet, 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    Loader2, 
    HelpCircle, 
    Calendar, 
    Tag, 
    UserCheck, 
    Briefcase,
    GraduationCap
} from 'lucide-react';
import { generateInternCSVTemplate, generateInternJSONTemplate } from '../../../../services/csvService';
import { INTERN_STATUS_META, GENDER_META } from '../../../../services/internImportValidator';

interface InternImportGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProcessFile: (file: File, baseYear: number) => Promise<void>;
    isProcessing?: boolean;
    onDownloadCSVTemplate?: () => void;
    onDownloadJSONTemplate?: () => void;
    onOpenAiExtract?: () => void;
}

export const InternImportGuideModal: React.FC<InternImportGuideModalProps> = ({
    isOpen,
    onClose,
    onProcessFile,
    isProcessing = false,
    onDownloadCSVTemplate,
    onDownloadJSONTemplate,
    onOpenAiExtract
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState<'FIELDS' | 'REFERENCE'>('FIELDS');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const currentYear = new Date().getFullYear();
    const [baseYear, setBaseYear] = useState<number>(currentYear);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isProcessing) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isProcessing, onClose]);

    // Clear error on open/close
    useEffect(() => {
        if (isOpen) {
            setUploadError(null);
        }
    }, [isOpen]);

    const handleDownloadCSV = useCallback(() => {
        if (onDownloadCSVTemplate) {
            onDownloadCSVTemplate();
            return;
        }
        const csvContent = generateInternCSVTemplate();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `intern_template_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [onDownloadCSVTemplate]);

    const handleDownloadJSON = useCallback(() => {
        if (onDownloadJSONTemplate) {
            onDownloadJSONTemplate();
            return;
        }
        const jsonContent = generateInternJSONTemplate();
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `intern_template_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [onDownloadJSONTemplate]);

    const handleFileSelected = useCallback(async (file: File) => {
        if (!file) return;
        const validExtensions = ['csv', 'xlsx', 'xls', 'json'];
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        if (!validExtensions.includes(ext)) {
            setUploadError('รองรับเฉพาะไฟล์ .csv, .xlsx, .xls หรือ .json เท่านั้น');
            return;
        }

        setUploadError(null);
        try {
            await onProcessFile(file, baseYear);
        } catch (err: any) {
            setUploadError(err.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์');
        }
    }, [onProcessFile, baseYear]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isProcessing) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelected(files[0]);
        }
    };

    if (typeof document === 'undefined') return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="intern-import-guide-modal-wrapper"
                    id="intern-import-guide-modal-wrapper"
                    className="fixed inset-0 z-[2100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
                >
                    {/* Backdrop */}
                    <motion.div
                        key="intern-import-guide-modal-backdrop"
                        id="intern-import-guide-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
                        onClick={() => {
                            if (!isProcessing) {
                                onClose();
                            }
                        }}
                    />

                    <motion.div
                        key="intern-import-guide-modal-container"
                        id="intern-import-guide-modal-container"
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                        className="relative z-10 w-full max-w-5xl bg-white border border-slate-200/80 rounded-[28px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                    {/* 1. Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-indigo-50/30">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-600 shadow-xs">
                                <Users2 className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                        ศูนย์นำเข้าข้อมูลเด็กฝึกงาน (Intern Candidates)
                                    </h2>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                        Smart Ingestion
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    นำเข้าข้อมูลผู้สมัครฝึกงานจำนวนมาก รองรับ CSV, Excel (.xlsx, .xls) และ JSON พร้อมระบบตรวจสอบความถูกต้องอัตโนมัติ
                                </p>
                            </div>
                        </div>

                        <button
                            id="btn-close-intern-guide-modal"
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Notice Banner */}
                    <div className="px-6 py-3 bg-indigo-50/70 border-b border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900 leading-relaxed">
                        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                            <strong>คำแนะนำการจัดเตรียมข้อมูล:</strong> ควรมีคอลัมน์ชื่อ-นามสกุล, ตำแหน่ง, มหาวิทยาลัย และระยะเวลาฝึกงาน เช่น <code className="px-1.5 py-0.5 bg-indigo-100 rounded-md font-mono text-[11px]">01/06/2026 - 31/08/2026</code> หรือแบบย่อ <code className="px-1.5 py-0.5 bg-indigo-100 rounded-md font-mono text-[11px]">23/03 - 05/06</code> ระบบจะตรวจจับภาษาไทย คำนวณวัน และจับคู่สถานะให้อัตโนมัติ
                        </div>
                    </div>

                    {/* 2. Main Content Grid */}
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Side: Columns & Reference Data (7 cols) */}
                        <div className="lg:col-span-7 flex flex-col space-y-4">
                            {/* Tab Switcher */}
                            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl w-fit">
                                <button
                                    id="tab-btn-fields"
                                    type="button"
                                    onClick={() => setActiveTab('FIELDS')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === 'FIELDS'
                                            ? 'bg-white text-slate-800 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    <span>โครงสร้างคอลัมน์ (Supported Fields)</span>
                                </button>
                                <button
                                    id="tab-btn-reference"
                                    type="button"
                                    onClick={() => setActiveTab('REFERENCE')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === 'REFERENCE'
                                            ? 'bg-white text-slate-800 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <Tag className="w-3.5 h-3.5" />
                                    <span>สถานะและค่าอ้างอิง (Master Options)</span>
                                </button>
                            </div>

                            {/* Tab 1: Fields Guide */}
                            {activeTab === 'FIELDS' && (
                                <div className="space-y-3">
                                    <div className="text-xs text-slate-500 flex items-center justify-between">
                                        <span>คอลัมน์ที่ระบบตรวจจับและรองรับในการ Import:</span>
                                        <span className="text-[11px] text-rose-500">* จำเป็นต้องมี</span>
                                    </div>

                                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                        {[
                                            {
                                                name: 'ชื่อ-นามสกุล (Name)',
                                                required: true,
                                                desc: 'ชื่อจริงและนามสกุลของผู้สมัครฝึกงาน',
                                                example: 'นายสมศักดิ์ ขยันยิ่ง',
                                                keywords: 'Name, ชื่อ, Fullname, ชื่อ-นามสกุล'
                                            },
                                            {
                                                name: 'ชื่อเล่น (Nickname)',
                                                required: false,
                                                desc: 'ชื่อเล่นเพื่อใช้เรียกในทีม',
                                                example: 'ก้อง',
                                                keywords: 'Nickname, ชื่อเล่น'
                                            },
                                            {
                                                name: 'เพศ (Gender)',
                                                required: false,
                                                desc: 'เพศของผู้สมัคร (ชาย / หญิง / อื่นๆ)',
                                                example: 'ชาย หรือ หญิง',
                                                keywords: 'Gen, Gender, เพศ'
                                            },
                                            {
                                                name: 'ตำแหน่ง (Position)',
                                                required: false,
                                                desc: 'ตำแหน่งงานที่ยื่นสมัครฝึกงาน',
                                                example: 'VIDEO EDITOR, CREATIVE, GRAPHIC',
                                                keywords: 'Position, ตำแหน่ง, Role, Job'
                                            },
                                            {
                                                name: 'มหาวิทยาลัย (University)',
                                                required: false,
                                                desc: 'สถาบันการศึกษาต้นสังกัด',
                                                example: 'มหาวิทยาลัยกรุงเทพ, จุฬาฯ',
                                                keywords: 'University, มหาลัย, มหาวิทยาลัย'
                                            },
                                            {
                                                name: 'คณะ / สาขาวิชา (Faculty)',
                                                required: false,
                                                desc: 'คณะวิชาหรือสาขาวิชาที่ศึกษา',
                                                example: 'นิเทศศาสตร์, วารสารศาสตร์',
                                                keywords: 'Faculty, คณะ'
                                            },
                                            {
                                                name: 'ชั้นปี (Academic Year)',
                                                required: false,
                                                desc: 'ชั้นปีการศึกษาปัจจุบัน',
                                                example: 'ปี 3, ปี 4',
                                                keywords: 'Year, ชั้นปี, ปี'
                                            },
                                            {
                                                name: 'ระยะเวลาฝึกงาน (Period)',
                                                required: false,
                                                desc: 'ช่วงเวลาเริ่มต้นและสิ้นสุดการฝึกงาน',
                                                example: '01/06/2026 - 31/08/2026 หรือ 23/03 - 05/06',
                                                keywords: 'Period, ช่วงเวลา, ระยะฝึกงาน'
                                            },
                                            {
                                                name: 'เบอร์โทรศัพท์ (Phone)',
                                                required: false,
                                                desc: 'เบอร์ติดต่อสำหรับนัดสัมภาษณ์',
                                                example: '0812345678',
                                                keywords: 'Tel, Phone, เบอร์, โทร'
                                            },
                                            {
                                                name: 'อีเมล (Email)',
                                                required: false,
                                                desc: 'อีเมลสำหรับส่งแบบทดสอบหรือผลคัดเลือก',
                                                example: 'intern@gmail.com',
                                                keywords: 'Email, Mail, อีเมล'
                                            },
                                            {
                                                name: 'Portfolio Link',
                                                required: false,
                                                desc: 'ลิงก์ผลงาน, Drive, หรือ Notion Resume',
                                                example: 'https://behance.net/...',
                                                keywords: 'Portfolio, พอร์ต, link'
                                            },
                                            {
                                                name: 'สถานะการคัดเลือก (Status)',
                                                required: false,
                                                desc: 'สถานะปัจจุบัน เช่น รอสัมภาษณ์, ผ่าน, นัดแล้ว',
                                                example: 'ยังไม่ได้นัดสัมภาษณ์, ผ่าน',
                                                keywords: 'Status, สถานะ'
                                            },
                                            {
                                                name: 'หมายเหตุ (Notes)',
                                                required: false,
                                                desc: 'จุดเด่น ทักษะพิเศษ หรือข้อสังเกต',
                                                example: 'ถนัด Premiere Pro และตัดต่อคลิปไวรัล',
                                                keywords: 'Note, หมายเหตุ, Remark'
                                            },
                                            {
                                                name: 'ช่องทางที่สมัคร (Source)',
                                                required: false,
                                                desc: 'ช่องทางที่ส่งใบสมัครเข้ามา',
                                                example: 'Facebook, Email, อาจารย์ส่งมา',
                                                keywords: 'Source, ช่องทาง, มาจาก'
                                            }
                                        ].map((field, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-2xl transition-all text-xs"
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-slate-800">
                                                            {field.name}
                                                        </span>
                                                        {field.required ? (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 font-bold text-[10px] border border-rose-200">
                                                                จำเป็น
                                                            </span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-slate-200/70 text-slate-600 font-medium text-[10px]">
                                                                ไม่บังคับ
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        {field.keywords}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 mb-1 leading-relaxed">
                                                    {field.desc}
                                                </p>
                                                <div className="text-[11px] text-slate-500 bg-white/80 px-2 py-1 rounded-lg border border-slate-200/50 inline-block font-mono">
                                                    ตัวอย่าง: {field.example}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Reference Options */}
                            {activeTab === 'REFERENCE' && (
                                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 text-xs">
                                    {/* Status List */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                            <UserCheck className="w-4 h-4 text-indigo-600" />
                                            <span>สถานะการคัดเลือก (Candidate Statuses)</span>
                                        </div>
                                        <p className="text-slate-500 text-[11px]">
                                            ระบบจะจับคู่คำภาษาไทยหรืออังกฤษเข้ากับสถานะมาตรฐานโดยอัตโนมัติ:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {Object.entries(INTERN_STATUS_META).map(([key, meta]) => (
                                                <div
                                                    key={key}
                                                    className="p-2.5 rounded-xl border bg-white border-slate-200/80 flex items-start gap-2 shadow-2xs"
                                                >
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.color} shrink-0`}>
                                                        {meta.label}
                                                    </span>
                                                    <div className="text-[11px] text-slate-500 leading-tight">
                                                        {meta.desc}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Gender List */}
                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                            <Tag className="w-4 h-4 text-indigo-600" />
                                            <span>เพศ (Gender)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {Object.entries(GENDER_META).map(([key, meta]) => (
                                                <div
                                                    key={key}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${meta.color}`}
                                                >
                                                    {meta.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recommended Positions */}
                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                            <Briefcase className="w-4 h-4 text-indigo-600" />
                                            <span>ตัวอย่างตำแหน่งยอดนิยม</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                'VIDEO EDITOR',
                                                'CREATIVE CONTENT',
                                                'GRAPHIC DESIGNER',
                                                'PRODUCTION ASSISTANT',
                                                'SOCIAL MEDIA ADMIN',
                                                'SOUND ENGINEER',
                                                'MOTION GRAPHIC'
                                            ].map((pos) => (
                                                <span
                                                    key={pos}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200"
                                                >
                                                    {pos}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Templates & Upload Area (5 cols) */}
                        <div className="lg:col-span-5 flex flex-col space-y-4">
                            {/* Step 1: Download Templates */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Download className="w-4 h-4 text-indigo-600" />
                                        <span>ขั้นตอนที่ 1: ดาวน์โหลด Template</span>
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    ดาวน์โหลดไฟล์ตัวอย่างที่มีข้อมูลตัวอย่างพร้อมใช้นำไปกรอกข้อมูลได้ทันที
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        id="btn-download-intern-csv"
                                        type="button"
                                        onClick={handleDownloadCSV}
                                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-700 font-semibold text-xs transition-all shadow-xs"
                                    >
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                        <span>ไฟล์ CSV Template</span>
                                    </button>
                                    <button
                                        id="btn-download-intern-json"
                                        type="button"
                                        onClick={handleDownloadJSON}
                                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-700 font-semibold text-xs transition-all shadow-xs"
                                    >
                                        <FileCode className="w-4 h-4 text-indigo-600" />
                                        <span>ไฟล์ JSON Template</span>
                                    </button>
                                </div>
                            </div>

                            {/* Base Year Selector */}
                            <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-indigo-900">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                    <div>
                                        <div className="font-bold">ปี ค.ศ. ฐาน (Base Year)</div>
                                        <div className="text-[10px] text-indigo-600">กรณีในไฟล์ระบุแค่วัน/เดือน เช่น "23/03"</div>
                                    </div>
                                </div>
                                <select
                                    value={baseYear}
                                    onChange={(e) => setBaseYear(parseInt(e.target.value, 10))}
                                    className="px-2.5 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 font-bold text-xs outline-hidden shadow-2xs cursor-pointer"
                                >
                                    {yearOptions.map(y => (
                                        <option key={y} value={y}>
                                            ค.ศ. {y} (พ.ศ. {y + 543})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Step 2: Upload Area */}
                            <div className="flex-1 flex flex-col space-y-2">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <UploadCloud className="w-4 h-4 text-indigo-600" />
                                    <span>ขั้นตอนที่ 2: อัปโหลดไฟล์เพื่อประมวลผล</span>
                                </span>

                                <div
                                    id="intern-import-dropzone"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                                    className={`flex-1 min-h-[190px] border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative overflow-hidden ${
                                        isDragging
                                            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                                            : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
                                    }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv, .xlsx, .xls, .json"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleFileSelected(f);
                                            e.target.value = '';
                                        }}
                                        className="hidden"
                                    />

                                    {isProcessing ? (
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                            <div className="text-xs font-bold text-slate-700">
                                                กำลังตรวจสอบและวิเคราะห์โครงสร้างข้อมูล...
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                ระบบกำลังคำนวณวันและจับคู่สถานะ
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center space-y-2.5">
                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-indigo-600">
                                                <UploadCloud className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700">
                                                    ลากไฟล์มาวางที่นี่ หรือ <span className="text-indigo-600 underline">คลิกเพื่อเลือกไฟล์</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1">
                                                    รองรับไฟล์ CSV, Excel (.xlsx, .xls) หรือ JSON
                                                </p>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                                                <span>เข้ารหัส UTF-8 และ TIS-620 อัตโนมัติ</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {onOpenAiExtract && (
                                    <div className="pt-1">
                                        <button
                                            id="btn-trigger-ai-import-guide"
                                            type="button"
                                            onClick={onOpenAiExtract}
                                            disabled={isProcessing}
                                            className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 hover:from-indigo-100 hover:via-purple-100 hover:to-pink-100 border border-indigo-200/80 text-indigo-950 flex items-center justify-between transition-all group shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-2.5 text-left">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                                                    <Sparkles className="w-4 h-4 text-amber-300" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold flex items-center gap-1.5">
                                                        <span>หรือ นำเข้าด้วย AI จากภาพ / แชท</span>
                                                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-200 text-indigo-800">
                                                            Smart Ingestion
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] sm:text-[11px] text-indigo-700/80">
                                                        วางรูปภาพ หรือก๊อปปี้แชท LINE ให้ Gemini สกัดเข้าสู่ตารางตรวจสอบทันที
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0 ml-1">
                                                <span>ลองเลย &rarr;</span>
                                            </span>
                                        </button>
                                    </div>
                                )}

                                {uploadError && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                        <span>{uploadError}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>ข้อมูลจะถูกนำเข้าสู่ระบบหลังผ่านหน้าต่างตรวจสอบ Smart Preview เท่านั้น</span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors disabled:opacity-50"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default InternImportGuideModal;
