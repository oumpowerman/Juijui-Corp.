import React, { useState } from 'react';
import { Crown, Save, UserPlus, Users, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Company, User } from '../../../../../types';
import CompanyBadge from '../../../../common/CompanyBadge';
import AttendeeSelectorModal from '../../../../meeting/AttendeeSelectorModal';

interface SuperApproversSectionProps {
    superApproverAdmins: User[];
    allAdminUsers: User[];
    selectedSuperApproverIds: string[];
    onUpdateSuperApproverIds: (ids: string[]) => void;
    companies: Company[];
    onRemoveSuperApprover: (userId: string) => void;
    onSaveSuperApprovers: () => void;
    isSaving: boolean;
}

export const SuperApproversSection: React.FC<SuperApproversSectionProps> = ({
    superApproverAdmins,
    allAdminUsers,
    selectedSuperApproverIds,
    onUpdateSuperApproverIds,
    companies,
    onRemoveSuperApprover,
    onSaveSuperApprovers,
    isSaving
}) => {
    const [isSelectorModalOpen, setIsSelectorModalOpen] = useState(false);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs relative overflow-hidden"
        >
            {/* Background accent */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-amber-100/40 via-amber-50/20 to-transparent rounded-full pointer-events-none blur-2xl"></div>

            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
                        <Crown className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">
                                ผู้บริหารสูงสุดและสิทธิ์อนุมัติข้ามบริษัท (Group Executives & Super Approvers)
                            </h3>
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                <Crown className="w-3 h-3 text-amber-600" />
                                <span>{superApproverAdmins.length} ท่าน</span>
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                            สิทธิ์พิเศษสำหรับผู้บริหารระดับสูง (ต้องมีสถานะเป็น Admin ในระบบ): ผู้ที่อยู่ในรายชื่อนี้จะได้รับสิทธิ์อนุมัติหรือปฏิเสธคำขอการลาและ OT ของพนักงานได้<strong>ทุกบริษัทในเครือ (All Companies)</strong> โดยไม่ถูกจำกัดตามสังกัดบริษัท
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onSaveSuperApprovers}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าสิทธิ์'}</span>
                </button>
            </div>

            {/* Super Approvers List Cards / Container */}
            <div className="mt-6">
                {superApproverAdmins.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-10 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200"
                    >
                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-gray-600">ยังไม่มีการกำหนดผู้บริหารสิทธิ์อนุมัติทุกบริษัท</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                            ในกรณีที่ไม่มีการกำหนดรายชื่อ Admin แต่ละท่านจะสามารถอนุมัติคำขอได้เฉพาะพนักงานที่สังกัดบริษัทเดียวกันเท่านั้น
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsSelectorModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ เพิ่มผู้บริหารตอนนี้</span>
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
                    >
                        <AnimatePresence mode="popLayout">
                            {superApproverAdmins.map((admin, idx) => {
                                const adminComp = companies.find(c => c.id === admin.companyId);
                                return (
                                    <motion.div
                                        key={admin.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.85, y: -10 }}
                                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                                        className="bg-white rounded-2xl p-4 border border-amber-200/80 hover:border-amber-300 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                {admin.avatarUrl ? (
                                                    <img
                                                        src={admin.avatarUrl}
                                                        alt={admin.name}
                                                        className="w-11 h-11 rounded-full object-cover border-2 border-amber-300"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-700 flex items-center justify-center font-bold text-sm">
                                                        {admin.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white shadow-xs">
                                                    👑
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h4 className="text-sm font-bold text-gray-800 truncate">
                                                        {admin.name}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    {adminComp ? (
                                                        <CompanyBadge company={adminComp} size="sm" showFullName={false} forceShow={true} />
                                                    ) : (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                                            HQ / ทุกบริษัท
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 truncate">
                                                        👑 อนุมัติทุกบริษัท
                                                    </span>
                                                </div>

                                                {admin.email && (
                                                    <p className="text-[11px] text-gray-400 mt-1 truncate">
                                                        {admin.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onRemoveSuperApprover(admin.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer opacity-70 group-hover:opacity-100 shrink-0"
                                            title="ถอนสิทธิ์ผู้บริหารสูงสุด"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Add Executive Card in Grid Container */}
                        <motion.button
                            type="button"
                            onClick={() => setIsSelectorModalOpen(true)}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="h-full min-h-[76px] rounded-2xl border-2 border-dashed border-amber-300/80 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50/70 flex items-center justify-center gap-2.5 p-4 text-amber-800 font-bold text-xs transition-all cursor-pointer shadow-2xs group"
                        >
                            <div className="w-7 h-7 rounded-full bg-amber-100 group-hover:bg-amber-200 text-amber-700 flex items-center justify-center transition-colors">
                                <UserPlus className="w-3.5 h-3.5" />
                            </div>
                            <span>+ เพิ่มผู้บริหารตอนนี้</span>
                        </motion.button>
                    </motion.div>
                )}
            </div>

            {/* AttendeeSelectorModal (Upgraded for Super Approver Selection with Amber Theme & Company Grouping) */}
            <AttendeeSelectorModal
                isOpen={isSelectorModalOpen}
                onClose={() => setIsSelectorModalOpen(false)}
                users={allAdminUsers}
                selectedIds={selectedSuperApproverIds}
                onConfirm={(newIds) => onUpdateSuperApproverIds(newIds)}
                title="เลือกผู้บริหารมอบสิทธิ์อนุมัติทุกบริษัท"
                subtitle="เลือกบัญชี Admin ที่ต้องการมอบสิทธิ์อนุมัติข้ามทุกบริษัทในเครือ"
                icon={<Crown className="w-6 h-6 text-white" />}
                themeColor="amber"
                groupBy="company"
                companies={companies}
            />
        </motion.div>
    );
};

export default SuperApproversSection;
