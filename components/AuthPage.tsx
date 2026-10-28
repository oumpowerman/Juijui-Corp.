import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import ImageCropper from './ImageCropper';
import { hasDemoIntentFlag } from '../context/DemoSandboxContext';

// Modular Auth Sub-components
import { BrandSection } from './auth/BrandSection';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';
import { UpdatePasswordForm } from './auth/UpdatePasswordForm';
import { AuthDynamicBackground } from './auth/AuthDynamicBackground';
import { AuthTabSwitcher } from './auth/AuthTabSwitcher';
import { RegistrationSuccessModal } from './auth/modals/RegistrationSuccessModal';
import { AuthPortalTransition, type AuthPortalMode } from './auth/AuthPortalTransition';

// Modular Auth Custom Hooks
import { useLoginForm } from '../hooks/auth/useLoginForm';
import { useRegisterForm } from '../hooks/auth/useRegisterForm';
import { useForgotPasswordForm } from '../hooks/auth/useForgotPasswordForm';
import { useUpdatePasswordForm } from '../hooks/auth/useUpdatePasswordForm';

interface AuthPageProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
  initialMode?: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE';
  onPasswordUpdateSuccess?: () => void;
  isZoomingOut?: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onBack,
  initialMode,
  onPasswordUpdateSuccess,
  isZoomingOut = false,
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE'>(() => {
    if (initialMode) return initialMode;
    if (typeof window !== 'undefined' && sessionStorage.getItem('juijui_trial_signup_intent') === '1') {
      return 'REGISTER';
    }
    return 'LOGIN';
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [localPortalMode, setLocalPortalMode] = useState<AuthPortalMode | null>(null);

  // Sync mode with parameters and URL recovery hash
  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    } else if (window.location.hash.includes('type=recovery')) {
      setAuthMode('UPDATE');
    }
  }, [initialMode]);

  // Hook 1: Login Form
  const loginForm = useLoginForm({
    onLoginSuccess,
  });

  // Hook 2: Register Form
  const registerForm = useRegisterForm({
    onRegisterSuccess: () => {
      setLocalPortalMode(
        registerForm.onboardingMode === 'CREATE_TRIAL' ? 'REGISTER_TRIAL' : 'REGISTER_JOIN'
      );
    },
    onSessionLoginSuccess: onLoginSuccess,
  });

  // Fetch taken emojis when entering REGISTER mode
  useEffect(() => {
    if (authMode === 'REGISTER') {
      registerForm.fetchTakenEmojis();
    }
  }, [authMode]);

  // Hook 3: Forgot Password Form
  const forgotForm = useForgotPasswordForm();

  // Hook 4: Update Password Form
  const updatePasswordForm = useUpdatePasswordForm({
    onSuccess: () => setShowSuccessModal(true),
  });

  const isLogin = authMode === 'LOGIN';
  const isRegister = authMode === 'REGISTER';
  const isForgot = authMode === 'FORGOT';
  const isUpdate = authMode === 'UPDATE';

  const toggleMode = (mode: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE') => {
    if (authMode === mode) return;
    setAuthMode(mode);
    loginForm.setErrorMsg(null);
    registerForm.setErrorMsg(null);
    forgotForm.resetState();
    updatePasswordForm.setErrorMsg(null);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    const wasUpdate = authMode === 'UPDATE';
    setAuthMode('LOGIN');
    registerForm.resetForm();
    updatePasswordForm.resetForm();

    if (wasUpdate && onPasswordUpdateSuccess) {
      onPasswordUpdateSuccess();
    }
  };

  // Active error message across forms
  const activeError =
    isLogin
      ? loginForm.errorMsg
      : isRegister
      ? registerForm.errorMsg
      : isForgot
      ? forgotForm.errorMsg
      : updatePasswordForm.errorMsg;

  const dynamicShadow =
    authMode === 'LOGIN'
      ? 'shadow-[0_45px_100px_-25px_rgba(59,130,246,0.18),0_20px_45px_-15px_rgba(0,0,0,0.05),0_0_80px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]'
      : authMode === 'REGISTER'
      ? registerForm.onboardingMode === 'CREATE_TRIAL'
        ? 'shadow-[0_45px_100px_-25px_rgba(217,119,6,0.22),0_20px_45px_-15px_rgba(244,63,94,0.12),0_0_85px_rgba(251,191,36,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]'
        : 'shadow-[0_45px_100px_-25px_rgba(244,63,94,0.2),0_20px_45px_-15px_rgba(168,85,247,0.1),0_0_85px_rgba(244,63,94,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]'
      : 'shadow-[0_45px_100px_-25px_rgba(168,85,247,0.18),0_20px_45px_-15px_rgba(0,0,0,0.05),0_0_80px_rgba(168,85,247,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]';

  return (
    <div className="h-[100dvh] min-h-[100dvh] w-full flex items-center justify-center p-0 sm:p-4 md:p-6 font-sans relative overflow-x-hidden overflow-y-auto sm:overflow-hidden scrollbar-hide perspective-1000">
      {/* Dynamic Crop Overlay */}
      {registerForm.cropImageSrc && (
        <ImageCropper
          imageSrc={registerForm.cropImageSrc}
          onCropComplete={registerForm.handleCropComplete}
          onCancel={() => registerForm.setCropImageSrc(null)}
        />
      )}

      {/* Premium Fluid Aura Background Component */}
      <AuthDynamicBackground
        authMode={authMode}
        onboardingMode={registerForm.onboardingMode}
      />

      {/* Outer Glow Wrapper (Waiting behind parting clouds & smoothly emerging) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 14, filter: 'blur(4px)' }}
        animate={
          isZoomingOut
            ? {
                opacity: 0,
                scale: 0.91,
                y: 16,
                filter: 'blur(6px)',
              }
            : {
                opacity: 1,
                scale: 1,
                y: 0,
                filter: 'blur(0px)',
              }
        }
        transition={{
          duration: isZoomingOut ? 0.44 : 0.56,
          ease: [0.22, 1, 0.36, 1] as const,
        }}
        style={{ willChange: 'transform, opacity, filter' }}
        className={`relative w-full max-w-5xl bg-white/40 backdrop-blur-3xl rounded-none sm:rounded-[2.6rem] p-0 sm:p-[1px] border-0 sm:border border-white/70 h-full min-h-[100dvh] sm:min-h-0 sm:max-h-[92dvh] md:h-[min(780px,88dvh)] my-auto flex flex-col md:flex-row overflow-hidden ${dynamicShadow}`}
      >
        {onBack && (
          /* DESKTOP & TABLET: Refined Floating 3D Pearl Peach Capsule Button */
          <button
            type="button"
            onClick={onBack}
            className="group hidden sm:flex absolute sm:top-6 sm:left-6 z-50 items-center gap-2 p-1.5 sm:pl-1.5 sm:pr-4 sm:py-1.5 rounded-full bg-gradient-to-b from-[#fffaf7] via-[#fff0eb] to-[#ffe3d8] hover:from-white hover:via-[#ffede6] hover:to-[#ffdcd0] dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-900 backdrop-blur-xl border border-white/95 hover:border-rose-200/90 dark:border-rose-400/20 shadow-[0_3.5px_0_0_#fba28e,0_10px_22px_-6px_rgba(251,146,60,0.22),inset_0_1.5px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(254,205,211,0.5)] hover:shadow-[0_4.5px_0_0_#f87966,0_14px_28px_-6px_rgba(251,113,133,0.32),inset_0_1.5px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(254,205,211,0.7)] active:shadow-[0_1px_0_0_#ea584c,0_4px_10px_-2px_rgba(234,88,12,0.2),inset_0_1px_2px_rgba(254,215,170,0.4)] hover:-translate-y-0.5 active:translate-y-[2.5px] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-rose-400 min-h-[40px] cursor-pointer select-none"
            aria-label="กลับหน้าหลัก"
            title="กลับหน้าหลัก"
          >
            <motion.span
              animate={{
                rotate: [-5, 5, -5],
                x: [-1, 1, -1],
                y: [-0.5, 0.5, -0.5],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-7 h-7 rounded-full bg-gradient-to-b from-white via-rose-100/90 to-orange-100/90 dark:from-slate-700 dark:to-slate-800 border border-white dark:border-rose-400/30 shadow-[0_2px_0_0_#fba28e,0_3px_6px_rgba(251,146,60,0.18),inset_0_1px_1px_#ffffff] group-hover:shadow-[0_2px_0_0_#f87966,0_4px_9px_rgba(244,63,94,0.25),inset_0_1px_1px_#ffffff] group-active:translate-y-[1px] group-active:shadow-[0_0.5px_0_0_#ea584c,inset_0_1px_1px_rgba(0,0,0,0.05)] flex items-center justify-center text-rose-500 dark:text-rose-300 group-hover:text-rose-600 dark:group-hover:text-rose-200 transition-all duration-150 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5] transition-transform duration-150 group-hover:-translate-x-0.5" />
            </motion.span>
            <span className="font-kanit font-bold text-xs sm:text-sm text-stone-700 dark:text-rose-100 group-hover:text-rose-600 dark:group-hover:text-rose-300 tracking-normal transition-colors duration-150">
              กลับหน้าหลัก
            </span>
          </button>
        )}

        {/* Left branding animated panel */}
        <BrandSection
          authMode={authMode}
          onboardingMode={registerForm.onboardingMode}
        />

        {/* Right input forms handler */}
        <div className="w-full md:w-7/12 px-5 pt-8 pb-8 sm:p-8 md:p-12 flex flex-col flex-1 relative overflow-y-auto overflow-x-hidden scrollbar-hide z-10 bg-white/95 sm:bg-white/75 rounded-none sm:rounded-r-[2.5rem] sm:rounded-l-[2.5rem] md:rounded-l-none">
          <AnimatePresence initial={false}>
            {(isLogin || isRegister) && (
              <motion.div
                key="auth-tab-switcher-wrapper"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
                className="overflow-hidden shrink-0"
              >
                <AuthTabSwitcher
                  authMode={authMode as 'LOGIN' | 'REGISTER'}
                  onSelectMode={(mode) => toggleMode(mode)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, x: isLogin || isForgot ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin || isForgot ? 10 : -10 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
              >
                {/* Headers */}
                {!forgotForm.showForgotConfirm && !forgotForm.resetSent && (
                  <div className="mb-6 text-center md:text-left">
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl font-bold mb-2 text-slate-800"
                    >
                      {isLogin
                        ? 'ยินดีต้อนรับกลับ! 👋'
                        : isRegister
                        ? registerForm.onboardingMode === 'CREATE_TRIAL'
                          ? 'เปิดตัวสตูดิโอใหม่ ✨'
                          : 'สร้างบัญชีใหม่ ✨'
                        : isForgot
                        ? 'กู้คืนรหัสผ่าน 🛡️'
                        : 'ตั้งรหัสผ่านใหม่ 🔒'}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-slate-500 font-bold text-sm"
                    >
                      {isLogin
                        ? 'กรอกข้อมูลเพื่อเข้าสู่ระบบจัดการงาน'
                        : isRegister
                        ? registerForm.onboardingMode === 'CREATE_TRIAL'
                          ? 'สร้างพื้นที่ทำงานระดับ PRO ฟรี 7 วัน พร้อมเริ่มงานได้ทันที'
                          : 'กรอกข้อมูลตำแหน่งงานเพื่อเข้าร่วมทีมครีเอเตอร์ของคุณ'
                        : isForgot
                        ? 'กรอกอีเมลเพื่อรับลิงก์สำหรับเปลี่ยนรหัสผ่าน'
                        : 'กรุณากรอกรหัสผ่านใหม่ที่ต้องการใช้งาน'}
                    </motion.p>
                  </div>
                )}

                {/* Error Notifications container */}
                {activeError && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-100 flex items-start gap-3 text-red-500 shadow-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="font-bold text-sm">{activeError}</span>
                  </div>
                )}

                {/* Demo Sandbox Intent Banner */}
                {hasDemoIntentFlag() && (isLogin || isRegister) && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-900 text-white border border-indigo-400/30 flex items-start gap-3 shadow-md">
                    <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-indigo-300" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">
                        โหมดทดลองเล่นระบบจริง (ฟรี 10 นาที / 1 บัญชี)
                      </p>
                      <p className="text-[11px] font-medium text-indigo-200 mt-0.5 leading-relaxed">
                        เข้าสู่ระบบด้วย Google, Facebook หรือบัญชีเว็บไซต์เพื่อเข้าสู่โหมด Sandbox ทันที (นับเวลาเฉพาะตอนเปิดหน้าเว็บเล่นอยู่)
                      </p>
                    </div>
                  </div>
                )}

                {/* Onboarding Code Detected Banner in Login Mode */}
                {isLogin && registerForm.onboardingCode && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 flex items-center justify-between gap-3 shadow-sm">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-indigo-900">
                        ตรวจพบรหัสองค์กร: <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-indigo-700">{registerForm.onboardingCode}</span>
                      </p>
                      <p className="text-[11px] font-semibold text-indigo-600/90 mt-0.5">
                        เข้าสู่ระบบด้วยบัญชีเดิม หรือสลับไปแท็บสมัครสมาชิกเพื่อใช้รหัสนี้ทันที
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleMode('REGISTER')}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      ไปหน้าสมัคร
                    </button>
                  </div>
                )}

                {/* Rendering corresponding active sub-forms */}
                {isLogin ? (
                  <LoginForm
                    username={loginForm.username}
                    setUsername={loginForm.setUsername}
                    password={loginForm.password}
                    setPassword={loginForm.setPassword}
                    showPassword={loginForm.showPassword}
                    setShowPassword={loginForm.setShowPassword}
                    isLoading={loginForm.isLoading}
                    onSubmit={loginForm.handleLoginSubmit}
                    onForgotPasswordClick={() => toggleMode('FORGOT')}
                    onGoogleSignIn={loginForm.handleGoogleSignIn}
                    onFacebookSignIn={loginForm.handleFacebookSignIn}
                  />
                ) : isRegister ? (
                  <RegisterForm
                    email={registerForm.email}
                    setEmail={registerForm.setEmail}
                    username={registerForm.username}
                    setUsername={registerForm.setUsername}
                    password={registerForm.password}
                    setPassword={registerForm.setPassword}
                    showPassword={registerForm.showPassword}
                    setShowPassword={registerForm.setShowPassword}
                    name={registerForm.name}
                    setName={registerForm.setName}
                    firstName={registerForm.firstName}
                    setFirstName={registerForm.setFirstName}
                    lastName={registerForm.lastName}
                    setLastName={registerForm.setLastName}
                    position={registerForm.position}
                    setPosition={registerForm.setPosition}
                    employmentType={registerForm.employmentType}
                    setEmploymentType={registerForm.setEmploymentType}
                    phone={registerForm.phone}
                    setPhone={registerForm.setPhone}
                    reason={registerForm.reason}
                    setReason={registerForm.setReason}
                    positions={registerForm.positions}
                    companyId={registerForm.companyId}
                    setCompanyId={registerForm.setCompanyId}
                    companies={registerForm.companies}
                    onboardingCode={registerForm.onboardingCode}
                    setOnboardingCode={registerForm.setOnboardingCode}
                    onboardingMode={registerForm.onboardingMode}
                    setOnboardingMode={registerForm.setOnboardingMode}
                    newOrgName={registerForm.newOrgName}
                    setNewOrgName={registerForm.setNewOrgName}
                    codeVerificationStatus={registerForm.codeVerificationStatus}
                    verifiedOrgInfo={registerForm.verifiedOrgInfo}
                    avatarPreview={registerForm.avatarPreview}
                    isConvertingImg={registerForm.isConvertingImg}
                    fileInputRef={registerForm.fileInputRef}
                    handleFileChange={registerForm.handleFileChange}
                    isLoading={registerForm.isLoading}
                    onSubmit={registerForm.handleRegisterSubmit}
                    selectedEmoji={registerForm.selectedEmoji}
                    setSelectedEmoji={registerForm.setSelectedEmoji}
                    takenEmojis={registerForm.takenEmojis}
                  />
                ) : isForgot ? (
                  <ForgotPasswordForm
                    email={forgotForm.email}
                    setEmail={forgotForm.setEmail}
                    isLoading={forgotForm.isLoading}
                    resetSent={forgotForm.resetSent}
                    showForgotConfirm={forgotForm.showForgotConfirm}
                    setShowForgotConfirm={forgotForm.setShowForgotConfirm}
                    onSubmitEmail={forgotForm.handleForgotSubmitEmail}
                    onSendReset={forgotForm.handleSendResetEmail}
                    onBackToLogin={() => toggleMode('LOGIN')}
                  />
                ) : (
                  <UpdatePasswordForm
                    password={updatePasswordForm.password}
                    setPassword={updatePasswordForm.setPassword}
                    confirmPassword={updatePasswordForm.confirmPassword}
                    setConfirmPassword={updatePasswordForm.setConfirmPassword}
                    showPassword={updatePasswordForm.showPassword}
                    setShowPassword={updatePasswordForm.setShowPassword}
                    isLoading={updatePasswordForm.isLoading}
                    onSubmit={updatePasswordForm.handleUpdatePassword}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* MOBILE ONLY: Back to Home Button placed at the very bottom, below Facebook and form content */}
            {onBack && (
              <div className="sm:hidden mt-5 pt-1 pb-1">
                <button
                  type="button"
                  onClick={onBack}
                  className="group w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fff7f2] via-[#ffede4] to-[#ffe5dc] hover:from-white hover:via-[#ffede6] hover:to-[#ffdcd0] dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-900 border border-rose-200/90 dark:border-rose-400/20 shadow-[0_3px_0_0_#fba28e,0_8px_18px_rgba(251,146,60,0.18),inset_0_1.5px_1px_rgba(255,255,255,1)] active:translate-y-[2px] active:shadow-[0_1px_0_0_#ea584c,0_4px_10px_rgba(234,88,12,0.18)] flex items-center justify-center gap-2.5 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer select-none"
                  aria-label="กลับหน้าหลัก"
                  title="กลับหน้าหลัก"
                >
                  <motion.span
                    animate={{
                      rotate: [-5, 5, -5],
                      x: [-1, 1, -1],
                      y: [-0.5, 0.5, -0.5],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-7 h-7 rounded-full bg-gradient-to-b from-white via-rose-100/90 to-orange-100/90 dark:from-slate-700 dark:to-slate-800 border border-white dark:border-rose-400/30 shadow-[0_1.5px_0_0_#fba28e,0_2px_4px_rgba(251,146,60,0.18),inset_0_1px_1px_#ffffff] flex items-center justify-center text-rose-500 dark:text-rose-300 group-hover:text-rose-600 transition-all duration-150 shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 stroke-[2.5] transition-transform duration-150 group-hover:-translate-x-0.5" />
                  </motion.span>
                  <span className="font-kanit font-bold text-sm text-stone-700 dark:text-rose-100 group-hover:text-rose-600 tracking-normal transition-colors duration-150">
                    กลับหน้าหลัก
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 3D Crystal Prism & Aurora Portal Transition for Non-Session Registration */}
      <AuthPortalTransition
        mode={localPortalMode}
        isWorkspaceReady={true}
        onComplete={() => {
          setLocalPortalMode(null);
          setShowSuccessModal(true);
        }}
      />

      {/* Shared success responses modal */}
      <RegistrationSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        isUpdate={isUpdate}
      />
    </div>
  );
};

export default AuthPage;
