
import React, { useState, useEffect, useMemo } from 'react';
import {
    Lock,
    LogOut,
    Clock,
    ShieldCheck,
    Building2,
    KeyRound,
    RefreshCw,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Users,
    XCircle,
    Sparkles
} from 'lucide-react';
import { User } from '../types';
import { useOrganization } from '../context/OrganizationContext';
import { useUserSession } from '../context/UserSessionContext';
import { supabase } from '../lib/supabase';
import { DemoTrialLaunchCard } from './demo/DemoTrialLaunchCard';


interface PendingApprovalScreenProps {
    user: User | null;
    onLogout: () => void;
}

const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({ user, onLogout }) => {
    const {
        allPlatformOrganizations,
        myMemberships,
        pendingInviteCodeFromUrl,
        pendingClaimTokenFromUrl,
        claimOrganizationOwnership,
        joinOrganizationByCode,
        cancelPendingJoinRequest,
        refreshOrganizations
    } = useOrganization();

    const { fetchProfile } = useUserSession();

    const [codeInput, setCodeInput] = useState('');
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [isChangingCode, setIsChangingCode] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Pre-fill code from URL or sessionStorage if present
    useEffect(() => {
        const savedCode = typeof window !== 'undefined'
            ? sessionStorage.getItem('juijui_pending_onboarding_code')
            : null;
        const initialCode = pendingClaimTokenFromUrl || pendingInviteCodeFromUrl || savedCode || '';
        if (initialCode && !codeInput) {
            setCodeInput(initialCode.trim().toUpperCase());
        }
    }, [pendingClaimTokenFromUrl, pendingInviteCodeFromUrl]);

    // Find user's pending or active memberships
    const pendingMembership = useMemo(
        () => myMemberships.find(m => m.status === 'PENDING'),
        [myMemberships]
    );

    const activeMembership = useMemo(
        () => myMemberships.find(m => m.status === 'ACTIVE'),
        [myMemberships]
    );

    const pendingOrg = useMemo(() => {
        if (!pendingMembership) return null;
        return allPlatformOrganizations.find(o => o.id === pendingMembership.orgId) || null;
    }, [pendingMembership, allPlatformOrganizations]);

    // If user already has an ACTIVE organization membership (e.g. Org Admin approved them),
    // automatically sync is_approved = true on their profile so they enter the workspace immediately.
    useEffect(() => {
        const autoSyncApprovedMember = async () => {
            if (user?.id && !user.isApproved && activeMembership) {
                try {
                    await supabase
                        .from('profiles')
                        .update({
                            is_approved: true,
                            current_org_id: user.currentOrgId || activeMembership.orgId
                        })
                        .eq('id', user.id);
                    await fetchProfile();
                } catch (err) {
                    console.warn('[PendingApprovalScreen] Auto-sync approval error:', err);
                }
            }
        };
        autoSyncApprovedMember();
    }, [user?.id, user?.isApproved, user?.currentOrgId, activeMembership, fetchProfile]);

    const trimmedCode = codeInput.trim().toUpperCase();
    const isClaimFormat = useMemo(() => {
        if (!trimmedCode) return false;
        if (trimmedCode.startsWith('CLAIM-') || trimmedCode.startsWith('OWN-')) return true;
        return allPlatformOrganizations.some(
            o => (o.ownerClaimToken || '').toUpperCase() === trimmedCode
        );
    }, [trimmedCode, allPlatformOrganizations]);

    const handleCheckApprovalStatus = async () => {
        setIsCheckingStatus(true);
        setFeedback(null);
        try {
            await refreshOrganizations();
            const updatedProfile = await fetchProfile();
            if (updatedProfile?.isApproved) {
                setFeedback({
                    type: 'success',
                    message: 'บัญชีของคุณได้รับการอนุมัติแล้ว! กำลังเข้าสู่ระบบ...'
                });
            } else {
                setFeedback({
                    type: 'info',
                    message: pendingOrg
                        ? `คำขอเข้าสังกัด "${pendingOrg.name}" ยังอยู่ระหว่างรอผู้ดูแลองค์กรกดอนุมัติครับ`
                        : 'บัญชียังอยู่ระหว่างรอการอนุมัติ หากคุณมีรหัสเชิญเข้าทีมหรือรหัสรับมอบองค์กร สามารถกรอกด้านล่างได้เลยครับ'
                });
            }
        } catch (err: any) {
            setFeedback({
                type: 'error',
                message: 'ไม่สามารถตรวจสอบสถานะได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง'
            });
        } finally {
            setIsCheckingStatus(false);
        }
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trimmedCode) {
            setFeedback({
                type: 'error',
                message: 'กรุณากรอกรหัสเชิญเข้าทีม (Invite Code) หรือรหัสรับมอบองค์กร (Claim Token)'
            });
            return;
        }

        setIsSubmittingCode(true);
        setFeedback(null);

        try {
            if (isClaimFormat) {
                const res = await claimOrganizationOwnership(trimmedCode);
                if (res.success) {
                    setFeedback({
                        type: 'success',
                        message: res.message
                    });
                    setCodeInput('');
                    setIsChangingCode(false);
                    await fetchProfile();
                } else {
                    setFeedback({
                        type: 'error',
                        message: res.message
                    });
                }
            } else {
                // If changing from an existing pending request, cancel old one first
                if (pendingMembership && isChangingCode) {
                    await cancelPendingJoinRequest(pendingMembership.orgId);
                }

                const res = await joinOrganizationByCode(trimmedCode);
                if (res.success) {
                    setFeedback({
                        type: 'success',
                        message: res.message
                    });
                    setCodeInput('');
                    setIsChangingCode(false);
                    if (res.status === 'ACTIVE') {
                        await fetchProfile();
                    }
                } else {
                    setFeedback({
                        type: 'error',
                        message: res.message
                    });
                }
            }
        } finally {
            setIsSubmittingCode(false);
        }
    };

    const handleCancelCurrentRequest = async () => {
        if (!pendingMembership) return;
        setIsSubmittingCode(true);
        setFeedback(null);
        try {
            await cancelPendingJoinRequest(pendingMembership.orgId);
            setIsChangingCode(false);
            setFeedback({
                type: 'info',
                message: 'ยกเลิกคำขอเดิมเรียบร้อยแล้ว คุณสามารถกรอกรหัสเชิญขององค์กรใหม่ได้ด้านล่างครับ'
            });
        } finally {
            setIsSubmittingCode(false);
        }
    };

    const showCodeForm = !pendingMembership || isChangingCode || Boolean(pendingClaimTokenFromUrl);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            {/* Subtle Dot Pattern Background */}
            <div
                className="absolute inset-0 z-0 opacity-15 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#4f46e5 0.75px, transparent 0.75px)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 w-full max-w-lg rounded-3xl shadow-xl p-6 sm:p-8 relative z-10 animate-in zoom-in-95 duration-300">
                {/* Header Icon */}
                <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                    {pendingMembership ? (
                        <Clock className="w-8 h-8 text-indigo-600 animate-pulse" />
                    ) : (
                        <Lock className="w-8 h-8 text-amber-500" />
                    )}
                </div>

                {/* Title & Greeting */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 mb-1.5">
                        {pendingMembership
                            ? 'รอผู้ดูแลองค์กรอนุมัติเข้าทีม'
                            : 'ยืนยันสังกัดองค์กรเพื่อเริ่มใช้งาน'}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        สวัสดีคุณ <span className="font-bold text-slate-800">{user?.name}</span>
                        {pendingMembership && pendingOrg ? (
                            <>
                                {' '}• ระบบได้ส่งคำขอเข้าร่วมองค์กร{' '}
                                <span className="font-bold text-indigo-600">{pendingOrg.name}</span>{' '}
                                เรียบร้อยแล้ว
                            </>
                        ) : (
                            <>
                                {' '}• บัญชีของคุณสร้างสำเร็จแล้ว กรุณากรอกรหัสเชิญเข้าทีม หรือรหัสรับมอบองค์กรเพื่อเข้าสู่ระบบ
                            </>
                        )}
                    </p>
                </div>

                {/* Feedback Alert Banner */}
                {feedback && (
                    <div
                        className={`mb-5 p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs font-bold ${
                            feedback.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : feedback.type === 'error'
                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}
                    >
                        {feedback.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        ) : feedback.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                        ) : (
                            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                        )}
                        <span className="leading-relaxed">{feedback.message}</span>
                    </div>
                )}

                {/* Pending Organization Request Card */}
                {pendingMembership && (
                    <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 mb-5 space-y-3.5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-sm">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                                        องค์กรที่กำลังรออนุมัติ
                                    </div>
                                    <div className="text-base font-bold text-slate-900 truncate">
                                        {pendingOrg?.name || 'องค์กรของคุณ'}
                                    </div>
                                </div>
                            </div>
                            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                รออนุมัติ
                            </span>
                        </div>

                        <div className="pt-3 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <div>
                                <span className="text-slate-400 font-semibold block">รหัสสังกัด:</span>
                                <span className="font-mono font-bold text-slate-800 tabular-nums">
                                    {pendingOrg?.inviteCode || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-semibold block">บทบาทเริ่มต้น:</span>
                                <span className="font-bold text-slate-800">Member (สมาชิกทีม)</span>
                            </div>
                        </div>

                        <p className="text-xs font-medium text-slate-500 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                            เมื่อผู้ดูแลองค์กร (<span className="font-bold text-slate-700">Owner / Admin</span>) กดอนุมัติคำขอของคุณในหน้าจัดการสมาชิก ระบบจะปลดล็อกให้เข้าใช้งานได้ทันทีครับ
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleCheckApprovalStatus}
                                disabled={isCheckingStatus}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                                <span>{isCheckingStatus ? 'กำลังตรวจสอบ...' : 'เช็คสถานะการอนุมัติล่าสุด'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsChangingCode(!isChangingCode)}
                                className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold transition-colors"
                            >
                                {isChangingCode ? 'ซ่อนช่องเปลี่ยนรหัส' : 'เปลี่ยนรหัส / ใช้รหัสอื่น'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Interactive Code Input Form (Shown when no pending org OR user clicked change code) */}
                {showCodeForm && (
                    <form
                        onSubmit={handleCodeSubmit}
                        className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 mb-5 space-y-3.5"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <KeyRound className="w-4 h-4 text-indigo-600" />
                                <span>
                                    {pendingMembership
                                        ? 'เปลี่ยนรหัสเชิญเข้าทีม หรือกรอกรหัสรับมอบองค์กร'
                                        : 'กรอกรหัสเชิญเข้าทีม หรือรหัสรับมอบองค์กร'}
                                </span>
                            </label>
                            {pendingMembership && (
                                <button
                                    type="button"
                                    onClick={handleCancelCurrentRequest}
                                    disabled={isSubmittingCode}
                                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    ยกเลิกคำขอเดิม
                                </button>
                            )}
                        </div>

                        <div>
                            <input
                                type="text"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                                placeholder="เช่น ORG-XXXX หรือ CLAIM-XXXXXX-XXXXXX"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-sm font-bold text-slate-800 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 uppercase tracking-wider transition-all"
                            />

                            {trimmedCode ? (
                                <div
                                    className={`mt-2 flex items-center gap-2 text-xs font-bold ${
                                        isClaimFormat ? 'text-emerald-700' : 'text-indigo-700'
                                    }`}
                                >
                                    {isClaimFormat ? (
                                        <>
                                            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                                            <span>
                                                รหัสรับมอบองค์กร (Owner Claim): ปลดล็อกสิทธิ์เจ้าของบริษัทและเข้าใช้งานทันที
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Users className="w-4 h-4 shrink-0 text-indigo-600" />
                                            <span>
                                                รหัสเชิญเข้าทีม (Invite Code): ส่งคำขอเข้าร่วมองค์กรให้หัวหน้าทีมอนุมัติ
                                            </span>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="mt-1.5 text-[11px] font-semibold text-slate-500 leading-relaxed">
                                    • พนักงานทั่วไป: ใช้ <span className="font-bold text-slate-700">Invite Code</span> จากหัวหน้าทีมเพื่อขอเข้าบริษัท<br />
                                    • เจ้าขององค์กรที่ซื้อแพ็กเกจ: ใช้รหัส <span className="font-bold text-emerald-700">CLAIM-XXXX</span> เพื่อเปิดใช้งานบริษัททันที
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                type="submit"
                                disabled={isSubmittingCode || !trimmedCode}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 ${
                                    isClaimFormat
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                <span>
                                    {isSubmittingCode
                                        ? 'กำลังตรวจสอบรหัส...'
                                        : isClaimFormat
                                        ? 'รับมอบสิทธิ์เจ้าขององค์กรและเข้าใช้งานทันที'
                                        : 'ส่งคำขอเข้าร่วมองค์กร'}
                                </span>
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            {!pendingMembership && (
                                <button
                                    type="button"
                                    onClick={handleCheckApprovalStatus}
                                    disabled={isCheckingStatus}
                                    className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                                    <span>เช็คสถานะ</span>
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* Logout Button */}
                <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center justify-center w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    ลงชื่อออกจากระบบ
                </button>
            </div>
        </div>
    );
};

export default PendingApprovalScreen;

