
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

  // --- GLOBAL PWA SYNC (Optimized: Background sync on every load) ---
  useEffect(() => {
    const syncPWAConfig = async () => {
      try {
        const { data } = await supabase
          .from('master_options')
          .select('key, label')
          .eq('type', 'PWA_CONFIG');

        if (data) {
          const name = data.find(i => i.key === 'APP_NAME')?.label;
          const icon = data.find(i => i.key === 'APP_ICON')?.label;

          const currentName = localStorage.getItem('pwa_app_name');
          const currentIcon = localStorage.getItem('pwa_app_icon');

          let changed = false;

          if (name && name !== currentName) {
            localStorage.setItem('pwa_app_name', name);
            changed = true;
          }
          if (icon && icon !== currentIcon) {
            localStorage.setItem('pwa_app_icon', icon);
            changed = true;
          }
          
          // If config changed, we might need a reload to refresh the dynamic manifest in index.html
          // but we do it gently or just update DOM for now
          if (changed) {
            console.log("PWA Config updated, applying changes...");
            if (name) document.title = name;
            if (icon) {
                const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
                if (appleIcon) appleIcon.setAttribute('href', icon);
            }
          }
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
