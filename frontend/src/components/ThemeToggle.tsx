import { Button, Tooltip } from '@arco-design/web-react';
import { IconSun, IconMoon, IconDesktop } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import type { ThemeMode } from '@/stores/appStore';

const CYCLE: ThemeMode[] = ['system', 'light', 'dark'];

export default function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const nextTheme = () => {
    const idx = CYCLE.indexOf(theme);
    const next = CYCLE[(idx + 1) % CYCLE.length]!;
    setTheme(next);
  };

  const icon = theme === 'dark' ? <IconMoon /> : theme === 'light' ? <IconSun /> : <IconDesktop />;
  const label = t(`theme.${theme}`);

  return (
    <Tooltip content={label}>
      <Button
        shape="circle"
        type="text"
        icon={icon}
        onClick={nextTheme}
        size="small"
      />
    </Tooltip>
  );
}
