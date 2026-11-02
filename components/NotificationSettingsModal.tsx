import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  X,
  Bell,
  Calendar,
  UserPlus,
  CheckCircle,
  Mail,
  Shield,
  Smartphone,
  Send,
  AlertCircle,
  Info,
  Loader2,
  ExternalLink,
  ChevronDown,
  Share,
  PlusSquare,
  Download,
  MoreVertical,
  Check,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { NotificationPreferences, User } from '../types';
import { BRAND_CONFIG } from '../config/brand.ts';
import { usePushNotification } from '../hooks/usePushNotification';
import { BaseModal } from './common/BaseModal';
import { syncNotificationPreferencesToServer } from '../utils/pushDispatcher';
import { getActiveOrgIdSync } from '../lib/tenantStorage';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: NotificationPreferences;
  onUpdate: (prefs: NotificationPreferences) => void;
  user?: User | null;
}

const guideExpandVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.24,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const tabContentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.14,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdate,
  user,
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: isPushLoading,
    error: pushError,
    isInIframe,
    isIos,
    isAndroid,
    isStandalonePwa,
    isIosPwaInstalled,
    canInstallPwa,
    promptInstallPwa,
    subscribeToPush,
    unsubscribeFromPush,
    testPush,
  } = usePushNotification(user?.id);

  const [isTestingPush, setIsTestingPush] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<'IOS' | 'ANDROID'>(() => (isIos ? 'IOS' : 'ANDROID'));
  const [isSyncingPrefs, setIsSyncingPrefs] = useState(false);

  // Auto-select appropriate OS tab when detected
  useEffect(() => {
    if (isIos) setGuideTab('IOS');
    else if (isAndroid) setGuideTab('ANDROID');
  }, [isIos, isAndroid]);

  // Fetch server-stored preferences on modal open so switches stay synced across devices
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    let cancelled = false;

    const loadServerPrefs = async () => {
      try {
        const orgId = getActiveOrgIdSync();
        const headers: Record<string, string> = { 'x-user-id': user.id };
        if (orgId) headers['x-org-id'] = orgId;

        const res = await fetch('/api/push/preferences', { headers });
        const data = await res.json();
        if (!cancelled && data?.success && data?.preferences) {
          localStorage.setItem('juijui_notification_prefs', JSON.stringify(data.preferences));
        }
      } catch {
        // Ignore network errors and use local preferences
      }
    };

    loadServerPrefs();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.id]);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const nextPrefs: NotificationPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    onUpdate(nextPrefs);

    if (user?.id) {
      setIsSyncingPrefs(true);
      await syncNotificationPreferencesToServer(user.id, nextPrefs);
      setIsSyncingPrefs(false);
    }
  };

  const handlePushToggle = async () => {
    setTestResult(null);
    if (isSubscribed) {
      await unsubscribeFromPush(user?.id);
    } else {
      const res = await subscribeToPush(user?.id);
      if (res.success && user?.id) {
        await syncNotificationPreferencesToServer(user.id, preferences);
      }
    }
  };

  const handleTestNotification = async () => {
    setIsTestingPush(true);
    setTestResult(null);
    try {
      if (!isSubscribed && permission !== 'granted') {
        const subRes = await subscribeToPush(user?.id);
        if (!subRes.success) {
          setTestResult({
            ok: false,
            text: subRes.error || 'กรุณากดเปิดสวิตช์รับการแจ้งเตือนด้านบนก่อนทดสอบ',
          });
          setIsTestingPush(false);
          return;
        }
      }

      const res = await testPush(user?.id);
      if (res && res.success) {
        setTestResult({
          ok: true,
          text: res.message || 'ส่งการแจ้งเตือนทดสอบเข้าอุปกรณ์เรียบร้อยแล้ว!',
        });
      } else {
        setTestResult({
          ok: false,
          text: res?.error || 'ไม่สามารถส่งการแจ้งเตือนได้ กรุณาตรวจสอบสิทธิ์ของเบราว์เซอร์',
        });
      }
    } catch (e: any) {
      setTestResult({
        ok: false,
        text: e?.message || 'เกิดข้อผิดพลาดในการทดสอบ',
      });
    } finally {
      setIsTestingPush(false);
    }
  };

  const ToggleItem = ({
    itemKey,
    label,
    description,
    icon: Icon,
    badgeBgClass,
    badgeTextClass,
  }: {
    itemKey: keyof NotificationPreferences;
    label: string;
    description: string;
    icon: React.ElementType;
    badgeBgClass: string;
    badgeTextClass: string;
  }) => {
    const isEnabled = Boolean(preferences[itemKey]);
    return (
      <div className="flex items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#E8E1D7] hover:border-[#D8CEC0] transition-colors shadow-[0_2px_10px_rgba(120,105,85,0.04)]">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`p-2.5 rounded-xl shrink-0 border ${badgeBgClass} ${badgeTextClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[#3D3630] text-sm leading-snug">{label}</h4>
            <p className="text-xs text-[#7C7267] mt-0.5 leading-relaxed">{description}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => handleToggle(itemKey)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-end shrink-0 cursor-pointer focus:outline-none"
        >
          <span
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border ${
              isEnabled
                ? 'bg-[#68947C] border-[#58836B]'
                : 'bg-[#E5DEC9]/70 border-[#D8CFC0]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-[#FAF8F5] shadow-xs transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </span>
        </button>
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={10000}
      containerClassName="items-end sm:items-center p-0 sm:p-4"
      backdropClassName="bg-[#E6DFD5]/75 backdrop-blur-md"
      windowClassName="w-full max-w-xl h-[92vh] sm:h-[85vh] flex flex-col bg-[#FAF7F2] rounded-t-[2rem] sm:rounded-3xl shadow-[0_24px_60px_rgba(95,82,66,0.18)] border border-[#E6DEC8] overflow-hidden font-sans"
    >
      {/* Mobile Drag Handle Affordance */}
      <div className="sm:hidden pt-2.5 pb-1 bg-[#F4EFE6] flex justify-center shrink-0">
        <div className="w-10 h-1.5 rounded-full bg-[#D5CBBF]" />
      </div>

      {/* 1. RIGID HEADER */}
      <div className="flex-shrink-0 px-5 sm:px-6 py-4 bg-[#F4EFE6] border-b border-[#E6DFD3] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#E4EFE8] border border-[#C8DDD0] text-[#3F6B54] flex items-center justify-center shrink-0 shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[#3A332C] tracking-tight truncate">
              การตั้งค่าแจ้งเตือนบนโทรศัพท์และระบบ
            </h2>
            <p className="text-xs text-[#7D7266] truncate">
              เปิดรับแจ้งเตือนเด้งบนจอมือถือและเลือกหมวดหมู่ที่ต้องการรับทราบ
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
          className="min-w-[44px] min-h-[44px] -mr-1 rounded-2xl bg-white/80 hover:bg-white border border-[#E4DDD2] text-[#7A6F63] hover:text-[#3A332C] flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-6">
        {/* SECTION 1: Device Web Push Notification */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="text-xs font-bold text-[#6C5E4F] tracking-wide flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#4B7A60]" />
              <span>แจ้งเตือนเข้าโทรศัพท์มือถือ (Web Push)</span>
            </h3>
            {isSubscribed ? (
              <span className="text-xs font-semibold text-[#3B6950]">
                สถานะ · เชื่อมต่ออุปกรณ์แล้ว
              </span>
            ) : (
              <span className="text-xs font-medium text-[#8C7F70]">
                สถานะ · ยังไม่ได้เปิดรับบนอุปกรณ์นี้
              </span>
            )}
          </div>

          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
              isSubscribed
                ? 'bg-[#EEF5F0] border-[#C6DDD0]'
                : 'bg-[#F3EFE8] border-[#E4DDD0]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`p-3 rounded-2xl shrink-0 border ${
                    isSubscribed
                      ? 'bg-[#5E8C73] text-white border-[#4D7A62] shadow-xs'
                      : 'bg-white text-[#7A6F63] border-[#E2DAD0]'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-[#38312A] text-sm sm:text-base">
                    ป้ายแจ้งเตือนเด้งบนจอมือถือและคอมพิวเตอร์
                  </h4>
                  <p className="text-xs text-[#6E6459] mt-1 leading-relaxed">
                    รับแจ้งเตือนพร้อมเสียงและการสั่นทันทีเมื่อมีงานใหม่ ตรวจงาน ขอลา ขอ OT หรือถูกแท็กชื่อ แม้ปิดหน้าเว็บหรือล็อกหน้าจออยู่
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isSubscribed}
                onClick={handlePushToggle}
                disabled={isPushLoading || !isSupported || isInIframe}
                className="min-w-[44px] min-h-[44px] flex items-center justify-end shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              >
                <span
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border ${
                    isSubscribed
                      ? 'bg-[#5E8C73] border-[#4D7A62]'
                      : 'bg-[#DED6C8] border-[#CFC5B4]'
                  }`}
                >
                  {isPushLoading ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-[#38312A] animate-spin" />
                    </span>
                  ) : (
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-[#FAF8F5] shadow-xs transition-transform ${
                        isSubscribed ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  )}
                </span>
              </button>
            </div>

            {/* In-Iframe Notice */}
            {isInIframe && (
              <div className="mt-4 p-3.5 bg-[#FBF3E0] border border-[#EBDAB4] rounded-2xl flex items-start gap-3 text-xs text-[#755722]">
                <Info className="w-4 h-4 text-[#9E742B] shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <span className="font-bold block text-[#5E4418]">
                    กำลังเปิดใช้งานในหน้าต่างพรีวิว (iframe)
                  </span>
                  <p className="leading-relaxed text-[#755722]">
                    เบราว์เซอร์จะจำกัดสิทธิ์แจ้งเตือนและการสั่นเมื่ออยู่ในกรอบพรีวิว กรุณากดเปิดแอปในแท็บใหม่เพื่อเปิดสวิตช์และทดสอบยิงเข้าอุปกรณ์จริง
                  </p>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2CFA3] font-bold text-[#6E501C] hover:bg-[#FAF5E8] transition-colors mt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดแอปในแท็บใหม่ (New Tab)</span>
                  </a>
                </div>
              </div>
            )}

            {/* Browser Permission Denied Notice */}
            {permission === 'denied' && !isInIframe && (
              <div className="mt-4 p-3.5 bg-[#F9EBE6] border border-[#E8C8BE] rounded-2xl flex items-start gap-2.5 text-xs text-[#8A4432]">
                <AlertCircle className="w-4 h-4 text-[#B25942] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">สิทธิ์แจ้งเตือนถูกปิดกั้นในเบราว์เซอร์:</span>{' '}
                  กรุณาแตะไอคอนรูปกุญแจหรือปุ่มตั้งค่าข้างแถบชื่อเว็บด้านบน แล้วเปลี่ยนสิทธิ์{' '}
                  <span className="font-semibold">การแจ้งเตือน (Notifications)</span> เป็น{' '}
                  <span className="font-semibold">อนุญาต (Allow)</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {pushError && permission !== 'denied' && !isInIframe && (
              <div className="mt-4 p-3.5 bg-[#FBF3E0] border border-[#EBDAB4] rounded-2xl flex items-start gap-2.5 text-xs text-[#755722]">
                <AlertCircle className="w-4 h-4 text-[#9E742B] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{pushError}</span>
              </div>
            )}

            {/* Action Bar: Test Push + Toggle Mobile Install Guide */}
            <div className="mt-4 pt-3.5 border-t border-[#DFD7CA] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={isTestingPush || isInIframe}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F9F6F0] border border-[#D4CBBF] text-[#3B342C] text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isTestingPush ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#5E8C73]" />
                  ) : (
                    <Send className="w-4 h-4 text-[#5E8C73]" />
                  )}
                  <span>ทดสอบยิง Push แจ้งเตือน</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsGuideOpen((prev) => !prev)}
                  className={`min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                    isGuideOpen
                      ? 'bg-[#FBF3E0] border-[#E2CD9C] text-[#6E501C]'
                      : 'bg-[#F7F3EB] hover:bg-[#FBF3E0]/70 border-[#E2DAD0] text-[#5C5247]'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-[#9A722E]" />
                  <span>วิธีติดตั้งแอปลงมือถือ (iOS / Android)</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isGuideOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {testResult && (
                <div
                  className={`w-full mt-1 px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                    testResult.ok
                      ? 'bg-[#E5EFE9] border-[#C4DDD0] text-[#335E47]'
                      : 'bg-[#F8EAE3] border-[#E6C7B8] text-[#8E4A32]'
                  }`}
                >
                  {testResult.text}
                </div>
              )}
            </div>

            {/* COLLAPSIBLE iOS & ANDROID INSTALLATION GUIDE */}
            <AnimatePresence initial={false}>
              {isGuideOpen && (
                <motion.div
                  key="mobile-install-guide"
                  variants={guideExpandVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-[#DFD7CA] space-y-3.5">
                    {/* OS Segmented Tabs */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#5C5247]">
                        เลือกคู่มือตามระบบโทรศัพท์ของคุณ:
                      </span>
                      <div className="flex items-center gap-1 p-1 bg-[#E8E1D5] rounded-xl">
                        <button
                          type="button"
                          onClick={() => setGuideTab('IOS')}
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            guideTab === 'IOS'
                              ? 'bg-white text-[#38312A] shadow-2xs'
                              : 'text-[#6E6357] hover:text-[#38312A]'
                          }`}
                        >
                          iPhone / iPad (iOS)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuideTab('ANDROID')}
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            guideTab === 'ANDROID'
                              ? 'bg-white text-[#38312A] shadow-2xs'
                              : 'text-[#6E6357] hover:text-[#38312A]'
                          }`}
                        >
                          Android (Chrome)
                        </button>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {guideTab === 'IOS' ? (
                        <motion.div
                          key="ios-guide"
                          variants={tabContentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="p-4 bg-white rounded-2xl border border-[#E4DDD0] space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs sm:text-sm font-bold text-[#3A332C]">
                              ขั้นตอนเปิดรับแจ้งเตือนสำหรับ iPhone / iPad (iOS 16.4+)
                            </h5>
                            <span className="text-[11px] font-semibold text-[#7A6F63]">
                              {isIosPwaInstalled
                                ? 'ติดตั้งลงหน้าจอโฮมแล้ว'
                                : 'ต้องเปิดผ่านหน้าจอโฮม'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D7] space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#4A4036]">
                                <span className="w-5 h-5 rounded-full bg-[#F3E6D8] text-[#8E5B3A] flex items-center justify-center text-[11px] font-bold">
                                  1
                                </span>
                                <span>แตะปุ่มแชร์ใน Safari</span>
                              </div>
                              <p className="text-[11px] text-[#6E6358] leading-relaxed">
                                เปิดหน้าเว็บนี้ในแอป <strong>Safari</strong> แล้วแตะไอคอน{' '}
                                <Share className="w-3.5 h-3.5 inline text-[#8E5B3A] mx-0.5" />{' '}
                                <strong>แชร์ (Share)</strong> ที่แถบด้านล่าง
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D7] space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#4A4036]">
                                <span className="w-5 h-5 rounded-full bg-[#F3E6D8] text-[#8E5B3A] flex items-center justify-center text-[11px] font-bold">
                                  2
                                </span>
                                <span>เพิ่มไปยังหน้าจอโฮม</span>
                              </div>
                              <p className="text-[11px] text-[#6E6358] leading-relaxed">
                                เลื่อนเมนูลงมาแล้วเลือก{' '}
                                <PlusSquare className="w-3.5 h-3.5 inline text-[#8E5B3A] mx-0.5" />{' '}
                                <strong>&quot;เพิ่มไปยังหน้าจอโฮม&quot; (Add to Home Screen)</strong>
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D7] space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#4A4036]">
                                <span className="w-5 h-5 rounded-full bg-[#E4EFE8] text-[#3F6B54] flex items-center justify-center text-[11px] font-bold">
                                  3
                                </span>
                                <span>เข้าแอปและเปิดสวิตช์</span>
                              </div>
                              <p className="text-[11px] text-[#6E6358] leading-relaxed">
                                กดเข้าแอปจากไอคอนบนหน้าจอโฮมของ iPhone แล้วกลับมาเปิดสวิตช์แจ้งเตือนด้านบน
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="android-guide"
                          variants={tabContentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="p-4 bg-white rounded-2xl border border-[#E4DDD0] space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs sm:text-sm font-bold text-[#3A332C]">
                              ขั้นตอนติดตั้งแอปและรับแจ้งเตือนสำหรับ Android (Chrome)
                            </h5>
                            <span className="text-[11px] font-semibold text-[#7A6F63]">
                              {isStandalonePwa ? 'ติดตั้งแอปเรียบร้อยแล้ว' : 'รองรับทันที'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D7] space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#4A4036]">
                                <span className="w-5 h-5 rounded-full bg-[#E4EFE8] text-[#3F6B54] flex items-center justify-center text-[11px] font-bold">
                                  1
                                </span>
                                <span>เปิดเมนูมุมขวาบน</span>
                              </div>
                              <p className="text-[11px] text-[#6E6358] leading-relaxed">
                                แตะปุ่มติดตั้งด้านล่าง หรือแตะไอคอน{' '}
                                <MoreVertical className="w-3.5 h-3.5 inline text-[#3F6B54]" />{' '}
                                มุมขวาบนของเบราว์เซอร์ Chrome
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D7] space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#4A4036]">
                                <span className="w-5 h-5 rounded-full bg-[#E4EFE8] text-[#3F6B54] flex items-center justify-center text-[11px] font-bold">
                                  2
                                </span>
                                <span>เลือกติดตั้งแอป</span>
                              </div>
                              <p className="text-[11px] text-[#6E6358] leading-relaxed">
                                แตะเมนู{' '}
                                <Download className="w-3.5 h-3.5 inline text-[#3F6B54] mx-0.5" />{' '}
                                <strong>&quot;ติดตั้งแอป&quot; (Install app)</strong> หรือเพิ่มลงในหน้าจอหลัก
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D7] space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#4A4036]">
                                <span className="w-5 h-5 rounded-full bg-[#E4EFE8] text-[#3F6B54] flex items-center justify-center text-[11px] font-bold">
                                  3
                                </span>
                                <span>กดอนุญาตแจ้งเตือน</span>
                              </div>
                              <p className="text-[11px] text-[#6E6358] leading-relaxed">
                                เปิดสวิตช์ด้านบนแล้วกด <strong>Allow (อนุญาต)</strong> เพื่อรับแจ้งเตือนแม้ขณะล็อกหน้าจอ
                              </p>
                            </div>
                          </div>

                          {canInstallPwa && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={promptInstallPwa}
                                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#5E8C73] hover:bg-[#4F7B63] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                                <span>ติดตั้งแอปลงเครื่องทันที (Install App)</span>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* SECTION 2: Category Preferences (Synced with Web Push Dispatcher) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#6C5E4F] tracking-wide">
              หมวดหมู่เรื่องที่ต้องการให้เด้งแจ้งเตือน (Tasks & Approvals)
            </h3>
            {isSyncingPrefs && (
              <span className="text-[11px] text-[#7A6F63] inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                กำลังบันทึก...
              </span>
            )}
          </div>

          <ToggleItem
            itemKey="newAssignments"
            label="งานที่ได้รับมอบหมาย & คำขออนุมัติใหม่"
            description="แจ้งเตือนเมื่อมีคนสั่งงานใหม่ ส่งงานรอตรวจ QC หรือมีพนักงานยื่นขอลาและขอ OT (สำหรับ Admin)"
            icon={UserPlus}
            badgeBgClass="bg-[#E5EFE9] border-[#C9DFD2]"
            badgeTextClass="text-[#3A6850]"
          />

          <ToggleItem
            itemKey="upcomingDeadlines"
            label="ใกล้ถึงกำหนดส่ง & คำขอเลื่อนวันส่งงาน"
            description="แจ้งเตือนล่วงหน้าก่อนถึงวันส่งงาน และเมื่อมีการยื่นหรืออนุมัติคำขอเลื่อน Deadline"
            icon={Calendar}
            badgeBgClass="bg-[#F8EAE3] border-[#E9C9BA]"
            badgeTextClass="text-[#9A5136]"
          />

          <ToggleItem
            itemKey="taskCompletions"
            label="ผลการตรวจงาน คอมเมนต์ & การแท็กชื่อ (@ชื่อ)"
            description="แจ้งเตือนเมื่องานผ่าน QC ถูกส่งกลับแก้ไข มีคอมเมนต์ในงานที่คุณรับผิดชอบ หรือถูกแท็กชื่อในแชททีม"
            icon={CheckCircle}
            badgeBgClass="bg-[#FBF3E0] border-[#EBD8AF]"
            badgeTextClass="text-[#8A6525]"
          />
        </div>

        {/* SECTION 3: System & Summary Channels */}
        <div className="space-y-3 pt-1">
          <h3 className="text-xs font-bold text-[#6C5E4F] tracking-wide px-1">
            ข่าวสารระบบ & ช่องทางเสริม (System)
          </h3>

          <ToggleItem
            itemKey="systemUpdates"
            label="ประกาศและอัปเดตจากระบบ"
            description={`การแจ้งเตือนฟีเจอร์ใหม่หรือประกาศสำคัญของ ${BRAND_CONFIG.name}`}
            icon={Sparkles}
            badgeBgClass="bg-[#F3E9E7] border-[#E2CCC8]"
            badgeTextClass="text-[#874E47]"
          />

          <ToggleItem
            itemKey="emailAlerts"
            label="รับสรุปงานค้างทางอีเมล (Email Summary)"
            description="ส่งสรุปภาพรวมตารางงานและรายการรอดำเนินการประจำสัปดาห์"
            icon={Mail}
            badgeBgClass="bg-[#EFECE6] border-[#DDD6C9]"
            badgeTextClass="text-[#63594E]"
          />
        </div>
      </div>

      {/* 3. RIGID STICKY FOOTER */}
      <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-[#F4EFE6] border-t border-[#E6DFD3] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 text-xs text-[#7A6F63]">
          <Shield className="w-4 h-4 text-[#5E8C73] shrink-0" />
          <span>การตั้งค่าจะถูกซิงค์กับอุปกรณ์และบัญชีของคุณโดยอัตโนมัติ</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-sm font-bold text-white bg-[#5E8C73] hover:bg-[#4F7B63] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>เสร็จสิ้น</span>
        </button>
      </div>
    </BaseModal>
  );
};

export default NotificationSettingsModal;
