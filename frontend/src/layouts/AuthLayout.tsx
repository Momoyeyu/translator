import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '@/components/ThemeToggle';
import LangSwitch from '@/components/LangSwitch';
import './AuthLayout.less';

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="auth-layout">
      <div className="auth-layout__decor" aria-hidden="true">
        <div className="auth-layout__decor-grid" />
        <div className="auth-layout__decor-shapes">
          <div className="auth-layout__decor-circle auth-layout__decor-circle--1" />
          <div className="auth-layout__decor-circle auth-layout__decor-circle--2" />
          <div className="auth-layout__decor-circle auth-layout__decor-circle--3" />
        </div>
        <div className="auth-layout__decor-brand">
          <img src="/favicon.svg" alt="Logo" />
          <h2>{t('app.name')}</h2>
          <p>{t('app.tagline')}</p>
        </div>
      </div>

      <div className="auth-layout__panel">
        <div className="auth-layout__actions">
          <ThemeToggle />
          <LangSwitch />
        </div>
        <div className="auth-layout__form-area">
          <div className="auth-layout__card">
            <div className="auth-layout__logo">
              <img src="/favicon.svg" alt="Logo" />
              <h1>{t('app.name')}</h1>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
