import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Organization, PlanTier, SubscriptionStatus } from '../../../../../types';
import { UpdateOrganizationLicenseInput } from '../../../../../context/OrganizationContext';
import { SAAS_PLAN_PRESETS } from '../../../../../lib/multiTenantMigrationSql';
import { ALL_AVAILABLE_MODULES } from './multiTenantConstants';

interface EditTenantLicenseModalProps {
    editingOrg: Organization | null;
    onClose: () => void;
    onUpdateLicense: (orgId: string, updates: UpdateOrganizationLicenseInput) => Promise<boolean>;
}

export const EditTenantLicenseModal: React.FC<EditTenantLicenseModalProps> = ({
    editingOrg,
    onClose,
    onUpdateLicense
}) => {
    const [editPlan, setEditPlan] = useState<PlanTier>('PRO');
    const [editStatus, setEditStatus] = useState<SubscriptionStatus>('ACTIVE');
    const [editMaxMembers, setEditMaxMembers] = useState<number>(35);
    const [editExpiresAt, setEditExpiresAt] = useState<string>('');
    const [editGraceDays, setEditGraceDays] = useState<number>(7);
    const [editUnrestrictedModules, setEditUnrestrictedModules] = useState<boolean>(false);
    const [editAllowedModules, setEditAllowedModules] = useState<string[]>([]);
    const [isSavingLicense, setIsSavingLicense] = useState(false);

    useEffect(() => {
        if (!editingOrg) return;
        setEditPlan(editingOrg.planTier || 'PRO');
        setEditStatus(editingOrg.subscriptionStatus || 'ACTIVE');
        setEditMaxMembers(editingOrg.maxMembers || 35);
        setEditGraceDays(editingOrg.gracePeriodDays ?? 7);
        setEditExpiresAt(
            editingOrg.expiresAt ? new Date(editingOrg.expiresAt).toISOString().slice(0, 10) : ''
        );
        if (!editingOrg.allowedModules || editingOrg.allowedModules.length === 0) {
            setEditUnrestrictedModules(true);
            setEditAllowedModules(ALL_AVAILABLE_MODULES.map(m => m.id));
        } else {
            setEditUnrestrictedModules(false);
            setEditAllowedModules(editingOrg.allowedModules);
        }
    }, [editingOrg]);

    const handleApplyPresetInEdit = (tier: PlanTier) => {
        setEditPlan(tier);
        const preset = SAAS_PLAN_PRESETS[tier];
        if (!preset) return;
        setEditMaxMembers(preset.maxMembers);
        if (preset.allowedModules === null) {
            setEditUnrestrictedModules(true);
            setEditAllowedModules(ALL_AVAILABLE_MODULES.map(m => m.id));
        } else {
            setEditUnrestrictedModules(false);
            setEditAllowedModules([...preset.allowedModules]);
        }
    };

    const handleToggleModuleInEdit = (viewId: string) => {
        setEditUnrestrictedModules(false);
        setEditAllowedModules(prev =>
            prev.includes(viewId) ? prev.filter(v => v !== viewId) : [...prev, viewId]
        );
    };

    const handleQuickExtend = (days: number | null) => {
        if (days === null) {
            setEditExpiresAt('');
            setEditPlan('LIFETIME');
            setEditStatus('ACTIVE');
            return;
        }
        const baseDate = editExpiresAt ? new Date(editExpiresAt) : new Date();
        const safeBase = baseDate > new Date() ? baseDate : new Date();
        safeBase.setDate(safeBase.getDate() + days);
        setEditExpiresAt(safeBase.toISOString().slice(0, 10));
        setEditStatus('ACTIVE');
    };

    const handleSaveLicenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrg) return;
        setIsSavingLicense(true);
        try {
            const isoExpiry = editExpiresAt
                ? new Date(`${editExpiresAt}T23:59:59Z`).toISOString()
                : null;
            const ok = await onUpdateLicense(editingOrg.id, {
                planTier: editPlan,
                subscriptionStatus: editStatus,
                maxMembers: editMaxMembers,
                expiresAt: isoExpiry,
                gracePeriodDays: editGraceDays,
                allowedModules: editUnrestrictedModules ? null : editAllowedModules
            });
            if (ok) {
                onClose();
            }
        } finally {
            setIsSavingLicense(false);
        }
    };

    return (
        <AnimatePresence>
            {editingOrg && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-3xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* 1. Rigid Header */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">
                                    ตั้งค่าลิขสิทธิ์และเมนู Sidebar: {editingOrg.name}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    เลือกแพ็กเกจ, วันหมดอายุ และกำหนดว่าบริษัทนี้สามารถเห็น Module ใดใน Sidebar ได้บ้าง
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 2. Scrollable Body */}
                        <form
                            id="edit-license-form"
                            onSubmit={handleSaveLicenseSubmit}
                            className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-5"
                        >
                            {/* Preset Quick Apply */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    1. แพ็กเกจหลัก (กดเพื่อใช้ค่ามาตรฐานของแพ็กเกจ หรือปรับแต่งแยกด้านล่าง)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(Object.keys(SAAS_PLAN_PRESETS) as PlanTier[]).map(tier => (
                                        <button
                                            key={tier}
                                            type="button"
                                            onClick={() => handleApplyPresetInEdit(tier)}
                                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                                editPlan === tier
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {tier}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status, Quota & Expiry */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        สถานะสัญญา (Status)
                                    </label>
                                    <select
                                        value={editStatus}
                                        onChange={e => setEditStatus(e.target.value as SubscriptionStatus)}
                                        className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-white"
                                    >
                                        <option value="ACTIVE">ACTIVE (ใช้งานปกติ)</option>
                                        <option value="TRIAL">TRIAL (ทดลองใช้)</option>
                                        <option value="GRACE_PERIOD">GRACE_PERIOD (ผ่อนผัน)</option>
                                        <option value="PAST_DUE">PAST_DUE (ค้างชำระ)</option>
                                        <option value="SUSPENDED">SUSPENDED (ระงับชั่วคราว)</option>
                                        <option value="EXPIRED">EXPIRED (หมดอายุ)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        โควตาสมาชิกสูงสุด (คน)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={editMaxMembers}
                                        onChange={e => setEditMaxMembers(Number(e.target.value) || 10)}
                                        className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-200 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        วันหมดอายุ (เว้นว่าง = ตลอดชีพ)
                                    </label>
                                    <input
                                        type="date"
                                        value={editExpiresAt}
                                        onChange={e => setEditExpiresAt(e.target.value)}
                                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Quick Extend Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">ต่ออายุทางลัด:</span>
                                <button
                                    type="button"
                                    onClick={() => handleQuickExtend(30)}
                                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                                >
                                    +30 วัน (1 เดือน)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickExtend(365)}
                                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                                >
                                    +365 วัน (1 ปี)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickExtend(null)}
                                    className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg"
                                >
                                    เปิดสิทธิ์ตลอดชีพ (Lifetime)
                                </button>
                            </div>

                            {/* Per-Company Module Entitlement Matrix */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">
                                            2. กำหนดสิทธิ์การมองเห็น Module ใน Sidebar รายบริษัท
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            เมนูที่ไม่ถูกติ๊กจะถูกซ่อนจาก Sidebar ของพนักงานทุกคนในบริษัทนี้ทันที
                                        </p>
                                    </div>
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editUnrestrictedModules}
                                            onChange={e => {
                                                setEditUnrestrictedModules(e.target.checked);
                                                if (e.target.checked) {
                                                    setEditAllowedModules(ALL_AVAILABLE_MODULES.map(m => m.id));
                                                }
                                            }}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-indigo-700">
                                            ปลดล็อกทุก Module (Unrestricted)
                                        </span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {ALL_AVAILABLE_MODULES.map(mod => {
                                        const checked =
                                            editUnrestrictedModules || editAllowedModules.includes(mod.id);
                                        return (
                                            <button
                                                key={mod.id}
                                                type="button"
                                                onClick={() => handleToggleModuleInEdit(mod.id)}
                                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                                                    checked
                                                        ? 'bg-indigo-50/70 border-indigo-300 text-slate-900'
                                                        : 'bg-slate-50 border-slate-200 text-slate-400'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold truncate">{mod.label}</p>
                                                    <p className="text-[10px] text-slate-500 truncate">{mod.id}</p>
                                                </div>
                                                <div
                                                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                                        checked
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-white border border-slate-300'
                                                    }`}
                                                >
                                                    {checked && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </form>

                        {/* 3. Rigid Sticky Footer */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                form="edit-license-form"
                                disabled={isSavingLicense}
                                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md"
                            >
                                {isSavingLicense ? 'กำลังบันทึก...' : 'บันทึกแพ็กเกจและสิทธิ์ Module'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
