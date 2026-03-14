import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useDocumentTitle(t('auth.forgotPassword'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      toast.success(t('auth.codeSent', { email: email.trim() }));
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__group">
          <label className="auth-form__label" htmlFor="forgot-email">
            {t('auth.email')}
          </label>
          <input
            type="email"
            id="forgot-email"
            className="auth-form__input"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <button type="submit" className="auth-form__btn-primary" disabled={loading}>
          {loading ? <span className="auth-form__spinner" /> : null}
          {t('auth.sendResetCode')}
        </button>
      </form>

      <div className="auth-layout__footer">
        <Link to="/login">{t('auth.goLogin')}</Link>
      </div>
    </>
  );
}
