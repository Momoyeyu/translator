import { useState } from 'react';
import { Form, Input, Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { userApi } from '@/api/user';
import { toast } from '@/utils/message';
import type { BizError } from '@/api/client';
import LinkedAccounts from '@/components/LinkedAccounts';

const FormItem = Form.Item;

export default function SecurityTab() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleChange = async (values: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    if (values.new_password !== values.confirm_password) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await userApi.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      });
      toast.success(t('settings.passwordChanged'));
      form.resetFields();
    } catch (err) {
      const bizErr = err as BizError;
      toast.error(bizErr.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-tab">
      <Form
        form={form}
        onSubmit={handleChange}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        <FormItem
          label={t('auth.oldPassword')}
          field="old_password"
          rules={[{ required: true, message: t('auth.passwordRequired') }]}
        >
          <Input.Password placeholder={t('auth.oldPassword')} />
        </FormItem>
        <FormItem
          label={t('auth.newPassword')}
          field="new_password"
          rules={[{ required: true, message: t('auth.passwordRequired') }]}
        >
          <Input.Password placeholder={t('auth.newPassword')} />
        </FormItem>
        <FormItem
          label={t('auth.confirmNewPassword')}
          field="confirm_password"
          rules={[{ required: true, message: t('auth.passwordRequired') }]}
        >
          <Input.Password placeholder={t('auth.confirmNewPassword')} />
        </FormItem>
        <FormItem wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t('settings.changePassword')}
          </Button>
        </FormItem>
      </Form>
      <LinkedAccounts />
    </div>
  );
}
