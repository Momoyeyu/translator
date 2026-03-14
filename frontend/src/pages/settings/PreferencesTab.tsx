import { Radio } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import type { Locale } from '@/stores/appStore';
import './PreferencesTab.less';

const RadioGroup = Radio.Group;

const languageOptions: { value: Locale; label: string }[] = [
  { value: 'en-US', label: 'English' },
  { value: 'zh-CN', label: '中文' },
];

export default function PreferencesTab() {
  const { t, i18n } = useTranslation();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  const handleChange = (value: string) => {
    const next = value as Locale;
    setLocale(next);
    i18n.changeLanguage(next);
  };

  return (
    <div className="preferences-tab">
      <div className="preferences-tab__section">
        <div className="preferences-tab__section-title">{t('settings.language')}</div>
        <div className="preferences-tab__section-desc">{t('settings.languageDesc')}</div>
        <RadioGroup
          value={locale}
          onChange={handleChange}
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
