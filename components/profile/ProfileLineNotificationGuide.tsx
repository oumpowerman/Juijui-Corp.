import React from 'react';
import { Bell, CheckCircle2, MessageSquare, Clock, Calendar, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const NOTIFICATION_FEATURES = [
    {
        icon: <MessageSquare className="w-4 h-4 text-indigo-500" />,
        title: "แจ้งเตือนแชททีม",
        desc: "เมื่อมีคนแท็กหรือตอบกลับข้อความ"
    },
    {
        icon: <Clock className="w-4 h-4 text-amber-500" />,
        title: "เตือนส่งงาน",
        desc: "แจ้งเตือนก่อนถึงกำหนดส่งงาน (Deadline)"
    },
    {
        icon: <Calendar className="w-4 h-4 text-emerald-500" />,
        title: "สรุปงานประจำวัน",
        desc: "รับสรุปงานที่ต้องทำทุกเช้า (Daily Brief)"
    },
    {
        icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
        title: "แจ้งเตือน HP/XP",
        desc: "เมื่อถูกหักเลือด หรือได้รับรางวัลพิเศษ"
    }
];

const ProfileLineNotificationGuide: React.FC = () => {
  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-100/50 relative overflow-hidden group"
    >
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
            <h4 className="text-sm font-black text-indigo-900 flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 fill-indigo-500 text-indigo-600" />
                เชื่อมต่อ LINE แล้วดียังไง?
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NOTIFICATION_FEATURES.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/60 transition-colors">
                        <div className="mt-0.5 bg-white p-1.5 rounded-lg shadow-sm border border-indigo-50">
                            {feature.icon}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-700">{feature.title}</p>
                            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{feature.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] text-indigo-600 bg-white/50 p-2 rounded-lg border border-indigo-50/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ระบบใช้ <strong>Edge Function</strong> ส่งแจ้งเตือนรวดเร็วภายใน 1 วินาที</span>
            </div>
        </div>
    </motion.div>
  );
};

export default ProfileLineNotificationGuide;
