import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi, type LinkedProvider } from '@/api/auth';
import { oauthProviders } from '@/config/oauthProviders';
import { useOAuth } from '@/hooks/useOAuth';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';
import './LinkedAccounts.less';

export default function LinkedAccounts() {
  const { t } = useTranslation();
  const { startLink, loadingProvider } = useOAuth();
  const [providers, setProviders] = useState<LinkedProvider[]>([]);
  const [hasPassword, setHasPassword] = useState(true);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    try {
      const data = await authApi.ssoProviders();
      setProviders(data.providers);
      setHasPassword(data.has_password);
    } catch {
      // silently fail — section will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (oauthProviders.length > 0) fetchProviders();
  }, [fetchProviders]);

  if (oauthProviders.length === 0) return null;

  const handleUnlink = async (provider: string) => {
    const linkedCount = providers.length;
    if (!hasPassword && linkedCount <= 1) {
      toast.error(t('settings.unlinkLastMethodError'));
      return;
    }

    if (!window.confirm(t('settings.unlinkConfirm', { provider }))) {
      return;
    }

    setUnlinking(provider);
    try {
      await authApi.ssoUnlink(provider);
      toast.success(t('settings.unlinkSuccess', { provider }));
      await fetchProviders();
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setUnlinking(null);
    }
  };

  const linkedMap = new Map(providers.map((p) => [p.provider, p]));

  if (loading) {
    return (
      <div className="linked-accounts__loading">
        <span className="settings-form__spinner settings-form__spinner--dark" />
      </div>
    );
  }

  return (
    <div className="linked-accounts">
      <div className="linked-accounts__header">
        <h3 className="linked-accounts__title">{t('settings.linkedAccounts')}</h3>
        <p className="linked-accounts__desc">{t('settings.linkedAccountsDesc')}</p>
      </div>
      <div className="linked-accounts__list">
        {oauthProviders.map((config) => {
          const linked = linkedMap.get(config.id);
          return (
            <div key={config.id} className="linked-accounts__item">
              <div className="linked-accounts__provider">
                <div
                  className="linked-accounts__icon"
                  style={{ background: config.id === 'github' ? '#24292f' : '#fff', color: config.textColor }}
                >
                  {config.icon}
                </div>
                <div className="linked-accounts__info">
                  <span className="linked-accounts__name">{config.name}</span>
                  {linked ? (
                    <span className="linked-accounts__email">{linked.email || t('settings.linked')}</span>
                  ) : (
                    <span className="linked-accounts__not-linked">{t('settings.notLinked')}</span>
                  )}
                </div>
              </div>
              {linked ? (
                <button
                  type="button"
                  className="settings-form__btn-danger settings-form__btn--small"
                  disabled={unlinking === config.id}
                  onClick={() => handleUnlink(config.id)}
                >
                  {unlinking === config.id && <span className="settings-form__spinner settings-form__spinner--danger" />}
                  {t('settings.unlink')}
                </button>
              ) : (
                <button
                  type="button"
                  className="settings-form__btn-secondary settings-form__btn--small"
                  disabled={loadingProvider === config.id}
                  onClick={() => startLink(config.id)}
                >
                  {loadingProvider === config.id && <span className="settings-form__spinner settings-form__spinner--dark" />}
                  {t('settings.link')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
