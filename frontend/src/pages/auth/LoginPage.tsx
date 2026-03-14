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
            type="email"
            id="email"
            className="login-page__form-input"
            placeholder={t('auth.username')}
            autoComplete="email"
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

        <div className="login-page__divider">
          <span>or continue with</span>
        </div>

        <button type="button" className="login-page__btn-social">
          <svg viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </form>
    </>
  );
}
