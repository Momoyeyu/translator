import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '@/api/user';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';
import LinkedAccounts from '@/components/LinkedAccounts';

export default function SecurityTab() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error(t('auth.passwordRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await userApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success(t('settings.passwordChanged'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-tab">
      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-form__group">
          <label className="settings-form__label" htmlFor="sec-old-password">{t('auth.oldPassword')}</label>
          <input
            id="sec-old-password"
            className="settings-form__input"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder={t('auth.oldPassword')}
            autoComplete="current-password"
          />
        </div>
        <div className="settings-form__group">
          <label className="settings-form__label" htmlFor="sec-new-password">{t('auth.newPassword')}</label>
          <input
            id="sec-new-password"
            className="settings-form__input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('auth.newPassword')}
            autoComplete="new-password"
          />
        </div>
        <div className="settings-form__group">
          <label className="settings-form__label" htmlFor="sec-confirm-password">{t('auth.confirmNewPassword')}</label>
          <input
            id="sec-confirm-password"
            className="settings-form__input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('auth.confirmNewPassword')}
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          className="settings-form__btn-primary"
          disabled={loading}
        >
          {loading && <span className="settings-form__spinner" />}
          {t('settings.changePassword')}
        </button>
      </form>
      <LinkedAccounts />
    </div>
  );
}
