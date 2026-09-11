import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  X, 
  Loader2, 
  Edit2, 
  Plus, 
  Tag, 
  LayoutTemplate, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { Channel, Platform, SocialLinks, PlatformFollowers } from '../../../types';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useMasterData } from '../../../hooks/useMasterData';
import { ChannelBrandTab, BrandColorOption } from './tabs/ChannelBrandTab';
import { ChannelPlatformsTab } from './tabs/ChannelPlatformsTab';
import { ChannelPillarsTab } from './tabs/ChannelPillarsTab';

export interface ChannelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  onSave: (channel: Channel, logoFile?: File | null) => Promise<boolean>;
}

export const BRAND_COLORS: BrandColorOption[] = [
  { id: 'red', class: 'bg-red-100 text-red-700 border-red-200 ring-red-500' },
  { id: 'orange', class: 'bg-orange-100 text-orange-700 border-orange-200 ring-orange-500' },
  { id: 'amber', class: 'bg-amber-100 text-amber-700 border-amber-200 ring-amber-500' },
  { id: 'green', class: 'bg-green-100 text-green-700 border-green-200 ring-green-500' },
  { id: 'teal', class: 'bg-teal-100 text-teal-700 border-teal-200 ring-teal-500' },
  { id: 'blue', class: 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-500' },
  { id: 'indigo', class: 'bg-indigo-100 text-indigo-700 border-indigo-200 ring-indigo-500' },
  { id: 'purple', class: 'bg-purple-100 text-purple-700 border-purple-200 ring-purple-500' },
  { id: 'pink', class: 'bg-pink-100 text-pink-700 border-pink-200 ring-pink-500' },
  { id: 'slate', class: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500' },
];

type TabKey = 'BRAND' | 'PLATFORMS' | 'PILLARS';

const TABS: { id: TabKey; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { id: 'BRAND', label: '1. ข้อมูล & อัตลักษณ์', shortLabel: 'ข้อมูลทั่วไป', icon: Tag },
  { id: 'PLATFORMS', label: '2. แพลตฟอร์ม & สถิติ', shortLabel: 'แพลตฟอร์ม', icon: LayoutTemplate },
  { id: 'PILLARS', label: '3. แกนเนื้อหา & หมวดหมู่', shortLabel: 'แกนเนื้อหา', icon: Layers },
];

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 32 : -32,
    opacity: 0,
    transition: { duration: 0.16, ease: 'easeIn' },
  }),
};

const ChannelFormModal: React.FC<ChannelFormModalProps> = ({ isOpen, onClose, channel, onSave }) => {
  const { showAlert } = useGlobalDialog();
  const { addMasterOption } = useMasterData();

  // Active Tab & Direction Tracking for animations
  const [activeTab, setActiveTab] = useState<TabKey>('BRAND');
  const [direction, setDirection] = useState<number>(0);
  
  // Form values
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['YOUTUBE']);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [followers, setFollowers] = useState<PlatformFollowers>({});
  const [color, setColor] = useState(BRAND_COLORS[0].class);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [targetId, setTargetId] = useState('');

  // Local state for temp options only when creating a new channel
  const [tempOptions, setTempOptions] = useState<{ id: string; type: 'PILLAR' | 'CATEGORY'; key: string; label: string; description?: string; parentKey?: string }[]>([]);

  // Image upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Load and populate fields when the channel prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('BRAND');
      setDirection(0);
      setTempOptions([]);
      if (channel) {
        setTargetId(channel.id);
        setName(channel.name);
        setDescription(channel.description || '');
        setEmail(channel.email || '');
        setSelectedPlatforms(channel.platforms || []);
        setSocialLinks(channel.social_links || {});
        setFollowers(channel.followers || {});
        setColor(channel.color || BRAND_COLORS[0].class);
        setLogoPreview(channel.logoUrl || null);
        setLogoFile(null);
      } else {
        // Clear fields for a brand new channel
        setTargetId(crypto.randomUUID());
        setName('');
        setDescription('');
        setEmail('');
        setSelectedPlatforms(['YOUTUBE']);
        setSocialLinks({});
        setFollowers({});
        setColor(BRAND_COLORS[0].class);
        setLogoFile(null);
        setLogoPreview(null);
      }
    }
  }, [isOpen, channel]);

  const switchTab = (newTab: TabKey) => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    const newIndex = TABS.findIndex(t => t.id === newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const handleNextTab = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex === 0 && !name.trim()) {
      showAlert("กรุณาตั้งชื่อรายการ/แบรนด์ก่อนไปขั้นตอนถัดไปครับ");
      return;
    }
    if (currentIndex < TABS.length - 1) {
      setDirection(1);
      setActiveTab(TABS[currentIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setDirection(-1);
      setActiveTab(TABS[currentIndex - 1].id);
    }
  };

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(i => i !== p) : [...prev, p]
    );
  };

  const handleSocialLinkChange = (p: Platform, url: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [p]: url
    }));
  };

  const handleFollowersChange = (p: Platform, count: number | undefined) => {
    setFollowers(prev => ({
      ...prev,
      [p]: count
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      showAlert("กรุณาตั้งชื่อรายการ/แบรนด์ด้วยครับ");
      if (activeTab !== 'BRAND') {
        switchTab('BRAND');
      }
      return;
    }
    if (selectedPlatforms.length === 0) {
      showAlert("ต้องเลือกอย่างน้อย 1 ช่องทาง (Platform) นะครับ");
      if (activeTab !== 'PLATFORMS') {
        switchTab('PLATFORMS');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Channel = {
        id: targetId,
        name: name.trim(),
        description: description.trim(),
        email: email.trim() || undefined,
        color,
        platforms: selectedPlatforms,
        logoUrl: logoPreview || undefined,
        social_links: socialLinks,
        followers: followers,
      };

      const success = await onSave(payload, logoFile);
      if (success) {
        // Save temp options if creating a new channel
        if (tempOptions.length > 0) {
          for (const opt of tempOptions) {
            await addMasterOption({
              type: opt.type,
              key: opt.key,
              label: opt.label,
              description: opt.description?.trim() || undefined,
              color: opt.type === 'PILLAR' 
                ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                : 'bg-emerald-100 text-emerald-700 border-emerald-200',
              sortOrder: 10,
              isActive: true,
              isDefault: false,
              parentKey: opt.type === 'PILLAR' ? targetId : opt.parentKey
            });
          }
        }
        onClose();
      }
    } catch (err) {
      console.error("Error submitting channel form:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTabIndex = TABS.findIndex(t => t.id === activeTab);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/60 backdrop-blur-md overflow-hidden"
          onClick={() => { if (!isSubmitting) onClose(); }}
        >
          {/* Stable Fixed Frame Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
            className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col h-[90vh] sm:h-[740px] lg:h-[780px] max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Zone 1: Header + Interactive Tab Navigation (Fixed Top Zone) */}
            <div className="shrink-0 bg-white border-b border-slate-100">
              {/* Top Title Bar */}
              <div className="px-6 py-4 sm:px-8 sm:py-4.5 bg-slate-50/80 flex justify-between items-center border-b border-slate-100/70">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    {channel ? (
                      <Edit2 className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                        {channel ? 'แก้ไขข้อมูลรายการ' : 'เพิ่มรายการใหม่'}
                      </h3>
                      {name.trim() && (
                        <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold border truncate max-w-[140px] ${color}`}>
                          {name}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {channel ? 'อัปเดตข้อมูลอัตลักษณ์ แพลตฟอร์ม และแกนเนื้อหา' : 'สร้างรายการใหม่และตั้งค่าโครงสร้างหมวดหมู่'}
                    </p>
                  </div>
                </div>
                <button
                  id="close-channel-modal-btn"
                  type="button"
                  onClick={() => { if (!isSubmitting) onClose(); }}
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200/60 rounded-full transition-colors disabled:opacity-50 shrink-0"
                  disabled={isSubmitting}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Navigation Strip */}
              <div className="px-6 py-2.5 sm:px-8">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 bg-slate-100/80 rounded-2xl">
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    const isCompleted = 
                      (tab.id === 'BRAND' && name.trim().length > 0) ||
                      (tab.id === 'PLATFORMS' && selectedPlatforms.length > 0) ||
                      (tab.id === 'PILLARS');

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        id={`channel-tab-${tab.id.toLowerCase()}`}
                        onClick={() => switchTab(tab.id)}
                        disabled={isSubmitting}
                        className={`
                          relative flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all
                          ${isActive 
                            ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200/60' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                          }
                        `}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="truncate hidden sm:inline">{tab.label}</span>
                        <span className="truncate sm:hidden">{tab.shortLabel}</span>

                        {/* Status indicator dot / badge */}
                        {isCompleted && !isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        {tab.id === 'PLATFORMS' && selectedPlatforms.length > 0 && (
                          <span className="hidden md:inline-flex text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-600 rounded-full font-bold">
                            {selectedPlatforms.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Zone 2: Fixed-Height Viewport with Smooth Horizontal Slide */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 custom-scrollbar relative">
              <AnimatePresence mode="wait" custom={direction}>
                {activeTab === 'BRAND' && (
                  <motion.div
                    key="tab-brand"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="h-full"
                  >
                    <ChannelBrandTab
                      name={name}
                      setName={setName}
                      description={description}
                      setDescription={setDescription}
                      email={email}
                      setEmail={setEmail}
                      color={color}
                      setColor={setColor}
                      brandColors={BRAND_COLORS}
                      logoPreview={logoPreview}
                      onFileChange={handleFileChange}
                      onRemovePhoto={handleRemovePhoto}
                      isSubmitting={isSubmitting}
                    />
                  </motion.div>
                )}

                {activeTab === 'PLATFORMS' && (
                  <motion.div
                    key="tab-platforms"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="h-full"
                  >
                    <ChannelPlatformsTab
                      selectedPlatforms={selectedPlatforms}
                      togglePlatform={togglePlatform}
                      socialLinks={socialLinks}
                      onSocialLinkChange={handleSocialLinkChange}
                      followers={followers}
                      onFollowersChange={handleFollowersChange}
                      isSubmitting={isSubmitting}
                    />
                  </motion.div>
                )}

                {activeTab === 'PILLARS' && (
                  <motion.div
                    key="tab-pillars"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="h-full"
                  >
                    <ChannelPillarsTab
                      targetId={targetId}
                      channel={channel}
                      tempOptions={tempOptions}
                      setTempOptions={setTempOptions}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Zone 3: Footer Control Bar (Fixed Bottom Zone - Absolute Position Stability) */}
            <div className="px-6 py-4 sm:px-8 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Step indicator & Cancel */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  id="cancel-channel-btn"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-all disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-lg">
                  ขั้นตอน {activeTabIndex + 1} จาก {TABS.length}
                </span>
              </div>

              {/* Navigation Actions (Prev / Next / Save) */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {activeTabIndex > 0 && (
                  <button
                    type="button"
                    id="prev-step-channel-btn"
                    onClick={handlePrevTab}
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>ย้อนกลับ</span>
                  </button>
                )}

                {activeTabIndex < TABS.length - 1 ? (
                  <button
                    type="button"
                    id="next-step-channel-btn"
                    onClick={handleNextTab}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-2xs"
                  >
                    <span>ถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : null}

                {/* Primary Save Button - Always Available */}
                <button
                  type="button"
                  id="submit-channel-btn"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className={`
                    px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all active:scale-95 flex items-center gap-1.5
                    ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{channel ? 'บันทึกการแก้ไข' : 'สร้างรายการ'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export { ChannelFormModal };
export default ChannelFormModal;
