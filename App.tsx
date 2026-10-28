import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import LandingPage from './components/landing/LandingPage';
import { isFastCheckoutHoldActive } from './components/landing/FastCheckoutOnboardingModal';
import AuthPage from './components/AuthPage';
import {
  SkyCloudCurtainTransition,
  type CloudCurtainPhase,
  type CloudCurtainDirection,
} from './components/landing/SkyCloudCurtainTransition';
import AppRouter from './routes/AppRouter';
import { BRAND_CONFIG } from './config/brand';
import PublicScriptViewer from './components/public/PublicScriptViewer';
import { TaskProvider } from './context/TaskContext';
import { GameConfigProvider } from './context/GameConfigContext';
import { MasterDataProvider } from './context/MasterDataContext';
import { GoogleDriveProvider } from './context/GoogleDriveContext';
import { WorkboxProvider } from './context/WorkboxContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChecklistProvider } from './context/ChecklistContext';
import { KPIProvider } from './context/KPIContext';
import { FinanceProvider } from './context/FinanceContext';
import { WikiProvider } from './context/WikiContext';
import { MeetingProvider } from './context/MeetingContext';
import { UserSessionProvider, useUserSession } from './context/UserSessionContext';
import { OrganizationProvider, useOrganization } from './context/OrganizationContext';
import { DemoSandboxProvider, setDemoIntentFlag } from './context/DemoSandboxContext';
import { DemoSandboxHudBar } from './components/demo/DemoSandboxHudBar';
import { WorkspaceSwitcherModal } from './components/organization/WorkspaceSwitcherModal';
import { SuperAdminPortalView } from './components/super-admin/SuperAdminPortalView';
import { SuperAdminWorkspaceBanner } from './components/super-admin/SuperAdminWorkspaceBanner';
import { useMasterData } from './hooks/useMasterData';
import GatekeeperOverlay from './components/layout/GatekeeperOverlay';
import { ShootQueueProvider } from './context/ShootQueueContext';
import { StorageProvider } from './context/StorageContext';
import { GlobalRealtimeSync } from './components/GlobalRealtimeSync';
import { ScreenSessionLimiter } from './components/ScreenSessionLimiter';
import { LineUserIdLinker } from './components/LineUserIdLinker';
import { LinePendingBanner } from './components/LinePendingBanner';
import PWAReloadPrompt from './components/PWAReloadPrompt';
import { Loader2 } from 'lucide-react';
import {
  AuthPortalTransition,
  consumeAuthPortalTransition,
  peekAuthPortalTransition,
  type AuthPortalMode,
} from './components/auth/AuthPortalTransition';

const queryClient = new QueryClient({

  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // --- ROUTING CHECK: LINE Webhook & Pending Deep Link Capture on Mount ---
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const lineUserIdParam = queryParams.get('line_user_id');
    if (lineUserIdParam) {
      sessionStorage.setItem('pending_line_user_id', lineUserIdParam.trim());
    }

    const claimOrgParam = queryParams.get('claim_org');
    const joinOrgParam = queryParams.get('join_org');
    if (claimOrgParam && claimOrgParam.trim()) {
      sessionStorage.setItem('juijui_pending_onboarding_code', claimOrgParam.trim().toUpperCase());
    } else if (joinOrgParam && joinOrgParam.trim()) {
      sessionStorage.setItem('juijui_pending_onboarding_code', joinOrgParam.trim().toUpperCase());
    }

    const viewParam = queryParams.get('view');
    const highlightReqIdParam = queryParams.get('highlightReqId');
    const taskIdParam = queryParams.get('taskId') || queryParams.get('contentId') || queryParams.get('highlightTaskId') || queryParams.get('openTaskId');
    const channelParam = queryParams.get('channels') || queryParams.get('channel');
    if (viewParam || highlightReqIdParam || taskIdParam || channelParam) {
      sessionStorage.setItem('juijui_pending_deep_link', window.location.search);
    }
  }, []);

  // --- ROUTING CHECK: Magic Link (Script Share) ---
  const path = window.location.pathname;
  if (path.startsWith('/s/')) {
      const token = path.split('/s/')[1];
      if (token) {
          return <PublicScriptViewer token={token} />;
      }
  }

  // --- ROUTING CHECK: PWA Share Target Payload Capture ---
  if (path.startsWith('/share_target')) {
      const searchParams = new URLSearchParams(window.location.search);
      const title = searchParams.get('title') || '';
      const text = searchParams.get('text') || '';
      const url = searchParams.get('url') || '';
      
      localStorage.setItem('juijui_pwa_shared_ref', JSON.stringify({
          title,
          text,
          url,
          timestamp: Date.now()
      }));
      
      // Smooth replace-location to root
      window.location.replace('/');
      return null;
  }

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return BRAND_CONFIG.initialRouteMode === 2 || params.has('claim_org') || params.has('join_org');
  });
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);
  const [isFastCheckoutHolding, setIsFastCheckoutHolding] = useState<boolean>(() =>
    isFastCheckoutHoldActive()
  );
  const [portalMode, setPortalMode] = useState<AuthPortalMode | null>(() =>
    peekAuthPortalTransition()
  );

  useEffect(() => {
    const handlePortalEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: AuthPortalMode }>;
      const mode = customEvent.detail?.mode;
      if (mode && mode !== 'REGISTER_JOIN') {
        setPortalMode(mode);
      }
    };
    const handleFastCheckoutHoldChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ hold?: boolean }>;
      setIsFastCheckoutHolding(Boolean(customEvent.detail?.hold));
    };
    window.addEventListener('juijui-auth-portal-start', handlePortalEvent);
    window.addEventListener('juijui-fast-checkout-hold-change', handleFastCheckoutHoldChange);
    return () => {
      window.removeEventListener('juijui-auth-portal-start', handlePortalEvent);
      window.removeEventListener('juijui-fast-checkout-hold-change', handleFastCheckoutHoldChange);
    };
  }, []);

  // --- SKY CLOUD CURTAIN TRANSITION STATE (LandingPage <-> AuthPage) ---
  const [cloudPhase, setCloudPhase] = useState<CloudCurtainPhase>('IDLE');
  const [cloudDirection, setCloudDirection] = useState<CloudCurtainDirection>('TO_AUTH');
  const swapTimerRef = useRef<number | null>(null);
  const endTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
      if (endTimerRef.current) window.clearTimeout(endTimerRef.current);
    };
  }, []);

  const triggerCloudRouteChange = useCallback(
    (targetShowLogin: boolean) => {
      if (cloudPhase !== 'IDLE') return;

      const direction: CloudCurtainDirection = targetShowLogin ? 'TO_AUTH' : 'TO_LANDING';
      setCloudDirection(direction);
      setCloudPhase('COVERING');

      // Stage 2 (480ms): Swap scene while 3D cloud curtain blankets the viewport
      swapTimerRef.current = window.setTimeout(() => {
        setShowLogin(targetShowLogin);
        if (!targetShowLogin) {
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
        // Stage 3: Part clouds laterally to reveal the already-mounted destination page
        setCloudPhase('PARTING');
      }, 480);

      // Complete at 1100ms
      endTimerRef.current = window.setTimeout(() => {
        setCloudPhase('IDLE');
      }, 1100);
    },
    [cloudPhase]
  );

  // --- INITIAL AUTH CHECK ---
  useEffect(() => {
    // 1. Check current session and recovery parameters
    const checkSession = async () => {
      if (window.location.hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
        setShowLogin(true);
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Auth session check error:", error.message);
          // If the error is about refresh token, we should probably sign out to clear local storage
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('invalid_grant')) {
            await supabase.auth.signOut();
            setSession(null);
          }
        } else {
          // Only set standard session if we're not actively handling recovery on initial mount
          if (session && !window.location.hash.includes('type=recovery')) {
            const pendingMode = peekAuthPortalTransition();
            if (pendingMode && pendingMode !== 'REGISTER_JOIN') {
              setPortalMode(pendingMode);
            }
            setSession(session);
          }
        }
      } catch (err: any) {
        console.error("Unexpected auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth Event:', event);
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsRecoveryMode(false);
        setIsWorkspaceReady(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setShowLogin(true);
        setSession(null); // Keep standard session state null during recovery to block authenticated app view
      } else if (session) {
        // If we are currently in recovery mode, don't let the authed app load yet
        if (!isRecoveryMode) {
          const pendingMode = peekAuthPortalTransition();
          if (pendingMode && pendingMode !== 'REGISTER_JOIN') {
            setPortalMode(pendingMode);
          }
          setSession(session);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isRecoveryMode]);

  const handlePasswordUpdateSuccess = async () => {
    setIsRecoveryMode(false);
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      setSession(currentSession);
    } else {
      setShowLogin(true);
    }
  };

  let content;
  if (loading) {
     content = (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex h-screen items-center justify-center bg-slate-50 flex-col"
        >
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        </motion.div>
     );
  } else if (isRecoveryMode) {
    content = (
      <motion.div
        key="recovery"
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.02, y: -15 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <AuthPage 
          onLoginSuccess={() => {}} 
          onPasswordUpdateSuccess={handlePasswordUpdateSuccess}
          onBack={undefined}
          initialMode="UPDATE" 
        />
      </motion.div>
    );
  } else if (!session || isFastCheckoutHolding) {
    content = (
      <motion.div
        key="unauthenticated-stage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
      >
        {showLogin ? (
          <div className="min-h-[100dvh] h-[100dvh] overflow-hidden scrollbar-hide">
            <AuthPage
              onLoginSuccess={() => {}}
              onBack={() => triggerCloudRouteChange(false)}
              isZoomingOut={cloudPhase === 'COVERING' && cloudDirection === 'TO_LANDING'}
            />
          </div>
        ) : (
          <LandingPage
            isZoomingOut={cloudPhase === 'COVERING' && cloudDirection === 'TO_AUTH'}
            onGoToLogin={() => {
              setDemoIntentFlag(false);
              triggerCloudRouteChange(true);
            }}
            onStartDemo={() => {
              setDemoIntentFlag(true);
              triggerCloudRouteChange(true);
            }}
          />
        )}
      </motion.div>
    );
  } else {
    content = (
      <motion.div
        key="app"
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
      >
        <QueryClientProvider client={queryClient}>
          <AuthenticatedApp
            user={session.user}
            onWorkspaceReadyChange={setIsWorkspaceReady}
          />
        </QueryClientProvider>
      </motion.div>
    );
  }

  return (
    <>
      <PWAReloadPrompt />
      {!session && <LinePendingBanner />}
      <SkyCloudCurtainTransition phase={cloudPhase} direction={cloudDirection} />
      {portalMode && (
        <AuthPortalTransition
          mode={portalMode}
          isWorkspaceReady={Boolean(session && isWorkspaceReady)}
          onComplete={() => {
            consumeAuthPortalTransition();
            setPortalMode(null);
          }}
        />
      )}
      <AnimatePresence mode={portalMode ? 'sync' : 'wait'}>
        {content}
      </AnimatePresence>
    </>
  );
}

function AuthenticatedApp({
  user,
  onWorkspaceReadyChange,
}: {
  user: any;
  onWorkspaceReadyChange: (ready: boolean) => void;
}) {
  return (
    <GoogleDriveProvider>
      <MasterDataProvider>
        <UserSessionProvider sessionUser={user}>
          <DemoSandboxProvider sessionUser={user}>
            <OrganizationProvider>
              <StorageProvider>
                <AuthenticatedAppInner
                  user={user}
                  onWorkspaceReadyChange={onWorkspaceReadyChange}
                />
              </StorageProvider>
            </OrganizationProvider>
          </DemoSandboxProvider>
        </UserSessionProvider>
      </MasterDataProvider>
    </GoogleDriveProvider>
  );
}

function AuthenticatedAppInner({
  user,
  onWorkspaceReadyChange,
}: {
  user: any;
  onWorkspaceReadyChange: (ready: boolean) => void;
}) {
  const { currentUserProfile, isReady } = useUserSession();
  const { isReady: isOrgReady, isSuperAdmin, isInSuperAdminPortal } = useOrganization();
  const { masterOptions } = useMasterData();
  const [isManagerReady, setIsManagerReady] = useState(false);

  const coreWorkspaceReady = isReady && isOrgReady;
  const portalWorkspaceReady = coreWorkspaceReady && (isInSuperAdminPortal || isManagerReady);

  useEffect(() => {
    onWorkspaceReadyChange(portalWorkspaceReady);
  }, [portalWorkspaceReady, onWorkspaceReadyChange]);

  // Active policy gatekeeper check
  const activePolicy = masterOptions.find(o => o.type === 'SYSTEM_POLICY' && o.key === 'TERMS_OF_SERVICE');
  const userAcceptedVersion = currentUserProfile?.acceptedTermsVersion || 0;
  const needsPolicyAcceptance = activePolicy && activePolicy.isActive && userAcceptedVersion < (activePolicy.progressValue || 1);

  const hasActivePortalTransition = Boolean(peekAuthPortalTransition());

  return (
    <>
      {!coreWorkspaceReady ? (
        <div
          className="flex h-screen items-center justify-center flex-col select-none"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.98) 0%, rgba(252,231,243,0.92) 32%, rgba(224,242,254,0.94) 68%, rgba(243,232,255,0.96) 100%)',
          }}
        >
          {!hasActivePortalTransition && (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-rose-400 mb-3" />
              <p className="text-slate-600 font-bold text-sm">กำลังจัดเตรียมพื้นที่สตูดิโอของคุณ...</p>
            </>
          )}
        </div>
      ) : (
        <>
          <WorkspaceSwitcherModal />
          {isSuperAdmin && isInSuperAdminPortal ? (
            <SuperAdminPortalView />
          ) : (
            <NotificationProvider currentUser={currentUserProfile}>
              {needsPolicyAcceptance && (
                <GatekeeperOverlay activePolicy={activePolicy} userAcceptedVersion={userAcceptedVersion} />
              )}
              <WorkboxProvider currentUser={currentUserProfile}>
                <ChecklistProvider>
                  <KPIProvider>
                    <FinanceProvider>
                      <WikiProvider>
                        <GameConfigProvider>
                          <MeetingProvider>
                            <TaskProvider>
                              <ShootQueueProvider>
                                <GlobalRealtimeSync />
                                <LineUserIdLinker />
                                <ScreenSessionLimiter user={user} />
                                <DemoSandboxHudBar />
                                <SuperAdminWorkspaceBanner />
                                <AppRouter user={user} onManagerReadyChange={setIsManagerReady} />
                              </ShootQueueProvider>
                            </TaskProvider>
                          </MeetingProvider>
                        </GameConfigProvider>
                      </WikiProvider>
                    </FinanceProvider>
                  </KPIProvider>
                </ChecklistProvider>
              </WorkboxProvider>
            </NotificationProvider>
          )}
        </>
      )}
    </>
  );
}

export default App;
