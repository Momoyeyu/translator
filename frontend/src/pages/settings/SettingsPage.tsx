import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import PreferencesTab from './PreferencesTab';
import './SettingsPage.less';

const TAB_KEYS = ['profile', 'security', 'preferences'] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  useDocumentTitle(t('settings.title'));

  return (
    <>
      <PageHeader title={t('settings.title')} />
      <div className="settings-tabs" role="tablist">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`settings-tabpanel-${key}`}
            className={`settings-tabs__btn${activeTab === key ? ' settings-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {t(`settings.${key}`)}
          </button>
        ))}
      </div>
      <div className="settings-page__tab-content" role="tabpanel" id={`settings-tabpanel-${activeTab}`}>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'preferences' && <PreferencesTab />}
      </div>
    </>
  );
}
