import React, { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Organization,
    OrganizationMember,
    OrganizationMemberStatus,
    User
} from '../../types';
import { generateRandomInviteCode } from './types';

interface UseOrganizationMembersDomainProps {
    currentUserProfile: User | null;
    currentOrg: Organization;
    allPlatformOrganizations: Organization[];
    currentOrgMembers: OrganizationMember[];
    setPendingInviteCodeFromUrl: React.Dispatch<React.SetStateAction<string | null>>;
    switchOrganization: (orgId: string) => Promise<boolean>;
    fetchOrganizationsAndMembers: () => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useOrganizationMembersDomain({
    currentUserProfile,
    currentOrg,
    allPlatformOrganizations,
    currentOrgMembers,
    setPendingInviteCodeFromUrl,
    switchOrganization,
    fetchOrganizationsAndMembers,
    showToast
}: UseOrganizationMembersDomainProps) {
    const joinOrganizationByCode = useCallback(async (rawCode: string) => {
        if (!currentUserProfile?.id) {
            return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนเข้าร่วมองค์กร' };
        }
        const code = rawCode.trim().toUpperCase();
        if (!code) {
            return { success: false, message: 'กรุณากรอกรหัสเชิญ (Invite Code)' };
        }

        try {
            const { data: targetOrg, error: lookupErr } = await supabase
                .from('organizations')
                .select('*')
                .ilike('invite_code', code)
                .eq('is_active', true)
                .maybeSingle();

            if (lookupErr || !targetOrg) {
                return { success: false, message: 'ไม่พบองค์กรจากรหัสเชิญนี้ กรุณาตรวจสอบความถูกต้อง' };
            }

            if (targetOrg.invite_enabled === false) {
                return { success: false, message: 'องค์กรนี้ปิดรับการเข้าร่วมด้วยรหัสเชิญชั่วคราว' };
            }

            const { data: existingMem } = await supabase
                .from('organization_members')
                .select('*')
                .eq('org_id', targetOrg.id)
                .eq('user_id', currentUserProfile.id)
                .maybeSingle();

            if (existingMem) {
                if (existingMem.status === 'ACTIVE') {
                    await switchOrganization(targetOrg.id);
                    return {
                        success: true,
                        status: 'ACTIVE' as OrganizationMemberStatus,
                        orgName: targetOrg.name,
                        message: `คุณเป็นสมาชิกของ ${targetOrg.name} อยู่แล้ว ระบบได้สลับ Workspace ให้ทันที`
                    };
                }
                return {
                    success: true,
                    status: existingMem.status as OrganizationMemberStatus,
                    orgName: targetOrg.name,
                    message: `คำขอเข้าร่วม ${targetOrg.name} ของคุณอยู่ระหว่างรอ Admin อนุมัติ`
                };
            }

            const { error: joinErr } = await supabase
                .from('organization_members')
                .insert([{
                    org_id: targetOrg.id,
                    user_id: currentUserProfile.id,
                    role: 'MEMBER',
                    status: 'PENDING'
                }]);

            if (joinErr) throw joinErr;

            await fetchOrganizationsAndMembers();
            setPendingInviteCodeFromUrl(null);
            showToast(`ส่งคำขอเข้าร่วม "${targetOrg.name}" แล้ว รอ Admin อนุมัติ`, 'info');
            return {
                success: true,
                status: 'PENDING' as OrganizationMemberStatus,
                orgName: targetOrg.name,
                message: `ส่งคำขอเข้าร่วม "${targetOrg.name}" สำเร็จ! กรุณารอ Admin ขององค์กรกดอนุมัติ`
            };
        } catch (err: any) {
            console.error('[OrganizationContext] joinOrganizationByCode error:', err);
            return { success: false, message: 'เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถเข้าร่วมได้') };
        }
    }, [currentUserProfile?.id, switchOrganization, fetchOrganizationsAndMembers, setPendingInviteCodeFromUrl, showToast]);

    const approveMemberRequest = useCallback(async (memberId: string, assignedCompanyId?: string): Promise<boolean> => {
        const activeCount = currentOrgMembers.filter(m => m.status === 'ACTIVE').length;
        const maxAllowed = currentOrg.maxMembers || 100;

        if (activeCount >= maxAllowed) {
            showToast(
                `ไม่สามารถอนุมัติได้ เนื่องจากสมาชิกในองค์กรเต็มโควตาแพ็กเกจแล้ว (${activeCount}/${maxAllowed} คน) กรุณาอัปเกรดแพ็กเกจ`,
                'error'
            );
            return false;
        }

        const targetMember = currentOrgMembers.find(m => m.id === memberId);

        try {
            const { error } = await supabase
                .from('organization_members')
                .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
                .eq('id', memberId);
            if (error) throw error;

            // Auto-unlock the approved user's profile (is_approved = true), set current_org_id, and optionally assign sub-company
            if (targetMember?.userId) {
                const profileUpdates: Record<string, any> = {
                    is_approved: true,
                    current_org_id: currentOrg.id
                };
                if (assignedCompanyId) {
                    profileUpdates.company_id = assignedCompanyId;
                }
                await supabase
                    .from('profiles')
                    .update(profileUpdates)
                    .eq('id', targetMember.userId);
            }

            await fetchOrganizationsAndMembers();
            showToast('อนุมัติสมาชิกเข้าสู่องค์กรและปลดล็อกสิทธิ์เข้าใช้งานเรียบร้อยแล้ว', 'success');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] approveMemberRequest error:', err);
            showToast('ไม่สามารถอนุมัติสมาชิกได้: ' + err.message, 'error');
            return false;
        }
    }, [currentOrgMembers, currentOrg.id, currentOrg.maxMembers, fetchOrganizationsAndMembers, showToast]);

    const rejectMemberRequest = useCallback(async (memberId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('organization_members')
                .delete()
                .eq('id', memberId);
            if (error) throw error;

            await fetchOrganizationsAndMembers();
            showToast('ปฏิเสธคำขอเข้าร่วมองค์กรแล้ว', 'info');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] rejectMemberRequest error:', err);
            showToast('ไม่สามารถลบคำขอได้: ' + err.message, 'error');
            return false;
        }
    }, [fetchOrganizationsAndMembers, showToast]);

    const cancelPendingJoinRequest = useCallback(async (orgId: string): Promise<boolean> => {
        if (!currentUserProfile?.id) return false;
        try {
            const { error } = await supabase
                .from('organization_members')
                .delete()
                .eq('org_id', orgId)
                .eq('user_id', currentUserProfile.id)
                .eq('status', 'PENDING');
            if (error) throw error;

            await fetchOrganizationsAndMembers();
            showToast('ยกเลิกคำขอเข้าร่วมองค์กรเดิมแล้ว คุณสามารถกรอกรหัสใหม่ได้ทันที', 'info');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] cancelPendingJoinRequest error:', err);
            showToast('ไม่สามารถยกเลิกคำขอได้: ' + err.message, 'error');
            return false;
        }
    }, [currentUserProfile?.id, fetchOrganizationsAndMembers, showToast]);

    const regenerateInviteCode = useCallback(async (orgId?: string): Promise<string | null> => {
        const targetOrg = allPlatformOrganizations.find(o => o.id === (orgId || currentOrg.id)) || currentOrg;
        const newCode = generateRandomInviteCode(targetOrg.slug || targetOrg.name);

        try {
            const { error } = await supabase
                .from('organizations')
                .update({ invite_code: newCode, updated_at: new Date().toISOString() })
                .eq('id', targetOrg.id);
            if (error) throw error;

            await fetchOrganizationsAndMembers();
            showToast(`สร้างรหัสเชิญใหม่สำเร็จ: ${newCode}`, 'success');
            return newCode;
        } catch (err: any) {
            console.error('[OrganizationContext] regenerateInviteCode error:', err);
            showToast('ไม่สามารถรีเซ็ตรหัสเชิญได้', 'error');
            return null;
        }
    }, [allPlatformOrganizations, currentOrg, fetchOrganizationsAndMembers, showToast]);

    const toggleInviteEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('organizations')
                .update({ invite_enabled: enabled, updated_at: new Date().toISOString() })
                .eq('id', currentOrg.id);
            if (error) throw error;

            await fetchOrganizationsAndMembers();
            showToast(enabled ? 'เปิดรับสมาชิกรหัสเชิญแล้ว' : 'ปิดรับสมาชิกรหัสเชิญชั่วคราว', 'info');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] toggleInviteEnabled error:', err);
            return false;
        }
    }, [currentOrg.id, fetchOrganizationsAndMembers, showToast]);

    return {
        joinOrganizationByCode,
        approveMemberRequest,
        rejectMemberRequest,
        cancelPendingJoinRequest,
        regenerateInviteCode,
        toggleInviteEnabled
    };
}
