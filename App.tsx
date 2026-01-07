import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { ImageGenerator } from './components/ImageGenerator';
import { User, ViewState, HistoryItem } from './types';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    // Check active session on load
    const initSession = async () => {
      try {
        // Standard V2: getSession returns { data: { session }, error }
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          mapSessionToUser(session.user);
          setCurrentView('dashboard');
        }
      } catch (err) {
        console.error("Erro ao verificar sessão:", err);
      } finally {
        setIsLoadingSession(false);
      }
    };

    initSession();

    // Listen for changes - Standard V2 syntax
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        mapSessionToUser(session.user);
        // Only switch to dashboard if we are currently on login/register pages
        // This prevents redirecting away if the user refreshes on 'generator' view (though simplistic)
        if (currentView === 'login' || currentView === 'register') {
             setCurrentView('dashboard');
        }
      } else {
        setUser(null);
        if (_event === 'SIGNED_OUT') {
            setCurrentView('login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Remove dependencies to avoid re-subscribing unnecessarily

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
    await supabase.auth.signOut();
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
    setCurrentView('dashboard');
  };

  const renderView = () => {
    if (isLoadingSession) {
      return <div className="flex-1 flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-2">
           <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           <span>Carregando...</span>
        </div>
      </div>;
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