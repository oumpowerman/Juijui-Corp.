
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { ContactInfo } from '../../services/landingService';

interface ContactModalProps {
  onClose: () => void;
  contactInfo?: ContactInfo;
}

const ContactModal: React.FC<ContactModalProps> = ({ onClose, contactInfo }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      {/* Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-0"
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
      >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Info */}
            <div className="w-full md:w-5/12 bg-purple-600 p-8 md:p-12 text-white">
              <h2 className="text-3xl font-black mb-4">คุยกับเรา 💬</h2>
              <p className="text-white/80 font-medium mb-12">เราพร้อมรับฟังทุกข้อเสนอแนะ หรือช่วยคุณแก้ปัญหาที่เจอ</p>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-white/50 mb-1">อีเมลฝ่ายสนับสนุน</p>
                    <p className="font-bold text-lg">{contactInfo?.email}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-white/50 mb-1">โทรศัพท์</p>
                    <p className="font-bold text-lg">{contactInfo?.phone}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-white/50 mb-1">เวลาทำการ</p>
                    <p className="font-bold text-lg">{contactInfo?.office_hours}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-white/50 mb-1">ที่ตั้ง</p>
                    <p className="font-bold text-lg">{contactInfo?.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Form (Mockup) */}
            <div className="w-full md:w-7/12 p-8 md:p-12">
               <h3 className="text-2xl font-black text-slate-800 mb-6">ส่งข้อความหาเรา</h3>
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">ชื่อของคุณ</label>
                    <input type="text" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-purple-200 outline-none font-bold text-slate-700 transition-all" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">ข้อความ</label>
                    <textarea rows={4} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-purple-200 outline-none font-bold text-slate-700 transition-all resize-none" placeholder="บอกเราหน่อยว่าเกิดอะไรขึ้น..." />
                  </div>
                  <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-purple-600 transition-all transform hover:scale-[1.02] shadow-xl shadow-purple-200/20 active:scale-95">
                    <Send className="w-5 h-5" />
                    ส่งข้อความทันที
                  </button>
               </div>

               <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed">
                    เรามักจะตอบลับภายใน 24 ชม. <br/> ในเวลาทำการปกติ
                  </p>
               </div>
            </div>
          </motion.div>
    </div>
  );
};

export default ContactModal;
