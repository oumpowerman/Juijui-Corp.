import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, Download, Lock } from 'lucide-react';
import {
    ALL_51_TENANT_TABLES,
    ENTERPRISE_SAAS_MIGRATION_SQL,
    PHASE_5_LICENSING_MIGRATION_SQL
} from '../../../../../lib/multiTenantMigrationSql';
import { useToast } from '../../../../../context/ToastContext';

export const SqlMigrationTab: React.FC = () => {
    const { showToast } = useToast();

    const [copiedPhase1Sql, setCopiedPhase1Sql] = useState(false);
    const [copiedPhase5Sql, setCopiedPhase5Sql] = useState(false);
    const [showPhase1Preview, setShowPhase1Preview] = useState(false);
    const [showPhase5Preview, setShowPhase5Preview] = useState(true);
    const [showTablesList, setShowTablesList] = useState(false);

    const handleCopySql = (sqlText: string, isPhase5: boolean) => {
        navigator.clipboard.writeText(sqlText);
        if (isPhase5) {
            setCopiedPhase5Sql(true);
            showToast('คัดลอกสคริปต์ SQL Phase 5 (Commercial SaaS & Billing) เรียบร้อยแล้ว', 'success');
            setTimeout(() => setCopiedPhase5Sql(false), 3000);
        } else {
            setCopiedPhase1Sql(true);
            showToast('คัดลอกสคริปต์ SQL Phase 1-4 (51 ตาราง RLS) เรียบร้อยแล้ว', 'success');
            setTimeout(() => setCopiedPhase1Sql(false), 3000);
        }
    };

    const handleDownloadSql = (sqlText: string, filename: string) => {
        const blob = new Blob([sqlText], { type: 'text/sql;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`ดาวน์โหลดไฟล์ ${filename} สำเร็จ`, 'success');
    };

    return (
        <div className="space-y-6">
            {/* Phase 5 SQL Card */}
            <div className="bg-white rounded-3xl border border-indigo-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-100 text-indigo-700 rounded-lg">
                                NEW • PHASE 5
                            </span>
                            <h3 className="font-bold text-slate-900 text-base">
                                สคริปต์ SQL เฟส 5: Commercial SaaS Licensing, Module Entitlements & Billing
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            เพิ่มคอลัมน์แพ็กเกจ (`plan_tier`, `subscription_status`, `allowed_modules`, `owner_claim_token`), ตารางบิล `subscription_invoices` และฟังก์ชัน RPC สำหรับ Super Admin
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleCopySql(PHASE_5_LICENSING_MIGRATION_SQL, true)}
                            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                        >
                            {copiedPhase5Sql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copiedPhase5Sql ? 'คัดลอก SQL Phase 5 แล้ว!' : 'คัดลอก SQL เฟส 5'}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                handleDownloadSql(
                                    PHASE_5_LICENSING_MIGRATION_SQL,
                                    'phase5_commercial_saas_licensing.sql'
                                )
                            }
                            className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                            <Download className="w-4 h-4" /> ดาวน์โหลด .sql
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setShowPhase5Preview(prev => !prev)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                    {showPhase5Preview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showPhase5Preview ? 'ซ่อนโค้ด SQL เฟส 5' : 'ดูโค้ด SQL เฟส 5 ฉบับเต็ม'}
                </button>

                {showPhase5Preview && (
                    <div className="rounded-2xl bg-slate-900 text-slate-100 p-4 overflow-x-auto max-h-96 border border-slate-800">
                        <pre className="text-xs font-mono leading-relaxed whitespace-pre">
                            {PHASE_5_LICENSING_MIGRATION_SQL}
                        </pre>
                    </div>
                )}
            </div>

            {/* Phase 1-4 SQL Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Lock className="w-5 h-5 text-indigo-600" />
                            สคริปต์ SQL เฟส 1-4: โครงสร้าง Multi-Tenant 51 ตาราง + Row-Level Security (RLS)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            สำหรับฐานข้อมูลที่ยังไม่เคยรันสคริปต์แยก `org_id` 51 ตาราง (รันเฟส 1-4 ก่อน แล้วตามด้วยเฟส 5)
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleCopySql(ENTERPRISE_SAAS_MIGRATION_SQL, false)}
                            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                            {copiedPhase1Sql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copiedPhase1Sql ? 'คัดลอกแล้ว!' : 'คัดลอก SQL เฟส 1-4'}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                handleDownloadSql(
                                    ENTERPRISE_SAAS_MIGRATION_SQL,
                                    'phase1_to_4_enterprise_rls_51_tables.sql'
                                )
                            }
                            className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                            <Download className="w-4 h-4" /> ดาวน์โหลด .sql
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowPhase1Preview(prev => !prev)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                        {showPhase1Preview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showPhase1Preview ? 'ซ่อนโค้ด SQL เฟส 1-4' : 'ดูโค้ด SQL เฟส 1-4'}
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                        type="button"
                        onClick={() => setShowTablesList(prev => !prev)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                        {showTablesList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        ดูรายชื่อ {ALL_51_TENANT_TABLES.length} ตาราง
                    </button>
                </div>

                {showTablesList && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {ALL_51_TENANT_TABLES.map((tableName, idx) => (
                            <div
                                key={tableName}
                                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2 truncate"
                            >
                                <span className="text-[10px] text-slate-400 tabular-nums">
                                    {String(idx + 1).padStart(2, '0')}.
                                </span>
                                <span className="truncate">{tableName}</span>
                            </div>
                        ))}
                    </div>
                )}

                {showPhase1Preview && (
                    <div className="rounded-2xl bg-slate-900 text-slate-100 p-4 overflow-x-auto max-h-96 border border-slate-800">
                        <pre className="text-xs font-mono leading-relaxed whitespace-pre">
                            {ENTERPRISE_SAAS_MIGRATION_SQL}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};
