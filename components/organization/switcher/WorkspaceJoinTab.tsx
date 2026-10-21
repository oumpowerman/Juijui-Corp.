import React, { useState, useEffect } from 'react';
import { KeyRound, UserPlus } from 'lucide-react';
import { useOrganization } from '../../../context/OrganizationContext';

export const WorkspaceJoinTab: React.FC = () => {
    const {
        pendingInviteCodeFromUrl,
        joinOrganizationByCode,
        closeSwitcherModal
    } = useOrganization();

    const [inviteCodeInput, setInviteCodeInput] = useState(pendingInviteCodeFromUrl || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joinResultMessage, setJoinResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (pendingInviteCodeFromUrl) {
            setInviteCodeInput(pendingInviteCodeFromUrl);
        }
    }, [pendingInviteCodeFromUrl]);

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCodeInput.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setJoinResultMessage(null);
        const res = await joinOrganizationByCode(inviteCodeInput);
        setIsSubmitting(false);
        setJoinResultMessage({
            type: res.success ? 'success' : 'error',
            text: res.message
        });
        if (res.success && res.status === 'ACTIVE') {
            setInviteCodeInput('');
            closeSwitcherModal();
        }
    };

    return (
        <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                        เข้าร่วมทีมขององค์กรด้วยรหัสเชิญ (Staff Invite Code)
                    </p>
                    <p>
                        สำหรับพนักงานในบริษัท: กรอกรหัสเชิญที่ได้รับจากผู้ดูแลองค์กรของคุณเพื่อส่งคำขอเข้าทีม
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    รหัสเชิญเข้าทีม (Invite Code)
                </label>
                <input
                    type="text"
                    required
                    value={inviteCodeInput}
                    onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                    placeholder="เช่น JUIJUI-HQ หรือ ORG-8F4K92"
                    className="w-full px-4 py-3 text-base font-mono font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
            </div>

            {joinResultMessage && (
                <div
                    className={`p-3.5 rounded-xl text-xs font-semibold border ${
                        joinResultMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                >
                    {joinResultMessage.text}
                </div>
            )}

            <button
                type="submit"
                disabled={!inviteCodeInput.trim() || isSubmitting}
                className="w-full py-3 px-5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
                <UserPlus className="w-4 h-4" />
                {isSubmitting ? 'กำลังตรวจสอบรหัสเชิญ...' : 'ส่งคำขอเข้าร่วมองค์กร'}
            </button>
        </form>
    );
};
