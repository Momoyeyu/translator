import { Button, Empty, List, Space, Tag } from '@arco-design/web-react';
import { IconDownload } from '@arco-design/web-react/icon';
import { downloadArtifact, type Artifact } from '../../api/project';

interface Props {
  projectId: string;
  artifacts: Artifact[];
}

export default function ArtifactList({ projectId, artifacts }: Props) {
  const handleDownload = async (artifact: Artifact) => {
    const res = await downloadArtifact(projectId, artifact.id);
    const blob = new Blob([res.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = artifact.format === 'markdown' ? 'md' : 'pdf';
    a.download = `${artifact.title}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (artifacts.length === 0) {
    return <Empty description="No artifacts yet. Complete the translation pipeline to generate output." />;
  }

  return (
    <List
      dataSource={artifacts}
      render={(item: Artifact) => (
        <List.Item
          key={item.id}
          extra={
            <Button icon={<IconDownload />} onClick={() => handleDownload(item)}>
              Download
            </Button>
          }
        >
          <List.Item.Meta
            title={
              <Space>
                {item.title}
                <Tag>{item.format.toUpperCase()}</Tag>
              </Space>
            }
            description={`${(item.file_size / 1024).toFixed(1)} KB · ${new Date(item.created_at).toLocaleString()}`}
          />
        </List.Item>
      )}
    />
  );
}
