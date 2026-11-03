import React from 'react';
import { BRAND_CONFIG } from '../../config/brand';
import PendingApprovalScreen from '../../components/PendingApprovalScreen';
import InactiveScreen from '../../components/InactiveScreen';
import DeathScreen from '../../components/gamification/DeathScreen';
import { MissingProfileScreen } from '../../components/auth/MissingProfileScreen';
import { User } from '../../types';
import { useDemoSandbox } from '../../context/DemoSandboxContext';

interface AccountStatusGuardProps {
  isManagerLoading: boolean;
  currentUserProfile: User | null;
  onLogout: () => Promise<void>;
  children: React.ReactNode;
}

export const AccountStatusGuard: React.FC<AccountStatusGuardProps> = ({
  isManagerLoading,
  currentUserProfile,
  onLogout,
  children,
}) => {
  const { isDemoMode } = useDemoSandbox();

  if (isManagerLoading) {
    // Visual loading is now handled seamlessly by the unified StudioLoadingOverlay in App.tsx
    return <div className="flex h-screen items-center justify-center bg-transparent" />;
  }

  if (isDemoMode) {
    return <>{children}</>;
  }

  if (!currentUserProfile) {
    return <MissingProfileScreen onLogout={onLogout} />;
  }

  if (!currentUserProfile.isApproved) {
    return <PendingApprovalScreen user={currentUserProfile} onLogout={onLogout} />;
  }

  if (currentUserProfile.status === 'DEATH' && BRAND_CONFIG.gamificationMode !== 2) {
    return <DeathScreen user={currentUserProfile} onLogout={onLogout} />;
  }

  if (!currentUserProfile.isActive && BRAND_CONFIG.gamificationMode !== 2) {
    return <InactiveScreen user={currentUserProfile} onLogout={onLogout} />;
  }

  return <>{children}</>;
};

