import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2 } from 'lucide-react';
import { getRegistryItem } from '../../../../constants/attendanceRegistry';

interface FileAttachmentZoneProps {
    file: File | null;
    setFile: (file: File | null) => void;
    selectedType: string;
}

export const FileAttachmentZone: React.FC<FileAttachmentZoneProps> = ({
    file,
    setFile,
    selectedType,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        if (selectedFile) {
            // Check file size (5MB limit)
            if (selectedFile.size > 5 * 1024 * 1024) {
                alert('ขนาดไฟล์เกินกำหนด 5MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    const registryItem = getRegistryItem(selectedType);
    const getAttachmentLabel = () => {
        if (selectedType === 'SICK') return 'แนบใบรับรองแพทย์';
        if (selectedType === 'OUT_OF_RANGE_CHECKOUT') return 'แนบรูปภาพพยานหลักฐานพิกัด GPS/สถานที่จริง (สำคัญ)';
        if (registryItem?.rules.requireAttachment) return 'แนบรูปภาพหรือเอกสารประกอบการพิจารณา (สำคัญ)';
        return 'แนบเอกสารประกอบ (ถ้ามี)';
    };

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => fileInputRef.current?.click()}
            className={`
                p-5 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] border-2 border-dashed transition-all cursor-pointer flex items-center justify-center gap-4 sm:gap-5 group relative overflow-hidden shadow-xl
                ${file ? 'border-emerald-200 bg-emerald-50/60 backdrop-blur-md' : 'border-slate-200 bg-white/40 backdrop-blur-md hover:bg-white hover:border-indigo-200 hover:shadow-indigo-100/30'}
            `}
        >
            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-[1.5rem] shadow-lg transition-all group-hover:rotate-12 ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400'}`}>
                {file ? <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" /> : <Upload className="w-6 h-6 sm:w-8 sm:h-8" />}
            </div>
            <div className="text-left flex-1 min-w-0">
                <p className={`text-sm sm:text-base font-bold truncate ${file ? 'text-emerald-800' : 'text-slate-500 group-hover:text-indigo-600'}`}>
                    {file ? file.name : getAttachmentLabel()}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-bold tracking-wider uppercase">รองรับรูปภาพ และ PDF (สูงสุด 5MB)</p>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,.pdf"
            />
        </motion.div>
    );
};
