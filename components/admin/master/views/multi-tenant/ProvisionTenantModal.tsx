import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, X } from 'lucide-react';
import { Organization, PlanTier } from '../../../../../types';
import { CreateOrganizationInput } from '../../../../../context/OrganizationContext';
import { SAAS_PLAN_PRESETS } from '../../../../../lib/multiTenantMigrationSql';

interface ProvisionTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateOrganization: (input: CreateOrganizationInput) => Promise<Organization | null>;
    onCreatedWithClaimToken: (org: Organization, claimToken: string) => void;
}

export const ProvisionTenantModal: React.FC<ProvisionTenantModalProps> = ({
    isOpen,
    onClose,
    onCreateOrganization,
    onCreatedWithClaimToken
}) => {
    const [provName, setProvName] = useState('');
    const [provDesc, setProvDesc] = useState('');
    const [provPlan, setProvPlan] = useState<PlanTier>('PRO');
    const [provMaxMembers, setProvMaxMembers] = useState<number>(35);
    const [provDurationDays, setProvDurationDays] = useState<number>(30);
    const [provOwnerUserId, setProvOwnerUserId] = useState('');
    const [provAllowedModules, setProvAllowedModules] = useState<string[] | null>(
        SAAS_PLAN_PRESETS.PRO.allowedModules
    );
    const [isProvisioning, setIsProvisioning] = useState(false);

    const handleSelectProvisionPlan = (tier: PlanTier) => {
        setProvPlan(tier);
        const preset = SAAS_PLAN_PRESETS[tier];
        if (preset) {
            setProvMaxMembers(preset.maxMembers);
            setProvAllowedModules(preset.allowedModules ? [...preset.allowedModules] : null);
            if (tier === 'LIFETIME') {
                setProvDurationDays(36500);
            } else if (provDurationDays > 3650) {
                setProvDurationDays(30);
            }
        }
    };

    const handleProvisionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provName.trim()) return;
        setIsProvisioning(true);
        try {
            const expiresAtIso =
                provPlan === 'LIFETIME'
                    ? null
                    : new Date(Date.now() + provDurationDays * 86400000).toISOString();

            const createdOrg = await onCreateOrganization({
                name: provName.trim(),
                description: provDesc.trim() || undefined,
                planTier: provPlan,
                maxMembers: provMaxMembers,
                allowedModules: provAllowedModules,
                expiresAt: expiresAtIso,
                assignOwnerUserId: provOwnerUserId.trim() || null,
                generateOwnerClaimLink: !provOwnerUserId.trim()
            });

            if (createdOrg) {
                setProvName('');
                setProvDesc('');
                setProvOwnerUserId('');
                onClose();
                if (createdOrg.ownerClaimToken) {
                    onCreatedWithClaimToken(createdOrg, createdOrg.ownerClaimToken);
                }
            }
        } finally {
            setIsProvisioning(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
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
                        className="w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* 1. Rigid Header */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">
                                        เปิดสิทธิ์องค์กรลูกค้าใหม่ (Provision Customer Workspace)
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        สร้างพื้นที่ทำงานใหม่พร้อมกำหนดแพ็กเกจและสร้างลิงก์ส่งมอบสิทธิ์ให้เจ้าของบริษัท
                                    </p>
                                </div>
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
                            id="provision-customer-form"
                            onSubmit={handleProvisionSubmit}
                            className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-5"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        ชื่อบริษัท / องค์กรลูกค้า *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={provName}
                                        onChange={e => setProvName(e.target.value)}
                                        placeholder="เช่น บริษัท เอเพ็กซ์ มีเดีย จำกัด"
                                        className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        รายละเอียด / หมายเหตุสัญญา
                                    </label>
                                    <input
                                        type="text"
                                        value={provDesc}
                                        onChange={e => setProvDesc(e.target.value)}
                                        placeholder="เช่น ลูกค้ารายปี ดูแลโดยทีม Sales A"
                                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Plan Tier Presets */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    เลือกแพ็กเกจมาตรฐาน (Plan Tier Preset)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {(Object.keys(SAAS_PLAN_PRESETS) as PlanTier[]).map(tier => {
                                        const preset = SAAS_PLAN_PRESETS[tier];
                                        const selected = provPlan === tier;
                                        return (
                                            <button
                                                key={tier}
                                                type="button"
                                                onClick={() => handleSelectProvisionPlan(tier)}
                                                className={`p-3 rounded-2xl border text-left transition-all ${
                                                    selected
                                                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                <p className="text-xs font-bold text-slate-900">
                                                    {preset.name}
                                                </p>
                                                <p className="text-[11px] font-mono text-indigo-600 font-bold mt-0.5">
                                                    {tier === 'LIFETIME'
                                                        ? `฿${preset.yearlyPriceTHB.toLocaleString()} ขาด`
                                                        : `฿${preset.monthlyPriceTHB.toLocaleString()}/ด.`}
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-1">
                                                    สูงสุด {preset.maxMembers} คน
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        โควตาสมาชิกสูงสุด (คน)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10000}
                                        value={provMaxMembers}
                                        onChange={e => setProvMaxMembers(Number(e.target.value) || 10)}
                                        className="w-full px-3.5 py-2.5 text-sm font-mono font-bold border border-slate-200 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        จำนวนวันที่เปิดใช้งาน (วัน)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        disabled={provPlan === 'LIFETIME'}
                                        value={provPlan === 'LIFETIME' ? 36500 : provDurationDays}
                                        onChange={e => setProvDurationDays(Number(e.target.value) || 30)}
                                        className="w-full px-3.5 py-2.5 text-sm font-mono font-bold border border-slate-200 rounded-xl disabled:bg-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        User ID เจ้าของ (เว้นว่างเพื่อสร้างลิงก์ Claim)
                                    </label>
                                    <input
                                        type="text"
                                        value={provOwnerUserId}
                                        onChange={e => setProvOwnerUserId(e.target.value)}
                                        placeholder="UUID (หากมีบัญชีแล้ว)"
                                        className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl"
                                    />
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
                                form="provision-customer-form"
                                disabled={isProvisioning || !provName.trim()}
                                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md"
                            >
                                {isProvisioning ? 'กำลังสร้างองค์กรลูกค้า...' : 'สร้างองค์กรและเปิดสิทธิ์ทันที'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
