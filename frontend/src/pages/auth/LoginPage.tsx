import { useState } from 'react';
import { Form, Input, Button } from '@arco-design/web-react';
import { IconUser, IconLock } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';

const FormItem = Form.Item;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  useDocumentTitle(t('auth.login'));

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (values: { identifier: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      toast.success(t('auth.loginSuccess'));
      navigate(from, { replace: true });
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form
        size="large"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <FormItem field="identifier" rules={[{ required: true, message: t('auth.emailRequired') }]}>
          <Input
            prefix={<IconUser />}
            placeholder={t('auth.username')}
          />
        </FormItem>
        <FormItem field="password" rules={[{ required: true, message: t('auth.passwordRequired') }]}>
          <Input.Password
            prefix={<IconLock />}
            placeholder={t('auth.password')}
          />
        </FormItem>
        <div className="auth-layout__extra">
          <Link to="/forgot-password">{t('auth.goForgotPassword')}</Link>
        </div>
        <FormItem>
          <Button type="primary" htmlType="submit" long loading={loading}>
            {t('auth.loginButton')}
          </Button>
        </FormItem>
      </Form>
      <div className="auth-layout__footer">
        {t('auth.noAccount')} <Link to="/register">{t('auth.goRegister')}</Link>
      </div>
    </>
  );
}
