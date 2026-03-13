import { Spin } from '@arco-design/web-react';

export default function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
      }}
    >
      <Spin size={32} />
    </div>
  );
}
