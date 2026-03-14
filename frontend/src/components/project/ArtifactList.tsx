import { downloadArtifact, type Artifact } from '../../api/project';
import './ArtifactList.less';

interface Props {
  projectId: string;
  artifacts: Artifact[];
}

export default function ArtifactList({ projectId, artifacts }: Props) {
  const handleDownload = async (artifact: Artifact) => {
    const res = await downloadArtifact(projectId, artifact.id);
    const blob = new Blob([res]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = artifact.format === 'markdown' ? 'md' : 'pdf';
    a.download = `${artifact.title}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (artifacts.length === 0) {
    return (
      <div className="artifact-list__empty">
        No artifacts yet. Complete the translation pipeline to generate output.
      </div>
    );
  }

  return (
    <div className="artifact-list__grid">
      {artifacts.map((item) => (
        <div key={item.id} className="artifact-list__card">
          <div className="artifact-list__card-info">
            <div className="artifact-list__card-title">
              {item.title}
              <span className="artifact-list__card-format">{item.format.toUpperCase()}</span>
            </div>
            <div className="artifact-list__card-meta">
              {(item.file_size / 1024).toFixed(1)} KB &middot; {new Date(item.created_at).toLocaleString()}
            </div>
          </div>
          <button className="artifact-list__download-btn" onClick={() => handleDownload(item)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
        </div>
      ))}
    </div>
  );
}
