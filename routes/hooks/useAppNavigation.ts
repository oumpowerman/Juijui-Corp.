import { useMemo, useRef, useCallback, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ViewMode, User, MasterOption } from '../../types';
import { MENU_GROUPS } from '../../components/Sidebar';
import { WarpStage } from './useWarpPortal';

interface UseAppNavigationProps {
  currentUserProfile: User | null;
  masterOptions: MasterOption[];
  isManagerLoading: boolean;
  globalWarpStage: WarpStage;
  triggerWarpTransition: (targetView: ViewMode, onPeakAction: () => void) => void;
}

export function useAppNavigation({
  currentUserProfile,
  masterOptions,
  isManagerLoading,
  globalWarpStage,
  triggerWarpTransition,
}: UseAppNavigationProps) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- STABILITY GUARD: Memory for the last known valid view ---
  const lastValidView = useRef<ViewMode>((searchParams.get('view') as ViewMode) || 'DASHBOARD');

  // --- DYNAMIC ALLOWED VIEWS COMPUTATION ---
  const allowedViews = useMemo(() => {
    // 1. ดึงรายการเมนูที่เปิดใช้งานในระบบจาก masterOptions
    const config = masterOptions?.find(o => o.type === 'SIDEBAR_CONFIG' && o.key === 'ACTIVE_MENUS');
    let activeViews: string[] = [];
    if (config) {
      try {
        activeViews = JSON.parse(config.label);
      } catch (e) {
        console.error("Failed to parse sidebar config", e);
      }
    }

    const isAdmin = currentUserProfile?.role === 'ADMIN';
    const views: string[] = [];

    // 2. วนลูปตรวจสอบสิทธิ์และสถานะ Active ทีละเมนูตามสถาปัตยกรรมของ Sidebar
    MENU_GROUPS.forEach(group => {
      // ข้ามกลุ่มเมนูสำหรับ Admin หากผู้ใช้ไม่ใช่ Admin
      if (group.adminOnly && !isAdmin) return;

      group.items.forEach(item => {
        // ตรวจสอบว่าเมนูนี้ถูกเปิดใช้งาน (หรือถ้าไม่มี Config ให้ถือว่าเปิดทั้งหมดเป็น Default)
        const isActive = activeViews.length === 0 || activeViews.includes(item.view);
        if (isActive) {
          views.push(item.view);
        }
      });
    });

    return views;
  }, [masterOptions, currentUserProfile]);

  // --- BEST DEFAULT VIEW SELECTION ---
  const defaultView = useMemo(() => {
    // กรณีที่ 1: ไม่มีเมนูใดๆ เปิดใช้งานเลย (เป็นไปได้ยาก แต่เผื่อไว้เป็นระบบป้องกัน) -> ใช้ 'DASHBOARD'
    if (allowedViews.length === 0) return 'DASHBOARD';

    // พิเศษ: หากเป็น MEMBER ที่เปิดใช้งาน Ultimate Workroom ให้เปิด Ultimate Workroom แทน DASHBOARD เป็นหน้าแรก
    if (currentUserProfile && currentUserProfile.role === 'MEMBER' && currentUserProfile.status === 'ACTIVE') {
      if (currentUserProfile.ultimateWorkroomEnabled !== false && allowedViews.includes('ULTIMATE_WORKROOM')) {
        return 'ULTIMATE_WORKROOM';
      }
    }

    // กรณีที่ 2: มีสิทธิ์เข้าใช้งานหน้า DASHBOARD ปกติ -> ให้ใช้ 'DASHBOARD' เป็นหน้าแรกเพื่อความคุ้นเคย
    if (allowedViews.includes('DASHBOARD')) return 'DASHBOARD';

    // กรณีที่ 3: ไม่มีหน้า DASHBOARD หรือเหลือเพียงเมนูเดียว -> ให้เอา "เมนูแรกสุดที่มีสิทธิ์" มาเป็นหน้าแรกทันที
    return allowedViews[0];
  }, [allowedViews, currentUserProfile]);

  // Derived currentView from URL - Single Source of Truth with Stability Fallback
  const currentView = useMemo(() => {
    const v = searchParams.get('view') as ViewMode;
    
    if (v) {
      lastValidView.current = v;
      return v;
    }

    // RACE CONDITION PROTECTION:
    if (location.pathname === '/' && searchParams.toString().length > 0) {
      return lastValidView.current;
    }

    return defaultView as ViewMode;
  }, [searchParams, location.pathname, defaultView]);

  // Helper to construct updated URL search params safely
  const applyViewParams = useCallback((view: ViewMode, queryParams?: Record<string, string>) => {
    setSearchParams((prev: any) => {
      const next = new URLSearchParams(prev);
      next.set('view', view);
      
      if (view !== 'ContentStock') {
        next.delete('stockMode');
        next.delete('stockTab');
        next.delete('stockPage');
      }
      if (view !== 'SCRIPT_HUB') {
        next.delete('scriptId');
        next.delete('q');
        next.delete('deep');
        next.delete('origin');
        next.delete('scriptPage');
      }
      if (view !== 'ATTENDANCE') {
        next.delete('tab');
        next.delete('highlightReqId');
        next.delete('id');
        next.delete('reqId');
        next.delete('leaveId');
      }
      if (queryParams) {
        Object.entries(queryParams).forEach(([key, val]) => {
          if (val) {
            next.set(key, val);
          } else {
            next.delete(key);
          }
        });
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // --- NAVIGATION HANDLER (Sync with URL - Enhanced with fluid cosmic portals) ---
  const handleNavigate = useCallback((view: ViewMode, queryParams?: Record<string, string>) => {
    const isDimensionJump = (currentView === 'ULTIMATE_WORKROOM') || (view === 'ULTIMATE_WORKROOM');

    if (isDimensionJump && globalWarpStage === 'IDLE') {
      triggerWarpTransition(view, () => {
        applyViewParams(view, queryParams);
      });
    } else {
      // Normal instant page switches for efficiency
      applyViewParams(view, queryParams);
    }
  }, [currentView, globalWarpStage, triggerWarpTransition, applyViewParams]);

  // Sync URL with default view - Enhanced stability with custom member redirect
  useEffect(() => {
    // Prevent redirecting before metadata and masterOptions are loaded
    if (isManagerLoading) return;

    const view = searchParams.get('view');
    
    // If we are at root and no view is set, determine default view
    if (!view && location.pathname === '/' && defaultView) {
      setSearchParams((next: any) => {
        // Double check inside the update to handle race conditions in StrictMode
        if (next.has('view')) return next;
        next.set('view', defaultView);
        return next;
      }, { replace: true });
      return;
    }

    // If a view is specified in URL but it is NOT allowed, redirect to default view!
    if (view && allowedViews.length > 0 && !allowedViews.includes(view)) {
      setSearchParams((next: any) => {
        next.set('view', defaultView);
        return next;
      }, { replace: true });
    }
  }, [location.pathname, searchParams, setSearchParams, defaultView, isManagerLoading, allowedViews]);

  return {
    currentView,
    defaultView,
    allowedViews,
    handleNavigate,
    searchParams,
    setSearchParams,
    location,
  };
}
