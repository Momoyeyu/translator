import { Message } from '@arco-design/web-react';

export const toast = {
  success(content: string) {
    Message.success({ content, duration: 3000 });
  },
  error(content: string) {
    Message.error({ content, duration: 5000 });
  },
  warning(content: string) {
    Message.warning({ content, duration: 4000 });
  },
  info(content: string) {
    Message.info({ content, duration: 3000 });
  },
};
