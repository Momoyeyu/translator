import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { setTokens } from '@/utils/token';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';
import SSOButtons from '@/components/SSOButtons';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  useDocumentTitle(t('auth.register'));

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) return;
    if (password !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        email: email.trim(),
        password,
        invitation_code: invitationCode.trim() || undefined,
      });
      setStep(2);
      setCountdown(60);
      toast.success(t('auth.codeSent', { email: email.trim() }));
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await authApi.register({
        email,
        password,
        invitation_code: invitationCode || undefined,
      });
      setCountdown(60);
      toast.success(t('auth.codeSent', { email }));
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [countdown, email, password, invitationCode, t]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 4) {
      toast.error(t('auth.codeRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.registerVerify({ email, code, password });
      setTokens(res.access_token, res.refresh_token);
      await fetchUser();
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <>
        <p className="auth-layout__hint">
          {t('auth.codeSent', { email })}
        </p>
        <form className="auth-form" onSubmit={handleVerify}>
          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="verify-code">
              {t('auth.verificationCode')}
            </label>
            <input
              type="text"
              id="verify-code"
              className="auth-form__input"
              placeholder={t('auth.verificationCode')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>

          <button type="submit" className="auth-form__btn-primary" disabled={loading}>
            {loading ? <span className="auth-form__spinner" /> : null}
            {t('auth.verify')}
          </button>

          <div className="auth-form__resend">
            {countdown > 0 ? (
              <span>{t('auth.resendCountdown', { seconds: countdown })}</span>
            ) : (
              <button type="button" onClick={handleResend} disabled={loading}>
                {t('auth.resendCode')}
              </button>
            )}
          </div>
        </form>
        <div className="auth-layout__footer">
          {t('auth.hasAccount')} <Link to="/login">{t('auth.goLogin')}</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleStep1}>
        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="reg-email">
            {t('auth.email')}
          </label>
          <input
            type="email"
            id="reg-email"
            className="auth-form__input"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="reg-password">
            {t('auth.password')}
          </label>
          <input
            type="password"
            id="reg-password"
            className="auth-form__input"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="reg-confirm-password">
            {t('auth.confirmPassword')}
          </label>
          <input
            type="password"
            id="reg-confirm-password"
            className="auth-form__input"
            placeholder={t('auth.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="reg-invitation">
            {t('auth.invitationCode')}
          </label>
          <input
            type="text"
            id="reg-invitation"
            className="auth-form__input"
            placeholder={`${t('auth.invitationCode')} (${t('auth.invitationCodePlaceholder')})`}
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value)}
          />
        </div>

        <button type="submit" className="auth-form__btn-primary" disabled={loading}>
          {loading ? <span className="auth-form__spinner" /> : null}
          {t('auth.sendCode')}
        </button>
      </form>

      <SSOButtons />

      <div className="auth-layout__footer">
        {t('auth.hasAccount')} <Link to="/login">{t('auth.goLogin')}</Link>
      </div>
    </>
  );
}
