import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import { setTokens } from '@/utils/token';
import type { BizError } from '@/api/client';

export default function InviteAcceptPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useDocumentTitle(t('invite.acceptTitle'));

  if (!token) {
    return (
      <>
        <p className="auth-layout__hint">{t('invite.tokenMissing')}</p>
        <div className="auth-layout__footer">
          <Link to="/login">{t('auth.goLogin')}</Link>
        </div>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) return;
    if (password !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.acceptInvite({ token, password });
      setTokens(response.access_token, response.refresh_token);
      toast.success(t('invite.acceptSuccess'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="auth-layout__hint">{t('invite.acceptDesc')}</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="invite-password">
            {t('auth.password')}
          </label>
          <input
            type="password"
            id="invite-password"
            className="auth-form__input"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="invite-confirm-password">
            {t('auth.confirmPassword')}
          </label>
          <input
            type="password"
            id="invite-confirm-password"
            className="auth-form__input"
            placeholder={t('auth.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <button type="submit" className="auth-form__btn-primary" disabled={loading}>
          {loading ? <span className="auth-form__spinner" /> : null}
          {t('invite.acceptButton')}
        </button>
      </form>
    </>
  );
}
