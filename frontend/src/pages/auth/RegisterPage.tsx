import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Space } from '@arco-design/web-react';
import { IconEmail, IconLock, IconCode, IconIdcard } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { setTokens } from '@/utils/token';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';
import SSOButtons from '@/components/SSOButtons';

const FormItem = Form.Item;

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  useDocumentTitle(t('auth.register'));

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleStep1 = async (values: {
    email: string;
    password: string;
    confirmPassword: string;
    invitation_code?: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        email: values.email,
        password: values.password,
        invitation_code: values.invitation_code || undefined,
      });
      setEmail(values.email);
      setPassword(values.password);
      setInvitationCode(values.invitation_code || '');
      setStep(2);
      setCountdown(60);
      toast.success(t('auth.codeSent', { email: values.email }));
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await authApi.register({
        email,
        password,
        invitation_code: invitationCode || undefined,
      });
      setCountdown(60);
      toast.success(t('auth.codeSent', { email }));
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [countdown, email, password, invitationCode, t]);

  const handleVerify = async () => {
    if (!code || code.length < 4) {
      toast.error(t('auth.codeRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.registerVerify({ email, code, password });
      setTokens(res.access_token, res.refresh_token);
      await fetchUser();
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <>
        <p className="auth-layout__hint">
          {t('auth.codeSent', { email })}
        </p>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Input
            size="large"
            prefix={<IconCode />}
            placeholder={t('auth.verificationCode')}
            value={code}
            onChange={setCode}
            maxLength={6}
          />
          <Button type="primary" long size="large" loading={loading} onClick={handleVerify}>
            {t('auth.verify')}
          </Button>
          <div style={{ textAlign: 'center' }}>
            {countdown > 0 ? (
              <span style={{ color: 'var(--color-text-3)' }}>
                {t('auth.resendCountdown', { seconds: countdown })}
              </span>
            ) : (
              <Button type="text" onClick={handleResend} loading={loading}>
                {t('auth.resendCode')}
              </Button>
            )}
          </div>
        </Space>
        <div className="auth-layout__footer">
          {t('auth.hasAccount')} <Link to="/login">{t('auth.goLogin')}</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Form
        size="large"
        onSubmit={handleStep1}
        autoComplete="off"
      >
        <FormItem
          field="email"
          rules={[
            { required: true, message: t('auth.emailRequired') },
            { type: 'email', message: t('auth.emailInvalid') },
          ]}
        >
          <Input prefix={<IconEmail />} placeholder={t('auth.email')} />
        </FormItem>
        <FormItem field="password" rules={[{ required: true, message: t('auth.passwordRequired') }]}>
          <Input.Password prefix={<IconLock />} placeholder={t('auth.password')} />
        </FormItem>
        <FormItem
          field="confirmPassword"
          rules={[{ required: true, message: t('auth.passwordRequired') }]}
        >
          <Input.Password prefix={<IconLock />} placeholder={t('auth.confirmPassword')} />
        </FormItem>
        <FormItem field="invitation_code">
          <Input prefix={<IconIdcard />} placeholder={`${t('auth.invitationCode')} (${t('auth.invitationCodePlaceholder')})`} />
        </FormItem>
        <FormItem>
          <Button type="primary" htmlType="submit" long loading={loading}>
            {t('auth.sendCode')}
          </Button>
        </FormItem>
      </Form>
      <SSOButtons />
      <div className="auth-layout__footer">
        {t('auth.hasAccount')} <Link to="/login">{t('auth.goLogin')}</Link>
      </div>
    </>
  );
}
