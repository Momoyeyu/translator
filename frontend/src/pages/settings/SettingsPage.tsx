import { Tabs } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import './SettingsPage.less';

const TabPane = Tabs.TabPane;

export default function SettingsPage() {
  const { t } = useTranslation();

  useDocumentTitle(t('settings.title'));

  return (
    <>
      <PageHeader title={t('settings.title')} />
      <Tabs defaultActiveTab="profile">
        <TabPane key="profile" title={t('settings.profile')}>
          <div className="settings-page__tab-content">
            <ProfileTab />
          </div>
        </TabPane>
        <TabPane key="security" title={t('settings.security')}>
          <div className="settings-page__tab-content">
            <SecurityTab />
          </div>
        </TabPane>
      </Tabs>
    </>
  );
}
