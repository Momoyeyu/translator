import { Button, Divider } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { oauthProviders } from '@/config/oauthProviders';
import { useOAuth } from '@/hooks/useOAuth';
import './SSOButtons.less';

export default function SSOButtons() {
  const { t } = useTranslation();
  const { startLogin, loadingProvider } = useOAuth();

  if (oauthProviders.length === 0) return null;

  return (
    <div className="sso-buttons">
      <Divider className="sso-buttons__divider">
        <span className="sso-buttons__divider-text">{t('auth.ssoOr')}</span>
      </Divider>
      <div className="sso-buttons__list">
        {oauthProviders.map((provider) => (
          <Button
            key={provider.id}
            long
            size="large"
            loading={loadingProvider === provider.id}
            className="sso-buttons__btn"
            style={{
              '--sso-bg': provider.brandColor,
              '--sso-bg-hover': provider.brandColorHover || provider.brandColor,
              '--sso-text': provider.textColor,
            } as React.CSSProperties}
            onClick={() => startLogin(provider.id)}
          >
            <span className="sso-buttons__btn-icon">{provider.icon}</span>
            {t('auth.ssoLoginWith', { provider: provider.name })}
          </Button>
        ))}
      </div>
    </div>
  );
}
