import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';
import './LoginPage.less';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  useDocumentTitle(t('auth.login'));

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;

    setLoading(true);
    try {
      await login({ identifier: identifier.trim(), password });
      toast.success(t('auth.loginSuccess'));
      navigate(from, { replace: true });
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-page__brand-logo">
        <div className="login-page__brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8l6 6" />
            <path d="M4 14l6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="M14 18l4-4 4 4" />
            <path d="M14 22h8" />
          </svg>
        </div>
      </div>

      <h1 className="login-page__brand-title">Translator</h1>
      <p className="login-page__brand-tagline">
        AI-powered document translation with human-quality precision.
      </p>

      <form className="login-page__form" onSubmit={handleSubmit}>
        <div className="login-page__form-group">
          <label className="login-page__form-label" htmlFor="email">Email</label>
          <input
            type="text"
            id="identifier"
            className="login-page__form-input"
            placeholder={t('auth.username')}
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        <div className="login-page__form-group">
          <label className="login-page__form-label" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            className="login-page__form-input"
            placeholder={t('auth.password')}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="login-page__btn-primary" disabled={loading}>
          {loading ? <span className="login-page__spinner" /> : null}
          {t('auth.loginButton')}
        </button>

        <div className="login-page__links">
          <Link to="/forgot-password">{t('auth.goForgotPassword')}</Link>
          <Link to="/register">{t('auth.goRegister')}</Link>
        </div>

      </form>
    </>
  );
}
