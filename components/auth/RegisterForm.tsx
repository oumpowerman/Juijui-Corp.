import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, Briefcase, Mail, Phone, Lock, Quote, ArrowRight, Loader2, Building2 } from 'lucide-react';
import FormInputField from '../common/FormInputField';
import FormTextareaField from '../common/FormTextareaField';
import FilterDropdown from '../common/FilterDropdown';
import AvatarUploadSection from './register/AvatarUploadSection';
import EmojiSelectorSection from './register/EmojiSelectorSection';
import TermsCheckbox from './register/TermsCheckbox';
import TermsOfServiceModal from './register/TermsOfServiceModal';
import { supabase } from '../../lib/supabase';
import { Company } from '../../types';

export interface RegisterFormProps {
  email: string;
  setEmail: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  name: string;
  setName: (val: string) => void;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  position: string;
  setPosition: (val: string) => void;
  employmentType: string;
  setEmploymentType: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  reason: string;
  setReason: (val: string) => void;
  companyId?: string;
  setCompanyId?: (val: string) => void;
  companies?: Company[];
  
  positions: { key: string; label: string }[];
  avatarPreview: string | null;
  isConvertingImg: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  selectedEmoji: string;
  setSelectedEmoji: (val: string) => void;
  takenEmojis: string[];
}

const FORM_FIELDS_ORDER = [
  'avatarPreview',
  'firstName',
  'lastName',
  'nickname',
  'username',
  'position',
  'companyId',
  'employmentType',
  'email',
  'phone',
  'password',
  'selectedEmoji',
  'acceptedTerms'
];

export const RegisterForm: React.FC<RegisterFormProps> = ({
  email,
  setEmail,
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  name,
  setName,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  position,
  setPosition,
  employmentType,
  setEmploymentType,
  phone,
  setPhone,
  reason,
  setReason,
  companyId,
  setCompanyId,
  companies = [],
  positions,
  avatarPreview,
  isConvertingImg,
  fileInputRef,
  handleFileChange,
  isLoading,
  onSubmit,
  selectedEmoji,
  setSelectedEmoji,
  takenEmojis,
}) => {
  const [policyData, setPolicyData] = useState<{ title: string; content: string } | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data } = await supabase
          .from('master_options')
          .select('*')
          .eq('type', 'SYSTEM_POLICY')
          .eq('key', 'TERMS_OF_SERVICE')
          .maybeSingle();
        if (data) {
          setPolicyData({
            title: data.label || 'ข้อตกลงและเงื่อนไขการปฏิบัติงาน',
            content: data.description || 'ไม่มีเนื้อหาข้อตกลงในระบบ',
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPolicy();
  }, []);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!avatarPreview) {
      newErrors.avatarPreview = 'กรุณาอัปโหลดรูปภาพโปรไฟล์ของคุณนะครับ';
    }
    if (!firstName || !firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อจริงนะครับ';
    }
    if (!lastName || !lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุลนะครับ';
    }
    if (!name || !name.trim()) {
      newErrors.nickname = 'กรุณากรอกชื่อเล่นนะครับ';
    }
    
    if (!username || !username.trim()) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้นะครับ';
    } else if (!/^[a-z0-9_.]{3,20}$/i.test(username)) {
      newErrors.username = 'ชื่อผู้ใช้ต้องประกอบด้วยภาษาอังกฤษ ตัวเลข ขีดล่าง (_) และจุด (.) ความยาว 3-20 ตัวอักษรเท่านั้นนะครับ';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      newErrors.email = 'กรุณากรอกอีเมลในรูปแบบที่ถูกต้องนะครับ';
    }

    if (!phone || !phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์นะครับ';
    }

    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่านนะครับ';
    } else if (password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษรนะครับ';
    }

    if (!position || position === 'ALL') {
      newErrors.position = 'กรุณาเลือกตำแหน่งงานนะครับ';
    }

    if (companies && companies.length > 1 && (!companyId || companyId === 'ALL')) {
      newErrors.companyId = 'กรุณาเลือกสังกัดบริษัทในเครือนะครับ';
    }

    if (!employmentType) {
      newErrors.employmentType = 'กรุณาเลือกประเภทพนักงานนะครับ';
    }

    if (!selectedEmoji) {
      newErrors.selectedEmoji = 'กรุณาเลือกอิโมจิประจำตัวนะครับ';
    } else if (takenEmojis.includes(selectedEmoji)) {
      newErrors.selectedEmoji = 'อิโมจินี้ถูกเพื่อนในทีมเลือกไปแล้ว โปรดเลือกอิโมจิอื่นนะครับ';
    }

    if (!acceptedTerms) {
      newErrors.acceptedTerms = 'กรุณายอมรับข้อตกลงและระเบียบปฏิบัติการทำงานนะครับ';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstInvalidKey = FORM_FIELDS_ORDER.find(key => newErrors[key]);
      if (firstInvalidKey) {
        const containerId = `register-${firstInvalidKey}-container`;
        const element = document.getElementById(containerId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            const input = element.querySelector('input:not([type="file"]):not([type="checkbox"]), button, textarea, #terms-checkbox') as HTMLElement;
            if (input) {
              input.focus();
            }
          }, 350);
        }
      }
      return;
    }

    onSubmit(e);
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
        {/* Avatar Image Selection */}
        <AvatarUploadSection
          avatarPreview={avatarPreview}
          isConvertingImg={isConvertingImg}
          fileInputRef={fileInputRef}
          handleFileChange={(e) => {
            clearError('avatarPreview');
            handleFileChange(e);
          }}
          error={errors.avatarPreview}
        />

        {/* First Name & Last Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInputField
            containerId="register-firstName-container"
            label="ชื่อจริง"
            required
            icon={<User className={`w-5 h-5 transition-colors duration-300 ${errors.firstName ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />}
            value={firstName}
            onChange={(val) => {
              setFirstName(val);
              if (val.trim()) clearError('firstName');
            }}
            placeholder="ชื่อจริง"
            error={errors.firstName}
          />

          <FormInputField
            containerId="register-lastName-container"
            label="นามสกุล"
            required
            icon={<User className={`w-5 h-5 transition-colors duration-300 ${errors.lastName ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />}
            value={lastName}
            onChange={(val) => {
              setLastName(val);
              if (val.trim()) clearError('lastName');
            }}
            placeholder="นามสกุล"
            error={errors.lastName}
          />
        </div>

        {/* Nickname and Position Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInputField
            containerId="register-nickname-container"
            label="ชื่อเล่น"
            required
            icon={
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <User className={`w-5 h-5 transition-colors duration-300 ${errors.nickname ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />
              </motion.div>
            }
            value={name}
            onChange={(val) => {
              setName(val);
              if (val.trim()) clearError('nickname');
            }}
            placeholder="ชื่อเล่น"
            error={errors.nickname}
          />

          <div id="register-position-container" className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ตำแหน่งงาน *</label>
            <FilterDropdown 
              label="ตำแหน่งงาน"
              align="right"
              options={positions.length > 0 ? positions.map(p => ({ key: p.label, label: p.label })) : [
                { key: 'Editor', label: 'Editor' },
                { key: 'Creative', label: 'Creative' },
              ]}
              value={position}
              onChange={(val) => {
                setPosition(val);
                if (val && val !== 'ALL') clearError('position');
              }}
              showAllOption={false}
              clearable={false}
              icon={<Briefcase className="w-5 h-5" />}
              activeColorClass="bg-pink-50 border-pink-200 text-pink-700 font-bold"
              hasError={!!errors.position}
            />
            {errors.position && (
              <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
                {errors.position}
              </p>
            )}
          </div>
        </div>

        {/* Company Affiliation & Employment Type Grid */}
        <div className={`grid ${companies.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-3`}>
          {companies.length > 1 && (
            <div id="register-companyId-container" className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase flex items-center justify-between">
                <span>สังกัดบริษัทในเครือ *</span>
              </label>
              <FilterDropdown 
                label="เลือกบริษัท"
                options={companies.map(c => ({
                  key: c.id,
                  label: `${c.shortName ? `[${c.shortName}] ` : ''}${c.name}`
                }))}
                value={companyId || (companies.length > 0 ? companies[0].id : '')}
                onChange={(val) => {
                  setCompanyId?.(val);
                  if (val && val !== 'ALL') clearError('companyId');
                }}
                showAllOption={false}
                clearable={false}
                icon={<Building2 className="w-5 h-5" />}
                activeColorClass="bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                hasError={!!errors.companyId}
              />
              {errors.companyId && (
                <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
                  {errors.companyId}
                </p>
              )}
            </div>
          )}

          <div id="register-employmentType-container" className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">ประเภทพนักงาน *</label>
            <FilterDropdown 
              label="ประเภทพนักงาน"
              options={[
                { key: 'FULL_TIME', label: 'พนักงานประจำ (Full-time)' },
                { key: 'INTERN', label: 'นักศึกษาฝึกงาน (Intern)' },
                { key: 'PROBATION', label: 'ทดลองงาน (Probation)' },
              ]}
              value={employmentType}
              onChange={(val) => {
                setEmploymentType(val);
                if (val) clearError('employmentType');
              }}
              showAllOption={false}
              clearable={false}
              icon={<User className="w-5 h-5" />}
              activeColorClass="bg-pink-50 border-pink-200 text-pink-700 font-bold"
              hasError={!!errors.employmentType}
            />
            {errors.employmentType && (
              <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
                {errors.employmentType}
              </p>
            )}
          </div>
        </div>

        {/* Username Input */}
        <FormInputField
          containerId="register-username-container"
          label="ชื่อผู้ใช้ (Username)"
          required
          icon={
            <motion.div
              animate={{ rotate: [0, 5, -5, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className={`w-5 h-5 transition-colors duration-300 ${errors.username ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
            </motion.div>
          }
          value={username}
          onChange={(val) => {
            setUsername(val);
            if (val && /^[a-z0-9_.]{3,20}$/i.test(val)) clearError('username');
          }}
          placeholder="ชื่อผู้ใช้ เช่น john_doe"
          error={errors.username}
          helperText="ใช้ในการล็อกอินแทนอีเมล (ภาษาอังกฤษ ตัวเลข และ _ ยาว 3-20 ตัวอักษร)"
        />

        {/* Email Input */}
        <FormInputField
          containerId="register-email-container"
          label="อีเมลสำรอง (ไม่บังคับ) 📧"
          type="email"
          icon={
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Mail className={`w-5 h-5 transition-colors duration-300 ${errors.email ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />
            </motion.div>
          }
          value={email}
          onChange={(val) => {
            setEmail(val);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!val || emailRegex.test(val)) clearError('email');
          }}
          placeholder="email@example.com (ไม่บังคับ)"
          error={errors.email}
          helperText="แนะนำให้กรอกไว้เพื่อใช้ในการกู้คืนรหัสผ่านหากลืมรหัสผ่านในอนาคตครับ (หรือจะข้ามไปก่อนและไปผูกอีเมลทีหลังในหน้าตั้งค่าโปรไฟล์ได้ครับ)"
        />

        {/* Phone Number */}
        <FormInputField
          containerId="register-phone-container"
          label="เบอร์โทรศัพท์"
          required
          type="tel"
          icon={<Phone className={`w-5 h-5 transition-colors duration-300 ${errors.phone ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />}
          value={phone}
          onChange={(val) => {
            setPhone(val);
            if (val.trim()) clearError('phone');
          }}
          placeholder="08x-xxx-xxxx"
          error={errors.phone}
        />

        {/* Password Input */}
        <FormInputField
          containerId="register-password-container"
          label="รหัสผ่าน"
          required
          type="password"
          showPasswordToggle
          isPasswordShown={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          icon={
            <motion.div
              animate={{ 
                rotate: [0, 8, 0, -8, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Lock className={`w-5 h-5 transition-colors duration-300 ${errors.password ? 'text-red-400 group-focus-within:text-red-500' : 'text-slate-400 group-focus-within:text-pink-500'}`} />
            </motion.div>
          }
          value={password}
          onChange={(val) => {
            setPassword(val);
            if (val.length >= 8) clearError('password');
          }}
          placeholder="••••••••"
          error={errors.password}
        />

        {/* Bio / Quote Area */}
        <FormTextareaField
          label="แนะนำตัว / ฝากถึงทีมงาน"
          icon={<Quote className="w-5 h-5" />}
          value={reason}
          onChange={(val) => setReason(val)}
          placeholder="บอกเราหน่อยว่าทำไมอยากร่วมทีม..."
          rows={2}
        />

        {/* 8-bit Emoji Picker Selection */}
        <EmojiSelectorSection
          selectedEmoji={selectedEmoji}
          setSelectedEmoji={(emo) => {
            setSelectedEmoji(emo);
            if (!takenEmojis.includes(emo)) clearError('selectedEmoji');
          }}
          takenEmojis={takenEmojis}
          error={errors.selectedEmoji}
        />

        {/* Terms & Conditions Checkbox */}
        <TermsCheckbox
          acceptedTerms={acceptedTerms}
          onToggle={() => {
            setAcceptedTerms(false);
          }}
          onOpenModal={() => {
            setIsPolicyModalOpen(true);
          }}
          error={errors.acceptedTerms}
        />

        {/* Submit Button */}
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isLoading || isConvertingImg}
            className={`w-full py-4 rounded-xl font-black text-white text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isLoading || isConvertingImg ? 'opacity-50 cursor-not-allowed' : ''} bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-200`}
          >
            {isLoading || isConvertingImg ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังส่งใบสมัคร...</span>
              </>
            ) : (
              <>
                <span>ส่งใบสมัครสมาชิก</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )} 
          </button>
        </div>
      </form>

      {/* Policy View Modal */}
      <TermsOfServiceModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        onAccept={() => {
          setAcceptedTerms(true);
          clearError('acceptedTerms');
        }}
        policyData={policyData}
      />
    </>
  );
};

export default RegisterForm;
