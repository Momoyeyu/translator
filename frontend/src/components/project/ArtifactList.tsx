import { useState } from 'react';
import { Message } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { downloadArtifact, exportPdf, type Artifact } from '../../api/project';
import './ArtifactList.less';

interface Props {
  projectId: string;
  artifacts: Artifact[];
  onArtifactCreated?: (artifact: Artifact) => void;
}

export default function ArtifactList({ projectId, artifacts, onArtifactCreated }: Props) {
  const { t } = useTranslation();
  const [exportingId, setExportingId] = useState<string | null>(null);

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

  const handleExportPdf = async (artifact: Artifact) => {
    setExportingId(artifact.id);
    try {
      const newArtifact = await exportPdf(projectId, artifact.id);
      onArtifactCreated?.(newArtifact);
    } catch {
      Message.error(t('artifact.exportFailed'));
    } finally {
      setExportingId(null);
    }
  };

  if (artifacts.length === 0) {
    return (
      <div className="artifact-list__empty">
        {t('artifact.empty')}
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
          <div className="artifact-list__card-actions">
            {item.format === 'markdown' && (
              <button
                className="artifact-list__export-btn"
                onClick={() => handleExportPdf(item)}
                disabled={exportingId === item.id}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                {exportingId === item.id ? t('artifact.exporting') : t('artifact.exportPdf')}
              </button>
            )}
            <button className="artifact-list__download-btn" onClick={() => handleDownload(item)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t('artifact.download')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
