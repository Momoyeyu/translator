import { useState } from 'react';
import { Form, Input, Button } from '@arco-design/web-react';
import { IconLock, IconCode } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';

const FormItem = Form.Item;

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(false);

  useDocumentTitle(t('auth.resetPassword'));

  const handleSubmit = async (values: {
    code: string;
    new_password: string;
    confirm_password: string;
  }) => {
    if (values.new_password !== values.confirm_password) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        code: values.code,
        new_password: values.new_password,
      });
      toast.success(t('auth.resetSuccess'));
      navigate('/login', { replace: true });
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="auth-layout__hint">
        {t('auth.codeSent', { email })}
      </p>
      <Form size="large" onSubmit={handleSubmit} autoComplete="off">
        <FormItem field="code" rules={[{ required: true, message: t('auth.codeRequired') }]}>
          <Input prefix={<IconCode />} placeholder={t('auth.verificationCode')} maxLength={6} />
        </FormItem>
        <FormItem
          field="new_password"
          rules={[{ required: true, message: t('auth.passwordRequired') }]}
        >
          <Input.Password prefix={<IconLock />} placeholder={t('auth.newPassword')} />
        </FormItem>
        <FormItem
          field="confirm_password"
          rules={[{ required: true, message: t('auth.passwordRequired') }]}
        >
          <Input.Password prefix={<IconLock />} placeholder={t('auth.confirmNewPassword')} />
        </FormItem>
        <FormItem>
          <Button type="primary" htmlType="submit" long loading={loading}>
            {t('auth.resetButton')}
          </Button>
        </FormItem>
      </Form>
      <div className="auth-layout__footer">
        <Link to="/login">{t('auth.goLogin')}</Link>
      </div>
    </>
  );
}
