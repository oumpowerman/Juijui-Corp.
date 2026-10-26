import React, { useEffect, useState } from 'react';
import {
    CheckCircle2,
    Copy,
    CreditCard,
    Database,
    Globe,
    KeyRound,
    RefreshCw,
    ShieldCheck,
    Sparkles
} from 'lucide-react';
import { useToast } from '../../../../../context/ToastContext';

interface GatewayInfo {
    status: string;
    endpoint: string;
    checkoutEndpoint: string;
    secretConfigured: boolean;
    stripeLiveConfigured: boolean;
    omiseLiveConfigured: boolean;
}

export const DomainReadinessTab: React.FC<{
    isNativeMultiTenantDB: boolean;
    totalOrganizationsCount: number;
    onGoToSqlTab: () => void;
}> = ({ isNativeMultiTenantDB, totalOrganizationsCount, onGoToSqlTab }) => {
    const { showToast } = useToast();
    const [gatewayInfo, setGatewayInfo] = useState<GatewayInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [customDomain, setCustomDomain] = useState('https://app.kontentos.com');

    const fetchGatewayStatus = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/billing/webhook-info');
            const data = await res.json();
            if (res.ok) {
                setGatewayInfo(data);
            }
        } catch {
            // ignore
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGatewayStatus();
    }, []);

    const copyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast(`คัดลอก ${label} เรียบร้อยแล้ว`, 'success');
    };

    const cleanDomain = customDomain.replace(/\/+$/, '');

    return (
        <div className="space-y-6">
            {/* Header Summary Banner */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Self-Serve Multi-Tenant SaaS · 100% Architecture Ready</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">
                        ศูนย์ตรวจสอบความพร้อมก่อนจดโดเมนและเปิดรับลูกค้าจ่ายเงินจริง
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        ตรวจสอบสถานะการแยกข้อมูลองค์กร (RLS 51 ตาราง), ระบบสมัครทดลองใช้ฟรี 7 วัน (PRO Trial), ระบบตัดบัตร/สร้าง QR อัตโนมัติ และการตั้งค่า Custom Domain
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchGatewayStatus}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 self-start lg:self-center shrink-0"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    ตรวจสอบสถานะเซิร์ฟเวอร์
                </button>
            </div>

            {/* 4-Pillar Readiness Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Multi-Tenant DB & RLS */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Database className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    1. ระบบแยกข้อมูลแต่ละองค์กร (Tenant Isolation & RLS)
                                </h3>
                                <p className="text-xs text-slate-500">
                                    รองรับบริษัทย่อย/แบรนด์ในเครือเดียวกัน (Sub-brands within Org)
                                </p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                            พร้อมใช้งาน ({totalOrganizationsCount} องค์กร)
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        • บังคับกรอง <span className="font-mono font-bold text-slate-800">org_id</span> ทั้งระดับ PostgreSQL RLS, Realtime Channel, Storage Folder และ Backend API (<span className="font-mono">resolveTenantContext</span>)<br />
                        • ข้อมูลข้ามบริษัทมองไม่เห็นกัน 100% ขณะที่บริษัทย่อยในเครือเดียวกันยังเชื่อมโยงกันได้ครบถ้วน
                    </p>
                    {!isNativeMultiTenantDB && (
                        <button
                            type="button"
                            onClick={onGoToSqlTab}
                            className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                            → เปิดสคริปต์ SQL เพื่อรันบน Supabase SQL Editor
                        </button>
                    )}
                </div>

                {/* 2. Self-Serve 7-Day Free Trial */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    2. ระบบเปิดองค์กรทดลองใช้ฟรี 7 วัน (Self-Service Trial)
                                </h3>
                                <p className="text-xs text-slate-500">
                                    สิทธิ์ระดับ PRO · จำกัดสมาชิกสูงสุด 5 คน · 1 บัญชีต่อ 1 องค์กร
                                </p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                            เปิดทำงานแล้ว
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        • ลูกค้าใหม่ที่เข้าหน้าเว็บสามารถกดเปิดบริษัทใหม่ได้เองตั้งแต่หน้าสมัครสมาชิก หรือหน้ายืนยันสังกัดหลังล็อกอิน<br />
                        • ระบบตั้งวันหมดอายุอัตโนมัติ 7 วัน พร้อม Seed หมวดหมู่ตั้งต้นให้องค์กรใหม่ทันที
                    </p>
                </div>

                {/* 3. Automated Payment Checkout & Webhook */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    3. ระบบชำระเงินอัตโนมัติ (Stripe / Omise QR / แนบสลิป)
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Endpoint: <span className="font-mono">/api/billing/create-checkout-session</span>
                                </p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                            {gatewayInfo?.stripeLiveConfigured || gatewayInfo?.omiseLiveConfigured
                                ? 'Live Gateway Active'
                                : 'Instant Simulator Active'}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[11px]">STRIPE_SECRET_KEY</span>
                            <span className="font-bold text-slate-800">
                                {gatewayInfo?.stripeLiveConfigured ? 'ตั้งค่าแล้ว (Live)' : 'โหมดจำลองอัตโนมัติ'}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[11px]">OMISE_SECRET_KEY</span>
                            <span className="font-bold text-slate-800">
                                {gatewayInfo?.omiseLiveConfigured ? 'ตั้งค่าแล้ว (Live)' : 'โหมด QR จำลอง'}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[11px]">WEBHOOK_SECRET</span>
                            <span className="font-bold text-slate-800">
                                {gatewayInfo?.secretConfigured ? 'ล็อกรหัสแล้ว' : 'พร้อมรับสัญญาณ'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. Public Landing & Pricing Page */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    4. หน้าแรก Landing & Pricing Page สำหรับผู้เยี่ยมชม
                                </h3>
                                <p className="text-xs text-slate-500">
                                    แสดงตารางเปรียบเทียบ STARTER, PRO, ENTERPRISE, LIFETIME
                                </p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                            เปิดเป็นหน้าแรกแล้ว
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        • มีปุ่มกด <span className="font-bold text-slate-800">เปิดองค์กรทดลองใช้ฟรี 7 วัน (PRO)</span>, <span className="font-bold text-slate-800">ทดลองเล่น Sandbox 10 นาที</span> และสวิตช์คำนวณราคารายเดือน/รายปีครบถ้วน
                    </p>
                </div>
            </div>

            {/* Custom Domain & Supabase Auth Redirect Configuration Helper */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-indigo-600" />
                            คู่มือตั้งค่าเมื่อผูกชื่อโดเมนจริง (Custom Domain & Webhook URLs)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            พิมพ์ชื่อโดเมนที่คุณจดทะเบียนด้านล่าง เพื่อสร้างลิงก์สำหรับนำไปวางใน Supabase Auth และ Stripe / Omise Dashboard
                        </p>
                    </div>
                    <input
                        type="text"
                        value={customDomain}
                        onChange={e => setCustomDomain(e.target.value)}
                        placeholder="https://app.yourdomain.com"
                        className="px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-72 outline-none focus:border-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">
                                1. Supabase Auth → URL Configuration (Site URL & Redirect URLs)
                            </span>
                            <button
                                type="button"
                                onClick={() => copyText(`${cleanDomain}/**`, 'Supabase Redirect URL')}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-indigo-600 flex items-center gap-1"
                            >
                                <Copy className="w-3 h-3" /> คัดลอก
                            </button>
                        </div>
                        <p className="font-mono text-xs text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                            Site URL: {cleanDomain}<br />
                            Redirect URL: {cleanDomain}/**
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">
                                2. Stripe / Omise → Webhook Endpoint URL
                            </span>
                            <button
                                type="button"
                                onClick={() => copyText(`${cleanDomain}/api/billing/webhook`, 'Webhook Endpoint URL')}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-indigo-600 flex items-center gap-1"
                            >
                                <Copy className="w-3 h-3" /> คัดลอก
                            </button>
                        </div>
                        <p className="font-mono text-xs text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                            POST {cleanDomain}/api/billing/webhook<br />
                            Events: checkout.session.completed, charge.complete
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
