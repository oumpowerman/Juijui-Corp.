import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface UseLoginFormOptions {
  onLoginSuccess: () => void;
  onError?: (msg: string) => void;
}

export function useLoginForm({ onLoginSuccess, onError }: UseLoginFormOptions) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const cleanUsername = username.toLowerCase().trim();
      if (!cleanUsername) {
        throw new Error('กรุณากรอกชื่อผู้ใช้ด้วยนะครับ');
      }

      // ค้นหาโปรไฟล์ในตาราง profiles ด้วยเงื่อนไข username
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profile) {
        throw new Error('ไม่พบชื่อผู้ใช้นี้ในระบบนะครับ');
      }

      const loginEmail = profile.email
        ? profile.email
        : `${cleanUsername}@juijui-app.com`;

      let { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      // If it fails and the email was our default mock domain, let's fallback to the old mock domain for backward compatibility
      if (error && !profile.email) {
        const fallbackEmail = `${cleanUsername}@juijui.local`;
        const { error: fallbackError } = await supabase.auth.signInWithPassword({
          email: fallbackEmail,
          password,
        });
        if (!fallbackError) {
          error = null;
        }
      }

      if (error) throw error;
      onLoginSuccess();
    } catch (err: any) {
      const msg = err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      const msg = err.message || 'ระบบเกิดข้อผิดพลาดในการกู้คืนผ่านระบบ Google';
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    errorMsg,
    setErrorMsg,
    resetForm,
    handleLoginSubmit,
    handleGoogleSignIn,
  };
}

export default useLoginForm;
