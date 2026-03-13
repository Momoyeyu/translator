import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import SidebarNav from '@/components/SidebarNav';
import AppHeader from '@/components/AppHeader';
import ContentContainer from '@/components/ContentContainer';
import './MainLayout.less';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const selectedKey = location.pathname.startsWith('/settings') ? '/settings' : '/dashboard';

  return (
    <div className="main-layout">
      <SidebarNav
        selectedKey={selectedKey}
        onNavigate={(key) => navigate(key)}
      />
      <div className="main-layout__body">
        <AppHeader user={user} onLogout={handleLogout} />
        <main className="main-layout__content">
          <ContentContainer>
            <Outlet />
          </ContentContainer>
        </main>
      </div>
    </div>
  );
}
