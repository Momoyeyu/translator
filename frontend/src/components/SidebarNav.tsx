import { Menu } from '@arco-design/web-react';
import { IconDashboard, IconCommon, IconSettings } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import './SidebarNav.less';

const MenuItem = Menu.Item;

interface SidebarNavProps {
  selectedKey: string;
  onNavigate: (key: string) => void;
}

export default function SidebarNav({ selectedKey, onNavigate }: SidebarNavProps) {
  const { t } = useTranslation();

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-nav__header">
        <img src="/favicon.svg" alt="Logo" />
        <span>{t('app.name')}</span>
      </div>
      <div className="sidebar-nav__menu">
        <Menu
          selectedKeys={[selectedKey]}
          onClickMenuItem={(key) => onNavigate(key)}
        >
          <MenuItem key="/dashboard">
            <IconDashboard />
            {t('nav.dashboard')}
          </MenuItem>
          <MenuItem key="/tenants">
            <IconCommon />
            {t('nav.tenants')}
          </MenuItem>
          <MenuItem key="/settings">
            <IconSettings />
            {t('nav.settings')}
          </MenuItem>
        </Menu>
      </div>
    </aside>
  );
}
