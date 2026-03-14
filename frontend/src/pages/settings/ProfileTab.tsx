import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserAvatar from '@/components/UserAvatar';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/api/user';
import { toast } from '@/utils/message';
import { setTokens } from '@/utils/token';
import './ProfileTab.less';

export default function ProfileTab() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [username, setUsername] = useState(user?.username ?? '');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await userApi.updateProfile({ username });
      updateUser({ username: res.username, avatar_url: res.avatar_url });
      // Backend returns new tokens when username changes (JWT sub is username)
      if (res.access_token && res.refresh_token) {
        setTokens(res.access_token, res.refresh_token);
      }
      toast.success(t('settings.saveSuccess'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-tab">
      <div className="profile-tab__user-card">
        <UserAvatar
          username={user.username}
          avatarUrl={user.avatar_url}
          size={64}
        />
        <div>
          <div className="profile-tab__user-name">{user.username}</div>
          <div className="profile-tab__user-email">{user.email}</div>
        </div>
      </div>
      <form className="settings-form" onSubmit={handleSave}>
        <div className="settings-form__group">
          <label className="settings-form__label">{t('settings.emailLabel')}</label>
          <input
            className="settings-form__input"
            type="email"
            value={user.email}
            disabled
          />
        </div>
        <div className="settings-form__group">
          <label className="settings-form__label">{t('settings.usernameLabel')}</label>
          <input
            className="settings-form__input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('settings.usernamePlaceholder')}
          />
        </div>
        <button
          type="submit"
          className="settings-form__btn-primary"
          disabled={loading}
        >
          {loading && <span className="settings-form__spinner" />}
          {t('settings.save')}
        </button>
      </form>
    </div>
  );
}
