import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Button } from '@arco-design/web-react';
import UserAvatar from '@/components/UserAvatar';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/api/user';
import { toast } from '@/utils/message';
import { setTokens } from '@/utils/token';
import './ProfileTab.less';

const FormItem = Form.Item;

export default function ProfileTab() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [username, setUsername] = useState(user?.username ?? '');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
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
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <FormItem label={t('settings.emailLabel')}>
          <Input value={user.email} disabled />
        </FormItem>
        <FormItem label={t('settings.usernameLabel')}>
          <Input
            value={username}
            placeholder={t('settings.usernamePlaceholder')}
            onChange={setUsername}
          />
        </FormItem>
        <FormItem wrapperCol={{ offset: 6, span: 18 }}>
          <Button type="primary" loading={loading} onClick={handleSave}>
            {t('settings.save')}
          </Button>
        </FormItem>
      </Form>
    </div>
  );
}
