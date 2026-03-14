import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listProjects, type Project } from '@/api/project';
import './DashboardPage.less';

const IN_PROGRESS_STATUSES = new Set([
  'created',
  'planning',
  'clarifying',
  'translating',
  'unifying',
]);

const statusColorClass: Record<string, string> = {
  created: 'created',
  planning: 'planning',
  clarifying: 'clarifying',
  translating: 'translating',
  unifying: 'unifying',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled',
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle(t('dashboard.title'));

  useEffect(() => {
    let cancelled = false;
    const fetchProjects = async () => {
      try {
        const res = await listProjects(1, 100);
        if (!cancelled) setProjects(res || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProjects();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const inProgress = projects.filter((p) => IN_PROGRESS_STATUSES.has(p.status)).length;
    return { total, completed, inProgress };
  }, [projects]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [projects]);

  const welcomeText = user?.username
    ? t('dashboard.welcome', { name: user.username })
    : t('dashboard.welcomeDefault');

  const formatLangPair = (p: Project) => {
    const src = p.source_language ? p.source_language.toUpperCase() : 'AUTO';
    const tgt = p.target_language.toUpperCase();
    return `${src} \u2192 ${tgt}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="dashboard__welcome">
        <div className="dashboard__welcome-decor" />
        <h1 className="dashboard__title">{welcomeText}</h1>
        <p className="dashboard__subtitle">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard__stats">
        <div className="dashboard__stat-card dashboard__stat-card--blue">
          <div className="dashboard__stat-number">
            {loading ? <span className="dashboard__skeleton-num" /> : stats.total}
          </div>
          <span className="dashboard__stat-label">{t('dashboard.totalProjects')}</span>
        </div>
        <div className="dashboard__stat-card dashboard__stat-card--teal">
          <div className="dashboard__stat-number">
            {loading ? <span className="dashboard__skeleton-num" /> : stats.completed}
          </div>
          <span className="dashboard__stat-label">{t('dashboard.completed')}</span>
        </div>
        <div className="dashboard__stat-card dashboard__stat-card--purple">
          <div className="dashboard__stat-number">
            {loading ? <span className="dashboard__skeleton-num" /> : stats.inProgress}
          </div>
          <span className="dashboard__stat-label">{t('dashboard.inProgress')}</span>
        </div>
        <div className="dashboard__stat-card dashboard__stat-card--warm">
          <div className="dashboard__stat-number">&mdash;</div>
          <span className="dashboard__stat-label">{t('dashboard.termsManaged')}</span>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="dashboard__section">
        <h2 className="dashboard__section-title">{t('dashboard.recentProjects')}</h2>
        {loading ? (
          <div className="dashboard__recent-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="dashboard__recent-item dashboard__recent-item--skeleton">
                <div className="dashboard__skeleton-line dashboard__skeleton-line--title" />
                <div className="dashboard__skeleton-line dashboard__skeleton-line--lang" />
                <div className="dashboard__skeleton-line dashboard__skeleton-line--badge" />
                <div className="dashboard__skeleton-line dashboard__skeleton-line--date" />
              </div>
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <p className="dashboard__empty">{t('dashboard.noProjects')}</p>
        ) : (
          <div className="dashboard__recent-list">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="dashboard__recent-item"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="dashboard__recent-title">{project.title}</div>
                <div className="dashboard__recent-lang">{formatLangPair(project)}</div>
                <span
                  className={`dashboard__status-badge dashboard__status-badge--${statusColorClass[project.status] || 'created'}`}
                >
                  {formatStatus(project.status)}
                </span>
                <div className="dashboard__recent-date">{formatDate(project.updated_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard__actions">
        <button className="dashboard__action-btn dashboard__action-btn--primary" onClick={() => navigate('/projects/new')}>
          {t('dashboard.newTranslation')}
        </button>
        <button className="dashboard__action-btn dashboard__action-btn--secondary" onClick={() => navigate('/projects')}>
          {t('dashboard.viewAllProjects')}
        </button>
      </div>
    </div>
  );
}
