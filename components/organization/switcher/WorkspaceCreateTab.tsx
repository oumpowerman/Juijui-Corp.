import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useOrganization } from '../../../context/OrganizationContext';
import { SAAS_PLAN_PRESETS } from '../../../lib/multiTenantMigrationSql';
import { PlanTier } from '../../../types';
import { WORKSPACE_COLOR_PRESETS } from './workspaceSwitcherConstants';

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

    return (
        <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                        เปิดองค์กรใหม่ให้ลูกค้าด่วน (Super Admin Quick Provision)
                    </p>
                    <p>
                        สร้าง Workspace ใหม่พร้อมชุดข้อมูลตั้งต้นและลิงก์ส่งมอบสิทธิ์เจ้าขององค์กร (หากต้องการเลือกเปิด-ปิด Module รายตัวแบบละเอียด สามารถตั้งค่าได้ที่หน้า Master Data &gt; Multi-Tenant SaaS)
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ชื่อองค์กร / บริษัทลูกค้า *
                </label>
                <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={e => setNewOrgName(e.target.value)}
                    placeholder="เช่น บริษัท ครีเอทีฟ สตูดิโอ จำกัด"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        แพ็กเกจเริ่มต้น (Plan Tier)
                    </label>
                    <select
                        value={newOrgPlan}
                        onChange={e => setNewOrgPlan(e.target.value as PlanTier)}
                        className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    >
                        <option value="STARTER">STARTER (10 คน · โมดูลพื้นฐาน)</option>
                        <option value="PRO">PRO (30 คน · สตูดิโอเต็มรูปแบบ)</option>
                        <option value="ENTERPRISE">ENTERPRISE (100 คน · ครบทุกโมดูล)</option>
                        <option value="LIFETIME">LIFETIME (ตลอดชีพ · ครบทุกโมดูล)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        คำอธิบายองค์กร
                    </label>
                    <input
                        type="text"
                        value={newOrgDesc}
                        onChange={e => setNewOrgDesc(e.target.value)}
                        placeholder="เช่น แพ็กเกจรายปี"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    โทนสีประจำองค์กร
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {WORKSPACE_COLOR_PRESETS.map(preset => (
                        <button
                            key={preset.label}
                            type="button"
                            onClick={() => setNewOrgColor(preset.value)}
                            className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                newOrgColor === preset.value
                                    ? `${preset.value} ring-2 ring-indigo-500/40`
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                            }`}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${preset.dot}`} />
                            <span>{preset.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={!newOrgName.trim() || isSubmitting}
                className="w-full py-3 px-5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                {isSubmitting ? 'กำลังเปิดองค์กรให้ลูกค้า...' : 'เปิดองค์กรใหม่และสร้างลิงก์ส่งมอบสิทธิ์'}
            </button>
        </form>
    );
};
