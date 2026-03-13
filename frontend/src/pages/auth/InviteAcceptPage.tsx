import { useState } from 'react';
import { Form, Input, Button } from '@arco-design/web-react';
import { IconLock } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import { setTokens } from '@/utils/token';
import type { BizError } from '@/api/client';

const FormItem = Form.Item;

export default function InviteAcceptPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);

  useDocumentTitle(t('tenant.inviteAcceptTitle'));

  if (!token) {
    return (
      <>
        <p className="auth-layout__hint">{t('tenant.inviteTokenMissing')}</p>
        <div className="auth-layout__footer">
          <Button type="text" onClick={() => navigate('/login')}>
            {t('auth.goLogin')}
          </Button>
        </div>
      </>
    );
  }

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.acceptInvite({ token, password: values.password });
      setTokens(response.access_token, response.refresh_token);
      toast.success(t('tenant.inviteAcceptSuccess'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="auth-layout__hint">{t('tenant.inviteAcceptDesc')}</p>
      <Form size="large" onSubmit={handleSubmit} autoComplete="off">
        <FormItem
          field="password"
          rules={[{ required: true, message: t('auth.passwordRequired') }]}
        >
          <Input.Password prefix={<IconLock />} placeholder={t('auth.password')} />
        </FormItem>
        <FormItem
          field="confirmPassword"
          rules={[{ required: true, message: t('auth.passwordRequired') }]}
        >
          <Input.Password prefix={<IconLock />} placeholder={t('auth.confirmPassword')} />
        </FormItem>
        <FormItem>
          <Button type="primary" htmlType="submit" long loading={loading}>
            {t('tenant.inviteAcceptButton')}
          </Button>
        </FormItem>
      </Form>
    </>
  );
}
