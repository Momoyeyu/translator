import { Button, Tooltip } from '@arco-design/web-react';
import { IconExport } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import LangSwitch from './LangSwitch';
import UserAvatar from './UserAvatar';
import type { UserProfile } from '@/types/user';
import './AppHeader.less';

interface AppHeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export default function AppHeader({ user, onLogout }: AppHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="app-header">
      <ThemeToggle />
      <LangSwitch />
      {user && (
        <div className="app-header__user-info">
          <UserAvatar
            username={user.username}
            avatarUrl={user.avatar_url}
            size={28}
          />
          <span className="app-header__username">
            {user.username}
          </span>
          <Tooltip content={t('nav.logout')}>
            <Button
              type="text"
              icon={<IconExport />}
              size="small"
              onClick={onLogout}
            />
          </Tooltip>
        </div>
      )}
    </header>
  );
}
