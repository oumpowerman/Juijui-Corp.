import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileSpreadsheet, 
    Sparkles, 
    X, 
    Download, 
    UploadCloud, 
    FileCode, 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    Loader2, 
    Layers, 
    Tv, 
    CheckSquare,
    HelpCircle
} from 'lucide-react';
import { Channel, MasterOption, User } from '../../../types';
import { generateContentStockCSVTemplate, generateContentStockJSONTemplate } from '../../../services/csvService';

interface StockImportGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    onProcessFile: (file: File) => Promise<void>;
    isProcessing?: boolean;
    onDownloadCSVTemplate?: () => void;
    onDownloadJSONTemplate?: () => void;
}

export const StockImportGuideModal: React.FC<StockImportGuideModalProps> = ({
    isOpen,
    onClose,
    channels,
    users,
    masterOptions,
    onProcessFile,
    isProcessing = false,
    onDownloadCSVTemplate,
    onDownloadJSONTemplate
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState<'FIELDS' | 'REFERENCE'>('FIELDS');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        const csvContent = generateContentStockCSVTemplate(masterOptions, channels);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `content_stock_template_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [masterOptions, channels, onDownloadCSVTemplate]);

    const handleDownloadJSON = useCallback(() => {
        if (onDownloadJSONTemplate) {
            onDownloadJSONTemplate();
            return;
        }
        const jsonContent = generateContentStockJSONTemplate(masterOptions, channels);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `content_stock_template_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [masterOptions, channels, onDownloadJSONTemplate]);

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
            await onProcessFile(file);
        } catch (err: any) {
            setUploadError(err.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์');
        }
    }, [onProcessFile]);

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

    // Filter reference items
    const activeChannels = channels || [];
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT');
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS');
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR');
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY');

    if (!isOpen) return null;

    const modalContent = (
        <AnimatePresence>
            <div 
                id="stock-import-guide-modal-backdrop"
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget && !isProcessing) {
                        onClose();
                    }
                }}
            >
                <motion.div
                    id="stock-import-guide-modal-container"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                    className="relative w-full max-w-5xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[28px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50/50 via-white to-emerald-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 shadow-sm">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                        ศูนย์นำเข้าคลังคอนเทนต์
                                    </h2>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                        <Sparkles className="w-3 h-3" />
                                        Smart Import
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    นำเข้าและจัดโครงสร้างรายการคอนเทนต์จำนวนมากผ่านไฟล์ CSV, Excel หรือ JSON พร้อมระบบจับคู่ข้อมูลอัตโนมัติ
                                </p>
                            </div>
                        </div>

                        <button
                            id="btn-close-import-guide-modal"
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Notice Banner */}
                    <div className="px-6 py-3.5 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-800/30 flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                            <span className="font-semibold">ข้อแนะนำสำคัญสำหรับการนำเข้า:</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 text-amber-700/90 dark:text-amber-300/80">
                                <div>• <strong>Content Topic (หัวข้อ)</strong> เป็นฟิลด์เดียวที่จำเป็นต้องระบุ</div>
                                <div>• <strong>สถานะ (Status)</strong> หากเว้นว่างไว้ จะถูกตั้งเป็น <span className="font-semibold">TODO</span> ให้อัตโนมัติ</div>
                                <div>• <strong>วันเผยแพร่ (Publish Date)</strong> รองรับทั้ง พ.ศ. และ ค.ศ. (เว้นว่าง = คลัง Unscheduled)</div>
                                <div>• <strong>ผู้รับผิดชอบ / ผู้ตัดต่อ</strong> ตรวจจับอัตโนมัติทั้งจากชื่อเต็ม ชื่อเล่น และอีเมล</div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Body - 2 Columns */}
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Column Left: Schema Guide & Templates (7 cols) */}
                        <div className="lg:col-span-7 flex flex-col space-y-4">
                            {/* Step 1 Header & Action Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                                        1
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                        โครงสร้างข้อมูลและตัวอย่าง Template
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        id="btn-download-csv-template"
                                        type="button"
                                        onClick={handleDownloadCSV}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 transition-all shadow-xs"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>CSV Template</span>
                                    </button>
                                    <button
                                        id="btn-download-json-template"
                                        type="button"
                                        onClick={handleDownloadJSON}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 transition-all shadow-xs"
                                    >
                                        <FileCode className="w-3.5 h-3.5" />
                                        <span>JSON Template</span>
                                    </button>
                                </div>
                            </div>

                            {/* Tabs for Fields vs Master Reference */}
                            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('FIELDS')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                        activeTab === 'FIELDS'
                                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    ฟิลด์และคอลัมน์ที่รองรับ (Fields)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('REFERENCE')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                        activeTab === 'REFERENCE'
                                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    ค่าอ้างอิงในระบบ (Master Options)
                                </button>
                            </div>

                            {/* Tab Content: Fields Table */}
                            {activeTab === 'FIELDS' ? (
                                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50 shadow-xs">
                                    <div className="max-h-[360px] overflow-y-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                                                <tr>
                                                    <th className="py-2.5 px-3.5 font-semibold text-slate-700 dark:text-slate-300">ชื่อคอลัมน์ (ไทย/อังกฤษ)</th>
                                                    <th className="py-2.5 px-2.5 font-semibold text-slate-700 dark:text-slate-300">สถานะ</th>
                                                    <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">ตัวอย่างข้อมูล</th>
                                                    <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">คำอธิบาย</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                                                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                        Content Topic <br />
                                                        <span className="text-[11px] text-slate-400 font-normal">ชื่อคอนเทนต์, หัวข้อ</span>
                                                    </td>
                                                    <td className="py-2 px-2.5">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                                                            จำเป็น
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 italic">"รีวิวกล้องใหม่"</td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">หัวข้อหลักของคอนเทนต์</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                        Channel <br />
                                                        <span className="text-[11px] text-slate-400 font-normal">Chanel, ช่อง</span>
                                                    </td>
                                                    <td className="py-2 px-2.5">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            แนะนำ
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 italic">"Juijui Vlog"</td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">จับคู่กับช่องที่มีในระบบ</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                        Status <br />
                                                        <span className="text-[11px] text-slate-400 font-normal">สถานะ, ขั้นตอน</span>
                                                    </td>
                                                    <td className="py-2 px-2.5">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            ตัวเลือก
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 italic">"TODO", "IDEA"</td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">หากเว้นว่างจะตั้งเป็น TODO</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                        Publish Date <br />
                                                        <span className="text-[11px] text-slate-400 font-normal">วันที่เผยแพร่, วันลงงาน</span>
                                                    </td>
                                                    <td className="py-2 px-2.5">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            ตัวเลือก
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 italic">"15/10/2026"</td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">รองรับ พ.ศ./ค.ศ. (เว้นว่าง = สต๊อก)</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                        Format / Pillar / Category
                                                    </td>
                                                    <td className="py-2 px-2.5">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            ตัวเลือก
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 italic">"Short Form"</td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">จับคู่ตาม Master Data</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                        Owner / Edit / Sub <br />
                                                        <span className="text-[11px] text-slate-400 font-normal">ผู้รับผิดชอบ, คนตัด</span>
                                                    </td>
                                                    <td className="py-2 px-2.5">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            ตัวเลือก
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 italic">"สมชาย", "บอย"</td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">จับคู่ชื่อเต็ม ชื่อเล่น หรืออีเมล</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                        Post / Platform <br />
                                                        <span className="text-[11px] text-slate-400 font-normal">แพลตฟอร์ม</span>
                                                    </td>
                                                    <td className="py-2 px-2.5">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            ตัวเลือก
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 italic">"YT, TT, FB, IG"</td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">ตรวจจับแท็กแพลตฟอร์มอัตโนมัติ</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                                    <td className="py-2 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                        IDEA & Remark <br />
                                                        <span className="text-[11px] text-slate-400 font-normal">บรีฟ, รายละเอียด</span>
                                                    </td>
                                                    <td className="py-2 px-2.5">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            ตัวเลือก
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 italic">"บรีฟเนื้อหา..."</td>
                                                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">รายละเอียดและหมายเหตุ</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                /* Tab Content: Master Reference Chips */
                                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900/50 shadow-xs max-h-[360px] overflow-y-auto space-y-4 text-xs">
                                    {/* Channels */}
                                    <div>
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 mb-2">
                                            <Tv className="w-4 h-4 text-indigo-500" />
                                            <span>ช่องที่เปิดใช้งานในระบบ ({activeChannels.length} ช่อง)</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {activeChannels.map(c => (
                                                <span key={c.id} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 text-[11px] font-medium">
                                                    {c.name}
                                                </span>
                                            ))}
                                            {activeChannels.length === 0 && (
                                                <span className="text-slate-400 italic">ยังไม่มีช่องในระบบ</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content Formats */}
                                    <div>
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 mb-2">
                                            <Layers className="w-4 h-4 text-emerald-500" />
                                            <span>รูปแบบคอนเทนต์ (Format)</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {formatOptions.map(o => (
                                                <span key={o.id || o.key} className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-medium">
                                                    {o.label || o.key}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Statuses */}
                                    <div>
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 mb-2">
                                            <CheckSquare className="w-4 h-4 text-amber-500" />
                                            <span>สถานะงาน (Status)</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {statusOptions.map(o => (
                                                <span key={o.id || o.key} className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-[11px] font-medium">
                                                    {o.label || o.key} ({o.key})
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pillars & Categories */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">Pillars</span>
                                            <div className="flex flex-wrap gap-1">
                                                {pillarOptions.slice(0, 8).map(o => (
                                                    <span key={o.id || o.key} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                                                        {o.label || o.key}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">Categories</span>
                                            <div className="flex flex-wrap gap-1">
                                                {categoryOptions.slice(0, 8).map(o => (
                                                    <span key={o.id || o.key} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                                                        {o.label || o.key}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Column Right: Drag & Drop Zone (5 cols) */}
                        <div className="lg:col-span-5 flex flex-col space-y-4">
                            {/* Step 2 Header */}
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                                    2
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    อัปโหลดและประมวลผลไฟล์
                                </h3>
                            </div>

                            {/* Drag & Drop Area */}
                            <div
                                id="stock-import-dropzone"
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => {
                                    if (!isProcessing) fileInputRef.current?.click();
                                }}
                                className={`flex-1 min-h-[260px] p-6 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                                    isDragging
                                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 scale-[1.01]'
                                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 dark:bg-slate-800/40 dark:hover:bg-slate-800/80'
                                } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelected(file);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                />

                                {isProcessing ? (
                                    <div className="flex flex-col items-center space-y-3">
                                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            กำลังตรวจสอบและประมวลผลข้อมูล...
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            ระบบกำลังตรวจสอบชื่อฟิลด์ แมปข้อมูลช่อง และผู้รับผิดชอบ
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="p-4 bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-xs">
                                            <UploadCloud className="w-8 h-8" />
                                        </div>

                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                ลากไฟล์มาวางที่นี่ หรือ <span className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2">คลิกเพื่อเลือกไฟล์</span>
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                รองรับไฟล์ CSV, Excel (.xlsx, .xls) และ JSON
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 pt-1">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                .CSV
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                                .XLSX
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                                .XLS
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                                .JSON
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error Alert if any */}
                            {uploadError && (
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{uploadError}</span>
                                </div>
                            )}

                            {/* Safe Verification Tips */}
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span>การันตีความปลอดภัยก่อนบันทึก:</span>
                                </div>
                                <p className="text-[11px] leading-relaxed">
                                    เมื่อวางไฟล์แล้ว ระบบจะพาไปยัง <strong>หน้าจอ Preview</strong> เพื่อตรวจสอบสรุปแถวที่ถูกต้อง ข้อควรระวัง (Warnings) และแถวที่ไม่ผ่าน (Errors) ให้คุณแก้ไขได้ก่อนกดยืนยันบันทึกลงฐานข้อมูลจริง
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <HelpCircle className="w-4 h-4 text-slate-400" />
                            <span>หากมีข้อสงสัยหรือต้องการเพิ่มตัวเลือก Master Data สามารถตั้งค่าได้ที่หน้า Master Data</span>
                        </div>

                        <button
                            id="btn-footer-close-guide"
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
