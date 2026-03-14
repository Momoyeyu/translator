import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import type { Locale, ThemeMode } from '@/stores/appStore';
import './PreferencesTab.less';

const languageOptions: { value: Locale; label: string }[] = [
  { value: 'en-US', label: 'English' },
  { value: 'zh-CN', label: '中文' },
];

const themeOptions: { value: ThemeMode; labelKey: string; icon: React.ReactNode }[] = [
  {
    value: 'light',
    labelKey: 'theme.light',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    ),
  },
  {
    value: 'dark',
    labelKey: 'theme.dark',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    value: 'system',
    labelKey: 'theme.system',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
];

export default function PreferencesTab() {
  const { t, i18n } = useTranslation();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const handleLangChange = (value: string) => {
    const next = value as Locale;
    setLocale(next);
    i18n.changeLanguage(next);
  };

  const handleThemeChange = (value: string) => {
    setTheme(value as ThemeMode);
  };

  return (
    <div className="preferences-tab">
      <div className="preferences-tab__section">
        <div className="preferences-tab__section-title">{t('settings.theme')}</div>
        <div className="preferences-tab__section-desc">{t('settings.themeDesc')}</div>
        <div className="preferences-tab__radio-group">
          {themeOptions.map((opt) => (
            <label
              key={opt.value}
              className={`preferences-tab__radio-card${theme === opt.value ? ' preferences-tab__radio-card--active' : ''}`}
            >
              <input
                type="radio"
                name="theme"
                value={opt.value}
                checked={theme === opt.value}
                onChange={() => handleThemeChange(opt.value)}
                className="preferences-tab__radio-input"
              />
              <span className="preferences-tab__radio-icon">{opt.icon}</span>
              <span className="preferences-tab__radio-text">{t(opt.labelKey)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="preferences-tab__section">
        <div className="preferences-tab__section-title">{t('settings.language')}</div>
        <div className="preferences-tab__section-desc">{t('settings.languageDesc')}</div>
        <div className="preferences-tab__radio-group">
          {languageOptions.map((opt) => (
            <label
              key={opt.value}
              className={`preferences-tab__radio-card${locale === opt.value ? ' preferences-tab__radio-card--active' : ''}`}
            >
              <input
                type="radio"
                name="language"
                value={opt.value}
                checked={locale === opt.value}
                onChange={() => handleLangChange(opt.value)}
                className="preferences-tab__radio-input"
              />
              <span className="preferences-tab__radio-text">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
