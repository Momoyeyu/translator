import { Button } from '@arco-design/web-react';
import { IconEmail, IconUser } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './DashboardPage.less';

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useDocumentTitle(t('dashboard.title'));

  const welcomeText = user?.username
    ? t('dashboard.welcome', { name: user.username })
    : t('dashboard.welcomeDefault');

  return (
    <div className="dashboard">
      <div className="dashboard__welcome">
        <div className="dashboard__welcome-decor" />
        <h1 className="dashboard__title">{welcomeText}</h1>
        <p className="dashboard__subtitle">{t('dashboard.subtitle')}</p>
      </div>

      <div className="dashboard__stats">
        <div className="dashboard__stat-card dashboard__stat-card--blue">
          <div className="dashboard__stat-icon">
            <IconEmail />
          </div>
          <div className="dashboard__stat-content">
            <span className="dashboard__stat-label">{t('settings.emailLabel')}</span>
            <span className="dashboard__stat-value">{user?.email || '—'}</span>
          </div>
        </div>
        <div className="dashboard__stat-card dashboard__stat-card--teal">
          <div className="dashboard__stat-icon">
            <IconUser />
          </div>
          <div className="dashboard__stat-content">
            <span className="dashboard__stat-label">{t('settings.usernameLabel')}</span>
            <span className="dashboard__stat-value">{user?.username || '—'}</span>
          </div>
        </div>
      </div>

      <div className="dashboard__actions">
        <Button type="outline" onClick={() => navigate('/settings')}>
          {t('dashboard.editProfile')}
        </Button>
      </div>
    </div>
  );
}
