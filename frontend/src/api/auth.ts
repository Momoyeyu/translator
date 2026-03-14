import client from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterVerifyRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  OAuthAuthorizeResponse,
  LinkedProvidersResponse,
} from '@/types/auth';
export type { LinkedProvider } from '@/types/auth';
import type { TenantInviteAcceptRequest } from '@/types/tenant';

export const authApi = {
  login(data: LoginRequest) {
    return client.post<unknown, LoginResponse>('/auth/login', data);
  },

  register(data: RegisterRequest) {
    return client.post<unknown, null>('/auth/register', data);
  },

  registerVerify(data: RegisterVerifyRequest) {
    return client.post<unknown, LoginResponse>('/auth/register/verify', data);
  },

  refreshToken(refreshToken: string) {
    return client.post<unknown, LoginResponse>('/auth/token/refresh', {
      refresh_token: refreshToken,
    });
  },

  logout(refreshToken: string) {
    return client.post<unknown, null>('/auth/logout', {
      refresh_token: refreshToken,
    });
  },

  forgotPassword(data: ForgotPasswordRequest) {
    return client.post<unknown, null>('/auth/password/forgot', data);
  },

  resetPassword(data: ResetPasswordRequest) {
    return client.post<unknown, null>('/auth/password/reset', data);
  },

  acceptInvite(data: TenantInviteAcceptRequest) {
    return client.post<unknown, LoginResponse>('/auth/invite/accept', data);
  },

  // SSO / OAuth2
  ssoAuthorize(provider: string) {
    return client.get<unknown, OAuthAuthorizeResponse>(`/auth/${provider}/authorize`);
  },

  ssoCallback(provider: string, code: string, state: string) {
    return client.get<unknown, LoginResponse>(`/auth/${provider}/callback`, {
      params: { code, state },
    });
  },

  /** Authenticated: start account linking */
  ssoLink(provider: string) {
    return client.get<unknown, OAuthAuthorizeResponse>(`/auth/${provider}/link`);
  },

  /** Authenticated: complete account linking */
  ssoLinkCallback(provider: string, code: string, state: string) {
    return client.get<unknown, null>(`/auth/${provider}/link/callback`, {
      params: { code, state },
    });
  },

  /** Authenticated: unlink provider */
  ssoUnlink(provider: string) {
    return client.delete<unknown, null>(`/auth/${provider}/unlink`);
  },

  /** Authenticated: list linked providers */
  ssoProviders() {
    return client.get<unknown, LinkedProvidersResponse>('/auth/providers');
  },
};
