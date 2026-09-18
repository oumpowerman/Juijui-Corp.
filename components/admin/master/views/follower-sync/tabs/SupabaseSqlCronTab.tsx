import React, { useState, useMemo } from 'react';
import { Database, Copy, Check, ExternalLink, Terminal, ShieldCheck, Clock, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { FollowerSyncConfig } from '../types';
import { useToast } from '../../../../../../context/ToastContext';

interface SupabaseSqlCronTabProps {
    config: FollowerSyncConfig;
}

export const SupabaseSqlCronTab: React.FC<SupabaseSqlCronTabProps> = ({ config }) => {
    const { showToast } = useToast();
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Compute UTC equivalent of Bangkok time
    const { utcHour, utcMin, cronUtc } = useMemo(() => {
        const [hourStr, minStr] = (config.syncTime || '08:00').split(':');
        const bkkHour = parseInt(hourStr, 10);
        const bkkMin = parseInt(minStr, 10);
        const safeHour = isNaN(bkkHour) || bkkHour < 0 || bkkHour > 23 ? 8 : bkkHour;
        const safeMin = isNaN(bkkMin) || bkkMin < 0 || bkkMin > 59 ? 0 : bkkMin;

        let utc = safeHour - 7;
        if (utc < 0) utc += 24;

        return {
            utcHour: utc,
            utcMin: safeMin,
            cronUtc: `${safeMin} ${utc} * * *`
        };
    }, [config.syncTime]);

    // Current app origin
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-r55e2gzylol44b2utbetjh-608846585493.asia-southeast1.run.app';
    const cronWebhookUrl = `${currentOrigin}/api/cron/sync-followers?source=cron`;
    const cronSecret = 'juijui-cron-secret-key-2026';

    // Generated SQL snippet matching the current configuration
    const sqlSnippet = useMemo(() => {
        return `-- ==============================================================================
-- 🚀 Supabase pg_cron + pg_net Follower Auto-Sync Setup
-- ตั้งเวลาอัปเดตยอดผู้ติดตามทุกช่องอัตโนมัติ (เวลาไทย ${config.syncTime} น. = ${String(utcHour).padStart(2, '0')}:${String(utcMin).padStart(2, '0')} UTC)
-- ==============================================================================

-- 1. เปิด Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. เคลียร์ Job เก่าหากเคยสร้างไว้
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_follower_sync') THEN
        PERFORM cron.unschedule('daily_follower_sync');
    END IF;
END $$;

-- 3. ลงทะเบียน Cron Job (${config.syncTime} น. เวลาไทย = ${cronUtc} UTC)
SELECT cron.schedule(
    'daily_follower_sync',
    '${cronUtc}',
    $$
    SELECT net.http_post(
        url := '${cronWebhookUrl}',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', '${cronSecret}',
            'Authorization', 'Bearer ${cronSecret}'
        ),
        body := jsonb_build_object(
            'triggered_by', 'supabase_pg_cron',
            'scheduled_time_bkk', '${config.syncTime}',
            'timestamp', now()
        ),
        timeout_milliseconds := 120000
    );
    $$
);

-- 4. ตรวจสอบผลลัพธ์
SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'daily_follower_sync';
`;
    }, [config.syncTime, cronUtc, utcHour, utcMin, cronWebhookUrl, cronSecret]);

    const handleCopy = (text: string, key: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        showToast(`คัดลอก ${label} แล้ว! 📋`, 'success');
        setTimeout(() => {
            setCopiedKey(prev => (prev === key ? null : prev));
        }, 2500);
    };

    return (
        <div className="space-y-6">
            {/* 1. Architecture Overview Banner */}
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white p-6 rounded-3xl border border-emerald-500/20 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                            <Database className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Database-Level Production Cron</span>
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            Supabase pg_cron + pg_net Architecture
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                            ย้ายระบบตั้งเวลาจาก Memory ของ Node.js ไปสู่ <strong>Supabase Database</strong> โดยตรง 
                            รับประกันการรันตรงเวลา 100% แม้ไม่มีผู้ใช้งานเปิดหน้าเว็บ และเซิร์ฟเวอร์จะถูกปลุกขึ้นมาประมวลผลอัตโนมัติตามเวลาที่ตั้งไว้
                        </p>
                    </div>

                    <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md hover:scale-[1.02]"
                    >
                        <span>เปิด Supabase SQL Editor</span>
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                            <span className="text-slate-400 block text-[11px]">เวลาไทย (GMT+7):</span>
                            <span className="font-bold text-white text-sm">{config.syncTime} น.</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                            <span className="text-slate-400 block text-[11px]">เวลาฐานข้อมูล (UTC):</span>
                            <span className="font-bold text-white text-sm">{String(utcHour).padStart(2, '0')}:{String(utcMin).padStart(2, '0')} UTC ({cronUtc})</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                            <span className="text-slate-400 block text-[11px]">ความปลอดภัย:</span>
                            <span className="font-bold text-emerald-300 text-sm">Protected via x-cron-secret</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Key Webhook Parameters Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>ข้อมูล Endpoint สำหรับนำไปตั้งค่า</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Webhook URL */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">Cron Webhook URL</span>
                            <button
                                type="button"
                                onClick={() => handleCopy(cronWebhookUrl, 'webhookUrl', 'Webhook URL')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                            >
                                {copiedKey === 'webhookUrl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedKey === 'webhookUrl' ? 'คัดลอกแล้ว' : 'คัดลอก URL'}</span>
                            </button>
                        </div>
                        <p className="font-mono text-xs text-slate-900 break-all bg-white p-2.5 rounded-xl border border-slate-200">
                            {cronWebhookUrl}
                        </p>
                    </div>

                    {/* Cron Secret Header */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">Security Secret Header (x-cron-secret)</span>
                            <button
                                type="button"
                                onClick={() => handleCopy(cronSecret, 'cronSecret', 'Cron Secret')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                            >
                                {copiedKey === 'cronSecret' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedKey === 'cronSecret' ? 'คัดลอกแล้ว' : 'คัดลอก Secret'}</span>
                            </button>
                        </div>
                        <p className="font-mono text-xs text-slate-900 break-all bg-white p-2.5 rounded-xl border border-slate-200">
                            {cronSecret}
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Ready-to-Run SQL Snippet */}
            <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-emerald-400" />
                            <h4 className="font-bold text-white text-base">
                                สคริปต์ SQL พร้อมรัน (Generated Supabase SQL)
                            </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            คัดลอกโค้ดนี้ไปวางที่ Supabase Dashboard &gt; SQL Editor แล้วกด "Run" ได้ทันที
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleCopy(sqlSnippet, 'sqlSnippet', 'สคริปต์ SQL ทั้งหมด')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
                    >
                        {copiedKey === 'sqlSnippet' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedKey === 'sqlSnippet' ? 'คัดลอก SQL เรียบร้อยแล้ว!' : 'คัดลอกสคริปต์ SQL'}</span>
                    </button>
                </div>

                <div className="relative">
                    <pre className="font-mono text-xs text-slate-200 bg-slate-950 p-5 rounded-2xl border border-slate-800 overflow-x-auto leading-relaxed max-h-96">
                        {sqlSnippet}
                    </pre>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
                    <span className="font-bold text-emerald-400 block">💡 ขั้นตอนการนำไปใช้:</span>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                        <li>กดปุ่ม <strong>"คัดลอกสคริปต์ SQL"</strong> ด้านบน</li>
                        <li>เปิดไปยังหน้า <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300">Supabase Dashboard</a> ของโปรเจกต์คุณ</li>
                        <li>เลือกเมนู <strong>SQL Editor</strong> ที่แถบด้านซ้าย</li>
                        <li>กดปุ่ม <strong>New Query</strong> วางสคริปต์ลงไป แล้วกดปุ่ม <strong>Run</strong></li>
                    </ol>
                </div>
            </div>
        </div>
    );
};
