import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import SidebarNav from '@/components/SidebarNav';
import './MainLayout.less';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/settings')) return '/settings';
    if (location.pathname.startsWith('/projects')) return '/projects';
    return '/dashboard';
  };

  return (
    <div className="main-layout">
      <SidebarNav
        selectedKey={getSelectedKey()}
        onNavigate={(key) => navigate(key)}
        onLogout={handleLogout}
      />
      <main className="main-layout__content">
        <div className="main-layout__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
