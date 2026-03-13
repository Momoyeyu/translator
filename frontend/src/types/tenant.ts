export interface TenantListItem {
  tenant_id: string;
  tenant_name: string;
  user_role: string;
}

export interface Tenant {
  id: string;
  name: string;
  status: string;
}

export interface TenantCreateRequest {
  name: string;
}

export interface TenantUpdateRequest {
  name?: string | null;
  status?: string | null;
}

export interface TenantInviteRequest {
  email: string;
  role?: string;
}

export interface TenantInviteAcceptRequest {
  token: string;
  password: string;
}

export interface TenantInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}
