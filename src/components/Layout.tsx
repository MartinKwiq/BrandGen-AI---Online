import { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: ReactNode;
  theme?: 'light' | 'dark';
}

export function Layout({ children, theme = 'light' }: LayoutProps) {
  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
    )}>
      {children}
    </div>
  );
}

interface SidebarProps {
  children: ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  onNewProject: () => void;
  theme?: 'light' | 'dark';
}

export function Sidebar({ children, activeView, onViewChange, onNewProject, theme = 'light' }: SidebarProps) {
  const isDark = theme === 'dark';
  
  const navItems = [
    { id: 'projects', label: 'Proyectos', icon: '📁' },
    { id: 'new', label: 'Nuevo', icon: '➕', action: onNewProject },
    { id: 'settings', label: 'Ajustes', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={cn(
        "w-64 border-r flex flex-col transition-colors duration-300",
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      )}>
        {/* Logo */}
        <div className={cn(
          "px-6 py-5 border-b",
          isDark ? 'border-slate-700' : 'border-slate-200'
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <div>
              <h1 className={cn("font-bold", isDark ? 'text-white' : 'text-slate-900')}>BrandGen</h1>
              <p className="text-xs text-slate-500">AI Branding</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.action ? item.action() : onViewChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                activeView === item.id
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : isDark 
                    ? 'text-slate-300 hover:bg-slate-700' 
                    : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn(
          "p-4 border-t",
          isDark ? 'border-slate-700' : 'border-slate-200'
        )}>
          <div className={cn(
            "rounded-xl p-4",
            isDark ? 'bg-slate-700' : 'bg-gradient-to-r from-violet-50 to-indigo-50'
          )}>
            <p className={cn("text-sm font-medium", isDark ? 'text-white' : 'text-slate-900')}>¿Necesitas ayuda?</p>
            <p className="text-xs text-slate-500 mt-1">Consulta la documentación</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  theme?: 'light' | 'dark';
}

export function Header({ title, subtitle, actions, theme = 'light' }: HeaderProps) {
  const isDark = theme === 'dark';
  
  return (
    <header className={cn(
      "px-8 py-6 border-b transition-colors duration-300",
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-2xl font-bold", isDark ? 'text-white' : 'text-slate-900')}>{title}</h1>
          {subtitle && <p className={cn("mt-1", isDark ? 'text-slate-400' : 'text-slate-500')}>{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
