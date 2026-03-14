import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import type { Locale, ThemeMode } from '@/stores/appStore';
import './AuthLayout.less';

const themeOrder: ThemeMode[] = ['light', 'dark', 'system'];

export default function AuthLayout() {
  const { i18n } = useTranslation();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const toggleLang = () => {
    const next: Locale = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
    setLocale(next);
    i18n.changeLanguage(next);
  };

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    const next = themeOrder[(idx + 1) % themeOrder.length]!;
    setTheme(next);
  };

  return (
    <div className="auth-layout">
      {/* Left Column: Form */}
      <div className="auth-layout__left">
        <div className="auth-layout__toggle-bar">
          <button
            className="auth-layout__toggle-btn"
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            aria-label={`Switch theme, current: ${theme}`}
          >
            {theme === 'light' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {theme === 'system' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            )}
          </button>
          <button
            className="auth-layout__toggle-btn"
            onClick={toggleLang}
            title={locale === 'zh-CN' ? 'Switch to English' : '切换到中文'}
            aria-label={locale === 'zh-CN' ? 'Switch to English' : '切换到中文'}
          >
            <span className="auth-layout__toggle-label">
              {locale === 'zh-CN' ? 'EN' : '中'}
            </span>
          </button>
        </div>
        <div className="auth-layout__left-inner">
          <Outlet />
        </div>
      </div>

      {/* Right Column: Decorative */}
      <div className="auth-layout__right">
        <div className="auth-layout__deco-circle auth-layout__deco-circle--1" />
        <div className="auth-layout__deco-circle auth-layout__deco-circle--2" />
        <div className="auth-layout__deco-circle auth-layout__deco-circle--3" />

        {/* Product Preview Mockup */}
        <div className="auth-layout__preview">
          <div className="auth-layout__preview-header">
            <span className="auth-layout__preview-dot auth-layout__preview-dot--1" />
            <span className="auth-layout__preview-dot auth-layout__preview-dot--2" />
            <span className="auth-layout__preview-dot auth-layout__preview-dot--3" />
            <div className="auth-layout__preview-title-bar" />
          </div>

          <div className="auth-layout__preview-content">
            <div className="auth-layout__preview-source">
              <div className="auth-layout__preview-label">English</div>
              <div className="auth-layout__preview-line" style={{ width: '100%' }} />
              <div className="auth-layout__preview-line" style={{ width: '85%' }} />
              <div className="auth-layout__preview-line" style={{ width: '92%' }} />
              <div className="auth-layout__preview-line" style={{ width: '70%' }} />
            </div>

            <div className="auth-layout__preview-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>

            <div className="auth-layout__preview-target">
              <div className="auth-layout__preview-label">Chinese</div>
              <div className="auth-layout__preview-line" style={{ width: '90%' }} />
              <div className="auth-layout__preview-line" style={{ width: '100%' }} />
              <div className="auth-layout__preview-line" style={{ width: '78%' }} />
              <div className="auth-layout__preview-line" style={{ width: '88%' }} />
            </div>
          </div>

          <div className="auth-layout__preview-badge">
            <span className="auth-layout__preview-badge-dot" />
            Translating... 80%
          </div>
        </div>
      </div>
    </div>
  );
}
