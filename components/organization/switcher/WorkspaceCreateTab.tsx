import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Plus, Sparkles } from 'lucide-react';
import { useOrganization } from '../../../context/OrganizationContext';
import { SAAS_PLAN_PRESETS } from '../../../lib/multiTenantMigrationSql';
import { PlanTier } from '../../../types';
import {
    WORKSPACE_COLOR_PRESETS,
    staggerContainerVariants,
    staggerItemVariants
} from './workspaceSwitcherConstants';

export const WorkspaceCreateTab: React.FC = () => {
    const {
        isSuperAdmin,
        createOrganization,
        setActiveModalTab,
        closeSwitcherModal
    } = useOrganization();

    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgDesc, setNewOrgDesc] = useState('');
    const [newOrgColor, setNewOrgColor] = useState(WORKSPACE_COLOR_PRESETS[0].value);
    const [newOrgPlan, setNewOrgPlan] = useState<PlanTier>('PRO');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isSuperAdmin) return null;

    const selectedPlanPreset = SAAS_PLAN_PRESETS[newOrgPlan] || SAAS_PLAN_PRESETS.PRO;

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrgName.trim() || isSubmitting || !isSuperAdmin) return;
        setIsSubmitting(true);
        const preset = SAAS_PLAN_PRESETS[newOrgPlan] || SAAS_PLAN_PRESETS.PRO;
        const created = await createOrganization({
            name: newOrgName.trim(),
            description: newOrgDesc.trim(),
            color: newOrgColor,
            planTier: newOrgPlan,
            maxMembers: preset.defaultMaxMembers,
            allowedModules: [...preset.defaultModules],
            generateOwnerClaimLink: true
        });
        setIsSubmitting(false);
        if (created) {
            setNewOrgName('');
            setNewOrgDesc('');
            setActiveModalTab('SWITCH');
            closeSwitcherModal();
        }
    };

    const previewInitials = (newOrgName.trim() || 'NW').slice(0, 2).toUpperCase();

    return (
        <motion.form
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onSubmit={handleCreateSubmit}
            className="space-y-4"
        >
            {/* Super Admin Banner + Live Organization Preview */}
            <motion.div
                variants={staggerItemVariants}
                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border border-emerald-200/80 space-y-3.5 shadow-2xs"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                        <p className="font-bold text-sm text-slate-900">
                            เปิดองค์กรใหม่ให้ลูกค้าด่วน (Super Admin Quick Provision)
                        </p>
                        <p className="leading-relaxed">
                            สร้าง Workspace ใหม่พร้อมชุดข้อมูลตั้งต้นและลิงก์ส่งมอบสิทธิ์เจ้าขององค์กรอัตโนมัติ
                        </p>
                    </div>
                </div>

                {/* Live Workspace Card Preview */}
                <div className="p-3 rounded-xl bg-white/95 border border-emerald-200/70 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${newOrgColor}`}
                        >
                            {previewInitials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                                {newOrgName.trim() || 'ตัวอย่างชื่อองค์กรลูกค้าใหม่'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                                {newOrgDesc.trim() || `โควตาสูงสุด ${selectedPlanPreset.defaultMaxMembers} ที่นั่ง · ${selectedPlanPreset.defaultModules.length} โมดูล`}
                            </p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                        <Crown className="w-3 h-3 text-amber-500" />
                        {newOrgPlan}
                    </span>
                </div>
            </motion.div>

            {/* Organization Form Fields */}
            <motion.div
                variants={staggerItemVariants}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5"
            >
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ชื่อองค์กร / บริษัทลูกค้า *
                    </label>
                    <input
                        type="text"
                        required
                        value={newOrgName}
                        onChange={e => setNewOrgName(e.target.value)}
                        placeholder="เช่น บริษัท ครีเอทีฟ สตูดิโอ จำกัด"
                        className="w-full px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            แพ็กเกจเริ่มต้น (Plan Tier)
                        </label>
                        <select
                            value={newOrgPlan}
                            onChange={e => setNewOrgPlan(e.target.value as PlanTier)}
                            className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 outline-none focus:border-indigo-500 transition-all"
                        >
                            <option value="STARTER">STARTER (10 คน · โมดูลพื้นฐาน)</option>
                            <option value="PRO">PRO (30 คน · สตูดิโอเต็มรูปแบบ)</option>
                            <option value="ENTERPRISE">ENTERPRISE (100 คน · ครบทุกโมดูล)</option>
                            <option value="LIFETIME">LIFETIME (ตลอดชีพ · ครบทุกโมดูล)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            คำอธิบายองค์กร
                        </label>
                        <input
                            type="text"
                            value={newOrgDesc}
                            onChange={e => setNewOrgDesc(e.target.value)}
                            placeholder="เช่น แพ็กเกจรายปี"
                            className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        โทนสีประจำองค์กร (Brand Identity)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {WORKSPACE_COLOR_PRESETS.map(preset => {
                            const isSelected = newOrgColor === preset.value;
                            return (
                                <motion.button
                                    key={preset.label}
                                    type="button"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setNewOrgColor(preset.value)}
                                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                        isSelected
                                            ? `${preset.value} ring-2 ${preset.ring} shadow-2xs`
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full ${preset.dot} shrink-0`} />
                                    <span>{preset.label}</span>
                                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            <motion.button
                variants={staggerItemVariants}
                whileHover={{ scale: !newOrgName.trim() || isSubmitting ? 1 : 1.01, y: !newOrgName.trim() || isSubmitting ? 0 : -1 }}
                whileTap={{ scale: !newOrgName.trim() || isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={!newOrgName.trim() || isSubmitting}
                className="w-full py-3.5 px-5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังเปิดองค์กรให้ลูกค้า...' : 'เปิดองค์กรใหม่และสร้างลิงก์ส่งมอบสิทธิ์'}</span>
            </motion.button>
        </motion.form>
    );
};

