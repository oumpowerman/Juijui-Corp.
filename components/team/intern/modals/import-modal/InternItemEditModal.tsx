import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ParsedInternItemPreview, 
    INTERN_STATUS_META, 
    GENDER_META 
} from '../../../../../services/internImportValidator';
import { InternStatus, Gender } from '../../../../../types';
import { X, Save, Sparkles, AlertCircle } from 'lucide-react';

interface InternItemEditModalProps {
    isOpen: boolean;
    item: ParsedInternItemPreview;
    onClose: () => void;
    onSave: (updated: ParsedInternItemPreview) => void;
}

export const InternItemEditModal: React.FC<InternItemEditModalProps> = ({
    isOpen,
    item,
    onClose,
    onSave
}) => {
    const [fullName, setFullName] = useState(item.fullName);
    const [nickname, setNickname] = useState(item.nickname);
    const [gender, setGender] = useState<Gender>(item.gender);
    const [position, setPosition] = useState(item.position);
    const [university, setUniversity] = useState(item.university);
    const [faculty, setFaculty] = useState(item.faculty);
    const [academicYear, setAcademicYear] = useState(item.academicYear);
    const [startDateStr, setStartDateStr] = useState(item.startDateStr);
    const [endDateStr, setEndDateStr] = useState(item.endDateStr);
    const [phoneNumber, setPhoneNumber] = useState(item.phoneNumber);
    const [email, setEmail] = useState(item.email);
    const [portfolioUrl, setPortfolioUrl] = useState(item.portfolioUrl);
    const [status, setStatus] = useState<InternStatus>(item.status);
    const [notes, setNotes] = useState(item.notes);
    const [source, setSource] = useState(item.source);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...item,
            fullName: fullName.trim(),
            nickname: nickname.trim(),
            gender,
            position: position.trim().toUpperCase(),
            university: university.trim(),
            faculty: faculty.trim(),
            academicYear: academicYear.trim(),
            startDateStr,
            endDateStr,
            rawPeriod: `${startDateStr} - ${endDateStr}`,
            phoneNumber: phoneNumber.trim(),
            email: email.trim(),
            portfolioUrl: portfolioUrl.trim(),
            status,
            notes: notes.trim(),
            source: source.trim()
        });
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[2300] flex items-center justify-center p-4 font-sans select-none overflow-hidden">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden z-10"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold text-xs">
                                #{item.index}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">
                                    แก้ไขข้อมูลแถว #{item.index}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    แก้ไขและตรวจสอบข้อมูลก่อนนำเข้าจริง
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                        {/* Error Alert if currently invalid */}
                        {!item.isValid && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-800">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <span className="font-semibold">ข้อผิดพลาดที่ต้องแก้ไข:</span>
                                    <div className="text-[11px] text-rose-700">
                                        {item.errors.join(' • ')}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Name & Nickname */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 space-y-1">
                                <label className="font-semibold text-slate-700">
                                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="เช่น นายสมศักดิ์ ขยันยิ่ง"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">ชื่อเล่น</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="เช่น ก้อง"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>
                        </div>

                        {/* Gender & Position */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">เพศ</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as Gender)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                >
                                    <option value="MALE">ชาย (Boy)</option>
                                    <option value="FEMALE">หญิง (Girl)</option>
                                    <option value="OTHER">อื่นๆ (Other)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">ตำแหน่งที่สมัคร</label>
                                <input
                                    type="text"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="เช่น VIDEO EDITOR, CREATIVE"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden uppercase"
                                />
                            </div>
                        </div>

                        {/* University, Faculty, Year */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">มหาวิทยาลัย / สถาบัน</label>
                                <input
                                    type="text"
                                    value={university}
                                    onChange={(e) => setUniversity(e.target.value)}
                                    placeholder="เช่น มหาวิทยาลัยกรุงเทพ"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">คณะ / สาขาวิชา</label>
                                <input
                                    type="text"
                                    value={faculty}
                                    onChange={(e) => setFaculty(e.target.value)}
                                    placeholder="เช่น นิเทศศาสตร์"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">ชั้นปี</label>
                                <input
                                    type="text"
                                    value={academicYear}
                                    onChange={(e) => setAcademicYear(e.target.value)}
                                    placeholder="เช่น ปี 3, ปี 4"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>
                        </div>

                        {/* Internship Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">วันเริ่มฝึกงาน</label>
                                <input
                                    type="date"
                                    value={startDateStr}
                                    onChange={(e) => setStartDateStr(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">วันสิ้นสุดฝึกงาน</label>
                                <input
                                    type="date"
                                    value={endDateStr}
                                    onChange={(e) => setEndDateStr(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">เบอร์โทรศัพท์</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="เช่น 0812345678"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">อีเมล</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="เช่น student@gmail.com"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>
                        </div>

                        {/* Portfolio & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">Portfolio Link</label>
                                <input
                                    type="text"
                                    value={portfolioUrl}
                                    onChange={(e) => setPortfolioUrl(e.target.value)}
                                    placeholder="เช่น https://behance.net/..."
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">สถานะการคัดเลือก</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as InternStatus)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden font-semibold"
                                >
                                    {(Object.entries(INTERN_STATUS_META) as [InternStatus, { label: string; color: string; desc: string }][]).map(([k, meta]) => (
                                        <option key={k} value={k}>
                                            {meta.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Notes & Source */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">หมายเหตุ / จุดเด่น</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="เช่น ถนัดตัดต่อ TikTok, มีอุปกรณ์พร้อม"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700">ช่องทางที่สมัคร</label>
                                <input
                                    type="text"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="เช่น Facebook, Instagram, อาจารย์แนะนำ"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                                />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                            >
                                <Save className="w-4 h-4" />
                                <span>บันทึกและตรวจสอบทันที</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};
