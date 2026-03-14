import { useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import SidebarNav from '@/components/SidebarNav';
import './MainLayout.less';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);

  // Auto-collapse on project detail pages (/projects/:id)
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const isProjectDetail = /^\/projects\/[^/]+/.test(location.pathname);
    const wasProjectDetail = /^\/projects\/[^/]+/.test(prevPathRef.current);
    prevPathRef.current = location.pathname;

    if (isProjectDetail && !wasProjectDetail) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname, setSidebarCollapsed]);

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
    <div className={`main-layout${collapsed ? ' main-layout--sidebar-collapsed' : ''}`}>
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
