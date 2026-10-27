import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import heic2any from 'heic2any';
import { BRAND_CONFIG } from '../../config/brand';
import { EMOJI_POOL, DEFAULT_EMOJI } from '../../constants/emojis';
import { DEFAULT_COMPANIES, mapCompanyFromDB } from '../useCompanies';
import { Company } from '../../types';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { setActiveOrgIdSync, setForceActiveOrgIdSync } from '../../lib/tenantStorage';
import { PRIMARY_DEFAULT_ORG_ID, SAAS_PLAN_PRESETS } from '../../lib/multiTenantMigrationSql';
import { generateRandomInviteCode } from '../../context/organization/types';
import { stageAuthPortalTransition, triggerAuthPortalTransition, consumeAuthPortalTransition } from '../../components/auth/AuthPortalTransition';

export type OnboardingCodeVerificationStatus = 'IDLE' | 'VERIFYING' | 'VERIFIED' | 'INVALID';

export interface VerifiedOrgInfo {
  id: string;
  name: string;
  type: 'INVITE' | 'CLAIM';
}

export interface UseRegisterFormOptions {
  onRegisterSuccess: () => void;
  onSessionLoginSuccess: () => void;
}

const DEFAULT_PUBLIC_POSITIONS: { key: string; label: string }[] = [
  { key: 'CREATIVE', label: 'Creative' },
  { key: 'EDITOR', label: 'Editor' },
  { key: 'PRODUCTION', label: 'Production' },
  { key: 'ADMIN', label: 'Admin / Co-ord' },
  { key: 'OTHER', label: 'อื่นๆ (ใส่ตำแหน่งทีหลัง)' },
];

export function useRegisterForm({
  onRegisterSuccess,
  onSessionLoginSuccess,
}: UseRegisterFormOptions) {
  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [onboardingCode, setOnboardingCode] = useState(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const claim = params.get('claim_org');
    const join = params.get('join_org');
    const saved = sessionStorage.getItem('juijui_pending_onboarding_code');
    return (claim || join || saved || '').trim().toUpperCase();
  });
  const [onboardingMode, setOnboardingMode] = useState<'JOIN_TEAM' | 'CREATE_TRIAL'>(() => {
    if (typeof window === 'undefined') return 'JOIN_TEAM';
    const isTrialIntent = sessionStorage.getItem('juijui_trial_signup_intent') === '1';
    return isTrialIntent ? 'CREATE_TRIAL' : 'JOIN_TEAM';
  });
  const [newOrgName, setNewOrgName] = useState('');

  // Scoped Companies & Master positions options for Registration
  const [companies, setCompanies] = useState<Company[]>([]);
  const [positions, setPositions] = useState<{ key: string; label: string }[]>(DEFAULT_PUBLIC_POSITIONS);

  // Real-time Onboarding Code Verification states
  const [codeVerificationStatus, setCodeVerificationStatus] = useState<OnboardingCodeVerificationStatus>('IDLE');
  const [verifiedOrgInfo, setVerifiedOrgInfo] = useState<VerifiedOrgInfo | null>(null);

  // Emoji states
  const [takenEmojis, setTakenEmojis] = useState<string[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_EMOJI);

  // Avatar upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isConvertingImg, setIsConvertingImg] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Statuses
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useGlobalDialog();

  // Helper: Resolve organization details (Exact Match 100%) from invite/claim code when in JOIN_TEAM mode
  const resolveTargetOrgFromCode = async (
    rawCode: string,
    mode: 'JOIN_TEAM' | 'CREATE_TRIAL'
  ): Promise<VerifiedOrgInfo | null> => {
    if (mode === 'CREATE_TRIAL') return null;
    const trimmedCode = rawCode.trim().toUpperCase();
    if (!trimmedCode) return null;

    try {
      const { data: orgRows, error: orgErr } = await supabase
        .from('organizations')
        .select('id, name, invite_code, invite_enabled, owner_claim_token')
        .eq('is_active', true);

      if (!orgErr && orgRows && orgRows.length > 0) {
        if (trimmedCode === 'JUIJUI-HQ') {
          const primaryOrg = orgRows.find((o: any) => o.id === PRIMARY_DEFAULT_ORG_ID);
          return {
            id: PRIMARY_DEFAULT_ORG_ID,
            name: primaryOrg?.name || 'JuiJui Studio HQ',
            type: 'INVITE',
          };
        }

        const claimMatched = orgRows.find(
          (o: any) => (o.owner_claim_token || '').toUpperCase() === trimmedCode
        );
        if (claimMatched) {
          return {
            id: claimMatched.id,
            name: claimMatched.name || 'องค์กรของคุณ',
            type: 'CLAIM',
          };
        }

        const inviteMatched = orgRows.find(
          (o: any) =>
            (o.invite_code || '').toUpperCase() === trimmedCode &&
            o.invite_enabled !== false
        );
        if (inviteMatched) {
          return {
            id: inviteMatched.id,
            name: inviteMatched.name || 'องค์กรของคุณ',
            type: 'INVITE',
          };
        }
      } else if (trimmedCode === 'JUIJUI-HQ') {
        return {
          id: PRIMARY_DEFAULT_ORG_ID,
          name: 'JuiJui Studio HQ',
          type: 'INVITE',
        };
      }

      // Fallback: check master_options SAAS_WORKSPACE if organizations table is inaccessible
      const { data: workspaceOpts } = await supabase
        .from('master_options')
        .select('*')
        .eq('type', 'SAAS_WORKSPACE')
        .eq('is_active', true);

      for (const w of workspaceOpts || []) {
        try {
          const meta = w.description ? JSON.parse(w.description) : {};
          if ((meta.ownerClaimToken || '').toUpperCase() === trimmedCode) {
            return {
              id: w.key || w.id,
              name: w.label || 'องค์กรของคุณ',
              type: 'CLAIM',
            };
          }
          if (
            (meta.inviteCode || '').toUpperCase() === trimmedCode &&
            meta.inviteEnabled !== false
          ) {
            return {
              id: w.key || w.id,
              name: w.label || 'องค์กรของคุณ',
              type: 'INVITE',
            };
          }
        } catch {
          // ignore malformed JSON
        }
      }
    } catch {
      // Ignore lookup errors
    }
    return null;
  };

  // Fetch taken emojis for a resolved organization ID (empty when null)
  const syncTakenEmojisForOrg = async (resolvedOrgId: string | null) => {
    try {
      if (!resolvedOrgId) {
        setTakenEmojis([]);
        setSelectedEmoji((prev) => prev || EMOJI_POOL[0] || DEFAULT_EMOJI);
        return;
      }

      const { data: memberRows } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('org_id', resolvedOrgId)
        .neq('status', 'REJECTED');

      const memberIds = (memberRows || []).map((m: any) => m.user_id).filter(Boolean);

      let emojis: string[] = [];
      if (memberIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('emoji')
          .in('id', memberIds);
        if (profileRows) {
          emojis = profileRows.map((p: any) => p.emoji).filter(Boolean);
        }
      } else {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('emoji')
          .eq('current_org_id', resolvedOrgId);
        if (profileRows) {
          emojis = profileRows.map((p: any) => p.emoji).filter(Boolean);
        }
      }

      setTakenEmojis(emojis);
      setSelectedEmoji((prev) => {
        if (prev && !emojis.includes(prev)) return prev;
        return EMOJI_POOL.find((e) => !emojis.includes(e)) || DEFAULT_EMOJI;
      });
    } catch (e) {
      console.error('Error fetching taken emojis:', e);
      setTakenEmojis([]);
    }
  };

  // Public helper for manual refresh (e.g. when switching tabs in AuthPage)
  const fetchTakenEmojis = async (
    overrideMode?: 'JOIN_TEAM' | 'CREATE_TRIAL',
    overrideCode?: string
  ) => {
    const activeMode = overrideMode ?? onboardingMode;
    const activeCode = overrideCode ?? onboardingCode;
    const matched = await resolveTargetOrgFromCode(activeCode, activeMode);
    await syncTakenEmojisForOrg(matched?.id || null);
  };

  // Real-time 4-state verification + scoped options sync (350ms Debounce + Exact Match 100%)
  useEffect(() => {
    let isCancelled = false;
    const trimmedCode = onboardingCode.trim().toUpperCase();

    // State 1 (IDLE): Creating a new trial org OR empty invite code
    if (onboardingMode === 'CREATE_TRIAL' || !trimmedCode) {
      setCodeVerificationStatus('IDLE');
      setVerifiedOrgInfo(null);
      setCompanies([]);
      setCompanyId('');
      setPositions(DEFAULT_PUBLIC_POSITIONS);
      setTakenEmojis([]);
      setSelectedEmoji((prev) => prev || EMOJI_POOL[0] || DEFAULT_EMOJI);
      return;
    }

    // State 2 (VERIFYING): User is typing a non-empty code -> show verifying spinner immediately
    setCodeVerificationStatus('VERIFYING');

    const timer = setTimeout(async () => {
      try {
        const matchedOrg = await resolveTargetOrgFromCode(trimmedCode, onboardingMode);
        if (isCancelled) return;

        // State 4 (INVALID): Code not found in system
        if (!matchedOrg) {
          setCodeVerificationStatus('INVALID');
          setVerifiedOrgInfo(null);
          setCompanies([]);
          setCompanyId('');
          setPositions(DEFAULT_PUBLIC_POSITIONS);
          setTakenEmojis([]);
          return;
        }

        // State 3 (VERIFIED): Exact match found!
        setCodeVerificationStatus('VERIFIED');
        setVerifiedOrgInfo(matchedOrg);

        const resolvedOrgId = matchedOrg.id;

        // Sync taken emojis for this organization
        await syncTakenEmojisForOrg(resolvedOrgId);
        if (isCancelled) return;

        // Load positions scoped strictly to resolvedOrgId
        const { data: posData } = await supabase
          .from('master_options')
          .select('key, label')
          .eq('org_id', resolvedOrgId)
          .eq('type', 'POSITION')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!isCancelled) {
          if (posData && posData.length > 0) {
            const loadedPositions = posData.filter(
              (p: any) => !['CEO', 'HR_MANAGER', 'SENIOR_HR'].includes(p.key)
            );
            loadedPositions.push({ key: 'OTHER', label: 'อื่นๆ (ใส่ตำแหน่งทีหลัง)' });
            setPositions(loadedPositions);
          } else {
            setPositions([...DEFAULT_PUBLIC_POSITIONS]);
          }
        }

        // Load sub-companies belonging strictly to resolvedOrgId
        const { data: companyRows, error: compErr } = await supabase
          .from('companies')
          .select('*')
          .eq('org_id', resolvedOrgId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (isCancelled) return;

        if (!compErr && companyRows && companyRows.length > 0) {
          const mapped = companyRows.map(mapCompanyFromDB).filter(c => c.isActive !== false);
          setCompanies(mapped);
          setCompanyId(mapped[0]?.id || '');
          return;
        }

        // Fallback to master_options scoped to resolvedOrgId
        const { data: masterData } = await supabase
          .from('master_options')
          .select('*')
          .eq('org_id', resolvedOrgId)
          .eq('type', 'COMPANY')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (isCancelled) return;

        if (masterData && masterData.length > 0) {
          const mapped: Company[] = masterData.map((m: any) => ({
            id: m.id,
            name: m.label || m.name,
            shortName: m.key || m.short_name || 'CO',
            code: m.key,
            description: m.description || '',
            color: m.color || 'bg-indigo-50 text-indigo-700 border-indigo-200',
            isActive: m.is_active !== false,
            sortOrder: m.sort_order || 0,
          }));
          setCompanies(mapped);
          setCompanyId(mapped[0]?.id || '');
          return;
        }

        if (resolvedOrgId === PRIMARY_DEFAULT_ORG_ID) {
          setCompanies(DEFAULT_COMPANIES);
          setCompanyId(DEFAULT_COMPANIES[0].id);
        } else {
          setCompanies([]);
          setCompanyId('');
        }
      } catch {
        if (!isCancelled) {
          setCodeVerificationStatus('INVALID');
          setVerifiedOrgInfo(null);
          setCompanies([]);
          setCompanyId('');
          setPositions(DEFAULT_PUBLIC_POSITIONS);
          setTakenEmojis([]);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [onboardingMode, onboardingCode]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let file = e.target.files[0];

      // Image format validation & conversion for HEIC files
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        setIsConvertingImg(true);
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8,
          });

          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          file = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
            type: 'image/jpeg',
          });
        } catch (err) {
          console.error('HEIC Conversion error:', err);
          setErrorMsg('ไม่สามารถแปลงไฟล์รูปภาพได้ กรุณาลองใช้รูปอื่น');
          setIsConvertingImg(false);
          return;
        } finally {
          setIsConvertingImg(false);
        }
      }

      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(objectUrl);
    setCropImageSrc(null);
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setName('');
    setFirstName('');
    setLastName('');
    setPosition('');
    setEmploymentType('');
    setPhone('');
    setReason('');
    setOnboardingCode('');
    setCodeVerificationStatus('IDLE');
    setVerifiedOrgInfo(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setErrorMsg(null);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Guard against submitting an invalid or still-verifying invite code
      if (onboardingMode === 'JOIN_TEAM' && onboardingCode.trim()) {
        if (codeVerificationStatus === 'VERIFYING') {
          throw new Error('กำลังตรวจสอบรหัสเชิญเข้าทีม กรุณารอสักครู่นะครับ');
        }
        if (codeVerificationStatus === 'INVALID') {
          throw new Error('ไม่พบรหัสเชิญนี้ในระบบ กรุณาตรวจสอบความถูกต้อง หรือลบออกหากต้องการกรอกภายหลัง');
        }
      }

      const cleanUsername = username.toLowerCase().trim();
      if (!cleanUsername) {
        throw new Error('กรุณากรอกชื่อผู้ใช้นะครับ');
      }
      if (!/^[a-z0-9_.]{3,20}$/.test(cleanUsername)) {
        throw new Error(
          'ชื่อผู้ใช้ต้องประกอบด้วยภาษาอังกฤษ ตัวเลข ขีดล่าง (_) และจุด (.) ความยาว 3-20 ตัวอักษรเท่านั้นนะครับ'
        );
      }

      if (
        !firstName.trim() ||
        !lastName.trim() ||
        !name.trim() ||
        !position.trim() ||
        !phone.trim() ||
        !employmentType
      ) {
        throw new Error('กรุณากรอกข้อมูลให้ครบทุกช่องที่มีเครื่องหมาย * นะครับ');
      }
      if (!selectedEmoji) {
        throw new Error('กรุณาเลือกอิโมจิประจำตัวของคุณด้วยนะครับ 👾');
      }
      if (takenEmojis.includes(selectedEmoji)) {
        throw new Error('อิโมจินี้ถูกเพื่อนในทีมเลือกไปแล้วครับ โปรดเลือกอิโมจิอื่นนะ ✨');
      }

      // Check if username is taken in profiles
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) {
        throw new Error('ชื่อผู้ใช้นี้ถูกใช้งานไปแล้ว กรุณาเลือกชื่อผู้ใช้อื่นนะครับ');
      }

      const cleanEmail = email.trim() ? email.toLowerCase().trim() : '';
      const finalAuthEmail = cleanEmail ? cleanEmail : `${cleanUsername}@juijui-app.com`;

      const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim();
      const targetPortalMode = onboardingMode === 'CREATE_TRIAL' ? 'REGISTER_TRIAL' : 'REGISTER_JOIN';
      stageAuthPortalTransition(targetPortalMode);

      // Create new user credentials
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: finalAuthEmail,
        password,
        options: {
          data: {
            full_name: fullNameCombined || name,
            position: position,
            phone_number: phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');

      const userId = authData.user.id;
      let publicUrl = '';

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;

        // Upload profile image safely to Storage bucket
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw new Error('อัปโหลดรูปไม่สำเร็จ: ' + uploadError.message);

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        publicUrl = urlData.publicUrl;
      }

      // Upsert customized user details
      const finalCompanyId =
        onboardingMode === 'CREATE_TRIAL'
          ? null
          : companyId || (companies.length > 0 ? companies[0].id : null);
      const cleanOnboardingCode = onboardingCode.trim().toUpperCase();

      // Resolve onboarding code if provided (Owner Claim Token vs Team Invite Code vs Self-Service Trial)
      let resolvedMode: 'CLAIM' | 'INVITE' | 'TRIAL_CREATE' | 'NONE' = 'NONE';
      let matchedOrgId: string | null = null;
      let isNativeOrgDB = false;
      let matchedFallbackWorkspaceRow: any = null;
      const cleanNewOrgName = newOrgName.trim();

      if (onboardingMode === 'CREATE_TRIAL' && cleanNewOrgName) {
        resolvedMode = 'TRIAL_CREATE';
        try {
          const provisionRes = await fetch('/api/billing/provision-fast-checkout-org', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              orgName: cleanNewOrgName,
              email: cleanEmail || finalAuthEmail,
              planTier: 'PRO',
              maxMembers: 5,
              allowedModules: [...SAAS_PLAN_PRESETS.PRO.defaultModules],
              subscriptionStatus: 'TRIAL',
              trialDays: 7,
              description: 'องค์กรทดลองใช้งานฟรี 7 วัน (PRO Trial)',
            }),
          });
          const provisionData = await provisionRes.json().catch(() => ({}));
          if (provisionRes.ok && provisionData?.orgId) {
            isNativeOrgDB = true;
            matchedOrgId = provisionData.orgId;
          }
        } catch (err) {
          console.warn('[useRegisterForm] Server provision fallback:', err);
        }

        if (!matchedOrgId) {
          const slugBase =
            cleanNewOrgName
              .toLowerCase()
              .replace(/[^a-z0-9ก-๙]+/g, '-')
              .replace(/^-+|-+$/g, '') || `studio-${Date.now()}`;
          const uniqueSlug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`;
          const inviteCode = generateRandomInviteCode(cleanNewOrgName);
          const trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          const insertPayload: Record<string, any> = {
            name: cleanNewOrgName,
            slug: uniqueSlug,
            description: 'องค์กรทดลองใช้งานฟรี 7 วัน (PRO Trial)',
            color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            logo_url: '',
            invite_code: inviteCode,
            invite_enabled: true,
            owner_id: userId,
            plan_tier: 'PRO',
            subscription_status: 'TRIAL',
            expires_at: trialExpiresAt,
            grace_period_days: 3,
            max_members: 5,
            allowed_modules: [...SAAS_PLAN_PRESETS.PRO.defaultModules],
            billing_email: cleanEmail || null,
            is_active: true,
          };

          const { data: createdOrg, error: createErr } = await supabase
            .from('organizations')
            .insert([insertPayload])
            .select('*')
            .single();

          if (!createErr && createdOrg) {
            isNativeOrgDB = true;
            matchedOrgId = createdOrg.id;
          }
        }
      } else if (cleanOnboardingCode) {
        const { data: orgRows, error: orgQueryErr } = await supabase
          .from('organizations')
          .select('*')
          .eq('is_active', true);

        if (!orgQueryErr && orgRows) {
          isNativeOrgDB = true;
          const claimMatch = orgRows.find(
            (o: any) => (o.owner_claim_token || '').toUpperCase() === cleanOnboardingCode
          );
          if (claimMatch) {
            resolvedMode = 'CLAIM';
            matchedOrgId = claimMatch.id;
          } else {
            const inviteMatch = orgRows.find(
              (o: any) =>
                (o.invite_code || '').toUpperCase() === cleanOnboardingCode &&
                o.invite_enabled !== false
            );
            if (inviteMatch) {
              resolvedMode = 'INVITE';
              matchedOrgId = inviteMatch.id;
            }
          }
        } else {
          // Fallback: check master_options SAAS_WORKSPACE
          const { data: workspaceOpts } = await supabase
            .from('master_options')
            .select('*')
            .eq('type', 'SAAS_WORKSPACE');

          if (cleanOnboardingCode === 'JUIJUI-HQ') {
            resolvedMode = 'INVITE';
            matchedOrgId = PRIMARY_DEFAULT_ORG_ID;
          } else {
            for (const w of workspaceOpts || []) {
              try {
                const meta = w.description ? JSON.parse(w.description) : {};
                if ((meta.ownerClaimToken || '').toUpperCase() === cleanOnboardingCode) {
                  resolvedMode = 'CLAIM';
                  matchedOrgId = w.key || w.id;
                  matchedFallbackWorkspaceRow = w;
                  break;
                }
                if (
                  (meta.inviteCode || '').toUpperCase() === cleanOnboardingCode &&
                  meta.inviteEnabled !== false
                ) {
                  resolvedMode = 'INVITE';
                  matchedOrgId = w.key || w.id;
                  matchedFallbackWorkspaceRow = w;
                  break;
                }
              } catch {
                // ignore
              }
            }
          }
        }
      }

      const isOwnerOrTrialSuccess =
        (resolvedMode === 'CLAIM' || resolvedMode === 'TRIAL_CREATE') && Boolean(matchedOrgId);

      const profilePayload: Record<string, any> = {
        id: userId,
        email: cleanEmail || null,
        username: cleanUsername,
        full_name: fullNameCombined || name,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: name.trim(),
        avatar_url: publicUrl || null,
        position: position,
        employment_type: employmentType,
        start_date: new Date().toISOString(),
        phone_number: phone,
        bio: reason,
        company_id: finalCompanyId,
        role: isOwnerOrTrialSuccess ? 'ADMIN' : 'MEMBER',
        is_approved: isOwnerOrTrialSuccess ? true : false,
        work_days: [1, 2, 3, 4, 5],
        hp: BRAND_CONFIG.initialHpMode === 2 ? 0 : 100,
        max_hp: 100,
        xp: 0,
        level: 1,
        available_points: 0,
        death_count: 0,
        emoji: selectedEmoji,
      };

      if (matchedOrgId) {
        profilePayload.current_org_id = matchedOrgId;
      }

      const { error: profileError } = await supabase.from('profiles').upsert(profilePayload);

      if (profileError) throw profileError;

      // Process Self-Service Trial Creation, Organization Claim, or Pending Invite Request
      if (resolvedMode === 'TRIAL_CREATE' && matchedOrgId) {
        await supabase.from('organization_members').upsert(
          [
            {
              org_id: matchedOrgId,
              user_id: userId,
              role: 'OWNER',
              status: 'ACTIVE',
            },
          ],
          { onConflict: 'org_id,user_id' }
        );

        try {
          await supabase.rpc('seed_organization_defaults', { target_org_id: matchedOrgId });
        } catch {
          // ignore if RPC not yet created
        }

        setForceActiveOrgIdSync(matchedOrgId);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('juijui_superadmin_portal_mode', 'WORKSPACE');
          sessionStorage.removeItem('juijui_trial_signup_intent');
          sessionStorage.removeItem('juijui_pending_onboarding_code');
          window.dispatchEvent(
            new CustomEvent('org-workspace-switched', {
              detail: { orgId: matchedOrgId, orgName: cleanNewOrgName },
            })
          );
        }
      } else if (resolvedMode === 'CLAIM' && matchedOrgId) {
        if (isNativeOrgDB) {
          await supabase
            .from('organizations')
            .update({
              owner_id: userId,
              owner_claim_token: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', matchedOrgId);

          await supabase.from('organization_members').upsert(
            [
              {
                org_id: matchedOrgId,
                user_id: userId,
                role: 'OWNER',
                status: 'ACTIVE',
              },
            ],
            { onConflict: 'org_id,user_id' }
          );
        } else if (matchedFallbackWorkspaceRow) {
          const meta = matchedFallbackWorkspaceRow.description
            ? JSON.parse(matchedFallbackWorkspaceRow.description)
            : {};
          meta.ownerId = userId;
          meta.ownerClaimToken = null;
          await supabase
            .from('master_options')
            .update({ description: JSON.stringify(meta) })
            .eq('id', matchedFallbackWorkspaceRow.id);

          await supabase.from('master_options').insert([
            {
              type: 'SAAS_WORKSPACE_MEMBER',
              key: `OWN_${matchedOrgId.slice(0, 6)}_${userId.slice(0, 6)}`,
              parent_key: matchedOrgId,
              label: fullNameCombined || name,
              description: JSON.stringify({
                userId,
                email: cleanEmail || null,
                role: 'OWNER',
                status: 'ACTIVE',
              }),
              sort_order: 1,
              is_active: true,
            },
          ]);
        }

        setActiveOrgIdSync(matchedOrgId);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('juijui_pending_onboarding_code');
          if (window.location.search.includes('claim_org')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      } else if (resolvedMode === 'INVITE' && matchedOrgId) {
        if (isNativeOrgDB) {
          await supabase.from('organization_members').upsert(
            [
              {
                org_id: matchedOrgId,
                user_id: userId,
                role: 'MEMBER',
                status: 'PENDING',
              },
            ],
            { onConflict: 'org_id,user_id' }
          );
        } else {
          await supabase.from('master_options').insert([
            {
              type: 'SAAS_WORKSPACE_MEMBER',
              key: `REQ_${matchedOrgId.slice(0, 6)}_${userId.slice(0, 6)}_${Date.now().toString().slice(-4)}`,
              parent_key: matchedOrgId,
              label: fullNameCombined || name,
              description: JSON.stringify({
                userId,
                email: cleanEmail || null,
                role: 'MEMBER',
                status: 'PENDING',
              }),
              sort_order: 10,
              is_active: true,
            },
          ]);
        }

        setActiveOrgIdSync(matchedOrgId);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('juijui_pending_onboarding_code');
          if (window.location.search.includes('join_org')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      }

      triggerAuthPortalTransition(targetPortalMode);
      if (authData.session) {
        onSessionLoginSuccess();
      } else {
        onRegisterSuccess();
      }
    } catch (err: any) {
      consumeAuthPortalTransition();
      const message = err.message || 'เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่อีกครั้งครับ';

      // Auto-scroll to the error field and focus
      if (message.includes('ชื่อผู้ใช้นี้ถูกใช้งานไปแล้ว') || message.includes('ชื่อผู้ใช้')) {
        const usernameContainer = document.getElementById('register-username-container');
        if (usernameContainer) {
          usernameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            const input = usernameContainer.querySelector('input') as HTMLInputElement;
            if (input) {
              input.focus();
              input.select();
            }
          }, 350);
        }
      } else if (message.includes('อิโมจิ')) {
        const emojiContainer = document.getElementById('register-selectedEmoji-container');
        if (emojiContainer) {
          emojiContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (
        message.includes('รูปภาพ') ||
        message.includes('รูปโปรไฟล์') ||
        message.includes('อัปโหลดรูป')
      ) {
        const avatarContainer = document.getElementById('register-avatarPreview-container');
        if (avatarContainer) {
          avatarContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      await showAlert(message, 'ไม่สามารถสมัครสมาชิกได้');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    name,
    setName,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    position,
    setPosition,
    employmentType,
    setEmploymentType,
    phone,
    setPhone,
    reason,
    setReason,
    companyId,
    setCompanyId,
    onboardingCode,
    setOnboardingCode,
    onboardingMode,
    setOnboardingMode,
    newOrgName,
    setNewOrgName,
    codeVerificationStatus,
    verifiedOrgInfo,
    companies,
    positions,
    takenEmojis,
    selectedEmoji,
    setSelectedEmoji,
    avatarPreview,
    isConvertingImg,
    cropImageSrc,
    setCropImageSrc,
    fileInputRef,
    isLoading,
    errorMsg,
    setErrorMsg,
    fetchTakenEmojis,
    handleFileChange,
    handleCropComplete,
    handleRegisterSubmit,
    resetForm,
  };
}

export default useRegisterForm;
