import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { ImageGenerator } from './components/ImageGenerator';
import { User, ViewState, HistoryItem } from './types';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    // If credentials are missing, don't try to fetch session to avoid network errors
    if (!isSupabaseConfigured) {
      console.log('Supabase credentials missing, skipping session check.');
      setIsLoadingSession(false);
      return;
    }

    // Check active session on load
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          mapSessionToUser(session.user);
          setCurrentView('dashboard');
        }
      } catch (err) {
        console.warn("Could not check session (offline or unconfigured):", err);
        // We don't block the app, just assume logged out
      } finally {
        setIsLoadingSession(false);
      }
    };

    checkSession();

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        mapSessionToUser(session.user);
        // Note: currentView in this closure will be the initial value, which is fine
        // as we generally want to redirect to dashboard upon login from any auth screen
        setCurrentView('dashboard');
      } else {
        setUser(null);
        // Only redirect to login if we lose session, but don't force it 
        // if the user is explicitly navigating between auth screens locally
        // However, checking stale state is hard. 
        // Since this callback fires on SIGN_OUT, we force login.
        // On initial load without session, we also force login (which is default).
        if (_event === 'SIGNED_OUT') {
            setCurrentView('login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Dependency array empty to run only once on mount

  const mapSessionToUser = (authUser: any) => {
    setUser({
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
      avatar: authUser.user_metadata?.avatar_url
    });
  };

  const handleLogin = () => {
    // handled by auth listener
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setCurrentView('login');
  };

  const handleNavigate = (view: ViewState) => {
    if (!user && (view === 'dashboard' || view === 'generator')) {
      setCurrentView('login');
      return;
    }
    setCurrentView(view);
  };

  const handleSaveToGallery = (item: HistoryItem) => {
    // Navigation happens after save, forcing a refresh of dashboard data when visited
    setCurrentView('dashboard');
  };

  const renderView = () => {
    if (isLoadingSession) {
      return <div className="flex-1 flex items-center justify-center text-slate-500">Carregando...</div>;
    }

    switch (currentView) {
      case 'login':
      case 'register':
        return (
          <AuthScreen 
            view={currentView} 
            onNavigate={handleNavigate}
            onLogin={handleLogin}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={handleNavigate} 
          />
        );
      case 'generator':
        return (
          <ImageGenerator 
            onSave={handleSaveToGallery}
            userId={user?.id}
          />
        );
      default:
        return <AuthScreen view="login" onNavigate={handleNavigate} onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Header 
        user={user} 
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col">
        {renderView()}
      </main>

      <footer className="py-6 text-center text-slate-600 text-sm border-t border-slate-800 mt-auto">
        <p>© {new Date().getFullYear()} AgeLens AI. Construído com Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;