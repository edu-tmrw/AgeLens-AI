import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { ImageGenerator } from './components/ImageGenerator';
import { LandingPage } from './components/LandingPage';
import { User, ViewState, HistoryItem } from './types';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  // Default to landing page
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    // Check active session on load
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          mapSessionToUser(session.user);
          // If logged in, go straight to dashboard
          setCurrentView('dashboard');
        } else {
          // If not logged in, ensure we are on landing (or login/register if url logic existed)
          setCurrentView('landing');
        }
      } catch (err) {
        console.error("Erro ao verificar sessão:", err);
      } finally {
        setIsLoadingSession(false);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        mapSessionToUser(session.user);
        // Only switch to dashboard if we are currently on public pages
        if (['landing', 'login', 'register'].includes(currentView)) {
             setCurrentView('dashboard');
        }
      } else {
        setUser(null);
        if (_event === 'SIGNED_OUT') {
            setCurrentView('landing');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); 

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
    setCurrentView('landing');
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
      return <div className="flex-1 flex items-center justify-center text-slate-500 min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
           <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           <span>Carregando...</span>
        </div>
      </div>;
    }

    switch (currentView) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
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
            user={user}
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
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  // Determine main container theme based on view
  const isLightMode = currentView === 'landing';
  const themeClasses = isLightMode 
    ? "bg-white text-slate-900" 
    : "bg-slate-900 text-slate-100";

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${themeClasses}`}>
      <Header 
        user={user} 
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col">
        {renderView()}
      </main>

      {/* Footer is only shown on app pages, Landing has its own specific sections/footer area usually, 
          but here we share a simple footer or hide it for Landing if it has its own */}
      {!isLightMode && (
        <footer className="py-6 text-center text-slate-600 text-sm border-t border-slate-800 mt-auto">
          <p>© {new Date().getFullYear()} AgeLens AI. Construído com Google Gemini.</p>
        </footer>
      )}
      
      {/* Landing Page specific minimal footer */}
      {isLightMode && (
         <footer className="py-8 bg-slate-900 text-slate-400 text-sm text-center">
            <p>© {new Date().getFullYear()} AgeLens AI. Todos os direitos reservados.</p>
         </footer>
      )}
    </div>
  );
};

export default App;