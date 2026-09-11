import React, { useState, useEffect } from 'react';
import { 
    CheckSquare, Square, Eye, EyeOff, Trash2, Edit2, Globe 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterOption, MatrixRow } from '../../types';
import { Pagination } from '../common/Pagination';
import { PILLAR_ITEMS_PER_PAGE } from '../../pillarConstants';

interface PillarMatrixViewProps {
    matrixRows: MatrixRow[];
    selectedItemIds: Set<string>;
    handleSelectAllMatrix: (items: MasterOption[]) => void;
    handleToggleItemSelection: (id: string) => void;
    handleBatchToggleActive: (setActive: boolean) => void;
    handleBatchDelete: () => void;
    setSelectedItemIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    handleToggleActive: (pillar: MasterOption) => void;
    handleOpenCreateCategory: (pillarKey: string) => void;
    handleOpenEditPillar: (pillar: MasterOption) => void;
    handleOpenEditCategory: (cat: MasterOption) => void;
    handleDeleteOption: (option: MasterOption) => void;
}

export const PillarMatrixView: React.FC<PillarMatrixViewProps> = ({
    matrixRows,
    selectedItemIds,
    handleSelectAllMatrix,
    handleToggleItemSelection,
    handleBatchToggleActive,
    handleBatchDelete,
    setSelectedItemIds,
    handleToggleActive,
    handleOpenCreateCategory,
    handleOpenEditPillar,
    handleOpenEditCategory,
    handleDeleteOption
}) => {
    // Pagination: 5 rows per page
    const ITEMS_PER_PAGE = PILLAR_ITEMS_PER_PAGE;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(matrixRows.length / ITEMS_PER_PAGE);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [matrixRows.length, totalPages, currentPage]);

    const paginatedRows = matrixRows.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );


    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Batch Actions Bar */}
            {selectedItemIds.size > 0 && (
                <div className="px-6 py-3 bg-indigo-600 text-white flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">
                            เลือกแล้ว {selectedItemIds.size} รายการ
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleBatchToggleActive(true)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                            <Eye className="w-3.5 h-3.5" /> เปิดใช้งานทั้งหมด
                        </button>
                        <button
                            onClick={() => handleBatchToggleActive(false)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                            <EyeOff className="w-3.5 h-3.5" /> ปิดใช้งานทั้งหมด
                        </button>
                        <button
                            onClick={handleBatchDelete}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> ลบที่เลือก
                        </button>
                        <button
                            onClick={() => setSelectedItemIds(new Set())}
                            className="px-2.5 py-1.5 text-white/80 hover:text-white text-xs font-bold transition-colors"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-black text-[10px] tracking-wider">
                            <th className="py-3 px-4 w-10">
                                <button
                                    onClick={() => handleSelectAllMatrix(matrixRows.map(r => r.pillar))}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {selectedItemIds.size === matrixRows.length && matrixRows.length > 0 ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                        <Square className="w-4 h-4" />
                                    )}
                                </button>
                            </th>
                            <th className="py-3 px-4">ช่อง / รายการ (Channel)</th>
                            <th className="py-3 px-4">แกนเนื้อหา (Pillar)</th>
                            <th className="py-3 px-4">หมวดหมู่ย่อย (Categories)</th>
                            <th className="py-3 px-4 text-center">สถานะ</th>
                            <th className="py-3 px-4 text-center">ลำดับ</th>
                            <th className="py-3 px-4 text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <AnimatePresence mode="wait">
                        <motion.tbody 
                            key={`matrix-page-${currentPage}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="divide-y divide-gray-100"
                        >
                            {paginatedRows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400">
                                        ไม่พบข้อมูลตามเงื่อนไข
                                    </td>
                                </tr>
                            )}
                            {paginatedRows.map(({ pillar, channel, categories }) => {
                                const isSelected = selectedItemIds.has(pillar.id);

                                return (
                                    <tr 
                                        key={pillar.id}
                                        className={`hover:bg-gray-50/80 transition-colors ${
                                            isSelected ? 'bg-indigo-50/40' : ''
                                        }`}
                                    >
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleToggleItemSelection(pillar.id)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                                                ) : (
                                                    <Square className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>

                                        {/* Channel */}
                                        <td className="py-3 px-4 font-bold text-gray-800">
                                            {channel ? (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-md ${channel.color || 'bg-indigo-600'} text-white text-[10px] font-black flex items-center justify-center shrink-0`}>
                                                        {channel.name.slice(0, 1)}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs">{channel.name}</span>
                                                        <div className="flex gap-1 mt-0.5">
                                                            {channel.platforms?.map(p => (
                                                                <span key={p} className="text-[8px] px-1 py-0.2 bg-gray-100 text-gray-500 rounded">
                                                                    {p}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200 flex items-center gap-1 w-max">
                                                    <Globe className="w-3 h-3" /> Global
                                                </span>
                                            )}
                                        </td>

                                        {/* Pillar */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${pillar.color || 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                                    {pillar.label}
                                                </span>
                                                <span className="text-[10px] font-mono text-gray-400">{pillar.key}</span>
                                            </div>
                                            {pillar.description && (
                                                <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{pillar.description}</p>
                                            )}
                                        </td>

                                        {/* Categories */}
                                        <td className="py-3 px-4">
                                            <div className="flex flex-wrap gap-1 max-w-md items-center">
                                                {categories.map(cat => (
                                                    <span 
                                                        key={cat.id} 
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                            cat.isActive ? 'bg-white text-gray-700 border-gray-200' : 'bg-gray-100 text-gray-400 border-transparent line-through'
                                                        }`}
                                                    >
                                                        {cat.label}
                                                    </span>
                                                ))}
                                                <button
                                                    onClick={() => handleOpenCreateCategory(pillar.key)}
                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200"
                                                    title="เพิ่ม Category ย่อย"
                                                >
                                                    + เพิ่ม
                                                </button>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => handleToggleActive(pillar)}
                                                className={`px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${
                                                    pillar.isActive 
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                                        : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                                                }`}
                                            >
                                                {pillar.isActive ? 'เปิดใช้' : 'ปิดใช้'}
                                            </button>
                                        </td>

                                        {/* Sort Order */}
                                        <td className="py-3 px-4 text-center font-mono font-bold text-gray-400">
                                            {pillar.sortOrder || 10}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleOpenEditPillar(pillar)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="แก้ไข Pillar"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOption(pillar)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="ลบ Pillar"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </motion.tbody>
                    </AnimatePresence>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(p) => setCurrentPage(p)}
                    totalItems={matrixRows.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </div>
        </div>
    );
};
export default PillarMatrixView;
