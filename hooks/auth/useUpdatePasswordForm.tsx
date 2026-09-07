import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface UseUpdatePasswordFormOptions {
  onSuccess: () => void;
  onError?: (msg: string) => void;
}

export function useUpdatePasswordForm(options?: UseUpdatePasswordFormOptions) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setErrorMsg(null);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (password !== confirmPassword) {
        throw new Error('รหัสผ่านไม่ตรงกัน');
      }
      if (password.length < 6) {
        throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      }
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      if (error) throw error;
      options?.onSuccess();
    } catch (err: any) {
      const msg = err.message || 'ไม่สามารถอัปเดตรหัสผ่านใหม่ได้';
      setErrorMsg(msg);
      options?.onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isLoading,
    errorMsg,
    setErrorMsg,
    resetForm,
    handleUpdatePassword,
  };
}

export default useUpdatePasswordForm;
