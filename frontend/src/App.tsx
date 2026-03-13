import { useEffect, useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from '@arco-design/web-react';
import enUS from '@arco-design/web-react/es/locale/en-US';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import ErrorBoundary from '@/components/ErrorBoundary';
import { router } from '@/router';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import '@/locales';

const ARCO_LOCALES = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as const;

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const initTheme = useAppStore((s) => s.initTheme);
  const locale = useAppStore((s) => s.locale);

  useEffect(() => {
    initialize();
    initTheme();
  }, [initialize, initTheme]);

  const arcoLocale = useMemo(() => ARCO_LOCALES[locale], [locale]);

  return (
    <ErrorBoundary>
      <ConfigProvider locale={arcoLocale}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </ErrorBoundary>
  );
}
