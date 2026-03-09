import { ReactNode } from 'react';
import { cn } from '../utils/cn';
import { useTranslation } from '../hooks/useTranslation';

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
  const { t } = useTranslation();

  const navItems = [
    { id: 'projects', label: t('sidebar', 'projects'), icon: '📁' },
    { id: 'new', label: t('sidebar', 'new'), icon: '➕', action: onNewProject },
    { id: 'settings', label: t('sidebar', 'settings'), icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={cn(
        "w-64 border-r flex flex-col transition-colors duration-300 shadow-xl z-20",
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-gradient-to-b from-[#00df9a] to-[#00b894] border-transparent'
      )}>
        {/* Logo */}
        <div className={cn(
          "px-6 py-5 border-b",
          isDark ? 'border-slate-700' : 'border-slate-200'
        )}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/kwiq-logo.png" alt="Kwiq Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className={cn("font-bold text-xl tracking-tight", isDark ? 'text-white' : 'text-white')}>Kwiq</h1>
              <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold">Branding Suite</p>
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
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                activeView === item.id
                  ? 'bg-[#ff57b7] text-white font-bold shadow-lg shadow-[#ff57b7]/20 ring-1 ring-white/20'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-700'
                    : 'text-white/80 hover:bg-[#ff57b7]/20 hover:text-white'
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
            isDark ? 'bg-slate-700' : 'bg-white/10 dark:bg-black/20 backdrop-blur-sm'
          )}>
            <p className={cn("text-sm font-medium", isDark ? 'text-white' : 'text-slate-900')}>{t('sidebar', 'help')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('sidebar', 'docs')}</p>
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
