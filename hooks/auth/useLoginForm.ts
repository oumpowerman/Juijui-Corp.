import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { stageAuthPortalTransition, triggerAuthPortalTransition, consumeAuthPortalTransition } from '../../components/auth/AuthPortalTransition';

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

  // References for OAuth Popup tracking and safety timers
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<any>(null);
  const safetyTimerRef = useRef<any>(null);

  const clearOAuthWatchers = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    popupRef.current = null;
  }, []);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg(null);
  };

  // Handle OAuth Popup Callback payload (from postMessage or localStorage fallback)
  const processOAuthPopupCallback = useCallback(
    async (payload: { hash?: string; search?: string; type?: string; error?: string; errorDescription?: string }) => {
      clearOAuthWatchers();

      try {
        if (payload.type === 'SUPABASE_OAUTH_CANCELLED' || payload.error === 'access_denied') {
          consumeAuthPortalTransition();
          setIsLoading(false);
          setErrorMsg('ยกเลิกการเข้าสู่ระบบแล้ว');
          return;
        }

        const hashParams = new URLSearchParams((payload.hash || '').replace(/^#/, ''));
        const searchParams = new URLSearchParams((payload.search || '').replace(/^\?/, ''));

        const errorDescription =
          payload.errorDescription ||
          hashParams.get('error_description') ||
          searchParams.get('error_description') ||
          payload.error ||
          hashParams.get('error') ||
          searchParams.get('error');

        if (errorDescription) {
          throw new Error(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = searchParams.get('code');

        if (accessToken && refreshToken) {
          triggerAuthPortalTransition('LOGIN');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          onLoginSuccess();
        } else if (code) {
          triggerAuthPortalTransition('LOGIN');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          onLoginSuccess();
        } else {
          consumeAuthPortalTransition();
          setIsLoading(false);
        }
      } catch (err: any) {
        consumeAuthPortalTransition();
        const msg = err.message || 'ไม่สามารถยืนยันตัวตนจากหน้าต่าง Popup ได้';
        setErrorMsg(msg);
        onError?.(msg);
        setIsLoading(false);
      }
    },
    [clearOAuthWatchers, onLoginSuccess, onError]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === 'SUPABASE_OAUTH_CALLBACK' ||
        event.data?.type === 'SUPABASE_OAUTH_CANCELLED' ||
        event.data?.type === 'SUPABASE_OAUTH_ERROR'
      ) {
        processOAuthPopupCallback(event.data);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'SUPABASE_OAUTH_POPUP_RESULT' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          localStorage.removeItem('SUPABASE_OAUTH_POPUP_RESULT');
          if (
            parsed?.type === 'SUPABASE_OAUTH_CALLBACK' ||
            parsed?.type === 'SUPABASE_OAUTH_CANCELLED' ||
            parsed?.type === 'SUPABASE_OAUTH_ERROR'
          ) {
            processOAuthPopupCallback(parsed);
          }
        } catch {
          // ignore invalid JSON
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      clearOAuthWatchers();
    };
  }, [processOAuthPopupCallback, clearOAuthWatchers]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const cleanUsername = username.toLowerCase().trim();
      if (!cleanUsername) {
        throw new Error('กรุณากรอกชื่อผู้ใช้หรืออีเมลด้วยนะครับ');
      }

      let loginEmail = '';

      if (cleanUsername.includes('@')) {
        loginEmail = cleanUsername;
      } else {
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

        loginEmail = profile.email
          ? profile.email
          : `${cleanUsername}@juijui-app.com`;
      }

      // Pre-stage portal transition mode in sessionStorage before signInWithPassword fires onAuthStateChange
      stageAuthPortalTransition('LOGIN');

      let { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      // If it fails and the email was our default mock domain, let's fallback to the old mock domain for backward compatibility
      if (error && !cleanUsername.includes('@')) {
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
      triggerAuthPortalTransition('LOGIN');
      onLoginSuccess();
    } catch (err: any) {
      consumeAuthPortalTransition();
      const msg = err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'facebook', providerLabel: string) => {
    clearOAuthWatchers();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const isIframe = typeof window !== 'undefined' && window.self !== window.top;

      if (isIframe) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/oauth-popup-callback`,
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;
        if (!data?.url) {
          throw new Error(`ไม่สามารถสร้างลิงก์เข้าสู่ระบบ ${providerLabel} ได้`);
        }

        const width = 520;
        const height = 660;
        const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
        const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

        const popup = window.open(
          data.url,
          `supabase_${provider}_oauth_popup`,
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        if (!popup) {
          throw new Error('เบราว์เซอร์บล็อกหน้าต่าง Popup กรุณาอนุญาตให้เปิด Popup สำหรับเว็บไซต์นี้');
        }

        popupRef.current = popup;

        // Poll every 500ms to detect if user manually closes the popup window
        pollTimerRef.current = setInterval(() => {
          if (!popupRef.current || popupRef.current.closed) {
            clearOAuthWatchers();
            consumeAuthPortalTransition();
            setIsLoading(false);
          }
        }, 500);

        // Safety timeout after 90 seconds
        safetyTimerRef.current = setTimeout(() => {
          clearOAuthWatchers();
          consumeAuthPortalTransition();
          setIsLoading(false);
        }, 90000);
      } else {
        stageAuthPortalTransition('LOGIN');
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
      }
    } catch (err: any) {
      clearOAuthWatchers();
      consumeAuthPortalTransition();
      const msg = err.message || `ระบบเกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน ${providerLabel}`;
      setErrorMsg(msg);
      onError?.(msg);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await handleOAuthSignIn('google', 'Google');
  };

  const handleFacebookSignIn = async () => {
    await handleOAuthSignIn('facebook', 'Facebook');
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
    handleFacebookSignIn,
  };
}

export default useLoginForm;

