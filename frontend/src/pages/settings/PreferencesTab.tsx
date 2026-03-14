import { Radio } from '@arco-design/web-react';
import { IconSun, IconMoon, IconDesktop } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import type { Locale, ThemeMode } from '@/stores/appStore';
import './PreferencesTab.less';

const RadioGroup = Radio.Group;

const languageOptions: { value: Locale; label: string }[] = [
  { value: 'en-US', label: 'English' },
  { value: 'zh-CN', label: '中文' },
];

const themeOptions: { value: ThemeMode; labelKey: string; icon: React.ReactNode }[] = [
  { value: 'light', labelKey: 'theme.light', icon: <IconSun /> },
  { value: 'dark', labelKey: 'theme.dark', icon: <IconMoon /> },
  { value: 'system', labelKey: 'theme.system', icon: <IconDesktop /> },
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
        <RadioGroup
          value={theme}
          onChange={handleThemeChange}
          direction="vertical"
        >
          {themeOptions.map((opt) => (
            <Radio key={opt.value} value={opt.value}>
              <span className="preferences-tab__theme-option">
                {opt.icon}
                <span>{t(opt.labelKey)}</span>
              </span>
            </Radio>
          ))}
        </RadioGroup>
      </div>

      <div className="preferences-tab__section">
        <div className="preferences-tab__section-title">{t('settings.language')}</div>
        <div className="preferences-tab__section-desc">{t('settings.languageDesc')}</div>
        <RadioGroup
          value={locale}
          onChange={handleLangChange}
          direction="vertical"
        >
          {languageOptions.map((opt) => (
            <Radio key={opt.value} value={opt.value}>
              {opt.label}
            </Radio>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
