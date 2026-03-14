import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useDocumentTitle(t('auth.resetPassword'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) return;
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        code: code.trim(),
        new_password: newPassword,
      });
      toast.success(t('auth.resetSuccess'));
      navigate('/login', { replace: true });
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="auth-layout__hint">
        {t('auth.codeSent', { email })}
      </p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="reset-code">
            {t('auth.verificationCode')}
          </label>
          <input
            type="text"
            id="reset-code"
            className="auth-form__input"
            placeholder={t('auth.verificationCode')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            autoComplete="one-time-code"
            required
          />
        </div>

        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="reset-new-password">
            {t('auth.newPassword')}
          </label>
          <input
            type="password"
            id="reset-new-password"
            className="auth-form__input"
            placeholder={t('auth.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="reset-confirm-password">
            {t('auth.confirmNewPassword')}
          </label>
          <input
            type="password"
            id="reset-confirm-password"
            className="auth-form__input"
            placeholder={t('auth.confirmNewPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <button type="submit" className="auth-form__btn-primary" disabled={loading}>
          {loading ? <span className="auth-form__spinner" /> : null}
          {t('auth.resetButton')}
        </button>
      </form>

      <div className="auth-layout__footer">
        <Link to="/login">{t('auth.goLogin')}</Link>
      </div>
    </>
  );
}
