import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Input, Table, Tag, Empty, Result } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { tenantApi } from '@/api/tenant';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import type { TenantListItem } from '@/types/tenant';
import type { BizError } from '@/api/client';
import './TenantPage.less';

const FormItem = Form.Item;

export default function TenantPage() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();

  useDocumentTitle(t('tenant.title'));

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const data = await tenantApi.list();
      setTenants(data);
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreate = async (values: { name: string }) => {
    if (createLoading) return;
    setCreateLoading(true);
    try {
      await tenantApi.create(values);
      toast.success(t('tenant.createSuccess'));
      setCreateVisible(false);
      form.resetFields();
      fetchTenants();
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCancelCreate = () => {
    setCreateVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: t('tenant.name'),
      dataIndex: 'tenant_name',
      render: (name: string, record: TenantListItem) => (
        <Link to={`/tenants/${record.tenant_id}`}>{name}</Link>
      ),
    },
    {
      title: t('tenant.role'),
      dataIndex: 'user_role',
      render: (role: string) => (
        <Tag color={role === 'owner' ? 'blue' : 'gray'}>{role}</Tag>
      ),
    },
  ];

  const renderContent = () => {
    if (fetchError) {
      return (
        <Result status="error" title={t('common.error')}>
          <Button type="primary" onClick={fetchTenants}>
            {t('common.retry')}
          </Button>
        </Result>
      );
    }

    if (!loading && tenants.length === 0) {
      return (
        <div className="tenant-page__empty">
          <Empty description={t('tenant.noTenantsDesc')} />
          <Button
            type="primary"
            onClick={() => setCreateVisible(true)}
            style={{ marginTop: 16 }}
          >
            {t('tenant.create')}
          </Button>
        </div>
      );
    }

    return (
      <Table
        loading={loading}
        columns={columns}
        data={tenants}
        rowKey="tenant_id"
        pagination={false}
        border={false}
      />
    );
  };

  return (
    <div className="tenant-page">
      <PageHeader
        title={t('tenant.title')}
        extra={
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => setCreateVisible(true)}
          >
            {t('tenant.create')}
          </Button>
        }
      />

      {renderContent()}

      <Modal
        title={t('tenant.createTitle')}
        visible={createVisible}
        onCancel={handleCancelCreate}
        footer={null}
        autoFocus={false}
        focusLock
      >
        <Form form={form} onSubmit={handleCreate}>
          <FormItem
            label={t('tenant.name')}
            field="name"
            rules={[{ required: true, message: t('tenant.nameRequired') }]}
          >
            <Input placeholder={t('tenant.namePlaceholder')} />
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              htmlType="submit"
              long
              loading={createLoading}
            >
              {t('tenant.create')}
            </Button>
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
