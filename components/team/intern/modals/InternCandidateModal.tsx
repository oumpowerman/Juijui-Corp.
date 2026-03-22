
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Phone, GraduationCap, Briefcase, Calendar, Link as LinkIcon, MessageSquare, BarChart3 } from 'lucide-react';
import { InternCandidate, InternStatus, Gender } from '../../../../types';
import { format } from 'date-fns';
import GenderSelector from './form-components/GenderSelector';
import PositionSelector from './form-components/PositionSelector';
import UniversityAutocomplete from './form-components/UniversityAutocomplete';
import DriveImageUpload from './form-components/DriveImageUpload';
import FormSection from './form-components/FormSection';
import FilterDropdown from '../../../common/FilterDropdown';

interface InternCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<InternCandidate>) => Promise<void>;
    intern?: InternCandidate;
    allInterns?: InternCandidate[];
}

const InternCandidateModal: React.FC<InternCandidateModalProps> = ({ isOpen, onClose, onSave, intern, allInterns = [] }) => {
    const [formData, setFormData] = useState<Partial<InternCandidate>>({
        fullName: '',
        email: '',
        phoneNumber: '',
        university: '',
        portfolioUrl: '',
        avatarUrl: '',
        gender: 'OTHER',
        position: '',
        startDate: new Date(),
        endDate: new Date(),
        status: 'APPLIED',
        interviewDate: null,
        notes: ''
    });

    const uniqueUniversities = useMemo(() => {
        const unis = allInterns.map(i => i.university).filter(u => u && u.trim() !== '');
        return Array.from(new Set(unis));
    }, [allInterns]);

    useEffect(() => {
        if (intern) {
            setFormData({
                ...intern,
                startDate: new Date(intern.startDate),
                endDate: new Date(intern.endDate),
                interviewDate: intern.interviewDate ? new Date(intern.interviewDate) : null
            });
        } else {
            setFormData({
                fullName: '',
                email: '',
                phoneNumber: '',
                university: '',
                portfolioUrl: '',
                avatarUrl: '',
                gender: 'OTHER',
                position: '',
                startDate: new Date(),
                endDate: new Date(),
                status: 'APPLIED',
                interviewDate: null,
                notes: ''
            });
        }
    }, [intern, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
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
                        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <GraduationCap className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                                        {intern ? 'แก้ไขข้อมูลผู้สมัคร' : 'เพิ่มผู้สมัครฝึกงาน'}
                                    </h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Intern Candidate Details</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={onClose} 
                                className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all shadow-sm border border-transparent hover:border-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Content */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {/* Profile Image & Basic Info */}
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <DriveImageUpload 
                                    value={formData.avatarUrl || ''} 
                                    onChange={url => setFormData({ ...formData, avatarUrl: url })} 
                                />

                                <div className="flex-1 w-full space-y-6">
                                    <FormSection title="ข้อมูลส่วนตัว" icon={User} colorClass="text-indigo-600">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ชื่อ-นามสกุล</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input 
                                                    required
                                                    type="text"
                                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-200 rounded-2xl text-base font-bold outline-none transition-all shadow-sm"
                                                    value={formData.fullName}
                                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                    placeholder="ชื่อจริง - นามสกุล"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">เพศ</label>
                                            <GenderSelector 
                                                value={formData.gender || 'OTHER'} 
                                                onChange={val => setFormData({ ...formData, gender: val })} 
                                            />
                                        </div>
                                    </FormSection>
                                </div>
                            </div>

                            <FormSection title="ข้อมูลติดต่อ" icon={Mail} colorClass="text-blue-600">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">อีเมล</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            required
                                            type="email"
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-200 rounded-2xl text-base font-bold outline-none transition-all shadow-sm"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="example@email.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            required
                                            type="tel"
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-200 rounded-2xl text-base font-bold outline-none transition-all shadow-sm"
                                            value={formData.phoneNumber}
                                            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            placeholder="08x-xxx-xxxx"
                                        />
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection title="การศึกษาและผลงาน" icon={GraduationCap} colorClass="text-purple-600">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">มหาวิทยาลัย / สถาบัน</label>
                                    <UniversityAutocomplete 
                                        value={formData.university || ''} 
                                        onChange={val => setFormData({ ...formData, university: val })} 
                                        suggestions={uniqueUniversities}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ตำแหน่งที่สมัคร</label>
                                    <PositionSelector 
                                        value={formData.position || ''} 
                                        onChange={val => setFormData({ ...formData, position: val })} 
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Link Portfolio / Resume</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            type="url"
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-200 rounded-2xl text-base font-bold outline-none transition-all shadow-sm"
                                            value={formData.portfolioUrl}
                                            onChange={e => setFormData({ ...formData, portfolioUrl: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection title="ระยะเวลาและสถานะ" icon={Calendar} colorClass="text-emerald-600">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">วันที่เริ่มฝึกงาน</label>
                                    <input 
                                        required
                                        type="date"
                                        className="w-full px-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-200 rounded-2xl text-base font-bold outline-none transition-all shadow-sm"
                                        value={formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : ''}
                                        onChange={e => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">วันที่จบการฝึกงาน</label>
                                    <input 
                                        required
                                        type="date"
                                        className="w-full px-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-200 rounded-2xl text-base font-bold outline-none transition-all shadow-sm"
                                        value={formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : ''}
                                        onChange={e => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">สถานะปัจจุบัน</label>
                                    <FilterDropdown 
                                        label="สถานะ"
                                        value={formData.status || 'APPLIED'}
                                        options={[
                                            { key: 'APPLIED', label: 'สมัครเข้ามา (Applied)' },
                                            { key: 'INTERVIEW_SCHEDULED', label: 'นัดสัมภาษณ์แล้ว (Scheduled)' },
                                            { key: 'INTERVIEWED', label: 'สัมภาษณ์แล้ว (Interviewed)' },
                                            { key: 'ACCEPTED', label: 'รับเข้าฝึกงาน (Accepted)' },
                                            { key: 'REJECTED', label: 'ไม่ผ่านการคัดเลือก (Rejected)' },
                                            { key: 'ARCHIVED', label: 'ย้ายไปที่เก็บถาวร (Archived)' },
                                        ]}
                                        onChange={val => setFormData({ ...formData, status: val as InternStatus })}
                                        icon={<BarChart3 className="w-4 h-4" />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">วันนัดสัมภาษณ์ (ถ้ามี)</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full px-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-200 rounded-2xl text-base font-bold outline-none transition-all shadow-sm"
                                        value={formData.interviewDate ? format(formData.interviewDate, "yyyy-MM-dd'T'HH:mm") : ''}
                                        onChange={e => setFormData({ ...formData, interviewDate: e.target.value ? new Date(e.target.value) : null })}
                                    />
                                </div>
                            </FormSection>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> บันทึกเพิ่มเติม
                                </h3>
                                <textarea 
                                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-200 rounded-2xl text-base font-bold outline-none transition-all min-h-[120px] shadow-sm"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="รายละเอียดเพิ่มเติมจากการสัมภาษณ์ หรือบันทึกจากทีมงาน..."
                                />
                            </div>
                        </form>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-white hover:text-gray-700 transition-all border border-transparent hover:border-gray-200"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl text-base font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                <Save className="w-5 h-5" />
                                บันทึกข้อมูล
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default InternCandidateModal;
