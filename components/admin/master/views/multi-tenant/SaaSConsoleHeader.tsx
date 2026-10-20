import React from 'react';
import { CreditCard, Crown, Database, KeyRound, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { ConsoleSubTab } from './multiTenantConstants';

interface SaaSConsoleHeaderProps {
    isSuperAdmin: boolean;
    activeSubTab: ConsoleSubTab;
    onSelectSubTab: (tab: ConsoleSubTab) => void;
    totalOrgsCount: number;
    pendingInvoicesCount: number;
    demoTrialsCount?: number;
    currentOrgName: string;
    onRefresh: () => void;
    onOpenProvisionModal: () => void;
}

export const SaaSConsoleHeader: React.FC<SaaSConsoleHeaderProps> = ({
    isSuperAdmin,
    activeSubTab,
    onSelectSubTab,
    totalOrgsCount,
    pendingInvoicesCount,
    demoTrialsCount = 0,
    currentOrgName,
    onRefresh,
    onOpenProvisionModal
}) => {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-sm shrink-0">
                        <Crown className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold text-slate-900">
                                Commercial SaaS & Super Admin Licensing Center
                            </h2>
                            {isSuperAdmin && (
                                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-lg">
                                    SUPER ADMIN MODE
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            บริหารแพ็กเกจลูกค้า (Starter / Pro / Enterprise), เปิด-ปิด Module รายบริษัท, จัดการโควต้าโหมดทดลองเล่น Demo 10 นาที และระบบต่ออายุอัตโนมัติ
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> รีเฟรชข้อมูล
                    </button>
                    {isSuperAdmin && (
                        <button
                            type="button"
                            onClick={onOpenProvisionModal}
                            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" /> เปิดสิทธิ์องค์กรลูกค้าใหม่ (Provision Tenant)
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => onSelectSubTab('SUPER_ADMIN')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeSubTab === 'SUPER_ADMIN'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <Crown className="w-4 h-4" />
                    จัดการลูกค้า & สิทธิ์ Module ({totalOrgsCount})
                </button>

                <button
                    type="button"
                    onClick={() => onSelectSubTab('BILLING_WEBHOOK')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeSubTab === 'BILLING_WEBHOOK'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <CreditCard className="w-4 h-4" />
                    ประวัติบิล & Payment Webhook
                    {pendingInvoicesCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-md font-mono tabular-nums">
                            {pendingInvoicesCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => onSelectSubTab('DEMO_TRIALS')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeSubTab === 'DEMO_TRIALS'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <Sparkles className="w-4 h-4" />
                    ผู้ทดลองเล่น Demo (10 นาที)
                    {demoTrialsCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-md font-mono tabular-nums">
                            {demoTrialsCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => onSelectSubTab('WORKSPACE_INVITES')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeSubTab === 'WORKSPACE_INVITES'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <KeyRound className="w-4 h-4" />
                    รหัสเชิญ & คิวอนุมัติสมาชิก ({currentOrgName})
                </button>

                <button
                    type="button"
                    onClick={() => onSelectSubTab('SQL_MIGRATION')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeSubTab === 'SQL_MIGRATION'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <Database className="w-4 h-4" />
                    สคริปต์ SQL (Phase 1-4 & Phase 5)
                </button>
            </div>
        </div>
    );
};
