
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
