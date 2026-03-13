import client from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterVerifyRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types/auth';
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
};
