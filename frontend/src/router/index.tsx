import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import ProtectedRoute from '@/layouts/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const TenantPage = lazy(() => import('@/pages/tenant/TenantPage'));
const TenantDetailPage = lazy(() => import('@/pages/tenant/TenantDetailPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const InviteAcceptPage = lazy(() => import('@/pages/auth/InviteAcceptPage'));
const ProjectListPage = lazy(() => import('@/pages/projects/ProjectListPage'));
const NewProjectPage = lazy(() => import('@/pages/projects/NewProjectPage'));
const ProjectDetailPage = lazy(() => import('@/pages/projects/ProjectDetailPage'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/projects" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
      },
      {
        path: '/register',
        element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper>,
      },
      {
        path: '/forgot-password',
        element: <SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>,
      },
      {
        path: '/reset-password',
        element: <SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>,
      },
      {
        path: '/invite/accept',
        element: <SuspenseWrapper><InviteAcceptPage /></SuspenseWrapper>,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/dashboard',
            element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper>,
          },
          {
            path: '/tenants',
            element: <SuspenseWrapper><TenantPage /></SuspenseWrapper>,
          },
          {
            path: '/tenants/:tenantId',
            element: <SuspenseWrapper><TenantDetailPage /></SuspenseWrapper>,
          },
          {
            path: '/settings',
            element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper>,
          },
          {
            path: '/projects',
            element: <SuspenseWrapper><ProjectListPage /></SuspenseWrapper>,
          },
          {
            path: '/projects/new',
            element: <SuspenseWrapper><NewProjectPage /></SuspenseWrapper>,
          },
          {
            path: '/projects/:id',
            element: <SuspenseWrapper><ProjectDetailPage /></SuspenseWrapper>,
          },
        ],
      },
    ],
  },
]);
