import React from 'react';
import { Loader2 } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand';
import PendingApprovalScreen from '../../components/PendingApprovalScreen';
import InactiveScreen from '../../components/InactiveScreen';
import DeathScreen from '../../components/gamification/DeathScreen';
import { MissingProfileScreen } from '../../components/auth/MissingProfileScreen';
import { User } from '../../types';

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
  if (isManagerLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">กำลังเชื่อมต่อฐานข้อมูล...</p>
      </div>
    );
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
