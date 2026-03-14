import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { setTokens } from '@/utils/token';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';

/**
 * Hook encapsulating the OAuth authorization flow.
 * Handles redirecting to the provider and processing callbacks.
 */
export function useOAuth() {
  const navigate = useNavigate();
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  /** Start SSO login/register: redirect user to provider */
  const startLogin = useCallback(async (provider: string) => {
    setLoadingProvider(provider);
    try {
      sessionStorage.setItem('oauth_flow', 'login');
      const res = await authApi.ssoAuthorize(provider);
      window.location.href = res.authorization_url;
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || 'Failed to start SSO');
      setLoadingProvider(null);
    }
  }, []);

  /** Handle the OAuth callback after provider redirects back */
  const handleCallback = useCallback(async (provider: string, code: string, state: string) => {
    const flow = sessionStorage.getItem('oauth_flow') || 'login';
    sessionStorage.removeItem('oauth_flow');

    if (flow === 'link') {
      await authApi.ssoLinkCallback(provider, code, state);
      toast.success(`${provider} account linked successfully`);
      navigate('/settings', { replace: true });
    } else {
      const res = await authApi.ssoCallback(provider, code, state);
      setTokens(res.access_token, res.refresh_token);
      await fetchUser();
      navigate('/dashboard', { replace: true });
    }
  }, [fetchUser, navigate]);

  /** Start account linking: redirect authenticated user to provider */
  const startLink = useCallback(async (provider: string) => {
    setLoadingProvider(provider);
    try {
      sessionStorage.setItem('oauth_flow', 'link');
      const res = await authApi.ssoLink(provider);
      window.location.href = res.authorization_url;
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || 'Failed to start linking');
      setLoadingProvider(null);
    }
  }, []);

  /** Handle the link callback */
  const handleLinkCallback = useCallback(async (provider: string, code: string, state: string) => {
    await authApi.ssoLinkCallback(provider, code, state);
    navigate('/settings', { replace: true });
  }, [navigate]);

  return {
    loadingProvider,
    startLogin,
    handleCallback,
    startLink,
    handleLinkCallback,
  };
}
