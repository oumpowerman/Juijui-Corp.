import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface UseForgotPasswordFormOptions {
  onError?: (msg: string) => void;
}

export function useForgotPasswordForm(options?: UseForgotPasswordFormOptions) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetState = () => {
    setEmail('');
    setIsLoading(false);
    setResetSent(false);
    setShowForgotConfirm(false);
    setErrorMsg(null);
  };

  const handleForgotSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setShowForgotConfirm(true);
  };

  const handleSendResetEmail = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      const msg = err.message || 'ไม่สามารถส่งลิงก์กู้คืนได้ ลองใหม่อีกครั้ง';
      setErrorMsg(msg);
      setShowForgotConfirm(false);
      options?.onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    isLoading,
    resetSent,
    showForgotConfirm,
    setShowForgotConfirm,
    errorMsg,
    setErrorMsg,
    resetState,
    handleForgotSubmitEmail,
    handleSendResetEmail,
  };
}

export default useForgotPasswordForm;
