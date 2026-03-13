import client from './client';
import type {
  UserProfile,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
} from '@/types/user';

export const userApi = {
  getProfile() {
    return client.get<unknown, UserProfile>('/user/me');
  },

  whoami() {
    return client.get<unknown, UserProfile>('/user/whoami');
  },

  updateProfile(data: UpdateProfileRequest) {
    return client.post<unknown, UpdateProfileResponse>('/user/me', data);
  },

  changePassword(data: ChangePasswordRequest) {
    return client.post<unknown, null>('/user/password/change', data);
  },
};
