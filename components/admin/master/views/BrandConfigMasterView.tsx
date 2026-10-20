import React, { useState, useEffect } from 'react';
import { MasterOption } from '../../../../types';
import { Sparkles, Upload, Image, RotateCcw, Save, CheckCircle2, AlertCircle, Eye, ShieldCheck, Link, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { BRAND_CONFIG } from '../../../../config/brand';
import { useToast } from '../../../../context/ToastContext';

interface BrandConfigMasterViewProps {
  masterOptions: MasterOption[];
  onUpdate: (option: MasterOption) => Promise<boolean>;
  onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

export const BrandConfigMasterView: React.FC<BrandConfigMasterViewProps> = ({
  masterOptions,
  onUpdate,
  onAdd,
  onDelete
}) => {
  const { showToast } = useToast();

  // Find existing config records
  const logoOption = masterOptions.find(o => 
    (o.type === 'BRAND_CONFIG' || o.type === 'SYSTEM_CONFIG') && 
    (o.key === 'SYSTEM_LOGO' || o.key === 'BRAND_LOGO' || o.key === 'APP_LOGO')
  );

  const nameOption = masterOptions.find(o => 
    (o.type === 'BRAND_CONFIG' || o.type === 'SYSTEM_CONFIG' || o.type === 'WORK_CONFIG') && 
    (o.key === 'SYSTEM_NAME' || o.key === 'APP_NAME' || o.key === 'BRAND_NAME')
  );

  const subtitleOption = masterOptions.find(o => 
    (o.type === 'BRAND_CONFIG' || o.type === 'SYSTEM_CONFIG') && 
    (o.key === 'SYSTEM_SUBTITLE' || o.key === 'BRAND_SUBTITLE')
  );

  // Local editable form states
  const [logoUrl, setLogoUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'slate' | 'dark' | 'emerald'>('slate');

  // Sync state with masterOptions on mount/update
  useEffect(() => {
    setLogoUrl(logoOption?.label || '');
    setBrandName(nameOption?.label || BRAND_CONFIG.name || 'Kontent OS');
    setSubtitle(subtitleOption?.label || '');
    setPreviewError(false);
  }, [logoOption, nameOption, subtitleOption]);

  // Handle local image file upload (convert to Base64 data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, SVG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      showToast('ขนาดไฟล์รูปภาพไม่ควรเกิน 1.5MB เพื่อประสิทธิภาพของระบบ', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        setPreviewError(false);
        showToast('โหลดรูปภาพตัวอย่างสำเร็จแล้ว อย่าลืมกดบันทึก', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save or Update Logo
      const trimmedLogo = logoUrl.trim();
      if (trimmedLogo) {
        if (logoOption) {
          await onUpdate({
            ...logoOption,
            type: 'BRAND_CONFIG',
            key: 'SYSTEM_LOGO',
            label: trimmedLogo,
            isActive: true,
          });
        } else {
          await onAdd({
            type: 'BRAND_CONFIG',
            key: 'SYSTEM_LOGO',
            label: trimmedLogo,
            color: '#6366f1',
            sortOrder: 1,
            isActive: true,
            isDefault: false,
          });
        }
      } else if (logoOption && onDelete) {
        // If user cleared logo, remove option to fallback to default
        await onDelete(logoOption.id);
      }

      // 2. Save or Update Brand Name
      const trimmedName = brandName.trim();
      if (trimmedName) {
        if (nameOption) {
          await onUpdate({
            ...nameOption,
            type: 'BRAND_CONFIG',
            key: 'SYSTEM_NAME',
            label: trimmedName,
            isActive: true,
          });
        } else {
          await onAdd({
            type: 'BRAND_CONFIG',
            key: 'SYSTEM_NAME',
            label: trimmedName,
            color: '#4f46e5',
            sortOrder: 2,
            isActive: true,
            isDefault: false,
          });
        }
      }

      // 3. Save or Update Subtitle
      const trimmedSub = subtitle.trim();
      if (trimmedSub) {
        if (subtitleOption) {
          await onUpdate({
            ...subtitleOption,
            type: 'BRAND_CONFIG',
            key: 'SYSTEM_SUBTITLE',
            label: trimmedSub,
            isActive: true,
          });
        } else {
          await onAdd({
            type: 'BRAND_CONFIG',
            key: 'SYSTEM_SUBTITLE',
            label: trimmedSub,
            color: '#8b5cf6',
            sortOrder: 3,
            isActive: true,
            isDefault: false,
          });
        }
      } else if (subtitleOption && onDelete) {
        await onDelete(subtitleOption.id);
      }

      showToast('บันทึกการตั้งค่าแบรนด์และโลโก้ระบบเรียบร้อยแล้ว ✨', 'success');
    } catch (err: any) {
      console.error('Error saving brand config:', err);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setLogoUrl('');
    setBrandName(BRAND_CONFIG.name || 'Kontent OS');
    setSubtitle('');
    setPreviewError(false);
    showToast('รีเซ็ตเป็นค่าตั้งต้นแล้ว กดบันทึกเพื่อยืนยัน', 'info');
  };

  // Preview theme classes
  const themeBackgrounds = {
    slate: 'bg-slate-900 border-slate-800 text-white',
    dark: 'bg-zinc-950 border-zinc-900 text-white',
    emerald: 'bg-emerald-950 border-emerald-900 text-emerald-100',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dynamic Sidebar Brand & Logo</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              จัดการโลโก้และชื่อแบรนด์ระบบ
            </h2>
            <p className="text-sm text-indigo-100 max-w-2xl leading-relaxed">
              กำหนดโลโก้ภาพ สัญลักษณ์ และชื่อระบบที่จะปรากฏบนแถบเมนูข้าง (Sidebar) ของผู้ใช้ทุกคนแบบเรียลไทม์ 
              หากไม่มีการกำหนดรูปภาพ ระบบจะ Fallback กลับไปใช้ไอคอนสปาร์คเคิลตั้งต้นโดยอัตโนมัติ
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleResetToDefault}
              type="button"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ใช้ค่าเริ่มต้น</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form Column */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">ข้อมูลโลโก้และชื่อแบรนด์</h3>
              <p className="text-xs text-slate-400">กรอก URL รูปภาพ หรืออัปโหลดไฟล์รูปภาพจากเครื่อง</p>
            </div>
          </div>

          {/* Input 1: Logo URL & Uploader */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-indigo-500" />
                <span>URL รูปภาพโลโก้ (Logo Image URL)</span>
              </label>
              <span className="text-[11px] text-slate-400">รองรับ SVG, PNG, WebP, JPG</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setPreviewError(false);
                }}
                placeholder="เช่น https://example.com/logo.png หรือ /icon-192.png"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl('');
                    setPreviewError(false);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold transition-colors cursor-pointer"
                  title="ล้างค่า URL"
                >
                  ล้าง
                </button>
              )}
            </div>

            {/* Local Upload Alternative */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <span>หรือเลือกไฟล์รูปจากคอมพิวเตอร์:</span>
              </span>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs cursor-pointer transition-colors border border-indigo-200/80">
                <Upload className="w-3.5 h-3.5" />
                <span>อัปโหลดรูปภาพ</span>
                <input 
                  type="file" 
                  accept="image/png,image/svg+xml,image/webp,image/jpeg" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Input 2: Brand Name */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>ชื่อแบรนด์ / ระบบ (Brand / System Name)</span>
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="เช่น Kontent OS, Studio Flow, Juijui Corp"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-semibold"
            />
            <p className="text-[11px] text-slate-400">
              หากมีช่องว่าง เช่น "Kontent OS" คำแรกจะแสดงเป็นตัวหนา และคำหลังจะแสดงเป็นตัวรอง
            </p>
          </div>

          {/* Input 3: Subtitle / Tagline */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>คำอธิบายย่อย / แผนก (Optional Subtitle)</span>
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="เช่น CREATOR STUDIO, HQ PLATFORM, CORP"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>

          {/* Quick Presets / Tips */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>เกร็ดความรู้สำหรับแอดมิน:</span>
            </div>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              <li>รูปภาพโลโก้แนะนำให้เป็นไฟล์ <strong>PNG พื้นหลังโปร่งใส (Transparent)</strong> หรือ <strong>SVG</strong></li>
              <li>อัตราส่วนภาพแนะนำ <strong>1:1 (สี่เหลี่ยมจัตุรัส)</strong> ขนาดประมาณ 128x128px ถึง 256x256px</li>
              <li>หาก URL เสีย หรือลบภาพออก ระบบจะแสดงไอคอน ✨ Sparkles แทนให้อัตโนมัติทันที</li>
            </ul>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">ตัวอย่างการแสดงผลจริง (Live Preview)</h3>
              </div>

              {/* Theme Switcher for Preview */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewTheme('slate')}
                  className={`px-2 py-0.5 rounded ${previewTheme === 'slate' ? 'bg-white shadow-2xs text-slate-800' : 'text-slate-500'}`}
                >
                  Slate
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('dark')}
                  className={`px-2 py-0.5 rounded ${previewTheme === 'dark' ? 'bg-white shadow-2xs text-slate-800' : 'text-slate-500'}`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('emerald')}
                  className={`px-2 py-0.5 rounded ${previewTheme === 'emerald' ? 'bg-white shadow-2xs text-slate-800' : 'text-slate-500'}`}
                >
                  Emerald
                </button>
              </div>
            </div>

            {/* Preview Box 1: Full Sidebar Mode */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                1. โหมด Sidebar แบบเปิดเต็ม (Expanded)
              </span>
              <div className={`p-6 rounded-2xl border ${themeBackgrounds[previewTheme]} shadow-lg transition-all overflow-hidden flex items-center`}>
                <motion.div 
                  className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shrink-0 relative overflow-hidden mr-4 shadow-lg shadow-indigo-500/20"
                >
                  {logoUrl && !previewError ? (
                    <img 
                      src={logoUrl} 
                      alt="Preview Logo"
                      onError={() => setPreviewError(true)}
                      className="w-8 h-8 object-contain relative z-10 select-none drop-shadow-sm"
                    />
                  ) : (
                    <Sparkles className="w-7 h-7 stroke-[2.5px] relative z-10 text-white" />
                  )}
                  {/* Shimmer Light */}
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
                  />
                </motion.div>

                <div className="overflow-hidden">
                  <div className="text-xl font-bold tracking-tight leading-none text-white font-inter flex items-center gap-1">
                    <span>{brandName || 'Kontent OS'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="h-[2px] w-4 bg-indigo-400 rounded-full" />
                    <p className="text-[10px] font-bold text-indigo-300 tracking-[0.25em] uppercase font-inter">
                      {subtitle || 'STUDIO OS'}
                    </p>
                    <div className="h-[2px] w-8 bg-gradient-to-r from-indigo-400 to-transparent rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Box 2: Collapsed Sidebar Mode */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                2. โหมด Sidebar แบบย่อไอคอน (Collapsed)
              </span>
              <div className={`p-4 rounded-2xl border ${themeBackgrounds[previewTheme]} shadow-lg transition-all flex items-center justify-center`}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shrink-0 relative overflow-hidden shadow-lg shadow-indigo-500/20">
                  {logoUrl && !previewError ? (
                    <img 
                      src={logoUrl} 
                      alt="Preview Logo"
                      onError={() => setPreviewError(true)}
                      className="w-8 h-8 object-contain relative z-10 select-none drop-shadow-sm"
                    />
                  ) : (
                    <Sparkles className="w-7 h-7 stroke-[2.5px] relative z-10 text-white" />
                  )}
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Status Feedback */}
            {previewError && logoUrl && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ไม่สามารถโหลดรูปภาพจาก URL ที่ระบุได้ ระบบจะแสดงไอคอน ✨ สำรองแทน</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandConfigMasterView;
