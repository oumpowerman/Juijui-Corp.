import React, { useCallback } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
    Organization,
    OrganizationMember,
    PlanTier,
    SubscriptionStatus,
    User
} from '../../types';
import { SAAS_PLAN_PRESETS } from '../../lib/multiTenantMigrationSql';
import { setActiveOrgIdSync } from '../../lib/tenantStorage';
import {
    CreateOrganizationInput,
    UpdateOrganizationLicenseInput,
    generateRandomInviteCode,
    generateOwnerClaimToken,
    mapOrgFromDB
} from './types';

interface UseOrganizationLicensingDomainProps {
    currentUserProfile: User | null;
    isSuperAdmin: boolean;
    myOrganizations: Organization[];
    allPlatformOrganizations: Organization[];
    myMemberships: OrganizationMember[];
    setSelectedOrgId: React.Dispatch<React.SetStateAction<string>>;
    setPendingClaimTokenFromUrl: React.Dispatch<React.SetStateAction<string | null>>;
    fetchOrganizationsAndMembers: () => Promise<void>;
    fetchProfile: () => Promise<unknown>;
    queryClient: QueryClient;
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useOrganizationLicensingDomain({
    currentUserProfile,
    isSuperAdmin,
    myOrganizations,
    allPlatformOrganizations,
    myMemberships,
    setSelectedOrgId,
    setPendingClaimTokenFromUrl,
    fetchOrganizationsAndMembers,
    fetchProfile,
    queryClient,
    showToast
}: UseOrganizationLicensingDomainProps) {
    const switchOrganization = useCallback(async (orgId: string): Promise<boolean> => {
        const target =
            myOrganizations.find(o => o.id === orgId) ||
            allPlatformOrganizations.find(o => o.id === orgId);
        if (!target) {
            showToast('ไม่พบองค์กรที่เลือก', 'error');
            return false;
        }

        const membership = myMemberships.find(m => m.orgId === orgId);
        if (!isSuperAdmin && membership && membership.status === 'PENDING') {
            showToast('คำขอเข้าร่วมองค์กรนี้ยังอยู่ระหว่างรอ Admin อนุมัติ', 'warning');
            return false;
        }

        try {
            setSelectedOrgId(orgId);
            setActiveOrgIdSync(orgId);

            if (currentUserProfile?.id) {
                await supabase
                    .from('profiles')
                    .update({ current_org_id: orgId })
                    .eq('id', currentUserProfile.id);
            }

            await queryClient.invalidateQueries();

            if (typeof window !== 'undefined') {
                window.dispatchEvent(
                    new CustomEvent('org-workspace-switched', {
                        detail: { orgId, orgName: target.name }
                    })
                );
            }

            await fetchOrganizationsAndMembers();
            showToast(`สลับไปยัง Workspace: ${target.name} เรียบร้อยแล้ว`, 'success');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] switchOrganization error:', err);
            showToast('เกิดข้อผิดพลาดในการสลับองค์กร', 'error');
            return false;
        }
    }, [
        myOrganizations,
        allPlatformOrganizations,
        myMemberships,
        isSuperAdmin,
        currentUserProfile?.id,
        setSelectedOrgId,
        queryClient,
        fetchOrganizationsAndMembers,
        showToast
    ]);

    const createOrganization = useCallback(async (input: CreateOrganizationInput): Promise<Organization | null> => {
        if (!currentUserProfile?.id) return null;
        if (!isSuperAdmin) {
            showToast('เฉพาะ Super Admin เท่านั้นที่สามารถเปิดองค์กรใหม่ให้ลูกค้าได้', 'error');
            return null;
        }

        const cleanName = input.name.trim();
        if (!cleanName) {
            showToast('กรุณาระบุชื่อองค์กร', 'error');
            return null;
        }

        const slugBase = (input.slug || cleanName)
            .toLowerCase()
            .replace(/[^a-z0-9ก-๙]+/g, '-')
            .replace(/^-+|-+$/g, '') || `workspace-${Date.now()}`;
        const uniqueSlug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`;
        const inviteCode = generateRandomInviteCode(cleanName);
        const color = input.color || 'bg-indigo-50 text-indigo-700 border-indigo-200';
        const planTier: PlanTier = input.planTier || 'PRO';
        const preset = SAAS_PLAN_PRESETS[planTier] || SAAS_PLAN_PRESETS.PRO;
        const subscriptionStatus: SubscriptionStatus = input.subscriptionStatus || 'ACTIVE';
        const maxMembers = input.maxMembers || preset.defaultMaxMembers;
        const allowedModules = input.allowedModules && input.allowedModules.length > 0
            ? input.allowedModules
            : [...preset.defaultModules];
        const ownerClaimToken = input.generateOwnerClaimLink !== false ? generateOwnerClaimToken(cleanName) : null;
        const targetOwnerId = input.assignOwnerUserId || currentUserProfile.id;

        try {
            const insertPayload: Record<string, any> = {
                name: cleanName,
                slug: uniqueSlug,
                description: input.description || '',
                color,
                logo_url: input.logoUrl || '',
                invite_code: inviteCode,
                invite_enabled: true,
                owner_id: targetOwnerId,
                plan_tier: planTier,
                subscription_status: subscriptionStatus,
                expires_at: input.expiresAt || null,
                grace_period_days: input.gracePeriodDays ?? 7,
                max_members: maxMembers,
                allowed_modules: allowedModules,
                owner_claim_token: ownerClaimToken,
                billing_email: input.billingEmail || null,
                is_active: true
            };

            let { data: createdOrg, error: createErr } = await supabase
                .from('organizations')
                .insert([insertPayload])
                .select('*')
                .single();

            // Graceful retry if extended columns are not yet present
            if (createErr) {
                const minimalPayload = {
                    name: cleanName,
                    slug: uniqueSlug,
                    description: input.description || '',
                    color,
                    logo_url: input.logoUrl || '',
                    invite_code: inviteCode,
                    invite_enabled: true,
                    owner_id: targetOwnerId,
                    plan_tier: planTier,
                    is_active: true
                };
                const retry = await supabase
                    .from('organizations')
                    .insert([minimalPayload])
                    .select('*')
                    .single();
                if (retry.error) throw retry.error;
                createdOrg = retry.data;
            }

            // Enroll assigned owner in organization_members
            await supabase
                .from('organization_members')
                .insert([{
                    org_id: createdOrg.id,
                    user_id: targetOwnerId,
                    role: 'OWNER',
                    status: 'ACTIVE'
                }]);

            // Seed default master_options for the new organization via RPC
            await supabase.rpc('seed_organization_defaults', { target_org_id: createdOrg.id });

            const mapped = mapOrgFromDB({
                ...createdOrg,
                plan_tier: planTier,
                subscription_status: subscriptionStatus,
                expires_at: input.expiresAt || null,
                max_members: maxMembers,
                allowed_modules: allowedModules,
                owner_claim_token: ownerClaimToken,
                billing_email: input.billingEmail || null
            }, 1);

            await fetchOrganizationsAndMembers();
            showToast(`เปิดองค์กรลูกค้า "${cleanName}" (${planTier}) สำเร็จ!`, 'success');
            return mapped;
        } catch (err: any) {
            console.error('[OrganizationContext] createOrganization error:', err);
            showToast('ไม่สามารถสร้างองค์กรได้: ' + (err.message || 'Unknown error'), 'error');
            return null;
        }
    }, [currentUserProfile?.id, isSuperAdmin, fetchOrganizationsAndMembers, showToast]);

    const updateOrganizationLicense = useCallback(async (
        orgId: string,
        updates: UpdateOrganizationLicenseInput
    ): Promise<boolean> => {
        if (!isSuperAdmin) {
            showToast('เฉพาะ Super Admin เท่านั้นที่สามารถแก้ไขแพ็กเกจและสิทธิ์โมดูลได้', 'error');
            return false;
        }

        const targetOrg = allPlatformOrganizations.find(o => o.id === orgId);
        if (!targetOrg) return false;

        const nextClaimToken = updates.regenerateClaimToken
            ? generateOwnerClaimToken(updates.name || targetOrg.name)
            : updates.regenerateClaimToken === false
            ? null
            : targetOrg.ownerClaimToken;

        try {
            const dbUpdates: Record<string, any> = {
                updated_at: new Date().toISOString()
            };
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.color !== undefined) dbUpdates.color = updates.color;
            if (updates.planTier !== undefined) dbUpdates.plan_tier = updates.planTier;
            if (updates.subscriptionStatus !== undefined) dbUpdates.subscription_status = updates.subscriptionStatus;
            if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;
            if (updates.gracePeriodDays !== undefined) dbUpdates.grace_period_days = updates.gracePeriodDays;
            if (updates.maxMembers !== undefined) dbUpdates.max_members = updates.maxMembers;
            if (updates.allowedModules !== undefined) dbUpdates.allowed_modules = updates.allowedModules;
            if (updates.billingEmail !== undefined) dbUpdates.billing_email = updates.billingEmail;
            if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
            if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
            if (updates.regenerateClaimToken !== undefined) dbUpdates.owner_claim_token = nextClaimToken;

            const { error } = await supabase
                .from('organizations')
                .update(dbUpdates)
                .eq('id', orgId);

            if (error) throw error;

            if (updates.ownerId) {
                await supabase
                    .from('organization_members')
                    .upsert([{
                        org_id: orgId,
                        user_id: updates.ownerId,
                        role: 'OWNER',
                        status: 'ACTIVE'
                    }], { onConflict: 'org_id,user_id' });
            }

            await fetchOrganizationsAndMembers();
            showToast(`บันทึกการตั้งค่าลิขสิทธิ์ "${updates.name || targetOrg.name}" เรียบร้อยแล้ว`, 'success');
            return true;
        } catch (err: any) {
            console.error('[OrganizationContext] updateOrganizationLicense error:', err);
            showToast('ไม่สามารถอัปเดตลิขสิทธิ์ได้: ' + err.message, 'error');
            return false;
        }
    }, [isSuperAdmin, allPlatformOrganizations, fetchOrganizationsAndMembers, showToast]);

    const claimOrganizationOwnership = useCallback(async (rawToken: string) => {
        if (!currentUserProfile?.id) {
            return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนรับมอบสิทธิ์เจ้าขององค์กร' };
        }
        const token = rawToken.trim().toUpperCase();
        if (!token) {
            return { success: false, message: 'กรุณาระบุรหัสรับมอบองค์กร (Owner Claim Token)' };
        }

        try {
            let matchedOrg = allPlatformOrganizations.find(
                o => (o.ownerClaimToken || '').toUpperCase() === token
            );

            if (!matchedOrg) {
                const { data: orgRow } = await supabase
                    .from('organizations')
                    .select('*')
                    .ilike('owner_claim_token', token)
                    .eq('is_active', true)
                    .maybeSingle();

                if (orgRow) {
                    matchedOrg = mapOrgFromDB(orgRow);
                }
            }

            if (!matchedOrg) {
                return { success: false, message: 'ไม่พบองค์กรจากรหัสรับมอบสิทธิ์นี้ หรือรหัสอาจถูกใช้งานไปแล้ว' };
            }

            await supabase
                .from('organizations')
                .update({
                    owner_id: currentUserProfile.id,
                    owner_claim_token: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', matchedOrg.id);

            await supabase
                .from('organization_members')
                .upsert([{
                    org_id: matchedOrg.id,
                    user_id: currentUserProfile.id,
                    role: 'OWNER',
                    status: 'ACTIVE'
                }], { onConflict: 'org_id,user_id' });

            // Unlock profile immediately (is_approved = true, role = 'ADMIN', current_org_id)
            await supabase
                .from('profiles')
                .update({
                    is_approved: true,
                    role: 'ADMIN',
                    current_org_id: matchedOrg.id
                })
                .eq('id', currentUserProfile.id);

            setPendingClaimTokenFromUrl(null);
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('juijui_pending_onboarding_code');
                if (window.location.search.includes('claim_org')) {
                    window.history.replaceState({}, '', window.location.pathname);
                }
            }

            await fetchOrganizationsAndMembers();
            await switchOrganization(matchedOrg.id);
            await fetchProfile();
            showToast(`คุณได้รับสิทธิ์ OWNER ของ "${matchedOrg.name}" เรียบร้อยแล้ว!`, 'success');
            return {
                success: true,
                orgName: matchedOrg.name,
                message: `รับมอบองค์กร "${matchedOrg.name}" สำเร็จ! ระบบได้ปลดล็อกและสลับเข้าสู่ Workspace ของคุณแล้ว`
            };
        } catch (err: any) {
            console.error('[OrganizationContext] claimOrganizationOwnership error:', err);
            return { success: false, message: 'เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถรับมอบองค์กรได้') };
        }
    }, [
        currentUserProfile?.id,
        allPlatformOrganizations,
        setPendingClaimTokenFromUrl,
        fetchOrganizationsAndMembers,
        switchOrganization,
        fetchProfile,
        showToast
    ]);

    const provisionSelfServiceTrialOrganization = useCallback(async (input: {
        name: string;
        description?: string;
    }) => {
        if (!currentUserProfile?.id) {
            return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนเปิดองค์กรทดลองใช้ฟรี' };
        }

        const cleanName = (input.name || '').trim();
        if (!cleanName) {
            return { success: false, message: 'กรุณาระบุชื่อบริษัทหรือสตูดิโอของคุณ' };
        }

        // Enforce 1 Trial Organization per regular user account
        const alreadyOwnsOrg =
            !isSuperAdmin &&
            (allPlatformOrganizations.some(o => o.ownerId === currentUserProfile.id) ||
                myMemberships.some(m => m.role === 'OWNER'));

        if (alreadyOwnsOrg) {
            return {
                success: false,
                message: 'บัญชีของคุณมีองค์กรที่เป็นเจ้าของอยู่แล้ว (จำกัดสิทธิ์เปิดองค์กรทดลองใช้ฟรี 1 แห่งต่อ 1 บัญชี)'
            };
        }

        const slugBase =
            cleanName
                .toLowerCase()
                .replace(/[^a-z0-9ก-๙]+/g, '-')
                .replace(/^-+|-+$/g, '') || `studio-${Date.now()}`;
        const uniqueSlug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`;
        const inviteCode = generateRandomInviteCode(cleanName);
        const planTier: PlanTier = 'PRO';
        const preset = SAAS_PLAN_PRESETS.PRO;
        const subscriptionStatus: SubscriptionStatus = 'TRIAL';
        const maxMembers = 5; // 7-Day Free Trial PRO tier capped at 5 members
        const allowedModules = [...preset.defaultModules];
        const trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        try {
            const insertPayload: Record<string, any> = {
                name: cleanName,
                slug: uniqueSlug,
                description: input.description || 'องค์กรทดลองใช้งานฟรี 7 วัน (PRO Trial)',
                color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                logo_url: '',
                invite_code: inviteCode,
                invite_enabled: true,
                owner_id: currentUserProfile.id,
                plan_tier: planTier,
                subscription_status: subscriptionStatus,
                expires_at: trialExpiresAt,
                grace_period_days: 3,
                max_members: maxMembers,
                allowed_modules: allowedModules,
                billing_email: currentUserProfile.email || null,
                is_active: true
            };

            let { data: createdOrg, error: createErr } = await supabase
                .from('organizations')
                .insert([insertPayload])
                .select('*')
                .single();

            if (createErr) {
                const minimalPayload = {
                    name: cleanName,
                    slug: uniqueSlug,
                    description: input.description || 'องค์กรทดลองใช้งานฟรี 7 วัน (PRO Trial)',
                    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    invite_code: inviteCode,
                    invite_enabled: true,
                    owner_id: currentUserProfile.id,
                    plan_tier: planTier,
                    is_active: true
                };
                const retry = await supabase
                    .from('organizations')
                    .insert([minimalPayload])
                    .select('*')
                    .single();
                if (retry.error) throw retry.error;
                createdOrg = retry.data;
            }

            // 1. Add creator as ACTIVE OWNER in organization_members
            await supabase
                .from('organization_members')
                .upsert(
                    [
                        {
                            org_id: createdOrg.id,
                            user_id: currentUserProfile.id,
                            role: 'OWNER',
                            status: 'ACTIVE'
                        }
                    ],
                    { onConflict: 'org_id,user_id' }
                );

            // 2. Seed default master_options for the new organization
            try {
                await supabase.rpc('seed_organization_defaults', { target_org_id: createdOrg.id });
            } catch {
                // Ignore if RPC is not yet created
            }

            // 3. Approve user profile immediately and bind current_org_id
            await supabase
                .from('profiles')
                .update({
                    is_approved: true,
                    role: 'ADMIN',
                    current_org_id: createdOrg.id
                })
                .eq('id', currentUserProfile.id);

            setSelectedOrgId(createdOrg.id);
            setActiveOrgIdSync(createdOrg.id);

            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('juijui_pending_onboarding_code');
                sessionStorage.removeItem('juijui_trial_signup_intent');
            }

            const mapped = mapOrgFromDB(
                {
                    ...createdOrg,
                    plan_tier: planTier,
                    subscription_status: subscriptionStatus,
                    expires_at: trialExpiresAt,
                    max_members: maxMembers,
                    allowed_modules: allowedModules
                },
                1
            );

            await fetchOrganizationsAndMembers();
            await switchOrganization(createdOrg.id);
            await fetchProfile();

            showToast(
                `เปิดองค์กร "${cleanName}" สำเร็จ! เริ่มทดลองใช้งานแพ็กเกจ PRO ฟรี 7 วัน (สูงสุด 5 คน)`,
                'success'
            );

            return {
                success: true,
                org: mapped,
                message: `เปิดองค์กร "${cleanName}" สำเร็จ! ระบบได้เปิดสิทธิ์แพ็กเกจ PRO ทดลองใช้ฟรี 7 วันให้คุณเรียบร้อยแล้ว`
            };
        } catch (err: any) {
            console.error('[OrganizationContext] provisionSelfServiceTrialOrganization error:', err);
            const msg = 'ไม่สามารถสร้างองค์กรทดลองใช้ได้: ' + (err.message || 'Unknown error');
            showToast(msg, 'error');
            return { success: false, message: msg };
        }
    }, [
        currentUserProfile?.id,
        currentUserProfile?.email,
        isSuperAdmin,
        allPlatformOrganizations,
        myMemberships,
        setSelectedOrgId,
        fetchOrganizationsAndMembers,
        switchOrganization,
        fetchProfile,
        showToast
    ]);

    return {
        switchOrganization,
        createOrganization,
        provisionSelfServiceTrialOrganization,
        updateOrganizationLicense,
        claimOrganizationOwnership
    };
}
