import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { rawSupabase } from '../lib/supabase';
import {
    DEMO_DEFAULT_QUOTA_SECONDS,
    DemoRolePerspective,
    DemoTrialSessionRecord,
    configureDemoSandboxRuntime,
    resetDemoSandboxRamData
} from '../lib/demoSandboxEngine';
import { useToast } from './ToastContext';

const LOCAL_QUOTA_REGISTRY_KEY = 'juijui_demo_quota_registry_v1';
const DEMO_INTENT_SESSION_KEY = 'juijui_demo_intent';

interface LocalQuotaMap {
    byUserId: Record<string, DemoTrialSessionRecord>;
    byEmail: Record<string, DemoTrialSessionRecord>;
}

const readLocalQuotaRegistry = (): LocalQuotaMap => {
    try {
        const raw = localStorage.getItem(LOCAL_QUOTA_REGISTRY_KEY);
        if (!raw) return { byUserId: {}, byEmail: {} };
        const parsed = JSON.parse(raw);
        return {
            byUserId: parsed?.byUserId || {},
            byEmail: parsed?.byEmail || {}
        };
    } catch {
        return { byUserId: {}, byEmail: {} };
    }
};

const writeLocalQuotaRecord = (record: DemoTrialSessionRecord) => {
    try {
        const reg = readLocalQuotaRegistry();
        const cleanEmail = (record.email || '').trim().toLowerCase();
        if (record.user_id) {
            reg.byUserId[record.user_id] = record;
        }
        if (cleanEmail) {
            reg.byEmail[cleanEmail] = record;
        }
        localStorage.setItem(LOCAL_QUOTA_REGISTRY_KEY, JSON.stringify(reg));
    } catch {
        // Ignore storage quota errors
    }
};

export const setDemoIntentFlag = (enabled: boolean) => {
    try {
        if (enabled) {
            sessionStorage.setItem(DEMO_INTENT_SESSION_KEY, 'true');
        } else {
            sessionStorage.removeItem(DEMO_INTENT_SESSION_KEY);
        }
    } catch {
        // Ignore
    }
};

export const hasDemoIntentFlag = (): boolean => {
    try {
        return sessionStorage.getItem(DEMO_INTENT_SESSION_KEY) === 'true';
    } catch {
        return false;
    }
};

interface DemoSandboxContextType {
    isDemoMode: boolean;
    isQuotaLoading: boolean;
    demoRole: DemoRolePerspective;
    elapsedSeconds: number;
    quotaSeconds: number;
    remainingSeconds: number;
    isDemoExpired: boolean;
    isDemoBlocked: boolean;
    formattedRemainingTime: string;
    trialRecord: DemoTrialSessionRecord | null;

    // User Actions
    startDemoMode: () => Promise<boolean>;
    pauseAndExitDemoMode: () => Promise<void>;
    switchDemoRole: (role: DemoRolePerspective) => void;
    resetDemoData: () => void;
    refreshMyTrialQuota: () => Promise<void>;

    // Super Admin Console Actions
    allTrialSessions: DemoTrialSessionRecord[];
    isAdminLoadingTrials: boolean;
    fetchAllDemoTrialSessions: () => Promise<void>;
    adminResetDemoQuota: (record: DemoTrialSessionRecord) => Promise<boolean>;
    adminExtendDemoQuota: (record: DemoTrialSessionRecord, addSeconds?: number) => Promise<boolean>;
    adminToggleBlockDemoUser: (record: DemoTrialSessionRecord) => Promise<boolean>;
}

const DemoSandboxContext = createContext<DemoSandboxContextType | undefined>(undefined);

export const formatSecondsMMSS = (totalSeconds: number): string => {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const DemoSandboxProvider: React.FC<{ sessionUser: any; children: React.ReactNode }> = ({
    sessionUser,
    children
}) => {
    const { showToast } = useToast();

    const [isDemoMode, setIsDemoMode] = useState(false);
    const [isQuotaLoading, setIsQuotaLoading] = useState(true);
    const [demoRole, setDemoRole] = useState<DemoRolePerspective>('ADMIN');
    const [trialRecord, setTrialRecord] = useState<DemoTrialSessionRecord | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [quotaSeconds, setQuotaSeconds] = useState<number>(DEMO_DEFAULT_QUOTA_SECONDS);
    const [isDemoBlocked, setIsDemoBlocked] = useState<boolean>(false);

    const [allTrialSessions, setAllTrialSessions] = useState<DemoTrialSessionRecord[]>([]);
    const [isAdminLoadingTrials, setIsAdminLoadingTrials] = useState<boolean>(false);

    const elapsedRef = useRef<number>(0);
    const quotaRef = useRef<number>(DEMO_DEFAULT_QUOTA_SECONDS);
    const recordRef = useRef<DemoTrialSessionRecord | null>(null);

    useEffect(() => {
        elapsedRef.current = elapsedSeconds;
    }, [elapsedSeconds]);

    useEffect(() => {
        quotaRef.current = quotaSeconds;
    }, [quotaSeconds]);

    useEffect(() => {
        recordRef.current = trialRecord;
    }, [trialRecord]);

    const userId = sessionUser?.id || '';
    const userEmail = (sessionUser?.email || '').trim().toLowerCase();
    const userName =
        sessionUser?.user_metadata?.full_name ||
        sessionUser?.user_metadata?.name ||
        (userEmail ? userEmail.split('@')[0] : 'ผู้ทดลองเล่น');
    const authProvider =
        sessionUser?.app_metadata?.provider ||
        sessionUser?.app_metadata?.providers?.[0] ||
        'email';

    // Sync current runtime user info
    useEffect(() => {
        if (userId) {
            configureDemoSandboxRuntime({
                userId,
                userEmail: userEmail || `${userId.slice(0, 8)}@juijui-demo.local`,
                userName
            });
        }
    }, [userId, userEmail, userName]);

    // Persist elapsed time to DB + localStorage
    const persistQuotaProgress = useCallback(
        async (targetElapsed: number, incrementSessionCount = false) => {
            if (!userId) return;
            const currentRec = recordRef.current;
            const nowIso = new Date().toISOString();
            const cleanEmail = userEmail || `${userId}@juijui-demo.local`;

            const updatedRecord: DemoTrialSessionRecord = {
                id: currentRec?.id || crypto.randomUUID?.() || `trial-${userId}`,
                user_id: userId,
                email: cleanEmail,
                full_name: currentRec?.full_name || userName,
                auth_provider: currentRec?.auth_provider || authProvider,
                elapsed_seconds: Math.min(targetElapsed, quotaRef.current),
                quota_seconds: currentRec?.quota_seconds ?? quotaRef.current,
                session_count: (currentRec?.session_count || 1) + (incrementSessionCount ? 1 : 0),
                is_blocked: currentRec?.is_blocked || false,
                last_active_at: nowIso,
                created_at: currentRec?.created_at || nowIso
            };

            writeLocalQuotaRecord(updatedRecord);
            setTrialRecord(updatedRecord);

            try {
                const { data, error } = await rawSupabase
                    .from('demo_trial_sessions')
                    .upsert(
                        {
                            user_id: updatedRecord.user_id,
                            email: updatedRecord.email,
                            full_name: updatedRecord.full_name,
                            auth_provider: updatedRecord.auth_provider,
                            elapsed_seconds: updatedRecord.elapsed_seconds,
                            quota_seconds: updatedRecord.quota_seconds,
                            session_count: updatedRecord.session_count,
                            is_blocked: updatedRecord.is_blocked,
                            last_active_at: updatedRecord.last_active_at
                        },
                        { onConflict: 'user_id' }
                    )
                    .select('*')
                    .maybeSingle();

                if (!error && data) {
                    writeLocalQuotaRecord(data as DemoTrialSessionRecord);
                    setTrialRecord(data as DemoTrialSessionRecord);
                }
            } catch {
                // Table may not be migrated yet; localStorage mirror keeps quota strictly enforced
            }
        },
        [userId, userEmail, userName, authProvider]
    );

    // Fetch or initialize quota record for current user (checking both user_id and email)
    const refreshMyTrialQuota = useCallback(async () => {
        if (!userId) {
            setIsQuotaLoading(false);
            return;
        }
        setIsQuotaLoading(true);
        try {
            const cleanEmail = userEmail || `${userId}@juijui-demo.local`;
            const localReg = readLocalQuotaRegistry();
            const localMatch = localReg.byUserId[userId] || (cleanEmail ? localReg.byEmail[cleanEmail] : undefined);

            let dbRecord: DemoTrialSessionRecord | null = null;
            try {
                const { data: byUser } = await rawSupabase
                    .from('demo_trial_sessions')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (byUser) {
                    dbRecord = byUser as DemoTrialSessionRecord;
                } else if (cleanEmail) {
                    const { data: byEmail } = await rawSupabase
                        .from('demo_trial_sessions')
                        .select('*')
                        .ilike('email', cleanEmail)
                        .maybeSingle();
                    if (byEmail) {
                        dbRecord = byEmail as DemoTrialSessionRecord;
                    }
                }
            } catch {
                // Ignore if table doesn't exist yet
            }

            if (dbRecord) {
                // Use DB record as source of truth (so Super Admin resets/extensions take immediate effect),
                // unless local has slightly newer heartbeat within the same quota
                let effectiveElapsed = Number(dbRecord.elapsed_seconds || 0);
                const dbQuota = Number(dbRecord.quota_seconds || DEMO_DEFAULT_QUOTA_SECONDS);

                if (
                    localMatch &&
                    localMatch.quota_seconds === dbQuota &&
                    localMatch.elapsed_seconds > effectiveElapsed &&
                    new Date(localMatch.last_active_at).getTime() > new Date(dbRecord.last_active_at).getTime()
                ) {
                    effectiveElapsed = localMatch.elapsed_seconds;
                }

                const merged: DemoTrialSessionRecord = {
                    ...dbRecord,
                    elapsed_seconds: effectiveElapsed,
                    quota_seconds: dbQuota,
                    is_blocked: Boolean(dbRecord.is_blocked)
                };
                writeLocalQuotaRecord(merged);
                setTrialRecord(merged);
                setElapsedSeconds(effectiveElapsed);
                setQuotaSeconds(dbQuota);
                setIsDemoBlocked(Boolean(merged.is_blocked));
            } else if (localMatch) {
                setTrialRecord(localMatch);
                setElapsedSeconds(Number(localMatch.elapsed_seconds || 0));
                setQuotaSeconds(Number(localMatch.quota_seconds || DEMO_DEFAULT_QUOTA_SECONDS));
                setIsDemoBlocked(Boolean(localMatch.is_blocked));
            } else {
                const nowIso = new Date().toISOString();
                const initialRec: DemoTrialSessionRecord = {
                    id: crypto.randomUUID?.() || `trial-${userId}`,
                    user_id: userId,
                    email: cleanEmail,
                    full_name: userName,
                    auth_provider: authProvider,
                    elapsed_seconds: 0,
                    quota_seconds: DEMO_DEFAULT_QUOTA_SECONDS,
                    session_count: 0,
                    is_blocked: false,
                    last_active_at: nowIso,
                    created_at: nowIso
                };
                setTrialRecord(initialRec);
                setElapsedSeconds(0);
                setQuotaSeconds(DEMO_DEFAULT_QUOTA_SECONDS);
                setIsDemoBlocked(false);
            }
        } finally {
            setIsQuotaLoading(false);
        }
    }, [userId, userEmail, userName, authProvider]);

    useEffect(() => {
        refreshMyTrialQuota();
    }, [refreshMyTrialQuota]);

    const remainingSeconds = Math.max(0, quotaSeconds - elapsedSeconds);
    const isDemoExpired = remainingSeconds <= 0 || isDemoBlocked;

    // Auto-start Demo Mode if user clicked "ทดลองเล่นระบบจริง (ฟรี 10 นาที)" from LandingPage
    useEffect(() => {
        if (!isQuotaLoading && userId && hasDemoIntentFlag() && !isDemoMode) {
            setDemoIntentFlag(false);
            if (!isDemoBlocked && quotaSeconds - elapsedSeconds > 0) {
                startDemoMode();
            } else {
                showToast('บัญชีนี้ใช้สิทธิ์เวลาทดลองเล่นครบ 10 นาทีแล้วครับ', 'warning');
            }
        }
    }, [isQuotaLoading, userId]);

    // Active Heartbeat Timer (Option B: counts ONLY while Demo Mode is active & tab is visible)
    useEffect(() => {
        if (!isDemoMode || isDemoExpired) return;

        const tickInterval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                return; // Pause counting when tab is hidden/minimized
            }

            setElapsedSeconds((prev) => {
                const next = prev + 1;
                const currentQuota = quotaRef.current;

                // Update localStorage every second so F5 refresh never loses elapsed seconds
                if (recordRef.current) {
                    writeLocalQuotaRecord({
                        ...recordRef.current,
                        elapsed_seconds: Math.min(next, currentQuota),
                        last_active_at: new Date().toISOString()
                    });
                }

                // Sync to Supabase DB every 10 seconds or right when quota expires
                if (next % 10 === 0 || next >= currentQuota) {
                    persistQuotaProgress(Math.min(next, currentQuota), false);
                }

                return Math.min(next, currentQuota);
            });
        }, 1000);

        const handleBeforeUnload = () => {
            if (recordRef.current) {
                writeLocalQuotaRecord({
                    ...recordRef.current,
                    elapsed_seconds: elapsedRef.current,
                    last_active_at: new Date().toISOString()
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            clearInterval(tickInterval);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDemoMode, isDemoExpired, persistQuotaProgress]);

    const startDemoMode = useCallback(async (): Promise<boolean> => {
        if (!userId) return false;
        if (isDemoBlocked) {
            showToast('สิทธิ์การทดลองเล่นของบัญชีนี้ถูกระงับโดยผู้ดูแลระบบ', 'error');
            return false;
        }
        if (quotaSeconds - elapsedSeconds <= 0) {
            showToast('คุณใช้เวลาทดลองเล่นครบโควต้า 10 นาทีแล้วครับ', 'warning');
            return false;
        }

        configureDemoSandboxRuntime({
            isActive: true,
            role: demoRole,
            userId,
            userEmail: userEmail || `${userId.slice(0, 8)}@juijui-demo.local`,
            userName
        });

        setIsDemoMode(true);
        await persistQuotaProgress(elapsedSeconds, true);

        window.dispatchEvent(new CustomEvent('org-workspace-switched'));
        window.dispatchEvent(new CustomEvent('demo-sandbox-toggled', { detail: { active: true, role: demoRole } }));
        showToast('เข้าสู่โหมดทดลองเล่นระบบจริง (Sandbox) แล้ว! ลองสร้างหรือแก้ไขข้อมูลได้เต็มที่ครับ', 'success');
        return true;
    }, [userId, isDemoBlocked, quotaSeconds, elapsedSeconds, demoRole, userEmail, userName, persistQuotaProgress, showToast]);

    const pauseAndExitDemoMode = useCallback(async () => {
        await persistQuotaProgress(elapsedRef.current, false);
        configureDemoSandboxRuntime({ isActive: false });
        setIsDemoMode(false);
        window.dispatchEvent(new CustomEvent('org-workspace-switched'));
        window.dispatchEvent(new CustomEvent('demo-sandbox-toggled', { detail: { active: false, role: demoRole } }));
        showToast(
            `พักเวลาโหมดทดลองเล่นแล้ว (เหลือเวลา ${formatSecondsMMSS(
                Math.max(0, quotaRef.current - elapsedRef.current)
            )} นาทีสำหรับครั้งถัดไป)`,
            'info'
        );
    }, [persistQuotaProgress, demoRole, showToast]);

    const switchDemoRole = useCallback(
        (nextRole: DemoRolePerspective) => {
            setDemoRole(nextRole);
            configureDemoSandboxRuntime({ role: nextRole });
            window.dispatchEvent(new CustomEvent('org-workspace-switched'));
            window.dispatchEvent(new CustomEvent('demo-sandbox-toggled', { detail: { active: isDemoMode, role: nextRole } }));
            showToast(
                nextRole === 'ADMIN'
                    ? 'สลับเป็นมุมมองผู้บริหาร (Admin): ปลดล็อกเมนูตั้งค่าองค์กรและดูงานทั้งบริษัท'
                    : 'สลับเป็นมุมมองพนักงาน (Member): แสดงหน้าต่างปฏิบัติงานของทีมครีเอทีฟ',
                'info'
            );
        },
        [isDemoMode, showToast]
    );

    const resetDemoData = useCallback(() => {
        resetDemoSandboxRamData();
        configureDemoSandboxRuntime({
            isActive: isDemoMode,
            role: demoRole,
            userId,
            userEmail: userEmail || `${userId.slice(0, 8)}@juijui-demo.local`,
            userName
        });
        window.dispatchEvent(new CustomEvent('org-workspace-switched'));
        showToast('รีเซ็ตข้อมูลจำลองกลับเป็นค่าเริ่มต้นเรียบร้อยแล้วครับ', 'success');
    }, [isDemoMode, demoRole, userId, userEmail, userName, showToast]);

    // --- SUPER ADMIN MANAGEMENT ACTIONS ---
    const fetchAllDemoTrialSessions = useCallback(async () => {
        setIsAdminLoadingTrials(true);
        try {
            const localReg = readLocalQuotaRegistry();
            const localList = Object.values(localReg.byUserId);

            let dbList: DemoTrialSessionRecord[] = [];
            try {
                const { data, error } = await rawSupabase
                    .from('demo_trial_sessions')
                    .select('*')
                    .order('last_active_at', { ascending: false });
                if (!error && data) {
                    dbList = data as DemoTrialSessionRecord[];
                }
            } catch {
                // Ignore if table not created yet
            }

            const mergedMap = new Map<string, DemoTrialSessionRecord>();
            localList.forEach((item) => mergedMap.set(item.user_id, item));
            dbList.forEach((item) => mergedMap.set(item.user_id, item));

            const sorted = Array.from(mergedMap.values()).sort(
                (a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime()
            );
            setAllTrialSessions(sorted);
        } finally {
            setIsAdminLoadingTrials(false);
        }
    }, []);

    const adminResetDemoQuota = useCallback(
        async (record: DemoTrialSessionRecord): Promise<boolean> => {
            const nowIso = new Date().toISOString();
            const updated: DemoTrialSessionRecord = {
                ...record,
                elapsed_seconds: 0,
                quota_seconds: Math.max(record.quota_seconds || DEMO_DEFAULT_QUOTA_SECONDS, DEMO_DEFAULT_QUOTA_SECONDS),
                is_blocked: false,
                last_active_at: nowIso
            };

            writeLocalQuotaRecord(updated);
            setAllTrialSessions((prev) => prev.map((r) => (r.user_id === record.user_id ? updated : r)));

            if (record.user_id === userId) {
                setTrialRecord(updated);
                setElapsedSeconds(0);
                setQuotaSeconds(updated.quota_seconds);
                setIsDemoBlocked(false);
            }

            try {
                await rawSupabase
                    .from('demo_trial_sessions')
                    .upsert(
                        {
                            user_id: updated.user_id,
                            email: updated.email,
                            full_name: updated.full_name,
                            auth_provider: updated.auth_provider,
                            elapsed_seconds: 0,
                            quota_seconds: updated.quota_seconds,
                            session_count: updated.session_count,
                            is_blocked: false,
                            last_active_at: nowIso
                        },
                        { onConflict: 'user_id' }
                    );
            } catch {
                // Ignore
            }

            showToast(`รีเซ็ตเวลาทดลองเล่นของ ${record.email} กลับเป็นเต็มโควต้าแล้ว`, 'success');
            return true;
        },
        [userId, showToast]
    );

    const adminExtendDemoQuota = useCallback(
        async (record: DemoTrialSessionRecord, addSeconds = 600): Promise<boolean> => {
            const nowIso = new Date().toISOString();
            const newQuota = Number(record.quota_seconds || DEMO_DEFAULT_QUOTA_SECONDS) + addSeconds;
            const updated: DemoTrialSessionRecord = {
                ...record,
                quota_seconds: newQuota,
                is_blocked: false,
                last_active_at: nowIso
            };

            writeLocalQuotaRecord(updated);
            setAllTrialSessions((prev) => prev.map((r) => (r.user_id === record.user_id ? updated : r)));

            if (record.user_id === userId) {
                setTrialRecord(updated);
                setQuotaSeconds(newQuota);
                setIsDemoBlocked(false);
            }

            try {
                await rawSupabase
                    .from('demo_trial_sessions')
                    .upsert(
                        {
                            user_id: updated.user_id,
                            email: updated.email,
                            full_name: updated.full_name,
                            auth_provider: updated.auth_provider,
                            elapsed_seconds: updated.elapsed_seconds,
                            quota_seconds: newQuota,
                            session_count: updated.session_count,
                            is_blocked: false,
                            last_active_at: nowIso
                        },
                        { onConflict: 'user_id' }
                    );
            } catch {
                // Ignore
            }

            showToast(`เพิ่มเวลาทดลองเล่น +${Math.round(addSeconds / 60)} นาที ให้ ${record.email} แล้ว`, 'success');
            return true;
        },
        [userId, showToast]
    );

    const adminToggleBlockDemoUser = useCallback(
        async (record: DemoTrialSessionRecord): Promise<boolean> => {
            const nowIso = new Date().toISOString();
            const nextBlocked = !record.is_blocked;
            const updated: DemoTrialSessionRecord = {
                ...record,
                is_blocked: nextBlocked,
                last_active_at: nowIso
            };

            writeLocalQuotaRecord(updated);
            setAllTrialSessions((prev) => prev.map((r) => (r.user_id === record.user_id ? updated : r)));

            if (record.user_id === userId) {
                setTrialRecord(updated);
                setIsDemoBlocked(nextBlocked);
            }

            try {
                await rawSupabase
                    .from('demo_trial_sessions')
                    .update({ is_blocked: nextBlocked, last_active_at: nowIso })
                    .eq('user_id', record.user_id);
            } catch {
                // Ignore
            }

            showToast(
                nextBlocked
                    ? `ระงับสิทธิ์โหมดทดลองเล่นของ ${record.email} แล้ว`
                    : `ปลดล็อกสิทธิ์โหมดทดลองเล่นของ ${record.email} แล้ว`,
                nextBlocked ? 'warning' : 'success'
            );
            return true;
        },
        [userId, showToast]
    );

    const value = React.useMemo(
        () => ({
            isDemoMode,
            isQuotaLoading,
            demoRole,
            elapsedSeconds,
            quotaSeconds,
            remainingSeconds,
            isDemoExpired,
            isDemoBlocked,
            formattedRemainingTime: formatSecondsMMSS(remainingSeconds),
            trialRecord,
            startDemoMode,
            pauseAndExitDemoMode,
            switchDemoRole,
            resetDemoData,
            refreshMyTrialQuota,
            allTrialSessions,
            isAdminLoadingTrials,
            fetchAllDemoTrialSessions,
            adminResetDemoQuota,
            adminExtendDemoQuota,
            adminToggleBlockDemoUser
        }),
        [
            isDemoMode,
            isQuotaLoading,
            demoRole,
            elapsedSeconds,
            quotaSeconds,
            remainingSeconds,
            isDemoExpired,
            isDemoBlocked,
            trialRecord,
            startDemoMode,
            pauseAndExitDemoMode,
            switchDemoRole,
            resetDemoData,
            refreshMyTrialQuota,
            allTrialSessions,
            isAdminLoadingTrials,
            fetchAllDemoTrialSessions,
            adminResetDemoQuota,
            adminExtendDemoQuota,
            adminToggleBlockDemoUser
        ]
    );

    return <DemoSandboxContext.Provider value={value}>{children}</DemoSandboxContext.Provider>;
};

export const useDemoSandbox = () => {
    const context = useContext(DemoSandboxContext);
    if (!context) {
        throw new Error('useDemoSandbox must be used within a DemoSandboxProvider');
    }
    return context;
};
