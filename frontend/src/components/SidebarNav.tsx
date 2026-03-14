import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import type { Locale, ThemeMode } from '@/stores/appStore';
import './SidebarNav.less';

interface SidebarNavProps {
  selectedKey: string;
  onNavigate: (key: string) => void;
  onLogout?: () => void;
}

const themeOrder: ThemeMode[] = ['light', 'dark', 'system'];

export default function SidebarNav({ selectedKey, onNavigate, onLogout }: SidebarNavProps) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    const next = themeOrder[(idx + 1) % themeOrder.length]!;
    setTheme(next);
  };

  const toggleLang = () => {
    const next: Locale = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
    setLocale(next);
    i18n.changeLanguage(next);
  };

  const navItems = [
    {
      key: '/dashboard',
      label: t('nav.dashboard'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      key: '/projects',
      label: t('nav.projects'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  const accountItems = [
    {
      key: '/settings',
      label: t('nav.settings'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const getInitials = (name: string): string => {
    const parts = name.split(/[\s@]+/);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-nav__logo">
        <div className="sidebar-nav__logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8l6 6" />
            <path d="M4 14l6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="M14 18l4-4 4 4" />
            <path d="M14 22h8" />
          </svg>
        </div>
        <span className="sidebar-nav__logo-text">{t('app.name')}</span>
      </div>

      <nav className="sidebar-nav__nav">
        <div className="sidebar-nav__section-label">Main</div>
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav__item${selectedKey === item.key || (item.key === '/projects' && selectedKey.startsWith('/projects')) ? ' sidebar-nav__item--active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        <div className="sidebar-nav__divider" />
        <div className="sidebar-nav__section-label">Account</div>
        {accountItems.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav__item${selectedKey === item.key ? ' sidebar-nav__item--active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

      </nav>

      <div className="sidebar-nav__quick-toggles">
        <button
          className="sidebar-nav__quick-toggle-btn"
          onClick={cycleTheme}
          title={`Theme: ${theme}`}
          aria-label={`Switch theme, current: ${theme}`}
        >
          {theme === 'light' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
          {theme === 'dark' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          {theme === 'system' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          )}
        </button>
        <button
          className="sidebar-nav__quick-toggle-btn"
          onClick={toggleLang}
          title={locale === 'zh-CN' ? 'Switch to English' : '切换到中文'}
          aria-label={locale === 'zh-CN' ? 'Switch to English' : '切换到中文'}
        >
          <span className="sidebar-nav__quick-toggle-label">
            {locale === 'zh-CN' ? 'EN' : '中'}
          </span>
        </button>
      </div>

      {user && (
        <div className="sidebar-nav__user">
          <div className="sidebar-nav__user-avatar">
            {getInitials(user.username)}
          </div>
          <div className="sidebar-nav__user-info">
            <div className="sidebar-nav__user-name">{user.username}</div>
            <div className="sidebar-nav__user-email">{user.email}</div>
          </div>
          {onLogout && (
            <button
              className="sidebar-nav__user-logout"
              title={t('nav.logout')}
              onClick={onLogout}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
