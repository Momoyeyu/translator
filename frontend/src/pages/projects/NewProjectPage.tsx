import { Message, Select } from '@arco-design/web-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../../api/project';
import './NewProjectPage.less';

const LANGUAGES = [
  { label: 'Chinese (zh)', value: 'zh' },
  { label: 'English (en)', value: 'en' },
  { label: 'Japanese (ja)', value: 'ja' },
  { label: 'Korean (ko)', value: 'ko' },
  { label: 'French (fr)', value: 'fr' },
  { label: 'German (de)', value: 'de' },
  { label: 'Spanish (es)', value: 'es' },
  { label: 'Russian (ru)', value: 'ru' },
  { label: 'Arabic (ar)', value: 'ar' },
  { label: 'Portuguese (pt)', value: 'pt' },
];

const FORMALITY_OPTIONS = [
  { label: 'Neutral', value: 'neutral' },
  { label: 'Formal', value: 'formal' },
  { label: 'Informal', value: 'informal' },
];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [formality, setFormality] = useState('neutral');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [textContent, setTextContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      Message.error('Please enter a title');
      return;
    }
    if (!targetLanguage) {
      Message.error('Please select a target language');
      return;
    }

    if (inputMode === 'text') {
      if (!textContent.trim()) {
        Message.error('Please enter some text');
        return;
      }
    } else {
      if (!file) {
        Message.error('Please upload a document');
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();

      if (inputMode === 'text') {
        const textBlob = new Blob([textContent], { type: 'text/plain' });
        formData.append('file', textBlob, 'input.txt');
      } else {
        formData.append('file', file!);
      }

      formData.append('title', title.trim());
      formData.append('target_language', targetLanguage);
      if (sourceLanguage) {
        formData.append('source_language', sourceLanguage);
      }
      formData.append('formality', formality);

      const res = await createProject(formData);
      Message.success('Project created');
      navigate(`/projects/${res.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create project';
      Message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-project">
      <button className="new-project__back" onClick={() => navigate('/projects')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Projects
      </button>

      <h1 className="new-project__title">New Translation Project</h1>

      <div className="new-project__form-card">
        <form onSubmit={handleSubmit}>
          <div className="new-project__form-group">
            <label className="new-project__form-label" htmlFor="np-title">Title</label>
            <input
              type="text"
              id="np-title"
              className="new-project__form-input"
              placeholder="Project title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="new-project__form-group">
            <label className="new-project__form-label">Document</label>

            <div className="new-project__input-toggle">
              <button
                type="button"
                className={`new-project__toggle-btn${inputMode === 'file' ? ' active' : ''}`}
                onClick={() => setInputMode('file')}
              >
                Upload File
              </button>
              <button
                type="button"
                className={`new-project__toggle-btn${inputMode === 'text' ? ' active' : ''}`}
                onClick={() => setInputMode('text')}
              >
                Paste Text
              </button>
            </div>

            {inputMode === 'text' ? (
              <textarea
                className="new-project__text-input"
                placeholder="Paste your text here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={10}
              />
            ) : (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".txt,.md,.html,.pdf,.docx"
                  onChange={handleFileChange}
                />
                <div
                  className={`new-project__upload-zone${file ? ' new-project__upload-zone--has-file' : ''}${dragOver ? ' new-project__upload-zone--drag-over' : ''}`}
                  onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {file ? (
                    <div className="new-project__upload-filename">{file.name}</div>
                  ) : (
                    <>
                      <div className="new-project__upload-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <div className="new-project__upload-text">Drop file here or click to browse</div>
                      <div className="new-project__upload-hint">.txt, .md, .html, .pdf, .docx</div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="new-project__form-group">
            <label className="new-project__form-label">Target Language</label>
            <Select
              options={LANGUAGES}
              placeholder="Select target language"
              value={targetLanguage || undefined}
              onChange={(val) => setTargetLanguage(val)}
              style={{ width: '100%' }}
              size="large"
            />
          </div>

          <div className="new-project__form-group">
            <label className="new-project__form-label">Source Language (optional)</label>
            <Select
              options={LANGUAGES}
              placeholder="Auto-detect"
              value={sourceLanguage || undefined}
              onChange={(val) => setSourceLanguage(val)}
              allowClear
              style={{ width: '100%' }}
              size="large"
            />
          </div>

          <div className="new-project__form-group">
            <label className="new-project__form-label">Formality</label>
            <Select
              options={FORMALITY_OPTIONS}
              value={formality}
              onChange={(val) => setFormality(val)}
              style={{ width: '100%' }}
              size="large"
            />
          </div>

          <button type="submit" className="new-project__btn-submit" disabled={loading}>
            {loading ? <span className="new-project__spinner" /> : null}
            Create & Start Translation
          </button>
        </form>
      </div>
    </div>
  );
}
