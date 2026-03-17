
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthPage from './components/AuthPage';
import AppRouter from './routes/AppRouter';
import PublicScriptViewer from './components/public/PublicScriptViewer';
import { TaskProvider } from './context/TaskContext';
import { GameConfigProvider } from './context/GameConfigContext'; // NEW
import { Loader2 } from 'lucide-react';

function App() {
  // --- ROUTING CHECK: Magic Link (Script Share) ---
  const path = window.location.pathname;
  if (path.startsWith('/s/')) {
      const token = path.split('/s/')[1];
      if (token) {
          return <PublicScriptViewer token={token} />;
      }
  }

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- INITIAL AUTH CHECK ---
  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- GLOBAL PWA SYNC (Optimized: Once every 24 hours) ---
  useEffect(() => {
    const syncPWAConfig = async () => {
      try {
        const lastSync = localStorage.getItem('pwa_last_sync');
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        // Skip if synced recently (within 24h) AND we already have the data
        if (lastSync && (now - parseInt(lastSync)) < ONE_DAY && localStorage.getItem('pwa_app_icon')) {
          return;
        }

        const { data } = await supabase
          .from('master_options')
          .select('key, label')
          .eq('type', 'PWA_CONFIG');

        if (data) {
          const name = data.find(i => i.key === 'APP_NAME')?.label;
          const icon = data.find(i => i.key === 'APP_ICON')?.label;

          if (name) {
            localStorage.setItem('pwa_app_name', name);
            document.title = name;
            const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
            if (metaTitle) metaTitle.setAttribute('content', name);
          }
          if (icon) {
            localStorage.setItem('pwa_app_icon', icon);
            const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
            if (appleIcon) appleIcon.setAttribute('href', icon);
          }
          
          // Mark as synced
          localStorage.setItem('pwa_last_sync', now.toString());
        }
      } catch (e) {
        console.warn("PWA Sync failed:", e);
      }
    };
    syncPWAConfig();
  }, []);

  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center bg-slate-50 flex-col">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        </div>
     );
  }

  if (!session) {
    return <AuthPage onLoginSuccess={() => window.location.reload()} />;
  }

  // Wrap authenticated app in Providers
  return (
    <GameConfigProvider>
      <TaskProvider>
        <AppRouter user={session.user} />
      </TaskProvider>
    </GameConfigProvider>
  );
}

export default App;
