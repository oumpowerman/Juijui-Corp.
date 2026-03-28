
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import Papa from 'papaparse';
import { internMappingService } from '../../../../services/internMappingService';
import { InternCandidate } from '../../../../types';

interface InternImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: Partial<InternCandidate>[]) => Promise<void>;
}

const InternImportModal: React.FC<InternImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [encoding, setEncoding] = useState<'UTF-8' | 'TIS-620'>('UTF-8');
    const [baseYear, setBaseYear] = useState<number>(new Date().getFullYear());
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                setError('กรุณาเลือกไฟล์ CSV เท่านั้น');
                return;
            }
            setFile(selectedFile);
            setError(null);
            parseFile(selectedFile, encoding);
        }
    };

    const parseFile = (file: File, currentEncoding: string) => {
        setIsParsing(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: currentEncoding,
            complete: (results) => {
                setPreview(results.data);
                setIsParsing(false);
            },
            error: (err) => {
                setError('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
                setIsParsing(false);
            }
        });
    };

    const handleEncodingChange = (newEncoding: 'UTF-8' | 'TIS-620') => {
        setEncoding(newEncoding);
        if (file) {
            parseFile(file, newEncoding);
        }
    };

    const handleImport = async () => {
        if (preview.length === 0) return;
        
        setIsImporting(true);
        try {
            const mappedData = preview.map(row => internMappingService.mapRowToIntern(row, baseYear));
            await onImport(mappedData);
            onClose();
        } catch (err: any) {
            setError('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + err.message);
        } finally {
            setIsImporting(false);
        }
    };

    const mappedPreview = preview.slice(0, 10).map(row => internMappingService.mapRowToIntern(row, baseYear));

    const downloadTemplate = () => {
        const headers = [
            'Gen', 'Source', 'Date', 'Month', 'Name', 'Position', 'Status', 
            'Nickname', 'Year', 'Period', 'Notes', 'Portfolio', 
            'DurationDays', 'University', 'Faculty', 'Phone', 'Email'
        ];
        const csvContent = headers.join(',') + '\n';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'intern_import_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Upload className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">นำเข้าข้อมูลจาก CSV</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Import Interns from Google Sheet</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all shadow-sm border border-transparent hover:border-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                            {!file ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileText className="w-8 h-8 text-indigo-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-gray-700">คลิกเพื่อเลือกไฟล์ CSV</p>
                                        <p className="text-sm text-gray-400">หรือลากไฟล์มาวางที่นี่</p>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".csv"
                                        className="hidden"
                                    />
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            downloadTemplate();
                                        }}
                                        className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                        <Download className="w-4 h-4" />
                                        ดาวน์โหลดไฟล์ตัวอย่าง (Template)
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-100 gap-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-6 h-6 text-indigo-600" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{file.name}</p>
                                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ปีที่เริ่มฝึกงาน (พ.ศ.)</span>
                                                <select 
                                                    value={baseYear}
                                                    onChange={(e) => setBaseYear(parseInt(e.target.value))}
                                                    className="bg-white border border-indigo-100 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                                                >
                                                    {yearOptions.map(year => (
                                                        <option key={year} value={year}>{year + 543}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">รหัสภาษา</span>
                                                <div className="flex bg-white p-1 rounded-xl border border-indigo-100 shadow-sm">
                                                    <button 
                                                        onClick={() => handleEncodingChange('UTF-8')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${encoding === 'UTF-8' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >
                                                        UTF-8
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEncodingChange('TIS-620')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${encoding === 'TIS-620' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >
                                                        TIS-620
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => {
                                                    setFile(null);
                                                    setPreview([]);
                                                }}
                                                className="text-xs font-bold text-red-500 hover:text-red-600 mt-4"
                                            >
                                                เปลี่ยนไฟล์
                                            </button>
                                        </div>
                                    </div>

                                    {isParsing ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                            <p className="text-sm font-bold text-gray-500">กำลังประมวลผลไฟล์...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">ตัวอย่างข้อมูล ({preview.length} รายการ)</h3>
                                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    พร้อมนำเข้า
                                                </div>
                                            </div>
                                            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                                <div className="max-h-[300px] overflow-auto custom-scrollbar">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-gray-50 sticky top-0">
                                                            <tr>
                                                                <th className="px-4 py-3 font-bold text-gray-500">Name</th>
                                                                <th className="px-4 py-3 font-bold text-gray-500">Position</th>
                                                                <th className="px-4 py-3 font-bold text-gray-500">Period</th>
                                                                <th className="px-4 py-3 font-bold text-gray-500">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {mappedPreview.map((intern, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                                    <td className="px-4 py-3">
                                                                        <div className="font-bold text-gray-700">{intern.fullName || '-'}</div>
                                                                        <div className="text-[10px] text-gray-400">{intern.university}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-gray-500 font-medium">{intern.position || '-'}</td>
                                                                    <td className="px-4 py-3 text-gray-500">
                                                                        {intern.startDate?.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })} - {intern.endDate?.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-600">
                                                                            {intern.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {preview.length > 10 && (
                                                                <tr>
                                                                    <td colSpan={4} className="px-4 py-3 text-center text-gray-400 italic">
                                                                        และอีก {preview.length - 10} รายการ...
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm font-bold text-red-600">{error}</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-white hover:text-gray-700 transition-all border border-transparent hover:border-gray-200"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                disabled={!file || preview.length === 0 || isImporting}
                                onClick={handleImport}
                                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl text-base font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        กำลังนำเข้า...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        ยืนยันการนำเข้า
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default InternImportModal;
