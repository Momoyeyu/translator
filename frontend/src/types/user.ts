export interface UserProfile {
  username: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
}

export interface UpdateProfileRequest {
  username?: string | null;
  avatar_url?: string | null;
}

export interface UpdateProfileResponse extends UserProfile {
  access_token?: string;
  refresh_token?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}
