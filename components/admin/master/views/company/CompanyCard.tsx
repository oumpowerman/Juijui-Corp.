import React from 'react';
import { Power, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Company } from '../../../../../types';
import CompanyBadge from '../../../../common/CompanyBadge';

interface CompanyCardProps {
    company: Company;
    index: number;
    onToggleActive: (company: Company) => void;
    onEdit: (company: Company) => void;
    onDelete: (company: Company) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
    company,
    index,
    onToggleActive,
    onEdit,
    onDelete
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
            className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between relative group ${
                company.isActive 
                    ? 'border-gray-200 hover:border-indigo-200 shadow-xs' 
                    : 'border-dashed border-gray-200 bg-gray-50/50 opacity-75'
            }`}
        >
            {/* Card Top */}
            <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <CompanyBadge 
                            company={company}
                            size="sm"
                            showFullName={false}
                            forceShow={true}
                        />
                        <span className="text-xs font-mono font-bold text-gray-400">
                            #{company.code || company.shortName}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            ลำดับ {company.sortOrder || index + 1}
                        </span>
                    </div>
                </div>

                <h3 className="text-base font-bold text-gray-800 leading-snug">
                    {company.name}
                </h3>

                <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">
                    {company.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </p>
            </div>

            {/* Card Bottom */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onToggleActive(company)}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            company.isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title={company.isActive ? 'กดเพื่อปิดใช้งาน' : 'กดเพื่อเปิดใช้งาน'}
                    >
                        <Power className="w-3 h-3" />
                        <span>{company.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}</span>
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onEdit(company)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                        title="แก้ไขข้อมูลบริษัท"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(company)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="ลบบริษัท"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default CompanyCard;
