
import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import AuthPage from './components/AuthPage';
import AppRouter from './routes/AppRouter';
import PublicScriptViewer from './components/public/PublicScriptViewer';
import { TaskProvider } from './context/TaskContext';
import { GameConfigProvider } from './context/GameConfigContext';
import { MasterDataProvider } from './context/MasterDataContext';
import { GoogleDriveProvider } from './context/GoogleDriveContext';
import { WorkboxProvider } from './context/WorkboxContext';
import { useAuth } from './hooks/useAuth';
import { GlobalRealtimeSync } from './components/GlobalRealtimeSync';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedApp user={session.user} />
    </QueryClientProvider>
  );
}

function AuthenticatedApp({ user }: { user: any }) {
  const { currentUserProfile } = useAuth(user);

  return (
    <GoogleDriveProvider>
      <MasterDataProvider>
        <WorkboxProvider currentUser={currentUserProfile}>
          <GameConfigProvider>
            <TaskProvider>
              <GlobalRealtimeSync />
              <AppRouter user={user} />
            </TaskProvider>
          </GameConfigProvider>
        </WorkboxProvider>
      </MasterDataProvider>
    </GoogleDriveProvider>
  );
}

export default App;
