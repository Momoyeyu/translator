export interface LoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_token_expires_in: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  invitation_code?: string;
}

export interface RegisterVerifyRequest {
  email: string;
  code: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}
