import client from './client';
import type {
  TenantListItem,
  Tenant,
  TenantCreateRequest,
  TenantUpdateRequest,
  TenantInviteRequest,
  TenantInvitation,
} from '@/types/tenant';

export const tenantApi = {
  list() {
    return client.get<unknown, TenantListItem[]>('/tenant');
  },

  get(tenantId: string) {
    return client.get<unknown, Tenant>(`/tenant/${tenantId}`);
  },

  create(data: TenantCreateRequest) {
    return client.post<unknown, Tenant>('/tenant', data);
  },

  update(tenantId: string, data: TenantUpdateRequest) {
    return client.put<unknown, Tenant>(`/tenant/${tenantId}`, data);
  },

  invite(tenantId: string, data: TenantInviteRequest) {
    return client.post<unknown, null>(`/tenant/${tenantId}/invite`, data);
  },

  listInvitations(tenantId: string) {
    return client.get<unknown, TenantInvitation[]>(`/tenant/${tenantId}/invitations`);
  },

  cancelInvitation(tenantId: string, invitationId: string) {
    return client.delete<unknown, null>(`/tenant/${tenantId}/invitations/${invitationId}`);
  },
};
