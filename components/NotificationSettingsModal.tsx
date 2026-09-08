import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Bell, Calendar, UserPlus, CheckCircle, Mail, Shield, Smartphone, Send, AlertCircle, Info, Loader2 } from 'lucide-react';
import { NotificationPreferences, User } from '../types';
import { BRAND_CONFIG } from '../config/brand.ts';
import { usePushNotification } from '../hooks/usePushNotification';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: NotificationPreferences;
  onUpdate: (prefs: NotificationPreferences) => void;
  user?: User | null;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  preferences, 
  onUpdate,
  user
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: isPushLoading,
    error: pushError,
    isIos,
    isIosPwaInstalled,
    subscribeToPush,
    unsubscribeFromPush,
    testPush
  } = usePushNotification(user?.id);

  const [isTestingPush, setIsTestingPush] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleToggle = (key: keyof NotificationPreferences) => {
    onUpdate({
      ...preferences,
      [key]: !preferences[key]
    });
  };

  const handlePushToggle = async () => {
    setTestResult(null);
    if (isSubscribed) {
      await unsubscribeFromPush(user?.id);
    } else {
      await subscribeToPush(user?.id);
    }
  };

  const handleTestNotification = async () => {
    setIsTestingPush(true);
    setTestResult(null);
    try {
      const res = await testPush(user?.id);
      if (res && res.success) {
        setTestResult('ส่งการแจ้งเตือนทดสอบเรียบร้อยแล้ว! ตรวจสอบที่แถบด้านบนของหน้าจอ');
      } else {
        setTestResult(res?.error || 'ไม่สามารถส่งการแจ้งเตือนได้');
      }
    } catch (e: any) {
      setTestResult(e?.message || 'เกิดข้อผิดพลาดในการทดสอบ');
    } finally {
      setIsTestingPush(false);
    }
  };

  const ToggleItem = ({ 
    itemKey, 
    label, 
    description, 
    icon: Icon, 
    colorClass 
  }: { 
    itemKey: keyof NotificationPreferences; 
    label: string; 
    description: string; 
    icon: any; 
    colorClass: string;
  }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-start space-x-3.5">
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-gray-800 text-sm">{label}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button 
        onClick={() => handleToggle(itemKey)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${preferences[itemKey] ? 'bg-indigo-600' : 'bg-gray-300'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences[itemKey] ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
  
  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15, filter: 'blur(8px)' }}
        className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600 shadow-sm border border-indigo-100/50">
                <Bell className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">การตั้งค่าการแจ้งเตือน</h2>
                <p className="text-xs text-gray-400">เลือกรับและเปิดสิทธิ์การแจ้งเตือนบนอุปกรณ์</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* SECTION 1: Device Web Push Notification (Background Push) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                การแจ้งเตือนบนอุปกรณ์ (Push Notification)
              </h3>
              {isSubscribed && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  เปิดใช้งานแล้ว
                </span>
              )}
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isSubscribed 
                ? 'bg-gradient-to-br from-indigo-50/70 to-purple-50/40 border-indigo-200 shadow-sm' 
                : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl ${isSubscribed ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-200 text-gray-600'}`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">
                      ป้ายแจ้งเตือนเด้งบนหน้าจอ (Web Push)
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      แจ้งเตือนเด้งที่แถบด้านบนพร้อมเสียง แม้ขณะปิดแอปหรือล็อคหน้าจอมือถือ
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handlePushToggle}
                  disabled={isPushLoading || !isSupported}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSubscribed ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  {isPushLoading ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    </span>
                  ) : (
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSubscribed ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  )}
                </button>
              </div>

              {/* Error or Denied State */}
              {permission === 'denied' && (
                <div className="mt-3.5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">สิทธิ์การแจ้งเตือนถูกบล็อกในเบราว์เซอร์:</span> กรุณากดที่ไอคอนรูปกุญแจ/ตั้งค่าข้าง URL เพื่อเปิดสิทธิ์การแจ้งเตือน (Notifications: Allow)
                  </div>
                </div>
              )}

              {pushError && permission !== 'denied' && (
                <div className="mt-3.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-700">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{pushError}</span>
                </div>
              )}

              {/* iOS PWA Hint */}
              {isIos && !isIosPwaInstalled && (
                <div className="mt-3.5 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2 text-xs text-blue-700">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">สำหรับผู้ใช้ iOS (iPhone/iPad):</span> เพื่อรับแจ้งเตือนขณะปิดแอป ให้กดปุ่ม <strong>แชร์ (Share)</strong> ใน Safari แล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong> จากนั้นเปิดแอปจากหน้าจอโฮมเพื่อเปิดสิทธิ์
                  </div>
                </div>
              )}

              {/* Test Button (Shown when subscribed) */}
              {isSubscribed && (
                <div className="mt-3.5 pt-3 border-t border-indigo-100/80 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={handleTestNotification}
                    disabled={isTestingPush}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isTestingPush ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span>ทดสอบยิง Push แจ้งเตือน</span>
                  </button>

                  {testResult && (
                    <span className="text-[11px] font-medium text-indigo-700">
                      {testResult}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Task-related Preferences */}
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">เกี่ยวกับงาน (Tasks)</h3>
             
             <ToggleItem 
                itemKey="newAssignments"
                label="งานที่ได้รับมอบหมาย"
                description="แจ้งเตือนเมื่อมีคน Assign งานใหม่ให้คุณ"
                icon={UserPlus}
                colorClass="bg-blue-100 text-blue-600"
             />

             <ToggleItem 
                itemKey="upcomingDeadlines"
                label="ใกล้ถึงกำหนดส่ง (Deadlines)"
                description="แจ้งเตือนล่วงหน้า 3 วัน ก่อนถึงวันส่งงาน"
                icon={Calendar}
                colorClass="bg-orange-100 text-orange-600"
             />

             <ToggleItem 
                itemKey="taskCompletions"
                label="งานเสร็จเรียบร้อย"
                description="แจ้งเตือนเมื่องานที่คุณติดตามเปลี่ยนสถานะเป็น Done"
                icon={CheckCircle}
                colorClass="bg-green-100 text-green-600"
             />
          </div>

          {/* SECTION 3: System-related Preferences */}
          <div className="space-y-3 pt-1">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">ระบบ & ช่องทาง (System)</h3>
             
             <ToggleItem 
                itemKey="systemUpdates"
                label="ข่าวสารจากระบบ"
                description={`การอัปเดตฟีเจอร์ใหม่ๆ ของ ${BRAND_CONFIG.name}`}
                icon={Shield}
                colorClass="bg-purple-100 text-purple-600"
             />

             <ToggleItem 
                itemKey="emailAlerts"
                label="ส่งสรุปทางอีเมล (Email)"
                description="รับอีเมลสรุปงานค้างทุกเช้าวันจันทร์"
                icon={Mail}
                colorClass="bg-gray-100 text-gray-600"
             />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
            ตั้งค่าจะมีผลทันทีหลังจากกดบันทึก
        </div>

      </motion.div>
    </div>
  );
};

export default NotificationSettingsModal;
