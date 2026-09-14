import type { ReactNode } from 'react';
import type { NavItem } from '../../app/App';
import { IconButton } from '../ui/IconButton';
import { ThemeToggle } from '../ui/ThemeToggle';

type AppShellProps = {
  navItems: NavItem[];
  activePage: string;
  currentPage: NavItem;
  onNavigate: (pageId: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (value: boolean) => void;
  userName: string;
  children: ReactNode;
};

export function AppShell({
  navItems,
  activePage,
  currentPage,
  onNavigate,
  theme,
  onToggleTheme,
  mobileOpen,
  onMobileOpenChange,
  userName,
  children,
}: AppShellProps) {
  return (
    <div className={`app-shell ${theme}`}>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} aria-label="Sidebar navigation">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <p className="brand-kicker">Learning platform</p>
            <h2>SmartStudy AI</h2>
          </div>
        </div>

        <nav aria-label="Main navigation">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  aria-current={activePage === item.id ? 'page' : undefined}
                >
                  <span className="nav-bullet" aria-hidden="true" />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar" aria-label="Top navigation">
          <div className="topbar-left">
            <IconButton
              label="Open navigation"
              className="mobile-menu-button"
              onClick={() => onMobileOpenChange(!mobileOpen)}
              aria-expanded={mobileOpen}
            >
              ☰
            </IconButton>
            <div>
              <p className="eyebrow">{currentPage.label}</p>
              <h1>SmartStudy AI</h1>
            </div>
          </div>

          <div className="topbar-right">
            <span className="welcome-text">Welcome back, {userName}</span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <div className="user-pill" aria-label="Current user">
              {userName}
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
