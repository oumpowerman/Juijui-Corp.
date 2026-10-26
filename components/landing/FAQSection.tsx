import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQItem } from '../../services/landingService';
import { SectionAuraHeader, ScrollRevealItem } from './ScrollRevealSection';

interface FAQSectionProps {
  faqs?: FAQItem[];
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="relative z-10 py-24 px-6 max-w-3xl mx-auto font-google-sans">
      <SectionAuraHeader
        className="text-center mb-14"
        titleClassName="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight"
        subtitleClassName="text-base sm:text-lg text-slate-600 font-medium"
        badge={
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-purple-200/80 text-purple-700 text-sm font-bold shadow-sm">
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>คำถามที่พบบ่อย</span>
          </div>
        }
        title={
          <>
            คุณมีข้อสงสัย?{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 bg-clip-text text-transparent">
              เรามีคำตอบ
            </span>
          </>
        }
        subtitle="รวบรวมคำถามที่เพื่อนๆ ครีเอเตอร์มักจะถามเราบ่อยที่สุด"
      />

      <div className="space-y-4">
        {faqs?.map((faq, idx) => (
          <ScrollRevealItem
            key={idx}
            index={idx}
            direction="up"
            className="border border-white/95 rounded-2xl overflow-hidden bg-white/90 backdrop-blur-xl shadow-[0_14px_34px_-12px_rgba(99,102,241,0.08)]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/70 transition-colors group cursor-pointer"
            >
              <span className="font-bold text-slate-800 text-base sm:text-lg group-hover:text-purple-600 transition-colors leading-snug">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 shrink-0 ml-3 transition-transform duration-300 ${
                  openIndex === idx ? 'rotate-180 text-purple-600' : ''
                }`}
              />
            </button>
            <AnimatePresence>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="px-6 pb-6 pt-0 text-slate-600 font-medium leading-relaxed text-sm sm:text-base">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollRevealItem>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
