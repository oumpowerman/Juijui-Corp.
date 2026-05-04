
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Sparkles, Building2 } from 'lucide-react';

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  recommended?: boolean;
}

interface PricingProps {
  onContact?: () => void;
  plans?: PricingPlan[];
}

const DEFAULT_PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    price: '฿0',
    period: 'เดือน',
    features: ['จัดการได้ 1 ช่องหลัก', 'ปฏิทินคอนเทนต์พื้นฐาน', 'ผู้ใช้งาน 1 คน'],
  },
  {
    name: 'Pro Creator',
    price: '฿499',
    period: 'เดือน',
    features: ['ไม่จำกัดจำนวนช่อง', 'ระบบ Team Collaboration', 'Dashboard วิเคราะห์ KPI', 'Content Stock & Script Hub', 'Meeting & Duty System'],
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: 'ติดต่อเรา',
    period: 'โปรเจกต์',
    features: ['ทุกอย่างในแผน Pro', 'Custom Dashboard', 'White-label Branding', 'Dedicated Manager'],
  }
];

const Pricing: React.FC<PricingProps> = ({ onContact, plans }) => {
  const displayPlans = plans && plans.length > 0 ? plans : DEFAULT_PLANS;

  return (
    <section className="py-24 bg-[#FDFCFE]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            เลือกแผนที่เหมาะกับ <br className="sm:hidden" /> <span className="text-purple-600 underline decoration-purple-100 underline-offset-8">สเกลงานของคุณ</span>
          </motion.h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            ไม่ว่าคุณจะบินเดี่ยว หรือทำงานเป็นทีมใหญ่ <br className="hidden md:block" />
            เรามีฟีเจอร์พร้อมสนับสนุนการเติบโตของคุณ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {displayPlans.map((plan, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-white p-10 rounded-[2.5rem] border ${
                plan.recommended 
                  ? 'border-2 border-purple-500 shadow-2xl shadow-purple-100 relative scale-105 z-10' 
                  : 'border-slate-100 hover:shadow-2xl hover:shadow-slate-100'
              } transition-all flex flex-col`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                  plan.recommended ? 'bg-purple-50' : 'bg-slate-50'
                }`}>
                  {plan.name.includes('Starter') && <Zap className="w-6 h-6 text-slate-400" />}
                  {plan.name.includes('Pro') && <Sparkles className="w-6 h-6 text-purple-600" />}
                  {plan.name.includes('Enterprise') && <Building2 className="w-6 h-6 text-indigo-400" />}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {plan.name.includes('Starter') ? 'สำหรับครีเอเตอร์เริ่มต้น' : 
                   plan.name.includes('Pro') ? 'ยอดนิยมสำหรับทีมขนาดกลาง' : 'สำหรับเอเจนซี่และสตูดิโอ'}
                </p>
              </div>

              <div className="mb-8">
                <span className={`${plan.price === 'ติดต่อเรา' ? 'text-3xl' : 'text-4xl'} font-black text-slate-900`}>{plan.price}</span>
                {plan.price !== 'ติดต่อเรา' && (
                  <span className="text-slate-400 font-bold ml-1 text-sm">/ {plan.period}</span>
                )}
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3 text-slate-600 font-medium">
                    <Check className={`w-5 h-5 ${plan.recommended ? 'text-purple-600 font-bold' : 'text-green-500'}`} /> {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={plan.name.includes('Enterprise') ? onContact : undefined}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  plan.recommended 
                    ? 'bg-purple-600 text-white shadow-xl shadow-purple-200 hover:bg-purple-700 hover:translate-y-[-2px]' 
                    : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                }`}
              >
                {plan.name.includes('Starter') ? 'เริ่มใช้งานฟรีเลย' : 
                 plan.name.includes('Pro') ? 'อัปเกรดเป็น Pro' : 'คุยกับฝ่ายขาย'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
