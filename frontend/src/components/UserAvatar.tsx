import { Avatar } from '@arco-design/web-react';

const COLORS = [
  '#F53F3F', '#F77234', '#FF7D00', '#F7BA1E',
  '#9FDB1D', '#00B42A', '#14C9C9', '#3491FA',
  '#722ED1', '#D91AD9',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length]!;
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

export default function UserAvatar({ username, avatarUrl, size = 32 }: UserAvatarProps) {
  if (avatarUrl) {
    return <Avatar size={size}><img src={avatarUrl} alt={username} /></Avatar>;
  }

  return (
    <Avatar
      size={size}
      style={{ backgroundColor: getColorFromName(username) }}
    >
      {getInitials(username)}
    </Avatar>
  );
}
