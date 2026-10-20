import React, { useState, useEffect, useMemo } from 'react';
import {
    Ban,
    CheckCircle2,
    Clock,
    PlusCircle,
    RefreshCw,
    RotateCcw,
    Search,
    Sparkles,
    Users
} from 'lucide-react';
import { formatSecondsMMSS, useDemoSandbox } from '../../../../../context/DemoSandboxContext';
import { DemoTrialSessionRecord } from '../../../../../lib/demoSandboxEngine';

type TrialFilterStatus = 'ALL' | 'ACTIVE' | 'EXHAUSTED' | 'BLOCKED';

export const DemoTrialLogsTab: React.FC = () => {
    const {
        allTrialSessions,
        isAdminLoadingTrials,
        fetchAllDemoTrialSessions,
        adminResetDemoQuota,
        adminExtendDemoQuota,
        adminToggleBlockDemoUser
    } = useDemoSandbox();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TrialFilterStatus>('ALL');
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchAllDemoTrialSessions();
    }, [fetchAllDemoTrialSessions]);

    const filteredRecords = useMemo(() => {
        return allTrialSessions.filter((rec) => {
            const remaining = Math.max(0, (rec.quota_seconds || 600) - (rec.elapsed_seconds || 0));
            const isExhausted = remaining <= 0;

            if (statusFilter === 'BLOCKED' && !rec.is_blocked) return false;
            if (statusFilter === 'EXHAUSTED' && (!isExhausted || rec.is_blocked)) return false;
            if (statusFilter === 'ACTIVE' && (isExhausted || rec.is_blocked)) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const matchName = (rec.full_name || '').toLowerCase().includes(q);
                const matchEmail = (rec.email || '').toLowerCase().includes(q);
                const matchProvider = (rec.auth_provider || '').toLowerCase().includes(q);
                if (!matchName && !matchEmail && !matchProvider) return false;
            }

            return true;
        });
    }, [allTrialSessions, statusFilter, searchQuery]);

    const stats = useMemo(() => {
        const total = allTrialSessions.length;
        let active = 0;
        let exhausted = 0;
        let blocked = 0;
        allTrialSessions.forEach((r) => {
            const rem = Math.max(0, (r.quota_seconds || 600) - (r.elapsed_seconds || 0));
            if (r.is_blocked) blocked++;
            else if (rem <= 0) exhausted++;
            else active++;
        });
        return { total, active, exhausted, blocked };
    }, [allTrialSessions]);

    const handleAction = async (userId: string, fn: () => Promise<boolean>) => {
        setProcessingUserId(userId);
        try {
            await fn();
        } finally {
            setProcessingUserId(null);
        }
    };

    const renderProviderBadge = (provider: string) => {
        const p = (provider || 'email').toLowerCase();
        if (p.includes('google')) {
            return (
                <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold">
                    Google OAuth
                </span>
            );
        }
        if (p.includes('facebook')) {
            return (
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                    Facebook OAuth
                </span>
            );
        }
        return (
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold">
                Web Account
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-500">ผู้ทดลองเล่นทั้งหมด</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                        {stats.total}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                        จำกัด 1 สิทธิ์ต่อ 1 อีเมล/บัญชี
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm">
                    <div className="text-xs font-bold text-emerald-700">ยังมีเวลาคงเหลือ (Active)</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono tabular-nums">
                        {stats.active}
                    </div>
                    <div className="text-[11px] font-medium text-emerald-600/80 mt-0.5">
                        สามารถกลับเข้ามาทดลองต่อได้
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm">
                    <div className="text-xs font-bold text-amber-700">ใช้ครบ 10 นาทีแล้ว (Hot Leads)</div>
                    <div className="text-2xl font-bold text-amber-700 mt-1 font-mono tabular-nums">
                        {stats.exhausted}
                    </div>
                    <div className="text-[11px] font-medium text-amber-600/80 mt-0.5">
                        ผู้มุ่งหวังที่ทดลองใช้งานจนครบเวลา
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-sm">
                    <div className="text-xs font-bold text-rose-700">ถูกระงับสิทธิ์ (Blocked)</div>
                    <div className="text-2xl font-bold text-rose-700 mt-1 font-mono tabular-nums">
                        {stats.blocked}
                    </div>
                    <div className="text-[11px] font-medium text-rose-600/80 mt-0.5">
                        บัญชีที่ผู้ดูแลระบบสั่งล็อกโหมด Demo
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            <span>รายชื่อผู้ทดลองเล่นโหมด Sandbox 10 นาที (Demo Trial Quota Control)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            ตรวจสอบเวลาที่ลูกค้าทดลองใช้งานจริง พร้อมปุ่มกดรีเซ็ตเวลาเป็น 10:00 นาที หรือเพิ่มเวลาพิเศษ (+10 นาที) รายบุคคล
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="relative min-w-[220px]">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาชื่อ, อีเมล หรือช่องทาง..."
                                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                            />
                        </div>

                        {/* Status Filter Buttons */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                            {(
                                [
                                    { key: 'ALL', label: 'ทั้งหมด' },
                                    { key: 'ACTIVE', label: 'มีเวลาเหลือ' },
                                    { key: 'EXHAUSTED', label: 'ครบ 10 นาที' },
                                    { key: 'BLOCKED', label: 'ระงับสิทธิ์' }
                                ] as { key: TrialFilterStatus; label: string }[]
                            ).map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                        statusFilter === tab.key
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={fetchAllDemoTrialSessions}
                            disabled={isAdminLoadingTrials}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isAdminLoadingTrials ? 'animate-spin' : ''}`} />
                            <span>รีเฟรช</span>
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                {filteredRecords.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <Users className="w-10 h-10 text-slate-300 mx-auto" />
                        <div className="text-sm font-bold text-slate-700">
                            ยังไม่มีรายการผู้ทดลองเล่นในหมวดหมู่นี้
                        </div>
                        <p className="text-xs text-slate-500">
                            เมื่อมีลูกค้ากดปุ่ม &ldquo;ทดลองเล่นระบบจริง (ฟรี 10 นาที)&rdquo; รายชื่อและเวลาที่ใช้จะปรากฏที่นี่ทันทีครับ
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                                    <th className="py-3 px-4">ผู้ทดลองเล่น / อีเมล</th>
                                    <th className="py-3 px-4">ช่องทางล็อกอิน</th>
                                    <th className="py-3 px-4">เวลาที่ใช้ไป / โควต้าคงเหลือ</th>
                                    <th className="py-3 px-4">เข้าเล่นล่าสุด</th>
                                    <th className="py-3 px-4">สถานะ</th>
                                    <th className="py-3 px-4 text-right">จัดการโควต้าเวลา (Super Admin)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredRecords.map((rec) => {
                                    const quota = rec.quota_seconds || 600;
                                    const used = Math.min(quota, rec.elapsed_seconds || 0);
                                    const remaining = Math.max(0, quota - used);
                                    const usedPercent = Math.min(100, Math.round((used / Math.max(1, quota)) * 100));
                                    const isBusy = processingUserId === rec.user_id;

                                    return (
                                        <tr key={rec.user_id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900">{rec.full_name || 'ผู้ทดลองเล่น'}</div>
                                                <div className="font-mono text-[11px] text-slate-500">{rec.email}</div>
                                            </td>

                                            <td className="py-3.5 px-4">{renderProviderBadge(rec.auth_provider)}</td>

                                            <td className="py-3.5 px-4 min-w-[200px]">
                                                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                                    <span className="text-slate-600 font-mono tabular-nums">
                                                        ใช้ไป {formatSecondsMMSS(used)} / {formatSecondsMMSS(quota)}
                                                    </span>
                                                    <span
                                                        className={`font-mono tabular-nums ${
                                                            remaining <= 0 ? 'text-rose-600' : 'text-emerald-600'
                                                        }`}
                                                    >
                                                        เหลือ {formatSecondsMMSS(remaining)}
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                    <div
                                                        className={`h-full transition-all ${
                                                            rec.is_blocked || remaining <= 0
                                                                ? 'bg-rose-500'
                                                                : usedPercent > 75
                                                                ? 'bg-amber-500'
                                                                : 'bg-indigo-600'
                                                        }`}
                                                        style={{ width: `${usedPercent}%` }}
                                                    />
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 text-slate-600">
                                                <div className="font-semibold">
                                                    {rec.last_active_at
                                                        ? new Date(rec.last_active_at).toLocaleString('th-TH', {
                                                              dateStyle: 'short',
                                                              timeStyle: 'short'
                                                          })
                                                        : '-'}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                                                    เข้าใช้งาน {rec.session_count || 1} ครั้ง
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {rec.is_blocked ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                                                        <Ban className="w-3.5 h-3.5" />
                                                        ระงับสิทธิ์
                                                    </span>
                                                ) : remaining <= 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        ครบโควต้าเวลา
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        มีโควต้าคงเหลือ
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() =>
                                                            handleAction(rec.user_id, () => adminResetDemoQuota(rec))
                                                        }
                                                        className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                                                        title="รีเซ็ตเวลาที่ใช้ไปกลับเป็น 00:00 (ให้เล่นใหม่เต็มโควต้า)"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>รีเซ็ตเวลา</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() =>
                                                            handleAction(rec.user_id, () =>
                                                                adminExtendDemoQuota(rec, 600)
                                                            )
                                                        }
                                                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                                                        title="บวกเวลาเพิ่มอีก 10 นาทีให้ลูกค้ารายนี้"
                                                    >
                                                        <PlusCircle className="w-3.5 h-3.5" />
                                                        <span>+10 นาที</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() =>
                                                            handleAction(rec.user_id, () =>
                                                                adminToggleBlockDemoUser(rec)
                                                            )
                                                        }
                                                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50 ${
                                                            rec.is_blocked
                                                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                                        }`}
                                                    >
                                                        <Ban className="w-3.5 h-3.5" />
                                                        <span>{rec.is_blocked ? 'ปลดล็อก' : 'ระงับสิทธิ์'}</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
