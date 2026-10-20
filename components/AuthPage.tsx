import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
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
}

const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onBack,
  initialMode,
  onPasswordUpdateSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE'>(
    initialMode || 'LOGIN'
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    onRegisterSuccess: () => setShowSuccessModal(true),
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
      ? 'shadow-[0_45px_100px_-25px_rgba(244,63,94,0.18),0_20px_45px_-15px_rgba(0,0,0,0.05),0_0_80px_rgba(244,63,94,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]'
      : 'shadow-[0_45px_100px_-25px_rgba(168,85,247,0.18),0_20px_45px_-15px_rgba(0,0,0,0.05),0_0_80px_rgba(168,85,247,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]';

  return (
    <div className="min-h-[100dvh] md:h-[100dvh] flex items-center justify-center p-4 md:p-6 font-sans relative overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:overflow-hidden perspective-1000">
      {/* Dynamic Crop Overlay */}
      {registerForm.cropImageSrc && (
        <ImageCropper
          imageSrc={registerForm.cropImageSrc}
          onCropComplete={registerForm.handleCropComplete}
          onCancel={() => registerForm.setCropImageSrc(null)}
        />
      )}

      {/* Premium Fluid Aura Background Component */}
      <AuthDynamicBackground authMode={authMode} />

      {/* Outer Glow Wrapper */}
      <motion.div
        className={`relative w-full max-w-5xl bg-white/40 backdrop-blur-3xl rounded-[2.6rem] p-[1px] border border-white/70 transition-all duration-700 h-full max-h-[92dvh] md:h-[min(780px,88dvh)] my-auto flex flex-col md:flex-row overflow-hidden ${dynamicShadow}`}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/75 transition-all active:scale-95 shadow-sm"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> กลับหน้าหลัก
          </button>
        )}

        {/* Left branding animated panel */}
        <BrandSection authMode={authMode} />

        {/* Right input forms handler */}
        <div className="w-full md:w-7/12 p-6 md:p-12 flex flex-col flex-1 relative overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden z-10 bg-white/75 rounded-r-[2.5rem] rounded-l-[2.5rem] md:rounded-l-none">
          {(isLogin || isRegister) && (
            <AuthTabSwitcher
              authMode={authMode as 'LOGIN' | 'REGISTER'}
              onSelectMode={(mode) => toggleMode(mode)}
            />
          )}

          <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, x: isLogin || isForgot ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin || isForgot ? 10 : -10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
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
                        ? 'สร้างบัญชีใหม่ ✨'
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
                        ? 'กรอกข้อมูลตำแหน่งงานเพื่อเข้าร่วมทีม'
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
          </div>
        </div>
      </motion.div>

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
