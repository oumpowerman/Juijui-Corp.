import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { useOrganization } from '../../../context/OrganizationContext';

export const WorkspaceClaimTab: React.FC = () => {
    const {
        pendingClaimTokenFromUrl,
        claimOrganizationOwnership,
        closeSwitcherModal
    } = useOrganization();

    const [claimTokenInput, setClaimTokenInput] = useState(pendingClaimTokenFromUrl || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [claimResultMessage, setClaimResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (pendingClaimTokenFromUrl) {
            setClaimTokenInput(pendingClaimTokenFromUrl);
        }
    }, [pendingClaimTokenFromUrl]);

    const handleClaimSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!claimTokenInput.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setClaimResultMessage(null);
        const res = await claimOrganizationOwnership(claimTokenInput);
        setIsSubmitting(false);
        setClaimResultMessage({
            type: res.success ? 'success' : 'error',
            text: res.message
        });
        if (res.success) {
            setClaimTokenInput('');
            closeSwitcherModal();
        }
    };

    return (
        <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                        รับมอบสิทธิ์เจ้าขององค์กร (Owner Onboarding Token)
                    </p>
                    <p>
                        สำหรับลูกค้าที่สั่งซื้อแพ็กเกจ: กรอกรหัสรับมอบองค์กร (Owner Claim Token) ที่ได้รับจากผู้ให้บริการ เพื่อเปิดใช้งานและรับสิทธิ์เป็น OWNER ทันที
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    รหัสรับมอบองค์กร (Owner Claim Token)
                </label>
                <input
                    type="text"
                    required
                    value={claimTokenInput}
                    onChange={e => setClaimTokenInput(e.target.value.toUpperCase())}
                    placeholder="เช่น COMP-8F4K92-X7M9P2"
                    className="w-full px-4 py-3 text-base font-mono font-bold tracking-wider uppercase border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
            </div>

            {claimResultMessage && (
                <div
                    className={`p-3.5 rounded-xl text-xs font-semibold border ${
                        claimResultMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                >
                    {claimResultMessage.text}
                </div>
            )}

            <button
                type="submit"
                disabled={!claimTokenInput.trim() || isSubmitting}
                className="w-full py-3 px-5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
                <Crown className="w-4 h-4" />
                {isSubmitting ? 'กำลังยืนยันสิทธิ์เจ้าขององค์กร...' : 'ยืนยันรับมอบสิทธิ์เป็น OWNER ขององค์กร'}
            </button>
        </form>
    );
};
