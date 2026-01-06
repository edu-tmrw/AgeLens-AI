import React from 'react';
import { Clock, LayoutDashboard, PlusCircle, LogOut, User as UserIcon } from 'lucide-react';
import { User, ViewState } from '../types';

interface HeaderProps {
  user: User | null;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, currentView, onNavigate, onLogout }) => {
  return (
    <header className="w-full py-4 px-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer" 
          onClick={() => user ? onNavigate('dashboard') : onNavigate('login')}
        >
          <div className="bg-indigo-500/10 p-2 rounded-lg">
            <Clock className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              AgeLens AI
            </h1>
          </div>
        </div>

        {user && (
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
        )}
      </div>
    </header>
  );
};