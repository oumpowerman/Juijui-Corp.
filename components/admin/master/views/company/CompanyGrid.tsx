import React from 'react';
import { Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Company } from '../../../../../types';
import CompanyCard from './CompanyCard';

interface CompanyGridProps {
    companies: Company[];
    isLoading: boolean;
    onToggleActive: (company: Company) => void;
    onEdit: (company: Company) => void;
    onDelete: (company: Company) => void;
}

export const CompanyGrid: React.FC<CompanyGridProps> = ({
    companies,
    isLoading,
    onToggleActive,
    onEdit,
    onDelete
}) => {
    if (isLoading) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200"
            >
                <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-medium text-gray-500 mt-3">กำลังโหลดข้อมูลบริษัทในเครือ...</p>
            </motion.div>
        );
    }

    if (companies.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-xs"
            >
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400 border border-gray-100">
                    <Building2 className="w-7 h-7 text-gray-300" />
                </div>
                <h3 className="text-base font-bold text-gray-700">ไม่พบบริษัทที่ตรงกับเงื่อนไข</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    ลองเปลี่ยนคำค้นหา ปรับตัวกรอง หรือกดปุ่ม "เพิ่มบริษัทใหม่" เพื่อสร้างข้อมูลบริษัทในเครือ
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <AnimatePresence mode="popLayout">
                {companies.map((company, idx) => (
                    <CompanyCard
                        key={company.id}
                        company={company}
                        index={idx}
                        onToggleActive={onToggleActive}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

export default CompanyGrid;
