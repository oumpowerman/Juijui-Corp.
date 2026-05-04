
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQItem } from '../../services/landingService';

interface FAQSectionProps {
  faqs?: FAQItem[];
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="py-24 px-6 max-w-3xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-sm font-bold mb-4">
          <HelpCircle className="w-4 h-4" />
          คำถามที่พบบ่อย
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">คุณมีข้อสงสัย? เรามีคำตอบ</h2>
        <p className="text-slate-500 font-medium">รวบรวมคำถามที่เพื่อนๆ ครีเตอร์มักจะถามเราบ่อยที่สุด</p>
      </div>

      <div className="space-y-4">
        {faqs?.map((faq, idx) => (
          <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button 
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group"
            >
              <span className="font-bold text-slate-800 text-lg group-hover:text-purple-600 transition-colors leading-snug">
                {faq.question}
              </span>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="px-6 pb-6 pt-0 text-slate-500 font-medium leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
