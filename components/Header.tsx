import React from 'react';
import { Clock, LayoutDashboard, PlusCircle, LogOut, User as UserIcon, LogIn } from 'lucide-react';
import { User, ViewState } from '../types';

interface HeaderProps {
  user: User | null;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, currentView, onNavigate, onLogout }) => {
  const isLanding = currentView === 'landing';
  
  // Styles based on theme (Light for Landing, Dark for App)
  const headerBg = isLanding ? 'bg-white/80 border-slate-200' : 'bg-slate-900/50 border-slate-800';
  const textColor = isLanding ? 'text-slate-900' : 'text-slate-100';
  const logoColor = isLanding ? 'text-indigo-600' : 'text-indigo-400';
  const logoBg = isLanding ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400';
  const buttonHover = isLanding ? 'hover:bg-slate-100' : 'hover:bg-slate-800/50';

  return (
    <header className={`w-full py-4 px-4 border-b backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300 ${headerBg}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => user ? onNavigate('dashboard') : onNavigate('landing')}
        >
          <div className={`p-2 rounded-lg transition-colors ${logoBg}`}>
            <Clock className={`w-6 h-6`} />
          </div>
          <div>
            <h1 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${isLanding ? 'from-indigo-600 to-violet-600' : 'from-indigo-400 to-purple-400'}`}>
              AgeLens AI
            </h1>
          </div>
        </div>

        {/* Logged User Navigation */}
        {user ? (
          <div className="flex items-center gap-2 md:gap-6">
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'dashboard' 
                    ? 'bg-slate-800 text-indigo-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => onNavigate('generator')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'generator' 
                    ? 'bg-slate-800 text-indigo-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Nova Foto
              </button>
            </nav>

            <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm text-slate-200 font-medium">{user.name}</span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Public Navigation (Landing Page) */
          <div className="flex items-center">
            {currentView === 'landing' && (
              <button 
                onClick={() => onNavigate('login')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                  isLanding 
                    ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                Login
                <LogIn className="w-4 h-4" />
              </button>
            )}
            
            {(currentView === 'login' || currentView === 'register') && (
               <button 
               onClick={() => onNavigate('landing')}
               className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
             >
               Voltar ao início
             </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};