import { useState } from 'react';
import { Form, Input, Button } from '@arco-design/web-react';
import { IconEmail } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';

const FormItem = Form.Item;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useDocumentTitle(t('auth.forgotPassword'));

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(values);
      toast.success(t('auth.codeSent', { email: values.email }));
      navigate(`/reset-password?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form size="large" onSubmit={handleSubmit} autoComplete="off">
        <FormItem
          field="email"
          rules={[
            { required: true, message: t('auth.emailRequired') },
            { type: 'email', message: t('auth.emailInvalid') },
          ]}
        >
          <Input prefix={<IconEmail />} placeholder={t('auth.email')} />
        </FormItem>
        <FormItem>
          <Button type="primary" htmlType="submit" long loading={loading}>
            {t('auth.sendResetCode')}
          </Button>
        </FormItem>
      </Form>
      <div className="auth-layout__footer">
        <Link to="/login">{t('auth.goLogin')}</Link>
      </div>
    </>
  );
}
