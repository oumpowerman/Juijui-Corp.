import React, { useState, useEffect } from 'react';
import { User, ViewMode } from '../types';
import NotificationPill from './NotificationPill';
import { useChecklistCadenceAlerts } from '../hooks/company-checklist/useChecklistCadenceAlerts';
import { sidebarBadgeManager, BADGE_SUPPORTED_VIEWS } from '../services/sidebarBadgeManager';

interface SidebarBadgeProps {
  view?: ViewMode;
  currentUser: User;
  collapsed?: boolean;
  count?: number; // Manual override
}

/**
 * Isolated Component for Company Checklist to avoid invoking useMasterDataContext
 * across all other menu buttons.
 */
const CompanyChecklistBadge: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { pendingCount } = useChecklistCadenceAlerts(true);
  if (pendingCount <= 0) return null;
  return (
    <NotificationPill
      count={pendingCount}
      collapsed={collapsed}
      className="bg-orange-500 shadow-orange-500/30"
    />
  );
};

const SidebarBadge: React.FC<SidebarBadgeProps> = ({ view, currentUser, collapsed, count: manualCount }) => {
  // 1. Manual override (e.g. Chat unread count provided by caller)
  if (manualCount !== undefined) {
    if (manualCount <= 0) return null;
    return <NotificationPill count={manualCount} collapsed={collapsed} />;
  }

  // 2. Specialized isolated badge for Company Checklist
  if (view === 'COMPANY_CHECKLIST') {
    return <CompanyChecklistBadge collapsed={collapsed} />;
  }

  // 3. Fast Exit: If view does not support badges, avoid creating state or subscriptions
  if (!view || !BADGE_SUPPORTED_VIEWS.has(view)) {
    return null;
  }

  // 4. Centralized Unified Realtime Store subscriber
  return (
    <UnifiedBadgeRenderer
      view={view}
      currentUser={currentUser}
      collapsed={collapsed}
    />
  );
};

/**
 * Connected Badge Renderer using Single Unified Realtime Channel
 */
const UnifiedBadgeRenderer: React.FC<{
  view: ViewMode;
  currentUser: User;
  collapsed?: boolean;
}> = ({ view, currentUser, collapsed }) => {
  const [count, setCount] = useState(() => sidebarBadgeManager.getCount(view));

  // Maintain the single unified Realtime WebSocket channel with reference counting
  useEffect(() => {
    if (!currentUser?.id) return;
    const unregister = sidebarBadgeManager.register(currentUser);
    return unregister;
  }, [currentUser?.id, currentUser?.role]);

  // Subscribe to count updates for this specific view
  useEffect(() => {
    const unsubscribe = sidebarBadgeManager.subscribe(view, (newCount) => {
      setCount(newCount);
    });
    return unsubscribe;
  }, [view]);

  if (count <= 0) return null;

  let colorClass: string | undefined;
  if (view === 'DASHBOARD') colorClass = 'bg-red-500';
  if (view === 'WIKI') colorClass = 'bg-emerald-500';
  if (view === 'DUTY') colorClass = 'bg-amber-500 shadow-amber-500/30';
  if (view === 'QUALITY_GATE') colorClass = 'bg-indigo-600 shadow-indigo-600/30';

  return <NotificationPill count={count} collapsed={collapsed} className={colorClass} />;
};

export default SidebarBadge;
