import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, X } from 'lucide-react';
import { Organization } from '../../../../../types';
import { UpdateOrganizationLicenseInput } from '../../../../../context/OrganizationContext';
import { useToast } from '../../../../../context/ToastContext';

interface OwnerHandoverModalProps {
    handoverOrg: Organization | null;
    initialClaimToken?: string | null;
    allPlatformOrganizations: Organization[];
    onClose: () => void;
    onUpdateLicense: (orgId: string, updates: UpdateOrganizationLicenseInput) => Promise<boolean>;
    onRefreshOrganizations: () => Promise<void>;
}

export const OwnerHandoverModal: React.FC<OwnerHandoverModalProps> = ({
    handoverOrg,
    initialClaimToken,
    allPlatformOrganizations,
    onClose,
    onUpdateLicense,
    onRefreshOrganizations
}) => {
    const { showToast } = useToast();

    const [generatedClaimCode, setGeneratedClaimCode] = useState<string | null>(null);
    const [targetOwnerUserId, setTargetOwnerUserId] = useState('');
    const [isGeneratingClaim, setIsGeneratingClaim] = useState(false);
    const [isAssigningOwner, setIsAssigningOwner] = useState(false);

    useEffect(() => {
        if (!handoverOrg) return;
        setGeneratedClaimCode(initialClaimToken ?? handoverOrg.ownerClaimToken ?? null);
        setTargetOwnerUserId(handoverOrg.ownerId || '');
    }, [handoverOrg, initialClaimToken]);

    useEffect(() => {
        if (!handoverOrg) return;
        const latest = allPlatformOrganizations.find(o => o.id === handoverOrg.id);
        if (latest?.ownerClaimToken) {
            setGeneratedClaimCode(latest.ownerClaimToken);
        }
    }, [allPlatformOrganizations, handoverOrg]);

    const handleGenerateNewClaimToken = async () => {
        if (!handoverOrg) return;
        setIsGeneratingClaim(true);
        try {
            const ok = await onUpdateLicense(handoverOrg.id, {
                regenerateClaimToken: true
            });
            if (ok) {
                await onRefreshOrganizations();
            }
        } finally {
            setIsGeneratingClaim(false);
        }
    };

    const handleAssignDirectOwner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!handoverOrg || !targetOwnerUserId.trim()) return;
        setIsAssigningOwner(true);
        try {
            const ok = await onUpdateLicense(handoverOrg.id, {
                ownerId: targetOwnerUserId.trim()
            });
            if (ok) {
                onClose();
            }
        } finally {
            setIsAssigningOwner(false);
        }
    };

    return (
        <AnimatePresence>
            {handoverOrg && (
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
                        className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* 1. Rigid Header */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">
                                    ส่งมอบสิทธิ์เจ้าขององค์กร (Owner Handover)
                                </h3>
                                <p className="text-xs text-slate-500">{handoverOrg.name}</p>
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
                        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-5">
                            {/* Method A: One-Time Claim Link */}
                            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-900">
                                        วิธีที่ 1: ส่งลิงก์ให้ลูกค้ารับสิทธิ์ผู้บริหารคนแรก (One-Time Claim Link)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleGenerateNewClaimToken}
                                        disabled={isGeneratingClaim}
                                        className="text-xs font-bold text-indigo-600 hover:underline"
                                    >
                                        {generatedClaimCode ? 'สร้างรหัสใหม่' : 'สร้างรหัส Claim'}
                                    </button>
                                </div>

                                {generatedClaimCode ? (
                                    <div className="space-y-2">
                                        <div className="p-3 rounded-xl bg-white border border-amber-200 font-mono text-sm font-bold text-center text-amber-900 tracking-wider">
                                            {generatedClaimCode}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const url = `${window.location.origin}/?claim_org=${encodeURIComponent(
                                                    generatedClaimCode
                                                )}`;
                                                navigator.clipboard.writeText(url);
                                                showToast('คัดลอกลิงก์ส่งมอบสิทธิ์ Owner แล้ว!', 'success');
                                            }}
                                            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Link2 className="w-4 h-4" />
                                            คัดลอกลิงก์ส่งให้ลูกค้า (/?claim_org=...)
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleGenerateNewClaimToken}
                                        disabled={isGeneratingClaim}
                                        className="w-full py-2.5 px-4 text-xs font-bold text-amber-800 bg-white border border-amber-300 hover:bg-amber-100 rounded-xl transition-colors"
                                    >
                                        กดสร้างรหัส Claim Token สำหรับส่งมอบบริษัท
                                    </button>
                                )}
                            </div>

                            {/* Method B: Assign Existing User ID */}
                            <form
                                onSubmit={handleAssignDirectOwner}
                                className="space-y-3 pt-2 border-t border-slate-100"
                            >
                                <label className="block text-xs font-bold text-slate-700">
                                    วิธีที่ 2: ผูกกับบัญชีผู้ใช้ที่มีอยู่ในระบบแล้ว (ระบุ User UUID)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={targetOwnerUserId}
                                        onChange={e => setTargetOwnerUserId(e.target.value)}
                                        placeholder="เช่น 8f14e45f-ceea-467f-a8f7-..."
                                        className="flex-1 px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-xl"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isAssigningOwner || !targetOwnerUserId.trim()}
                                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shrink-0"
                                    >
                                        ผูกสิทธิ์ Owner
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* 3. Rigid Sticky Footer */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
