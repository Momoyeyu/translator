import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Input, Select, Table, Tag, Empty, Result, Spin, Popconfirm } from '@arco-design/web-react';
import { IconPlus, IconLeft, IconDelete } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { tenantApi } from '@/api/tenant';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import type { Tenant, TenantInvitation, TenantListItem } from '@/types/tenant';
import type { BizError } from '@/api/client';
import './TenantDetailPage.less';

const FormItem = Form.Item;

export default function TenantDetailPage() {
  const { t } = useTranslation();
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [userRole, setUserRole] = useState<string>('member');
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [form] = Form.useForm();

  useDocumentTitle(t('tenant.detail'));

  const canManageInvitations = userRole === 'owner' || userRole === 'admin';

  const fetchTenant = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setFetchError(false);
    try {
      const [detail, list] = await Promise.all([
        tenantApi.get(tenantId),
        tenantApi.list(),
      ]);
      setTenant(detail);
      const match = (list as TenantListItem[]).find((item) => item.tenant_id === tenantId);
      if (match) setUserRole(match.user_role);
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId, t]);

  const fetchInvitations = useCallback(async () => {
    if (!tenantId) return;
    setInvitationsLoading(true);
    try {
      const data = await tenantApi.listInvitations(tenantId);
      setInvitations(data);
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setInvitationsLoading(false);
    }
  }, [tenantId, t]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  useEffect(() => {
    if (canManageInvitations) {
      fetchInvitations();
    }
  }, [canManageInvitations, fetchInvitations]);

  const handleInvite = async (values: { email: string; role?: string }) => {
    if (!tenantId || inviteLoading) return;
    setInviteLoading(true);
    try {
      await tenantApi.invite(tenantId, values);
      toast.success(t('tenant.inviteSuccess'));
      setInviteVisible(false);
      form.resetFields();
      fetchInvitations();
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvite = () => {
    setInviteVisible(false);
    form.resetFields();
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!tenantId) return;
    try {
      await tenantApi.cancelInvitation(tenantId, invitationId);
      toast.success(t('tenant.cancelSuccess'));
      fetchInvitations();
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'orange',
      accepted: 'green',
      expired: 'gray',
    };
    const labelMap: Record<string, string> = {
      pending: t('tenant.invitePending'),
      accepted: t('tenant.inviteAccepted'),
      expired: t('tenant.inviteExpired'),
    };
    return <Tag color={colorMap[status] || 'gray'}>{labelMap[status] || status}</Tag>;
  };

  const invitationColumns = [
    {
      title: t('tenant.inviteEmail'),
      dataIndex: 'email',
    },
    {
      title: t('tenant.inviteRole'),
      dataIndex: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'blue' : 'gray'}>{role}</Tag>
      ),
    },
    {
      title: t('tenant.sentAt'),
      dataIndex: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '',
      dataIndex: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '',
      dataIndex: 'id',
      render: (id: string, record: TenantInvitation) =>
        record.status === 'pending' ? (
          <Popconfirm
            title={t('tenant.cancelConfirm')}
            onOk={() => handleCancelInvitation(id)}
          >
            <Button type="text" status="danger" icon={<IconDelete />} size="small">
              {t('tenant.cancel')}
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  if (loading) {
    return (
      <div className="tenant-detail-page">
        <Spin style={{ display: 'block', textAlign: 'center', padding: 48 }} />
      </div>
    );
  }

  if (fetchError || !tenant) {
    return (
      <div className="tenant-detail-page">
        <Result status="error" title={t('common.error')}>
          <Button type="primary" onClick={fetchTenant}>
            {t('common.retry')}
          </Button>
        </Result>
      </div>
    );
  }

  return (
    <div className="tenant-detail-page">
      <div className="tenant-detail-page__back">
        <Button
          type="text"
          icon={<IconLeft />}
          onClick={() => navigate('/tenants')}
        >
          {t('tenant.back')}
        </Button>
      </div>

      <PageHeader title={tenant.name} />

      {canManageInvitations && (
        <div className="tenant-detail-page__section">
          <div className="tenant-detail-page__section-header">
            <h3>{t('tenant.invitations')}</h3>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={() => setInviteVisible(true)}
            >
              {t('tenant.invite')}
            </Button>
          </div>

          {!invitationsLoading && invitations.length === 0 ? (
            <Empty description={t('tenant.noInvitations')} />
          ) : (
            <Table
              loading={invitationsLoading}
              columns={invitationColumns}
              data={invitations}
              rowKey="id"
              pagination={false}
              border={false}
            />
          )}
        </div>
      )}

      <Modal
        title={t('tenant.inviteTitle')}
        visible={inviteVisible}
        onCancel={handleCancelInvite}
        footer={null}
        autoFocus={false}
        focusLock
      >
        <Form form={form} onSubmit={handleInvite}>
          <FormItem
            label={t('tenant.inviteEmail')}
            field="email"
            rules={[
              { required: true, message: t('tenant.inviteEmailRequired') },
              { type: 'email', message: t('auth.emailInvalid') },
            ]}
          >
            <Input placeholder={t('tenant.inviteEmailPlaceholder')} />
          </FormItem>
          <FormItem
            label={t('tenant.inviteRole')}
            field="role"
            initialValue="member"
          >
            <Select>
              <Select.Option value="member">Member</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              htmlType="submit"
              long
              loading={inviteLoading}
            >
              {t('tenant.invite')}
            </Button>
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
