import { Button, Tooltip } from '@arco-design/web-react';
import { IconLanguage } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import type { Locale } from '@/stores/appStore';

export default function LangSwitch() {
  const { i18n } = useTranslation();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  const toggle = () => {
    const next: Locale = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
    setLocale(next);
    i18n.changeLanguage(next);
  };

  return (
    <Tooltip content={locale === 'zh-CN' ? 'English' : '中文'}>
      <Button
        shape="circle"
        type="text"
        icon={<IconLanguage />}
        onClick={toggle}
        size="small"
      />
    </Tooltip>
  );
}
