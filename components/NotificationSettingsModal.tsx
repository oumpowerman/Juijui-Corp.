
import React from 'react';
import { X, Bell, Calendar, UserPlus, CheckCircle, Mail, Shield } from 'lucide-react';
import { NotificationPreferences } from '../types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: NotificationPreferences;
  onUpdate: (prefs: NotificationPreferences) => void;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  preferences, 
  onUpdate 
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof NotificationPreferences) => {
    onUpdate({
      ...preferences,
      [key]: !preferences[key]
    });
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
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-start space-x-4">
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
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${preferences[itemKey] ? 'bg-indigo-600' : 'bg-gray-300'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences[itemKey] ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                <Bell className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-800">การแจ้งเตือน (Notifications)</h2>
                <p className="text-xs text-gray-400">เลือกรับเฉพาะเรื่องที่สำคัญกับคุณ</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          <div className="space-y-4">
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

          <div className="space-y-4 pt-2">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">ระบบ & ช่องทาง (System)</h3>
             
             <ToggleItem 
                itemKey="systemUpdates"
                label="ข่าวสารจากระบบ"
                description="การอัปเดตฟีเจอร์ใหม่ๆ ของ Juijui Planner"
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
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
            <button 
                onClick={onClose}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
                บันทึกการตั้งค่า
            </button>
        </div>

      </div>
    </div>
  );
};

export default NotificationSettingsModal;
