import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import { SocialLinks, FooterCategory } from '../../services/landingService';
import { BRAND_CONFIG } from '../../config/brand.ts';

interface FooterProps {
  socialLinks?: SocialLinks;
  categories?: FooterCategory[];
  onNavigate: (path: string) => void;
}

const FOOTER_STRUCTURE = [
  {
    title: 'ผลิตภัณฑ์',
    links: [
      { label: 'ฟีเจอร์ทั้งหมด', view: 'FEATURES' },
      { label: 'ราคาและแพ็กเกจ', view: 'PRICING' },
      { label: 'ความสามารถพิเศษ', view: 'FEATURES' },
    ],
  },
  {
    title: 'แหล่งข้อมูล',
    links: [
      { label: 'คู่มือการใช้งาน', view: 'FAQS' },
      { label: 'คำถามที่พบบ่อย', view: 'FAQS' },
      { label: 'อัปเดตระบบ', view: 'UPDATES' },
    ],
  },
  {
    title: 'สนับสนุน',
    links: [
      { label: 'ติดต่อเรา', view: 'CONTACT' },
      { label: 'Privacy Policy', view: 'PRIVACY' },
      { label: 'Terms of Service', view: 'TERMS' },
    ],
  },
];

const Footer: React.FC<FooterProps> = ({ socialLinks, onNavigate }) => {
  return (
    <footer className="relative z-10 bg-white/80 backdrop-blur-2xl pt-20 pb-10 border-t border-white/90 shadow-[0_-12px_40px_-15px_rgba(139,92,246,0.08)] font-google-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <div
              className="flex items-center gap-2.5 mb-6 cursor-pointer group"
              onClick={() => onNavigate('HOME')}
            >
              <div className="w-9 h-9 bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200/70 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-700 tracking-tight">
                {BRAND_CONFIG.name}
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
              {BRAND_CONFIG.tagline} <br />
              ที่ช่วยให้ครีเอเตอร์ทำงานง่ายขึ้น 10 เท่า
            </p>
            <div className="flex items-center gap-3.5">
              <a
                href={socialLinks?.line || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-slate-500 hover:text-green-600 hover:bg-green-50 transition-all border border-slate-200/80 hover:border-green-200"
                title="Line OA"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={socialLinks?.facebook || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-200/80 hover:border-blue-200"
                title="Facebook"
              >
                <FaFacebook className="w-4 h-4" />
              </a>
              <a
                href={socialLinks?.instagram || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-all border border-slate-200/80 hover:border-pink-200"
                title="Instagram"
              >
                <FaInstagram className="w-4 h-4" />
              </a>
              <a
                href={socialLinks?.youtube || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-200/80 hover:border-red-200"
                title="Youtube"
              >
                <FaYoutube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {FOOTER_STRUCTURE.map((category, idx) => (
            <div key={idx}>
              <h4 className="font-bold text-slate-900 mb-6 underline decoration-purple-200/60 underline-offset-4">
                {category.title}
              </h4>
              <ul className="space-y-4 text-sm font-semibold text-slate-600">
                {category.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <button
                      type="button"
                      onClick={() => onNavigate(link.view)}
                      className="hover:text-purple-600 transition-colors text-left font-semibold cursor-pointer"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-purple-100/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-500">
          <p>{BRAND_CONFIG.copyright}</p>
          <p className="flex items-center gap-1">{BRAND_CONFIG.madeBy}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
