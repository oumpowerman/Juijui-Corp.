import React from 'react';
import { Copy, KeyRound, Link2, RefreshCw, UserCheck, Users } from 'lucide-react';
import { Organization, OrganizationMember } from '../../../../../types';
import { useToast } from '../../../../../context/ToastContext';

interface WorkspaceInvitesTabProps {
    currentOrg: Organization;
    activeMemberCount: number;
    isOrgAdmin: boolean;
    pendingJoinRequests: OrganizationMember[];
    onOpenSwitcherModal: () => void;
    onRegenerateInviteCode: (orgId?: string) => Promise<string | null>;
    onApproveMemberRequest: (memberId: string) => Promise<boolean>;
    onRejectMemberRequest: (memberId: string) => Promise<boolean>;
}

export const WorkspaceInvitesTab: React.FC<WorkspaceInvitesTabProps> = ({
    currentOrg,
    activeMemberCount,
    isOrgAdmin,
    pendingJoinRequests,
    onOpenSwitcherModal,
    onRegenerateInviteCode,
    onApproveMemberRequest,
    onRejectMemberRequest
}) => {
    const { showToast } = useToast();

    const handleCopyInviteLink = (inviteCode: string) => {
        const link = `${window.location.origin}/?join_org=${encodeURIComponent(inviteCode)}`;
        navigator.clipboard.writeText(link);
        showToast('คัดลอกลิงก์เชิญเข้าร่วมองค์กรแล้ว', 'success');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-indigo-600" />
                        รหัสเชิญเข้าทีมของ {currentOrg.name}
                    </h3>
                    <button
                        type="button"
                        onClick={onOpenSwitcherModal}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                        เปิดหน้าต่างสลับองค์กร
                    </button>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-slate-500">
                            Invite Code สำหรับพนักงานในบริษัท
                        </p>
                        <p className="text-xl font-bold font-mono tabular-nums text-indigo-700 tracking-wider mt-0.5">
                            {currentOrg.inviteCode}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(currentOrg.inviteCode);
                                showToast(`คัดลอกรหัส ${currentOrg.inviteCode} แล้ว`, 'success');
                            }}
                            className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors flex items-center gap-1.5"
                        >
                            <Copy className="w-3.5 h-3.5" /> คัดลอกรหัส
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCopyInviteLink(currentOrg.inviteCode)}
                            className="px-3 py-2 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                        >
                            <Link2 className="w-3.5 h-3.5" /> คัดลอกลิงก์เชิญ
                        </button>
                        {isOrgAdmin && (
                            <button
                                type="button"
                                onClick={() => onRegenerateInviteCode(currentOrg.id)}
                                className="p-2 text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl transition-colors"
                                title="สร้างรหัสเชิญใหม่"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600">
                            โควตาสมาชิกในแพ็กเกจ ({currentOrg.planTier || 'PRO'})
                        </span>
                        <span className="font-mono tabular-nums text-slate-900">
                            {activeMemberCount} / {currentOrg.maxMembers || 50} คน
                        </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.round((activeMemberCount / (currentOrg.maxMembers || 50)) * 100)
                                )}%`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Pending Join Requests */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        คิวอนุมัติพนักงานเข้าองค์กร (Pending Join Queue)
                    </h3>
                    <span className="text-xs font-bold font-mono tabular-nums text-slate-500">
                        รออนุมัติ {pendingJoinRequests.length} รายการ
                    </span>
                </div>

                {pendingJoinRequests.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                        <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-sm font-bold text-slate-700">
                            ไม่มีคำขอเข้าร่วมที่ค้างอนุมัติ
                        </p>
                        <p className="text-xs text-slate-500">
                            เมื่อพนักงานกรอกรหัสเชิญ {currentOrg.inviteCode} รายชื่อจะปรากฏที่นี่เพื่อให้ Admin กดอนุมัติ
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {pendingJoinRequests.map(req => (
                            <div
                                key={req.id}
                                className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                        {req.user?.name || 'ผู้ขอเข้าร่วมองค์กร'}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {req.user?.email || req.userId}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => onApproveMemberRequest(req.id)}
                                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1"
                                    >
                                        <UserCheck className="w-3.5 h-3.5" /> อนุมัติ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRejectMemberRequest(req.id)}
                                        className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors"
                                    >
                                        ปฏิเสธ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
