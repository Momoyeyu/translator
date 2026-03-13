import { Button, Empty, List, Space, Tag, Typography } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, deleteProject, type Project } from '../../api/project';

const statusColorMap: Record<string, string> = {
  created: 'gray',
  planning: 'blue',
  clarifying: 'orange',
  translating: 'blue',
  unifying: 'blue',
  completed: 'green',
  failed: 'red',
  cancelled: 'gray',
};

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await listProjects();
      setProjects(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    fetchProjects();
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title heading={4}>Translation Projects</Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={() => navigate('/projects/new')}>
          New Project
        </Button>
      </Space>

      {projects.length === 0 && !loading ? (
        <Empty description="No projects yet" />
      ) : (
        <List
          loading={loading}
          dataSource={projects}
          render={(item: Project) => (
            <List.Item
              key={item.id}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${item.id}`)}
              extra={
                <Space>
                  <Tag color={statusColorMap[item.status] || 'gray'}>{item.status}</Tag>
                  <Button
                    size="small"
                    status="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                  >
                    Delete
                  </Button>
                </Space>
              }
            >
              <List.Item.Meta
                title={item.title}
                description={`${item.source_language || 'auto'} → ${item.target_language} · ${new Date(item.created_at).toLocaleDateString()}`}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
