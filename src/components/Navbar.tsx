import React from 'react';
import { CheckSquare, BarChart2, Calendar, LogOut, Tag, Network } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  activeTab: 'tasks' | 'analytics' | 'calendar' | 'admin' | 'mindmap';
  setActiveTab: (tab: 'tasks' | 'analytics' | 'calendar' | 'admin' | 'mindmap') => void;
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, user, onLogout }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-sky-400 text-white shadow-md shadow-brand-500/20">
            <CheckSquare className="h-6 w-6 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            Priorize<span className="text-brand-500">.</span>
          </span>
        </div>

        {/* Menu Principal (Tabs) */}
        <nav className="flex space-x-1 rounded-xl bg-slate-100/80 p-1">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === 'tasks'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tarefas</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Análises</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === 'calendar'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendário</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === 'admin'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Categorias</span>
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === 'mindmap'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">Mapa Mental</span>
          </button>
        </nav>

        {/* Perfil & Logout */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* Avatar com Iniciais */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 border border-brand-100">
                {getInitials(user.name)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-700">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>
            </div>
            {/* Botão Sair */}
            <button
              onClick={onLogout}
              title="Sair do aplicativo"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-100 hover:border-rose-100 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
