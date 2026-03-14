import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, type Project } from '../../api/project';
import './ProjectListPage.less';

const statusProgressColors: Record<string, string> = {
  created: '#9C9488',
  planning: '#5A7A9B',
  clarifying: '#C67A00',
  translating: '#8B6834',
  unifying: '#5A7A9B',
  completed: '#2E7D32',
  failed: '#C62828',
  cancelled: '#9C9488',
};

function getProgressPercent(status: string): number {
  switch (status) {
    case 'created': return 0;
    case 'planning': return 15;
    case 'clarifying': return 35;
    case 'translating': return 60;
    case 'unifying': return 85;
    case 'completed': return 100;
    case 'failed': return 50;
    case 'cancelled': return 0;
    default: return 0;
  }
}

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await listProjects();
      setProjects(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="project-list">
      {/* Page Header */}
      <div className="project-list__header">
        <div>
          <h1 className="project-list__title">Translation Projects</h1>
          <p className="project-list__subtitle">
            {loading ? 'Loading...' : `You have ${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="project-list__actions">
          <input
            type="text"
            className="project-list__search"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Card Grid */}
      <div className="project-list__grid">
        {loading ? (
          // Skeleton loading cards
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="project-list__skeleton">
              <div className="project-list__skeleton-line project-list__skeleton-lang" />
              <div className="project-list__skeleton-line project-list__skeleton-title" />
              <div className="project-list__skeleton-line project-list__skeleton-progress" />
              <div className="project-list__skeleton-status">
                <div className="project-list__skeleton-line project-list__skeleton-badge" />
                <div className="project-list__skeleton-line project-list__skeleton-date" />
              </div>
            </div>
          ))
        ) : filteredProjects.length === 0 ? (
          <div className="project-list__empty">
            {search ? 'No projects match your search' : 'No projects yet. Create one to get started.'}
          </div>
        ) : (
          filteredProjects.map((project) => {
            const percent = getProgressPercent(project.status);
            const color = statusProgressColors[project.status] || '#9C9488';
            return (
              <div
                key={project.id}
                className="project-list__card"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="project-list__card-lang">
                  {project.source_language || 'AUTO'} &rarr; {project.target_language.toUpperCase()}
                </div>
                <div className="project-list__card-title">{project.title}</div>
                <div className="project-list__card-progress">
                  <div className="project-list__progress-bar">
                    <div
                      className="project-list__progress-fill"
                      style={{ width: `${percent}%`, background: color }}
                    />
                  </div>
                  {percent > 0 && (
                    <span className="project-list__progress-text">{percent}%</span>
                  )}
                </div>
                <div className="project-list__card-status-row">
                  <span className={`project-list__status-badge project-list__status-badge--${project.status}`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                  <span className="project-list__card-date">
                    {new Date(project.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <button
        className="project-list__fab"
        title="New Project"
        onClick={() => navigate('/projects/new')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
