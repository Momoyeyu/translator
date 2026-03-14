import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Spin, Result } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useOAuth } from '@/hooks/useOAuth';
import { getProviderConfig } from '@/config/oauthProviders';

/**
 * OAuth callback page.
 * Handles both login callbacks (/auth/callback/:provider)
 * and link callbacks (/auth/callback/:provider/link).
 */
export default function OAuthCallbackPage() {
  const { t } = useTranslation();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { handleCallback, handleLinkCallback } = useOAuth();
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  const isLinkFlow = location.pathname.includes('/link');

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!provider || !code || !state) {
      setError(t('auth.ssoCallbackMissingParams'));
      return;
    }

    const config = getProviderConfig(provider);
    if (!config) {
      setError(t('auth.ssoUnsupportedProvider'));
      return;
    }

    const process = async () => {
      try {
        if (isLinkFlow) {
          await handleLinkCallback(provider, code, state);
        } else {
          await handleCallback(provider, code, state);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('auth.ssoCallbackError');
        setError(message);
      }
    };

    process();
  }, [provider, searchParams, isLinkFlow, handleCallback, handleLinkCallback, t]);

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Result status="error" title={t('auth.ssoCallbackFailed')} subTitle={error} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 16 }}>
      <Spin size={32} />
      <span style={{ color: 'var(--color-text-2)', fontSize: 14 }}>{t('auth.ssoProcessing')}</span>
    </div>
  );
}
